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
    doc.addEventListener('keydown', (e) => {
      if (!isToggle(e)) return;
      e.preventDefault();
      toFullScreen(win);
    }, true);
  };

  // Ctrl+Option+P switches between the strip and Meet in full screen.
  // Chrome only opens the floating window from a key press inside Meet, so it works while Meet or the strip has focus.
  const isToggle = (e) => e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey && e.code === 'KeyP';
  const hasIcon = (el, name) => [...el.querySelectorAll('i')].some((i) => i.textContent.trim() === name);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // Page full screen is refused once a key press has been used to close the strip, so bridge.js and
  // background.js make the whole Meet window full screen instead.
  const askWindow = (action) => window.postMessage({ source: 'pip-no-icons', action }, location.origin);

  const toFullScreen = (pip) => {
    pip.close();
    askWindow('fullscreen');
  };

  // Opens the strip through Meet's own menu item (this needs the key press), then leaves full screen.
  const toStrip = async () => {
    const more = document.querySelector('button[jsname="NakZHc"]') ||
      [...document.querySelectorAll('button')].find((b) => !b.closest(TILE) && hasIcon(b, 'more_vert'));
    if (!more) return;
    more.click();
    for (let i = 0; i < 40; i++) {
      const item = [...document.querySelectorAll('[role="menuitem"]')].find((m) => hasIcon(m, 'dropdown'));
      if (item) {
        item.click();
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        askWindow('restore');
        return;
      }
      await wait(50);
    }
  };

  const dpip = window.documentPictureInPicture;
  if (!dpip) return;
  dpip.addEventListener('enter', (e) => inject(e.window));
  if (dpip.window) inject(dpip.window);

  document.addEventListener('keydown', (e) => {
    if (!isToggle(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (dpip.window) toFullScreen(dpip.window);
    else toStrip();
  }, true);
})();
