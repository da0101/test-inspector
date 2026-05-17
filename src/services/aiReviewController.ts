import { promises as fs } from 'node:fs';
import * as vscode from 'vscode';
import { activeProvider, createProviderRegistry, enrichCase, PROVIDER_IDS, secretKey, type LlmProviderId } from './llm';
import type { CaseFile, CaseFileAiReview, CaseFileBundle } from './caseFile';

export function createAiReviewer(
  registry: ReturnType<typeof createProviderRegistry>,
  output: vscode.OutputChannel
): (caseFile: CaseFile, bundle: CaseFileBundle) => Promise<CaseFileAiReview> {
  return async (caseFile, bundle) => {
    const provider = activeProvider(registry);
    if (!provider) {
      return {
        status: 'error',
        reviewedAt: Date.now(),
        error: 'No AI reviewer selected. Run "Test Inspector: Configure LLM (optional reviewer)" and choose OpenAI, Claude, or Gemini.'
      };
    }
    if (!(await provider.isConfigured())) {
      return {
        status: 'error',
        provider: provider.displayName,
        reviewedAt: Date.now(),
        error: `${provider.displayName} is selected, but no API key is stored. Run Configure LLM and add the key.`
      };
    }

    try {
      const approved = await vscode.window.showWarningMessage(
        `Send ${caseFile.target.kind} file content and up to 3 related files to ${provider.displayName} for evidence-grounded review?`,
        { modal: true },
        'Send for review'
      );
      if (approved !== 'Send for review') {
        return {
          status: 'error',
          provider: provider.displayName,
          reviewedAt: Date.now(),
          error: 'AI review cancelled. No code was sent.'
        };
      }
      const fileContent = await fs.readFile(caseFile.target.path, 'utf8');
      const relatedContent = await readRelatedContent(caseFile, bundle);
      output.appendLine(`[llm] sending ${caseFile.target.path} to ${provider.displayName}…`);
      const result = await enrichCase(provider, { caseFile, fileContent, relatedContent });
      if (!result.ok) {
        output.appendLine(`[llm] enrichment failed: ${result.error}`);
        if (result.rawResponse) {
          output.appendLine('[llm] raw response (first 800 chars):');
          output.appendLine(result.rawResponse.slice(0, 800));
          output.appendLine('[llm] --- end raw response ---');
        }
        return {
          status: 'error',
          provider: provider.displayName,
          reviewedAt: Date.now(),
          error: result.error
        };
      }
      output.appendLine(`[llm] enrichment ok: ${result.explanation.evidenceAnchors.length} verified, ${result.droppedAnchors} dropped`);
      return {
        status: result.explanation.verdictAlignsWithEvidence ? 'accepted' : 'challenged',
        provider: result.provider,
        model: result.model,
        reviewedAt: Date.now(),
        explanation: result.explanation.explanation,
        evidenceAnchors: result.explanation.evidenceAnchors,
        suggestedFix: result.explanation.suggestedFix,
        uncertaintyNotes: result.explanation.uncertaintyNotes,
        droppedAnchors: result.droppedAnchors
      };
    } catch (err) {
      return {
        status: 'error',
        provider: provider.displayName,
        reviewedAt: Date.now(),
        error: err instanceof Error ? err.message : String(err)
      };
    }
  };
}

export async function configureLlm(context: vscode.ExtensionContext, output: vscode.OutputChannel): Promise<void> {
  const registry = createProviderRegistry(context.secrets);
  const cfg = vscode.workspace.getConfiguration('testInspector.llm');
  const current = cfg.get<string>('provider') || 'none';
  const picked = await vscode.window.showQuickPick(
    [
      { label: 'Disable AI reviewer', id: 'none' as const, description: current === 'none' ? 'current' : undefined },
      ...PROVIDER_IDS.map((id) => {
        const provider = registry.get(id);
        return {
          label: provider?.displayName ?? id,
          id,
          description: current === id ? 'current' : undefined,
          detail: provider?.suggestedModels.join(', ')
        };
      })
    ],
    { placeHolder: 'Choose the optional AI reviewer provider' }
  );
  if (!picked) return;

  if (picked.id === 'none') {
    await cfg.update('provider', 'none', vscode.ConfigurationTarget.Workspace);
    output.appendLine('[llm] disabled');
    void vscode.window.showInformationMessage('Test Inspector: AI reviewer disabled.');
    return;
  }

  const providerId = picked.id as LlmProviderId;
  const provider = registry.get(providerId);
  if (!provider) return;

  await cfg.update('provider', providerId, vscode.ConfigurationTarget.Workspace);
  const model = await vscode.window.showQuickPick(provider.suggestedModels, {
    placeHolder: `Choose ${provider.displayName} model`
  });
  if (model) {
    await cfg.update('model', model, vscode.ConfigurationTarget.Workspace);
  }

  const action = await vscode.window.showQuickPick(['Add or replace API key', 'Delete stored API key', 'Keep existing key'], {
    placeHolder: `${provider.displayName} API key`
  });
  if (!action) return;

  if (action === 'Delete stored API key') {
    await context.secrets.delete(secretKey(providerId));
    output.appendLine(`[llm] deleted ${provider.displayName} key`);
    void vscode.window.showInformationMessage(`Test Inspector: deleted stored ${provider.displayName} API key.`);
    return;
  }

  if (action === 'Add or replace API key') {
    const apiKey = await vscode.window.showInputBox({
      title: `${provider.displayName} API key`,
      prompt: 'Stored in VS Code SecretStorage. It is never written to settings or reports.',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => (value.trim() ? null : 'API key is required.')
    });
    if (!apiKey) return;
    await context.secrets.store(secretKey(providerId), apiKey.trim());
  }

  const configuredProvider = createProviderRegistry(context.secrets).get(providerId);
  const test = configuredProvider ? await configuredProvider.testConnection() : { ok: false as const, error: 'Provider unavailable.' };
  if (test.ok) {
    output.appendLine(`[llm] ${provider.displayName} configured (${test.modelUsed})`);
    void vscode.window.showInformationMessage(`Test Inspector: ${provider.displayName} reviewer configured.`);
  } else {
    output.appendLine(`[llm] ${provider.displayName} test failed: ${test.error}`);
    void vscode.window.showWarningMessage(`Test Inspector: ${provider.displayName} key saved, but test failed — ${test.error}`);
  }
}

async function readRelatedContent(caseFile: CaseFile, bundle: CaseFileBundle): Promise<{ path: string; content: string }[]> {
  const paths = new Set<string>();
  for (const related of caseFile.evidence.relatedTests.slice(0, 3)) {
    paths.add(related.path);
  }
  if (caseFile.target.kind === 'test') {
    for (const candidate of bundle.cases) {
      if (candidate.target.kind === 'source' && candidate.evidence.relatedTests.some((related) => related.path === caseFile.target.path)) {
        paths.add(candidate.target.path);
      }
      if (paths.size >= 3) break;
    }
  }

  const relatedContent: { path: string; content: string }[] = [];
  for (const filePath of paths) {
    if (filePath === caseFile.target.path) continue;
    try {
      relatedContent.push({ path: filePath, content: await fs.readFile(filePath, 'utf8') });
    } catch {
      // Related context is helpful but not required for grounded validation.
    }
  }
  return relatedContent;
}
