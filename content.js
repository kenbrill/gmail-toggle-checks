(function () {
  'use strict';

  // Prevent double-injection on Gmail navigation events
  if (document.getElementById('gtc-toolbar')) return;

  let activeRow = null;
  let hideTimer = null;

  // Labels of Gmail's hover actions (Archive, Delete, Snooze, Mark as read, Track/Unsubscribe, …)
  const STOCK_ACTION_RE = /archive|delete|trash|snooze|mark as|unsubscribe|track/i;

  const toolbar = buildToolbar();
  document.body.appendChild(toolbar);

  document.addEventListener('mouseover', onMouseOver);
  document.addEventListener('mouseout', onMouseOut);
  toolbar.addEventListener('mouseenter', () => clearTimeout(hideTimer));
  toolbar.addEventListener('mouseleave', scheduleHide);

  // Gmail is a SPA — re-guard on each navigation so we never double-inject
  const navObserver = new MutationObserver(() => {
    if (!document.getElementById('gtc-toolbar')) {
      document.body.appendChild(toolbar);
    }
  });
  navObserver.observe(document.body, { childList: true });

  // ── event handlers ──────────────────────────────────────────────────────────

  function onMouseOver(e) {
    const row = emailRow(e.target);
    if (!row) return;
    clearTimeout(hideTimer);
    activeRow = row;
    // Re-align on every hover: Gmail renders its hover actions after the first mouseover
    alignToolbar(row);
    toolbar.style.display = 'flex';
  }

  function onMouseOut(e) {
    const row = emailRow(e.target);
    if (!row) return;
    const to = e.relatedTarget;
    // Keep toolbar visible when mouse moves from row → toolbar (or stays in row)
    if (to && (row.contains(to) || toolbar.contains(to))) return;
    scheduleHide();
  }

  function scheduleHide() {
    hideTimer = setTimeout(() => {
      toolbar.style.display = 'none';
      activeRow = null;
    }, 160);
  }

  // ── core logic ───────────────────────────────────────────────────────────────

  // Returns the nearest ancestor <tr> that contains a Gmail aria checkbox,
  // or null if the element isn't inside an email row.
  function emailRow(el) {
    const row = el.closest('tr');
    return row && row.querySelector('div[role="checkbox"]') ? row : null;
  }

  function alignToolbar(row) {
    const rect = row.getBoundingClientRect();
    // Vertically centre the toolbar on the row
    toolbar.style.top = Math.round(rect.top + (rect.height - 28) / 2) + 'px';

    // Sit just left of Gmail's own hover actions so they stay clickable.
    // Fall back to the right edge when none are rendered for this row.
    const stockLeft = leftmostStockAction(row);
    toolbar.style.right = stockLeft === null
      ? '16px'
      : Math.round(document.documentElement.clientWidth - stockLeft + 8) + 'px';
  }

  // Left edge of the furthest-left visible Gmail hover action in the row, or null
  function leftmostStockAction(row) {
    let left = null;
    row.querySelectorAll('[data-tooltip], [aria-label]').forEach(el => {
      const label = el.getAttribute('data-tooltip') || el.getAttribute('aria-label') || '';
      if (!STOCK_ACTION_RE.test(label)) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      if (left === null || r.left < left) left = r.left;
    });
    return left;
  }

  // Set every email row from activeRow downward to the given checked state.
  // Gmail uses <div role="checkbox" aria-checked="true|false"> — toggling
  // requires a synthetic click rather than setting .checked.
  function applyFromRow(checked) {
    if (!activeRow) return;

    const allRows = Array.from(document.querySelectorAll('tr'))
      .filter(r => r.querySelector('div[role="checkbox"]'));

    const start = allRows.indexOf(activeRow);
    if (start < 0) return;

    for (let i = start; i < allRows.length; i++) {
      const cb = allRows[i].querySelector('div[role="checkbox"]');
      if (!cb) continue;
      const isChecked = cb.getAttribute('aria-checked') === 'true';
      if (isChecked !== checked) cb.click();
    }
  }

  // ── UI construction ──────────────────────────────────────────────────────────

  function buildToolbar() {
    const t = document.createElement('div');
    t.id = 'gtc-toolbar';
    Object.assign(t.style, {
      position:     'fixed',
      right:        '16px',
      zIndex:       '10000',
      display:      'none',
      alignItems:   'center',
      gap:          '2px',
      background:   '#fff',
      border:       '1px solid #dadce0',
      borderRadius: '4px',
      boxShadow:    '0 1px 3px rgba(60,64,67,.3),0 4px 8px rgba(60,64,67,.15)',
      padding:      '2px 4px',
    });

    t.appendChild(makeBtn('↓ Check below',   'Check this row and every row below it',   true));
    t.appendChild(makeSep());
    t.appendChild(makeBtn('↓ Uncheck below', 'Uncheck this row and every row below it', false));

    return t;
  }

  function makeBtn(label, title, checked) {
    const b = document.createElement('button');
    b.textContent = label;
    b.title = title;
    Object.assign(b.style, {
      background:  'none',
      border:      'none',
      cursor:      'pointer',
      padding:     '4px 10px',
      fontSize:    '12px',
      fontFamily:  "'Google Sans',Roboto,Arial,sans-serif",
      color:       '#3c4043',
      borderRadius:'3px',
      whiteSpace:  'nowrap',
      lineHeight:  '20px',
    });
    b.addEventListener('mouseenter', () => { b.style.background = '#f1f3f4'; });
    b.addEventListener('mouseleave', () => { b.style.background = 'none'; });
    b.addEventListener('click', (e) => {
      e.stopPropagation();
      applyFromRow(checked);
    });
    return b;
  }

  function makeSep() {
    const s = document.createElement('span');
    Object.assign(s.style, {
      width:      '1px',
      height:     '16px',
      background: '#dadce0',
      display:    'inline-block',
      flexShrink: '0',
    });
    return s;
  }
})();
