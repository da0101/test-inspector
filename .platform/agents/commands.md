# Agentboard Command Guide (LLM Protocols)

This guide defines the **Exact Phrases** you can use to trigger high-reliability workflows. When these phrases are used, the AI MUST follow the linked protocol without hallucination or deviation.

## 1. Stream Management

| Phrase | Action | Protocol Source |
|---|---|---|
| `audit stream` | Run a full QA/Security/Style audit of the current task. | `workflow.md#stage-6-verify` |
| `archive stream` | Finalize, log, and move the stream to archive. | `workflow.md#closure-checklist` |
| `start stream "<name>"`| Triage a new request and create a work stream file. | `workflow.md#stage-1-triage` |
| `plan stream` | Create a design doc with invariants and data flow. | `workflow.md#stage-4-propose` |
| `research stream` | Perform bounded research (1 search + 3 reads max). | `ab-research` |
| `web first` | Spawn a parallel web-research agent before executing the task. | See §2 below |
| `debug stream` | Use the scientific method to find a root cause. | `ab-debug` |
| `sync context` | Ensure AGENTS.md and GEMINI.md are updated. | `.platform/scripts/sync-context.sh` |

---

## 2. Command Protocols (LLM Hard-Rules)

### `plan stream`
When I say **"plan stream"**, you MUST:
1. **Activate** the `ab-architect` skill.
2. **Read** the current stream brief in `work/BRIEF.md`.
3. **Produce** a design in the stream file (`work/<slug>.md`) that includes:
   - **Invariants:** What must never change?
   - **Data Flow:** How does information move?
   - **Failure Modes:** What happens when things break?
4. **Style:** No code implementation yet. Only design and architectural logic.

### `research stream`
When I say **"research stream"**, you MUST:
1. **Activate** the `ab-research` skill.
2. **Limit** output to a ≤300-word synthesis in the chat.
3. **Draft** any findings directly into the "Research" section of the current stream file.

### `debug stream`
When I say **"debug stream"**, you MUST:
1. **Activate** the `ab-debug` skill.
2. **State** a clear hypothesis before running any tests.
3. **Narrow** the cause through empirical testing (max 3 hypotheses).
4. **Log** the results of each test in the current stream file.

### `web first`
When I say **"web first"** (as a prefix before any task description), you MUST:
1. **Spawn a parallel web-research agent** using the Task tool before touching any code or files:
   - Model: `sonnet`
   - Task: search the web for the most relevant docs, articles, or examples for the described task
   - Search queries: derive 2–3 focused queries from the task description
   - Cap: ≤4 web sources; return a ≤200-word synthesis + key URLs
2. **In parallel**, begin your own triage/planning for the task (Stage 1–3 of the 6-stage workflow).
3. **After the research agent returns**, synthesize its findings into your plan before proposing or executing anything.
4. **Surface to user**: one bullet of what the research added (or "research confirmed existing approach — no change").

**Style:** Never skip the parallel dispatch. Never do the web search inline/sequentially — it must be a separate Task agent running concurrently with your planning.

### `audit stream`
When I say **"audit stream"**, you MUST:
1. **Read** the current active stream file in `.platform/work/`.
2. **Execute** the checklist in `workflow.md` (Stage 6: Verify).
3. **Output** a structured report with these sections:
   - **Verification Results:** (Pass/Fail per criteria)
   - **Architectural Integrity:** (Check against `architecture.md`)
   - **Security/Style Check:** (Check against `conventions/`)
4. **Style:** Do NOT provide inline chat analysis. Provide a rendered markdown report. **Do NOT** make any code changes during an audit.

### `archive stream`
When I say **"archive stream"**, you MUST:
1. **Verify** that `closure_approved: true` is present in the stream file.
2. **Update** `.platform/STATUS.md` and any relevant deep-reference files.
3. **Log** the outcome in `.platform/memory/log.md`.
4. **Move** the file to `.platform/work/archive/`.

### `status check`
When I say **"status check"**, you MUST:
1. **Render** a summary of `.platform/STATUS.md`.
2. **List** all active streams from `ACTIVE.md`.
3. **Identify** any blocking tasks or stale sessions.

---

## 3. Reliability Clause
As an AI Agent, when you encounter one of the phrases above, you are **forbidden** from:
- Inventing your own sequence of steps.
- Summarizing without checking the source protocol files.
- Modifying files unless the protocol explicitly requires it.
- Apologizing or explaining your process — just **execute** the protocol.

---

## 4. CLI Command Shortcuts

When the user types one of these phrases, **run the associated CLI command** (don't invent a substitute — these map to exact ab verbs). Fill `<slug>` from the currently active stream.

| If the user says… | Run this | Notes |
|---|---|---|
| "do a checkpoint", "save my place", "checkpoint this", "end session" | `ab checkpoint <slug> --what "…" --next "…"` | Fill `--what` from the last completed action; `--next` from the next planned step. Add `--provider` and `--type` when known. |
| "log usage", "log tokens", "track spend now", "record usage" | `ab usage log --provider <p> --input N --output N --stream <slug> --type <t>` | Use the actual session token counts. Omit `--stream` only if no active stream. |
| "brief me", "session start", "what are we working on", "what's the current state" | `ab brief` | Run at the start of every session before any work. |
| "validate the project", "run doctor", "anything broken", "check the state" | `ab doctor` | Run before declaring a stream done or handing off. |
| "close this stream", "we're done", "done ritual", "archive this" | `ab close <slug>` | Step 1 only (harvest checklist). Do NOT run `--confirm` until the user has reviewed and distilled the harvest items into memory files. |
| "confirm close", "yes archive it", "close confirmed" | `ab close <slug> --confirm` | Step 2 — only after harvest is complete and user says yes. |
| "what changed", "show progress", "diff vs base" | `ab progress <slug>` | Appends `git diff --stat` to the stream's progress log. |
| "prep handoff", "pass this off", "switching to codex", "switching agents" | `ab handoff <slug>` | Prints load order + resume state for the next agent. Run `checkpoint` first if state is stale. |
| "install hooks", "set up hooks", "wire up ab" | `ab install-hooks` | Then add `--aliases` if the user runs Codex or Gemini CLI. |
| "install shell aliases", "wire up codex", "wire up gemini" | `ab install-hooks --aliases` | Writes shell functions to `~/.zshrc`/`~/.bashrc`. Reload shell after. |
| "start a new stream", "new task", "let's work on…" | `ab new-stream <slug> --domain <d>` | Then fill the stream file with context and update `work/BRIEF.md`. |
| "usage summary", "how much have we spent", "token report" | `ab usage summary` | Global 30-day totals. Use `usage dashboard --week` for visual output. |
| "update ab", "pull latest ab files" | `ab update` | Refreshes shipped protocol files without touching project-specific docs. |

### Hard rule
When a phrase from this table appears in conversation, **run the command** before doing anything else. Do not describe the command. Do not ask for confirmation unless the command is destructive (close --confirm). Just run it and show the output.
