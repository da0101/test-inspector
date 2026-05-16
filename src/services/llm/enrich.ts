import type { CaseFile } from '../caseFile';
import type { LlmProvider, ProviderResult } from './types';

/**
 * The grounded explanation the LLM is asked to produce. Every claim must be
 * verifiable against `fileContent` — we run anchor verification before
 * surfacing anything to the user.
 */
export type GroundedExplanation = {
  verdictAlignsWithEvidence: boolean;
  explanation: string;
  evidenceAnchors: Array<{ lineNumber: number; excerpt: string; issue: string }>;
  suggestedFix: { summary: string; pseudocode?: string };
  uncertaintyNotes?: string;
};

export type EnrichResult =
  | { ok: true; explanation: GroundedExplanation; provider: string; model: string; droppedAnchors: number }
  | { ok: false; error: string; rawResponse?: string };

const SYSTEM_PROMPT = `You are an expert reviewer of unit tests. A static analyzer has flagged a test or source file with a verdict (THEATER / WEAK / MISSING / STRONG). Your job is to look at the actual file content and produce an evidence-grounded explanation in strict JSON.

CRITICAL RULES — VIOLATING ANY RULE MAKES YOUR RESPONSE WORTHLESS:
1. Every \`evidenceAnchors\` entry MUST cite a real \`lineNumber\` that exists in the provided file (1-indexed). The \`excerpt\` MUST be a verbatim substring of that exact line — do not paraphrase.
2. Do NOT invent code, function names, classes, imports, or APIs that are not present in the provided file content.
3. The \`suggestedFix.pseudocode\` (if provided) MUST only reference types, functions, or imports visible in the provided file content. If you cannot construct a valid fix from the visible context, write the summary only and omit the pseudocode.
4. If you cannot find evidence supporting the analyzer's verdict, set \`verdictAlignsWithEvidence: false\` and explain why in \`explanation\`. Do not invent evidence to defend a verdict.
5. If any part of your analysis is uncertain — for example you can't see the source file the test claims to cover — put it in \`uncertaintyNotes\` rather than guessing.
6. \`explanation\` must be 2–4 sentences, plain English, no jargon a junior dev wouldn't understand.
7. Return ONLY a single JSON object. No prose before or after. No markdown code fences.

JSON SCHEMA:
{
  "verdictAlignsWithEvidence": boolean,
  "explanation": string,
  "evidenceAnchors": [ { "lineNumber": number, "excerpt": string, "issue": string } ],
  "suggestedFix": { "summary": string, "pseudocode": string | null },
  "uncertaintyNotes": string | null
}`;

export function buildUserPrompt(opts: {
  caseFile: CaseFile;
  fileContent: string;
  relatedContent?: { path: string; content: string }[];
}): string {
  const numbered = numberLines(opts.fileContent);
  const signalLines = opts.caseFile.evidence.signals
    .map((s) => `- ${s.name} (weight ${s.weight}): ${s.detail ?? 'no detail'}${s.location ? ` @ line ${s.location.line ?? '?'}` : ''}`)
    .join('\n');

  const related = (opts.relatedContent ?? []).map((r) =>
    `\n--- RELATED ${r.path} ---\n${truncate(numberLines(r.content), 6000)}\n--- END ---`,
  ).join('\n');

  return [
    `VERDICT: ${opts.caseFile.verdict}`,
    `STORY: ${opts.caseFile.story.headline}`,
    ``,
    `DETERMINISTIC SIGNALS:`,
    signalLines || '(none)',
    ``,
    `--- TARGET FILE: ${opts.caseFile.target.path} ---`,
    truncate(numbered, 10000),
    `--- END TARGET ---`,
    related,
    ``,
    `Produce the grounded JSON now.`,
  ].join('\n');
}

function numberLines(content: string): string {
  return content.split(/\r?\n/).map((line, idx) => `${idx + 1}: ${line}`).join('\n');
}

