(function () {
  'use strict';

  // Gmail's hover actions (Archive, Delete, Snooze, …) live in a <ul class="bqY">
  // inside each row's action cell. We add our buttons to that list so they sit
  // in the same bar instead of in a separate floating panel.
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Icon shapes as [tag, attributes]. Built with DOM calls, not innerHTML,
  // because Gmail enforces Trusted Types.
  const CHECKBOX = ['rect', { x: 3, y: 3, width: 11, height: 11, rx: 2 }];
  const DOWN_ARROW = ['path', { d: 'M18 11v9.5m-3.5-3.5L18 20.5l3.5-3.5' }];

  const ACTIONS = [
    {
      title:   'Check this row and every row below it',
      label:   'Check below',
      checked: true,
      shapes:  [CHECKBOX, ['path', { d: 'M6 8.5l2 2 4-4' }], DOWN_ARROW],
    },
    {
      title:   'Uncheck this row and every row below it',
      label:   'Uncheck below',
      checked: false,
      shapes:  [CHECKBOX, DOWN_ARROW],
    },
  ];

  // Add our buttons to any hover bar that doesn't have them yet.
  // Gmail re-renders the bar on hover, so this runs on every DOM change.
  function injectIntoBars() {
    document.querySelectorAll('ul.bqY').forEach(bar => {
      if (bar.querySelector('.gtc-action')) return;
      const items = ACTIONS.map(makeItem);
      items.push(makeSep());
      bar.prepend(...items);
    });
  }

  // ── UI construction ──────────────────────────────────────────────────────────

  function makeItem(action) {
    const li = document.createElement('li');
    li.className = 'bqX gtc-action';
    li.setAttribute('data-tooltip', action.title);
    Object.assign(li.style, {
      display:        'inline-flex',
      alignItems:     'center',
      justifyContent: 'center',
      width:          '28px',
      height:         '20px',
      margin:         '0 2px',
      borderRadius:   '50%',
      cursor:         'pointer',
      color:          '#5f6368',
    });

    li.appendChild(makeIcon(action.shapes));

    li.addEventListener('mouseenter', () => { li.style.background = '#f1f3f4'; });
    li.addEventListener('mouseleave', () => { li.style.background = 'none'; });
    // Keep Gmail's row handlers from opening the email or starting a selection
    li.addEventListener('mousedown', e => e.stopPropagation());
    li.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      applyFromRow(li.closest('tr'), action.checked);
    });
    return li;
  }

  function makeIcon(shapes) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    setAttrs(svg, { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': 'true' });
    shapes.forEach(([tag, attrs]) => {
      const el = document.createElementNS(SVG_NS, tag);
      setAttrs(el, {
        fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs,
      });
      svg.appendChild(el);
    });
    return svg;
  }

  function setAttrs(el, attrs) {
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  }

  function makeSep() {
    const s = document.createElement('li');
    s.className = 'gtc-action';
    s.setAttribute('aria-hidden', 'true');
    Object.assign(s.style, {
      width:      '1px',
      height:     '16px',
      margin:     '0 4px',
      background: '#dadce0',
      display:    'inline-block',
      flexShrink: '0',
    });
    return s;
  }

  // ── core logic ───────────────────────────────────────────────────────────────

  // Set every email row from `startRow` downward to the given checked state.
  // Gmail uses <div role="checkbox" aria-checked="true|false"> — toggling
  // requires a synthetic click rather than setting .checked.
  function applyFromRow(startRow, checked) {
    if (!startRow) return;

    const allRows = Array.from(document.querySelectorAll('tr'))
      .filter(r => r.querySelector('div[role="checkbox"]'));

    const start = allRows.indexOf(startRow);
    if (start < 0) return;

    for (let i = start; i < allRows.length; i++) {
      const cb = allRows[i].querySelector('div[role="checkbox"]');
      if (!cb) continue;
      const isChecked = cb.getAttribute('aria-checked') === 'true';
      if (isChecked !== checked) cb.click();
    }
  }

  // ── start ────────────────────────────────────────────────────────────────────

  injectIntoBars();
  // Gmail is a SPA and re-renders hover bars constantly
  new MutationObserver(injectIntoBars).observe(document.body, { childList: true, subtree: true });
})();
