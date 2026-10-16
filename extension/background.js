// Puts the Meet window into (or out of) full screen. Window-level, so it needs no key press inside the page.
const previous = new Map();

chrome.runtime.onMessage.addListener((msg, sender) => {
  const id = sender.tab?.windowId;
  if (id === undefined) return;
  chrome.windows.get(id, (win) => {
    if (msg.action === 'fullscreen' && win.state !== 'fullscreen') {
      previous.set(id, win.state);
      chrome.windows.update(id, { state: 'fullscreen', focused: true });
    } else if (msg.action === 'fullscreen') {
      chrome.windows.update(id, { focused: true });
    } else if (msg.action === 'restore' && win.state === 'fullscreen') {
      chrome.windows.update(id, { state: previous.get(id) || 'normal' });
    }
  });
});
