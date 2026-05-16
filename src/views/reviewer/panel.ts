import * as crypto from 'node:crypto';
import * as vscode from 'vscode';
import {
  secretKey,
  type LlmProvider,
  type LlmProviderId,
  PROVIDER_IDS,
} from '../../services/llm';
import { renderReviewerHtml, type ReviewerProviderInfo, type ReviewerState } from './template';

type IncomingMessage =
  | { type: 'selectProvider'; provider: string }
  | { type: 'selectModel'; model: string }
  | { type: 'save'; provider: string; model?: string; apiKey?: string }
  | { type: 'test'; provider: string }
  | { type: 'delete'; provider: string };

export class ReviewerViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = 'testInspector.reviewer';

  private view: vscode.WebviewView | undefined;
  private lastTest: ReviewerState['lastTest'];

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly registry: Map<LlmProviderId, LlmProvider>,
    private readonly output: vscode.OutputChannel,
  ) {}

  async resolveWebviewView(view: vscode.WebviewView): Promise<void> {
    this.view = view;
    view.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };
    view.webview.onDidReceiveMessage((msg: IncomingMessage) => this.handleMessage(msg));
    await this.render();
  }

  /** Re-render — called from outside when config changes elsewhere. */
  async refresh(): Promise<void> {
    if (this.view) await this.render();
  }

  private async render(): Promise<void> {
    if (!this.view) return;
    const state = await this.collectState();
    const nonce = crypto.randomBytes(16).toString('base64');
    const cspSource = this.view.webview.cspSource;
    this.view.webview.html = renderReviewerHtml(state, { nonce, cspSource });
  }

  private async collectState(): Promise<ReviewerState> {
    const cfg = vscode.workspace.getConfiguration('testInspector.llm');
    const activeProvider = (cfg.get<string>('provider') || 'none') as ReviewerState['activeProvider'];
    const activeModel = cfg.get<string>('model') || '';

    const providers: ReviewerProviderInfo[] = PROVIDER_IDS.map((id) => {
      const provider = this.registry.get(id);
      return {
        id,
        displayName: provider?.displayName ?? id,
        defaultModel: provider?.defaultModel ?? '',
        suggestedModels: provider?.suggestedModels ?? [],
      };
    });

    const configured: LlmProviderId[] = [];
    for (const id of PROVIDER_IDS) {
      const provider = this.registry.get(id);
      if (provider && (await provider.isConfigured())) configured.push(id);
    }

    return {
      activeProvider,
      activeModel,
      configuredProviders: configured,
      providers,
      lastTest: this.lastTest,
    };
  }

  private async handleMessage(msg: IncomingMessage): Promise<void> {
    const cfg = vscode.workspace.getConfiguration('testInspector.llm');

    switch (msg.type) {
      case 'selectProvider': {
        const provider = msg.provider as ReviewerState['activeProvider'];
        await cfg.update('provider', provider, vscode.ConfigurationTarget.Global);
        // If switching to a configured provider with no model yet, prefill default.
        if (provider !== 'none') {
          const currentModel = cfg.get<string>('model') || '';
          const providerInfo = this.registry.get(provider);
          if (!currentModel && providerInfo) {
            await cfg.update('model', providerInfo.defaultModel, vscode.ConfigurationTarget.Global);
          }
        }
        this.lastTest = undefined;
        await this.render();
        return;
      }

      case 'selectModel': {
        await cfg.update('model', msg.model, vscode.ConfigurationTarget.Global);
        this.lastTest = undefined;
        await this.render();
        return;
      }

      case 'save': {
        const providerId = msg.provider as ReviewerState['activeProvider'];
        if (providerId === 'none') {
          await cfg.update('provider', 'none', vscode.ConfigurationTarget.Global);
          this.lastTest = undefined;
          await this.render();
          return;
        }
        if (!PROVIDER_IDS.includes(providerId as LlmProviderId)) {
          void vscode.window.showWarningMessage(`Test Inspector: unknown provider "${msg.provider}".`);
          await this.render();
          return;
        }
        await cfg.update('provider', providerId, vscode.ConfigurationTarget.Global);
        if (msg.model) {
          await cfg.update('model', msg.model, vscode.ConfigurationTarget.Global);
        }
        const provider = this.registry.get(providerId as LlmProviderId);
        if (msg.apiKey && provider) {
          await this.context.secrets.store(secretKey(providerId as LlmProviderId), msg.apiKey);
          this.output.appendLine(`[reviewer] ${provider.displayName} key stored`);
        }
        // Re-create the registry against the new key, then verify.
        const updatedProvider = this.registry.get(providerId as LlmProviderId);
        if (updatedProvider && (await updatedProvider.isConfigured())) {
          const result = await updatedProvider.testConnection();
          this.lastTest = result.ok
            ? { ok: true, message: `${updatedProvider.displayName} reachable (${result.modelUsed})`, at: Date.now() }
            : { ok: false, message: result.error, at: Date.now() };
          this.output.appendLine(`[reviewer] ${updatedProvider.displayName} test: ${result.ok ? 'ok' : 'failed — ' + result.error}`);
        }
        await this.render();
        return;
      }

      case 'test': {
        const providerId = msg.provider as LlmProviderId;
        const provider = this.registry.get(providerId);
        if (!provider) {
          this.lastTest = { ok: false, message: 'Unknown provider.', at: Date.now() };
          await this.render();
          return;
        }
        if (!(await provider.isConfigured())) {
          this.lastTest = { ok: false, message: 'No API key stored for this provider.', at: Date.now() };
          await this.render();
          return;
        }
        const result = await provider.testConnection();
        this.lastTest = result.ok
          ? { ok: true, message: `${provider.displayName} reachable (${result.modelUsed})`, at: Date.now() }
          : { ok: false, message: result.error, at: Date.now() };
        this.output.appendLine(`[reviewer] ${provider.displayName} test: ${result.ok ? 'ok' : 'failed — ' + result.error}`);
        await this.render();
        return;
      }

      case 'delete': {
        const providerId = msg.provider as LlmProviderId;
        if (!PROVIDER_IDS.includes(providerId)) return;
        await this.context.secrets.delete(secretKey(providerId));
        this.output.appendLine(`[reviewer] deleted ${providerId} key`);
        this.lastTest = undefined;
        await this.render();
        void vscode.window.showInformationMessage(`Test Inspector: ${providerId} API key removed.`);
        return;
      }
    }
  }
}
