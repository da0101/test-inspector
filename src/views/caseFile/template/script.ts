// Webview script — runs in the Case File webview. Inline JS data, kept
// as a single exported string so the template can splice it into the
// page HTML with a per-render nonce.

export const SCRIPT = `
  const vscode = acquireVsCodeApi();

  // Restore view state from the previous render. Without this, every re-render
  // (AI review complete, Mark Reviewed, Rescan) would:
  //   1. Reset verdictFilter to '*' and projectFilter to '*' (all)
  //   2. Re-sort cards by killPriority so THEATER jumps to the top
  //   3. Scroll back to 0 (or to a Y that now points at a different card)
  // The user would see "I clicked AI review on a Weak card and got bounced
  // to the Theater list at the top". Persisting filters + scroll fixes this.
  const savedState = vscode.getState() || {};
  let verdictFilter = typeof savedState.verdictFilter === 'string' ? savedState.verdictFilter : '*';
  let projectFilter = typeof savedState.projectFilter === 'string' ? savedState.projectFilter : '*';

  function saveState() {
    const prev = vscode.getState() || {};
    vscode.setState({
      ...prev,
      verdictFilter,
      projectFilter,
      scrollY: window.scrollY,
    });
  }

  // Throttled scroll saver — runs at most every 80 ms during scroll.
  let scrollSaveTimer;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollSaveTimer);
    scrollSaveTimer = setTimeout(saveState, 80);
  }, { passive: true });

  function applyFilter() {
    // 1. Recompute KPI counts based on current project scope
    const inScope = [];
    document.querySelectorAll('.case').forEach((el) => {
      const p = el.getAttribute('data-project');
      if (projectFilter === '*' || p === projectFilter) {
        inScope.push(el);
      }
    });
    const total = inScope.length;
    const counts = { THEATER: 0, WEAK: 0, MISSING: 0, STRONG: 0 };
    for (const el of inScope) {
      const v = el.getAttribute('data-verdict');
      if (counts[v] !== undefined) counts[v]++;
    }

    // 2. Update KPI tiles (numbers + share + disabled state + active state)
    document.querySelectorAll('.kpi').forEach((tile) => {
      const v = tile.getAttribute('data-verdict');
      const count = counts[v] ?? 0;
      const share = total > 0 ? Math.round((count / total) * 100) : 0;
      const valEl = tile.querySelector('[data-count]');
      if (valEl) valEl.textContent = String(count);
      const pctEl = tile.querySelector('[data-pct]');
      const sepEl = tile.querySelector('[data-sep]');
      if (pctEl && sepEl) {
        if (total > 0) {
          sepEl.textContent = '·';
          pctEl.textContent = share + '%';
        } else {
          sepEl.textContent = '';
          pctEl.textContent = '';
        }
      }
      tile.classList.toggle('disabled', count === 0);
      tile.classList.toggle('active', v === verdictFilter && count > 0);
    });

    // 3. Update tab active state
    document.querySelectorAll('.tab').forEach((t) => {
      const isActive = t.getAttribute('data-project') === projectFilter;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });

    // 4. Apply combined filter to cards
    let shown = 0;
    document.querySelectorAll('.case').forEach((el) => {
      const v = el.getAttribute('data-verdict');
      const p = el.getAttribute('data-project');
      const match = (verdictFilter === '*' || verdictFilter === v) && (projectFilter === '*' || projectFilter === p);
      el.style.display = match ? '' : 'none';
      if (match) shown++;
    });

    // 5. Update counter
    const counter = document.getElementById('counter');
    if (counter) {
      counter.textContent = shown === total ? total + ' case' + (total === 1 ? '' : 's') : 'showing ' + shown + ' of ' + total;
    }
  }

  // KPI tile click = toggle verdict filter
  document.querySelectorAll('.kpi').forEach((tile) => {
    tile.addEventListener('click', () => {
      if (tile.classList.contains('disabled')) return;
      const v = tile.getAttribute('data-verdict');
      verdictFilter = (verdictFilter === v) ? '*' : v;
      applyFilter();
      saveState();
    });
  });

  // Tab click = switch project scope (exclusive, like radio)
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      projectFilter = tab.getAttribute('data-project');
      verdictFilter = '*';
      // Smooth scroll back to top so the new scope reads from card 1
      window.scrollTo({ top: 0, behavior: 'smooth' });
      applyFilter();
      saveState();
    });
  });

  // Clear filters link
  document.getElementById('clear-filters')?.addEventListener('click', () => {
    verdictFilter = '*';
    projectFilter = '*';
    applyFilter();
    saveState();
  });

  // Validate restored filters against the current bundle. If the project the
  // user had selected no longer has cases (or the verdict tile is disabled),
  // fall back to '*' rather than showing an empty list.
  function validateRestoredFilters() {
    if (verdictFilter !== '*') {
      const tile = document.querySelector('.kpi[data-verdict="' + verdictFilter + '"]');
      if (!tile || tile.classList.contains('disabled')) verdictFilter = '*';
    }
    if (projectFilter !== '*') {
      const tab = document.querySelector('.tab[data-project="' + projectFilter + '"]');
      if (!tab) projectFilter = '*';
    }
  }
  validateRestoredFilters();

  document.querySelectorAll('button[data-cmd]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cmd = btn.dataset.cmd;

      // Evidence toggle is handled client-side — no roundtrip.
      if (cmd === 'evidence') {
        const card = btn.closest('.case');
        const evidence = card && card.querySelector('.case-evidence');
        if (evidence) {
          if (evidence.hasAttribute('hidden')) {
            evidence.removeAttribute('hidden');
            btn.textContent = 'Hide evidence';
          } else {
            evidence.setAttribute('hidden', '');
            btn.textContent = 'Show evidence';
          }
        }
        return;
      }

      if (cmd === 'aiReview') {
        btn.innerHTML = '<span class="spinner"></span><span>Reviewing…</span>';
        btn.classList.add('busy');
        btn.disabled = true;
      }

      if (cmd === 'rescan') {
        btn.innerHTML = '<span class="spinner"></span><span>Rescanning…</span>';
        btn.classList.add('busy');
        btn.disabled = true;
      }

      // Mark Reviewed: hide the card immediately so the user sees instant feedback;
      // the extension host will write to disk and re-emit the bundle, but UX shouldn't wait.
      if (cmd === 'review') {
        const card = btn.closest('.case');
        if (card) card.style.display = 'none';
      }

      vscode.postMessage({
        type: cmd,
        path: btn.dataset.path,
        text: btn.dataset.text,
      });
    });
  });

  // Initial state — applyFilter renders the current filter set, then we
  // restore the saved scroll position once the layout has settled.
  applyFilter();
  if (typeof savedState.scrollY === 'number' && savedState.scrollY > 0) {
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedState.scrollY, behavior: 'auto' });
    });
  }
`;
