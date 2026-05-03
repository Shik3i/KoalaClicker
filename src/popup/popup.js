document.addEventListener('DOMContentLoaded', async () => {
  const addBtn = document.getElementById('add-clicker-btn');
  const listContainer = document.getElementById('clickers-list');
  const emptyState = document.getElementById('empty-state');

  // Get current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;
  const tab = tabs[0];

  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('edge://')) {
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
    addBtn.style.cursor = 'not-allowed';
    emptyState.textContent = "Cannot run on this page.";
    return;
  }

  const urlObj = new URL(tab.url);
  const siteKey = urlObj.origin + urlObj.pathname;

  // Set version label
  const versionLabel = document.getElementById('version-label');
  const manifest = chrome.runtime.getManifest();
  if (versionLabel && manifest) {
    versionLabel.textContent = `v${manifest.version}`;
  }

  // Inject content script if not already injected
  await injectContentScriptIfNeeded(tab.id);

  // Load saved clickers
  await loadAndRenderClickers();

  // "Add New Clicker" button logic
  addBtn.addEventListener('click', async () => {
    // Tell content script to enter selection mode
    chrome.tabs.sendMessage(tab.id, { action: 'ENTER_SELECTION_MODE', url: siteKey });
    window.close(); // Close popup so user can interact with the page
  });

  async function injectContentScriptIfNeeded(tabId) {
    try {
      // Check if it responds
      await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    } catch (e) {
      // Need to inject
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content/content.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.js']
      });
      // Give it a tiny moment to initialize
      await new Promise(r => setTimeout(r, 50));
    }
  }

  async function loadAndRenderClickers() {
    chrome.storage.local.get([siteKey], (result) => {
      const clickers = result[siteKey] || [];
      
      if (clickers.length === 0) {
        emptyState.style.display = 'block';
        listContainer.innerHTML = '';
        return;
      }
      
      emptyState.style.display = 'none';
      listContainer.innerHTML = '';

      clickers.forEach((clicker, index) => {
        const item = document.createElement('div');
        item.className = 'clicker-item';
        
        item.innerHTML = `
          <div class="clicker-header">
            <input type="text" class="clicker-name-input" value="${clicker.name || 'Clicker ' + (index + 1)}" title="Selector: ${clicker.selector}" placeholder="Name this clicker" />
            <span class="status-badge ${clicker.active ? '' : 'stopped'}">${clicker.active ? 'Running' : 'Stopped'}</span>
          </div>
          <div class="clicker-controls">
            <input type="number" class="interval-input" value="${clicker.interval}" min="25" step="25" />
            <span class="interval-label">ms</span>
            <button class="btn-icon btn-stop ${clicker.active ? '' : 'is-stopped'}">${clicker.active ? 'Stop' : 'Start'}</button>
            <button class="btn-icon btn-remove">Del</button>
          </div>
        `;

        // Event Listeners for controls
        const nameInput = item.querySelector('.clicker-name-input');
        const intervalInput = item.querySelector('.interval-input');
        const stopBtn = item.querySelector('.btn-stop');
        const removeBtn = item.querySelector('.btn-remove');

        nameInput.addEventListener('input', (e) => {
          clicker.name = e.target.value;
          updateClicker(clickers);
        });

        intervalInput.addEventListener('input', (e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val) || val < 25) val = 25;
          // We don't force e.target.value = val during 'input' because it breaks typing (e.g. typing "1" gets forced to "25" instantly).
          // We only update the data model.
          clicker.interval = val;
          updateClicker(clickers);
        });

        // Ensure the input field corrects itself visually when the user clicks away
        intervalInput.addEventListener('change', (e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val) || val < 25) val = 25;
          e.target.value = val;
        });

        // Highlight element on hover
        item.addEventListener('mouseenter', () => {
          chrome.tabs.sendMessage(tab.id, { action: 'HIGHLIGHT_ELEMENT', selector: clicker.selector });
        });
        
        item.addEventListener('mouseleave', () => {
          chrome.tabs.sendMessage(tab.id, { action: 'UNHIGHLIGHT_ELEMENT' });
        });

        stopBtn.addEventListener('click', () => {
          clicker.active = !clicker.active;
          updateClicker(clickers);
        });

        removeBtn.addEventListener('click', () => {
          clickers.splice(index, 1);
          updateClicker(clickers);
        });

        listContainer.appendChild(item);
      });

      // Send the current list to the content script so it syncs its running intervals
      chrome.tabs.sendMessage(tab.id, { action: 'SYNC_CLICKERS', clickers: clickers, url: siteKey });
    });
  }

  function updateClicker(clickers) {
    const obj = {};
    obj[siteKey] = clickers;
    chrome.storage.local.set(obj, () => {
      loadAndRenderClickers();
    });
  }
});