function truncate(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars)}\n… [truncated for length]`;
}

/**
 * Parse a raw LLM response into a GroundedExplanation, then verify every
 * evidenceAnchor against the actual file content. Anchors that cannot be
 * verified are silently dropped — the user never sees them.
 *
 * Returns `null` if the response is unparseable (not JSON, or missing the
 * required `explanation` field).
 */
export function validateExplanation(
  raw: string,
  fileContent: string,
): { explanation: GroundedExplanation; droppedAnchors: number } | null {
  const cleaned = stripCodeFence(raw).trim();
  let parsed: unknown = null;

  // 1) Try parsing the whole cleaned response directly.
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // 2) Fallback: extract a JSON object from a longer response. Some models
    //    (especially Gemini even with responseMimeType set) prefix with
    //    "Here's the analysis:" or wrap in extra prose. Find the largest
    //    {...} substring and parse that.
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        parsed = JSON.parse(objectMatch[0]);
      } catch {
        // 3) Truncated / unterminated JSON. Try to pull out just the
        //    explanation string with a tolerant regex so the user still sees
        //    the LLM's prose. We cannot verify anchors in this case, so they
        //    are explicitly dropped — the UI must label this as
        //    "anchors unavailable" so the user knows the trust signal is
        //    weaker than usual.
        const explanationMatch = cleaned.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (explanationMatch && explanationMatch[1]) {
          const verdictMatch = cleaned.match(/"verdictAlignsWithEvidence"\s*:\s*(true|false)/);
          return {
            explanation: {
              verdictAlignsWithEvidence: verdictMatch?.[1] === 'true',
              explanation: explanationMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n'),
              evidenceAnchors: [],
              suggestedFix: { summary: 'AI response was truncated; only prose explanation shown above. No verified line citations available.' },
              uncertaintyNotes: 'The AI response was truncated mid-output. Anchors and suggested-fix details could not be parsed. Treat the prose as a hint, not a verified claim.',
            },
            droppedAnchors: 0,
          };
        }
        return null;
      }
    } else {
      return null;
    }
  }
  if (!isObject(parsed)) return null;

  const explanation = String(parsed['explanation'] ?? '').trim();
  if (!explanation) return null;

  const verdictAlignsWithEvidence = parsed['verdictAlignsWithEvidence'] === true;
  const rawAnchors = Array.isArray(parsed['evidenceAnchors']) ? parsed['evidenceAnchors'] : [];
  const lines = fileContent.split(/\r?\n/);

  const verifiedAnchors: GroundedExplanation['evidenceAnchors'] = [];
  let dropped = 0;
  for (const a of rawAnchors) {
    if (!isObject(a)) {
      dropped++;
      continue;
    }
    const lineNumber = Number(a['lineNumber']);
    const excerpt = String(a['excerpt'] ?? '').trim();
    const issue = String(a['issue'] ?? '').trim();
    if (!Number.isInteger(lineNumber) || lineNumber < 1 || lineNumber > lines.length) {
      dropped++;
      continue;
    }
    const actualLine = lines[lineNumber - 1] ?? '';
    if (!isExcerptInLine(excerpt, actualLine)) {
      dropped++;
      continue;
    }
    if (!issue) {
      dropped++;
      continue;
    }
    verifiedAnchors.push({ lineNumber, excerpt, issue });
  }

  const fixObj = isObject(parsed['suggestedFix']) ? parsed['suggestedFix'] : {};
  const suggestedFix: GroundedExplanation['suggestedFix'] = {
    summary: String(fixObj['summary'] ?? '').trim() || 'No fix suggested.',
    pseudocode: typeof fixObj['pseudocode'] === 'string' && fixObj['pseudocode'].trim() ? fixObj['pseudocode'].trim() : undefined,
  };

  const uncertaintyNotes = typeof parsed['uncertaintyNotes'] === 'string' && parsed['uncertaintyNotes'].trim()
    ? parsed['uncertaintyNotes'].trim()
    : undefined;

  return {
    explanation: {
      verdictAlignsWithEvidence,
      explanation,
      evidenceAnchors: verifiedAnchors,
      suggestedFix,
      uncertaintyNotes,
    },
    droppedAnchors: dropped,
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isExcerptInLine(excerpt: string, line: string): boolean {
  if (!excerpt) return false;
  const norm = (s: string): string => s.replace(/\s+/g, ' ').trim().toLowerCase();
  return norm(line).includes(norm(excerpt));
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('```')) {
    // Remove leading fence (with optional language tag) and trailing fence.
    return trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```\s*$/, '');
  }
  return trimmed;
}

export async function enrichCase(
  provider: LlmProvider,
  opts: {
    caseFile: CaseFile;
    fileContent: string;
    relatedContent?: { path: string; content: string }[];
    abortSignal?: AbortSignal;
  },
): Promise<EnrichResult> {
  const user = buildUserPrompt(opts);
  const res: ProviderResult = await provider.complete({
    system: SYSTEM_PROMPT,
    user,
    temperature: 0,
    // Gemini 2.5 models spend tokens on internal reasoning before producing
    // the JSON output, so we need significant headroom or the response gets
    // truncated mid-object. 6000 is comfortable for grounded explanations
    // and still bounded enough to fail fast on runaway models.
    maxTokens: 6000,
    abortSignal: opts.abortSignal,
  });
  if (!res.ok) return res;

  const validated = validateExplanation(res.text, opts.fileContent);
  if (!validated) {
    const preview = res.text.slice(0, 600);
    return {
      ok: false,
      error: `AI response was not valid grounded JSON. The deterministic verdict still applies. (Preview: ${preview}…)`,
      rawResponse: res.text,
    };
  }
  return {
    ok: true,
    explanation: validated.explanation,
    provider: provider.displayName,
    model: res.modelUsed,
    droppedAnchors: validated.droppedAnchors,
  };
}
