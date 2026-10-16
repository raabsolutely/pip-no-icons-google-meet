(() => {
  // Ctrl+Option+F: a frameless floating strip. All tiles are drawn side by side onto a canvas, and the canvas
  // stream goes into Chrome's classic video picture-in-picture, which macOS shows without a title bar.
  // Needs the key press inside Meet: Chrome only opens picture-in-picture from a user action.
  const TILE = '[data-participant-id]';
  const TILE_W = 320;
  const TILE_H = 180;
  const GAP = 8;
  const RADIUS = 12;

  const isToggle = (e) => e.ctrlKey && e.altKey && !e.metaKey && !e.shiftKey && e.code === 'KeyF';
  const hasIcon = (el, names) => [...el.querySelectorAll('i')].some((i) => names.includes(i.textContent.trim()));

  let canvas;
  let video;
  let loop;

  // One tile per person, in Meet's order. Meet can show the same person twice (stage and filmstrip).
  const tiles = () => {
    const seen = new Set();
    return [...document.querySelectorAll(TILE)].filter((t) => {
      const id = t.getAttribute('data-participant-id');
      if (seen.has(id) || !t.getClientRects().length) return false;
      seen.add(id);
      return true;
    }).slice(0, 8);
  };

  const liveVideo = (tile) => [...tile.querySelectorAll('video')]
    .filter((v) => v.readyState >= 2 && v.videoWidth && v.getClientRects().length)
    .sort((a, b) => b.clientWidth - a.clientWidth)[0];

  // Meet mirrors your own camera with a CSS flip, which drawing ignores, so mirror it here too.
  const isMirrored = (el, tile) => {
    let flip = false;
    for (; el && el !== tile.parentElement; el = el.parentElement) {
      const t = getComputedStyle(el).transform;
      if (t && t !== 'none' && new DOMMatrixReadOnly(t).a < 0) flip = !flip;
    }
    return flip;
  };

  const name = (tile) => (tile.querySelector('[jsname="giiMnc"]')?.innerText || '').trim();

  const drawTile = (ctx, tile, x, y) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, TILE_W, TILE_H, RADIUS);
    ctx.clip();
    const v = liveVideo(tile);
    if (v) {
      // object-fit: cover
      const ta = TILE_W / TILE_H;
      const va = v.videoWidth / v.videoHeight;
      const sw = va > ta ? v.videoHeight * ta : v.videoWidth;
      const sh = va > ta ? v.videoHeight : v.videoWidth / ta;
      const sx = (v.videoWidth - sw) / 2;
      const sy = (v.videoHeight - sh) / 2;
      if (isMirrored(v, tile)) {
        ctx.translate(x + TILE_W, y);
        ctx.scale(-1, 1);
        ctx.drawImage(v, sx, sy, sw, sh, 0, 0, TILE_W, TILE_H);
      } else {
        ctx.drawImage(v, sx, sy, sw, sh, x, y, TILE_W, TILE_H);
      }
    } else {
      // Camera off: an initial on Meet's tile grey
      ctx.fillStyle = '#3C4043';
      ctx.fillRect(x, y, TILE_W, TILE_H);
      ctx.fillStyle = '#E8EAED';
      ctx.font = '600 56px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((name(tile)[0] || '').toUpperCase(), x + TILE_W / 2, y + TILE_H / 2);
    }
    ctx.restore();
  };

  const draw = () => {
    const list = tiles();
    const w = Math.max(1, list.length) * (TILE_W + GAP) + GAP;
    const h = TILE_H + GAP * 2;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, h);
    list.forEach((t, i) => drawTile(ctx, t, GAP + i * (TILE_W + GAP), GAP));
  };

  // Mute, camera and leave in the floating window act on Meet's own buttons.
  const callButton = (icons) => [...document.querySelectorAll('button')]
    .find((b) => !b.closest(TILE) && b.getClientRects().length && hasIcon(b, icons));

  const syncControls = () => {
    const mic = callButton(['mic', 'mic_off']);
    const cam = callButton(['videocam', 'videocam_off']);
    try {
      if (mic) navigator.mediaSession.setMicrophoneActive(!hasIcon(mic, ['mic_off']));
      if (cam) navigator.mediaSession.setCameraActive(!hasIcon(cam, ['videocam_off']));
    } catch {}
  };

  const setControls = (on) => {
    const handlers = {
      togglemicrophone: () => callButton(['mic', 'mic_off'])?.click(),
      togglecamera: () => callButton(['videocam', 'videocam_off'])?.click(),
      hangup: () => callButton(['call_end'])?.click(),
    };
    for (const [action, fn] of Object.entries(handlers)) {
      try { navigator.mediaSession.setActionHandler(action, on ? fn : null); } catch {}
    }
  };

  const stop = () => {
    clearInterval(loop);
    loop = null;
    setControls(false);
    video?.srcObject?.getTracks().forEach((t) => t.stop());
    video?.remove();
    video = null;
  };

  const start = async () => {
    canvas = document.createElement('canvas');
    draw();
    video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = 'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:0;left:0';
    video.srcObject = canvas.captureStream(30);
    document.body.append(video);
    // Timers keep running while Meet plays call audio, unlike animation frames in a hidden window.
    let tick = 0;
    loop = setInterval(() => {
      draw();
      if (++tick % 15 === 0) syncControls();
    }, 33);
    await video.play();
    await video.requestPictureInPicture();
    setControls(true);
    syncControls();
    video.addEventListener('leavepictureinpicture', stop, { once: true });
  };

  document.addEventListener('keydown', (e) => {
    if (!isToggle(e)) return;
    e.preventDefault();
    e.stopPropagation();
    if (document.pictureInPictureElement && document.pictureInPictureElement === video) {
      document.exitPictureInPicture();
    } else {
      start().catch((err) => { console.warn('[PiP No Icons] frameless strip failed:', err); stop(); });
    }
  }, true);
})();
