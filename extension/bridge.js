// Relays window requests from content.js (page world, no extension APIs) to background.js.
window.addEventListener('message', (e) => {
  if (e.source !== window || e.data?.source !== 'pip-no-icons') return;
  if (e.data.action === 'fullscreen' || e.data.action === 'restore') {
    chrome.runtime.sendMessage({ action: e.data.action });
  }
});
