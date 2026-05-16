#!/usr/bin/env node
// platform-closure-gate.js — PreToolUse hook (HARD BLOCKER)
// Blocks edits to ACTIVE.md that remove or close a stream row
// unless the corresponding stream file has closure_approved: true.
//
// Enforces: "Only the human/owner declares a stream complete."
// This gate cannot be bypassed by instruction or argument.
//
// Exit 2 = block. Exit 0 = allow.

const fs = require('fs');
const path = require('path');

function extractSection(content, heading) {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex(line => line.trim() === heading);
  if (start === -1) return '';
  const collected = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^##\s+/.test(lines[i])) break;
    collected.push(lines[i]);
  }
  return collected.join('\n');
}

let input = '';
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input);

    // Only intercept Edit tool calls
    if (data.tool_name !== 'Edit') process.exit(0);

    const filePath = data.tool_input?.file_path || '';

    // Only intercept edits to work/ACTIVE.md
    if (!filePath.match(/[/\\]work[/\\]ACTIVE\.md$/)) process.exit(0);

    const oldString = data.tool_input?.old_string || '';
    const newString = data.tool_input?.new_string || '';

    // Extract stream slugs from table rows in old_string
    // Table rows look like: | slug | type | status | agent | date |
    const rowRegex = /^\s*\|\s*([a-zA-Z][a-zA-Z0-9_-]*)\s*\|/gm;
    const slugsToCheck = [];
    let match;

    while ((match = rowRegex.exec(oldString)) !== null) {
      const slug = match[1].trim();
      // Skip header and separator rows
      if (!slug || slug === 'Stream' || /^-+$/.test(slug)) continue;
      // Only flag rows that are being removed from new_string
      const rowPresent = newString.includes(`| ${slug} |`) ||
                         newString.includes(`|${slug}|`) ||
                         newString.includes(`| ${slug}|`) ||
                         newString.includes(`|${slug} |`);
      if (!rowPresent) {
        slugsToCheck.push(slug);
      }
    }

    if (slugsToCheck.length === 0) process.exit(0);

    const cwd = data.cwd || process.cwd();
    const workDir = path.join(cwd, '.platform', 'work');

    for (const slug of slugsToCheck) {
      const streamFile = path.join(workDir, `${slug}.md`);

      // If stream file is already archived, allow (already gone through the gate)
      if (!fs.existsSync(streamFile)) continue;

      const content = fs.readFileSync(streamFile, 'utf8');
      const approved =
        /\*\*closure_approved:\*\*\s*true/i.test(content) ||
        /^closure_approved:\s*true/im.test(content);
      const doneCriteria = extractSection(content, '## Done criteria');
      const hasUncheckedDoneCriteria = /-\s*\[\s\]/.test(doneCriteria);

      if (!approved) {
        const output = {
          decision: 'block',
          reason:
            `⛔ STREAM CLOSURE BLOCKED — "${slug}"\n\n` +
            `closure_approved is not set to true in .platform/work/${slug}.md\n\n` +
            `To close this stream:\n` +
            `  1. Present completion evidence to the user ("here is what was done...")\n` +
            `  2. Wait for explicit human sign-off ("yes, close it" / "looks good")\n` +
            `  3. Set closure_approved: true in work/${slug}.md\n` +
            `  4. Then re-attempt this ACTIVE.md change\n\n` +
            `Rule: only the human/owner declares a stream complete. No exceptions.`,
        };
        process.stdout.write(JSON.stringify(output));
        process.exit(2);
      }

      if (hasUncheckedDoneCriteria) {
        const output = {
          decision: 'block',
          reason:
            `⛔ STREAM CLOSURE BLOCKED — "${slug}"\n\n` +
            `Unchecked done criteria remain in .platform/work/${slug}.md\n\n` +
            `To close this stream:\n` +
            `  1. Finish every item in ## Done criteria\n` +
            `  2. Complete manual QA / verification\n` +
            `  3. Get explicit human sign-off\n` +
            `  4. Then re-attempt this ACTIVE.md change\n\n` +
            `Rule: streams do not close while checklist items are still open.`,
        };
        process.stdout.write(JSON.stringify(output));
        process.exit(2);
      }
    }

    process.exit(0);
  } catch (e) {
    // Silent fail — never block on hook error
    process.exit(0);
  }
});
