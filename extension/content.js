(() => {
  // Hooks are Meet's jscontroller/jsname IDs and data attributes, which don't change with UI language.
  const TILE = '[data-participant-id]';
  const BAR = '[jscontroller="Kfy4fd"]';
  const RESIZE = '[role="button"].TLSgbb';
  const NAME = `${TILE} [jsname="giiMnc"]`;

  const CSS = `
    /* Tiles fill the whole window */
    main[jscontroller="izfDQc"] { inset: 0 !important; }

    /* Control bar floats over the video, hidden until the pointer is in the window */
    ${BAR} {
      position: absolute !important;
      left: 0 !important; right: 0 !important; bottom: 0 !important;
      z-index: 10 !important;
      background: linear-gradient(transparent, rgba(0, 0, 0, .6)) !important;
    }
    ${BAR}, ${RESIZE} { opacity: 0 !important; transition: opacity .15s ease !important; }
    body:hover ${BAR}, body:hover ${RESIZE} { opacity: 1 !important; }

    /* Gemini button, always hidden (marked by hideGemini below) */
    [aria-label*="Gemini" i], span:has(> [aria-label*="Gemini" i]), [data-fms-hide] { display: none !important; }

    /* Per tile: mic/audio indicator and menus hidden, name on tile hover */
    ${TILE} [jscontroller="HTP19d"], ${TILE} button { display: none !important; }
    ${NAME} { opacity: 0 !important; transition: opacity .15s ease !important; }
    ${TILE}:hover [jsname="giiMnc"] { opacity: 1 !important; }
  `;

  // The Gemini button carries no stable ID, so find it by any attribute or tooltip text
  // mentioning Gemini, and hide the small clickable element around it.
  const mentionsGemini = (el) =>
    [...el.attributes].some((a) => /gemini/i.test(a.value)) ||
    (el.getAttribute('role') === 'tooltip' && /gemini/i.test(el.textContent));

  const hideGemini = (doc) => {
    for (const el of doc.body.querySelectorAll('*')) {
      if (el.hasAttribute('data-fms-hide') || !mentionsGemini(el)) continue;
      const anchor = el.getAttribute('role') === 'tooltip' && el.id
        ? doc.querySelector(`[data-tooltip-id="${el.id}"]`) || el
        : el;
      const button = anchor.closest('button, [role="button"]') || anchor;
      const r = button.getBoundingClientRect();
      if (button.closest(TILE) || button.closest(BAR) || button.querySelector(TILE) || r.width > 120 || r.height > 120) continue;
      const wrapper = button.closest('[data-is-tooltip-wrapper]');
      const soleButton = wrapper && wrapper.querySelectorAll('button, [role="button"]').length === 1;
      (soleButton ? wrapper : button).setAttribute('data-fms-hide', '');
    }
  };

  const inject = (win) => {
    const doc = win.document;
    const add = () => {
      if (doc.getElementById('fms-style')) return;
      const style = doc.createElement('style');
      style.id = 'fms-style';
      style.textContent = CSS;
      doc.head.append(style);
    };
    add();
    new MutationObserver(add).observe(doc.head, { childList: true });

    let queued = false;
    const scan = () => {
      if (queued) return;
      queued = true;
      win.requestAnimationFrame(() => { queued = false; hideGemini(doc); });
    };
    scan();
    new MutationObserver(scan).observe(doc.body, { childList: true, subtree: true });
  };

  const dpip = window.documentPictureInPicture;
  if (!dpip) return;
  dpip.addEventListener('enter', (e) => inject(e.window));
  if (dpip.window) inject(dpip.window);
})();
