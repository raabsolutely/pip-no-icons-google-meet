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

    /* Gemini star and the "call feature notifications and actions" panel it sits in, always hidden */
    [jscontroller="baDByd"], [jsname="ocqpFe"], [jsname="J4YcA"], [aria-label*="Gemini" i] { display: none !important; }

    /* Per tile: mic/audio indicator and menus hidden, name on tile hover */
    ${TILE} [jscontroller="HTP19d"], ${TILE} button { display: none !important; }
    ${NAME} { opacity: 0 !important; transition: opacity .15s ease !important; }
    ${TILE}:hover [jsname="giiMnc"] { opacity: 1 !important; }
  `;

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
  };

  const dpip = window.documentPictureInPicture;
  if (!dpip) return;
  dpip.addEventListener('enter', (e) => inject(e.window));
  if (dpip.window) inject(dpip.window);
})();
