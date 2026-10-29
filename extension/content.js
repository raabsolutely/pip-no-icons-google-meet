(() => {
  // Hooks are Meet's jscontroller/jsname IDs and data attributes, which don't change with UI language.
  const TILE = '[data-participant-id]';
  const BAR = '[jscontroller="Kfy4fd"]';
  const RESIZE = '[role="button"].TLSgbb';
  const NAME = `${TILE} [jsname="giiMnc"]`;

  const CSS = `
    /* Tiles fill the whole window (fit below scales away Meet's leftover margin) */
    body { overflow: hidden !important; }
    main[jscontroller="izfDQc"] { inset: 0 !important; }

    /* Banners above the tiles (e.g. "… (Presenting)") take height from the faces */
    main[jscontroller="izfDQc"] > :not(:has(${TILE})) { display: none !important; }

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

    // Meet sizes its tile area 16px narrower and 4px shorter than the space it has and pins it top-left,
    // which leaves a gap on the right. Scale the tile layer to fit that space, centred. Fit, not cover:
    // covering would cut tiles off at the edges whenever the tile area's shape differs from the window's.
    // Offsets are layout values, unaffected by the transform, so measuring never feeds back on itself.
    let queued = false;
    let last = '';
    const fit = () => {
      queued = false;
      const main = doc.querySelector('main[jscontroller="izfDQc"]');
      const areas = main ? [...main.children].filter((c) => c.querySelector(TILE)) : [];
      if (!areas.length) return;
      const x0 = Math.min(...areas.map((a) => a.offsetLeft));
      const y0 = Math.min(...areas.map((a) => a.offsetTop));
      const aw = Math.max(...areas.map((a) => a.offsetLeft + a.offsetWidth)) - x0;
      const ah = Math.max(...areas.map((a) => a.offsetTop + a.offsetHeight)) - y0;
      const W = main.clientWidth;
      const H = main.clientHeight;
      if (!aw || !ah || !W || !H) return;
      const s = Math.min(Math.max(Math.min(W / aw, H / ah), 0.6), 1.15);
      const tx = (W - aw * s) / 2 - x0 * s;
      const ty = (H - ah * s) / 2 - y0 * s;
      const transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${s.toFixed(4)})`;
      if (transform === last) return;
      last = transform;
      main.style.setProperty('transform-origin', '0 0', 'important');
      main.style.setProperty('transform', transform, 'important');
    };
    const refit = () => { if (!queued) { queued = true; win.requestAnimationFrame(fit); } };
    win.addEventListener('resize', refit);
    new MutationObserver(refit).observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    refit();
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
