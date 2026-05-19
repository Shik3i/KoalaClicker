document.addEventListener('DOMContentLoaded', async () => {
  const addBtn = document.getElementById('add-clicker-btn');
  const listContainer = document.getElementById('clickers-list');
  const emptyState = document.getElementById('empty-state');

  // Get current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;
  const tab = tabs[0];

  const blockedProtocols = ['chrome:', 'about:', 'edge:', 'chrome-extension:', 'view-source:'];
  const isBlocked = !tab.url || blockedProtocols.some(proto => tab.url.startsWith(proto));
  if (isBlocked) {
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
    addBtn.style.cursor = 'not-allowed';
    emptyState.textContent = "Cannot run on this page.";
    emptyState.style.display = 'block';
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
  try {
    await injectContentScriptIfNeeded(tab.id);
  } catch (e) {
    console.error("Failed to inject content script", e);
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
    addBtn.style.cursor = 'not-allowed';
    emptyState.textContent = "Script injection is blocked on this page (e.g. Chrome Web Store or local file without permission).";
    emptyState.style.display = 'block';
    return;
  }

  // Load saved clickers
  await loadAndRenderClickers();

  // "Add New Clicker" button logic
  addBtn.addEventListener('click', async () => {
    try {
      // Tell content script to enter selection mode
      await chrome.tabs.sendMessage(tab.id, { action: 'ENTER_SELECTION_MODE', url: siteKey });
    } catch (e) {
      console.error("Failed to enter selection mode", e);
    }
    window.close(); // Close popup so user can interact with the page
  });

  async function injectContentScriptIfNeeded(tabId) {
    try {
      // Check if it responds
      await chrome.tabs.sendMessage(tabId, { action: 'PING' });
    } catch (e) {
      // Need to inject isolated content script and CSS
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content/content.css']
      });
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.js']
      });
      // Inject native MAIN-world bypass script (CSP immune)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: 'MAIN',
          files: ['content/bypass.js']
        });
      } catch (bypassError) {
        console.warn("KoalaClicker: Failed to inject main-world bypass script.", bypassError);
      }
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
        
        const header = document.createElement('div');
        header.className = 'clicker-header';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'clicker-name-input';
        nameInput.value = clicker.name || 'Clicker ' + (index + 1);
        nameInput.title = `Selector: ${clicker.selector}`;
        nameInput.placeholder = 'Name this clicker';

        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${clicker.active ? '' : 'stopped'}`;
        statusBadge.textContent = clicker.active ? 'Running' : 'Stopped';

        header.appendChild(nameInput);
        header.appendChild(statusBadge);

        const controls = document.createElement('div');
        controls.className = 'clicker-controls';

        const intervalInput = document.createElement('input');
        intervalInput.type = 'number';
        intervalInput.className = 'interval-input';
        intervalInput.value = clicker.interval;
        intervalInput.min = '25';
        intervalInput.step = '25';

        const intervalLabel = document.createElement('span');
        intervalLabel.className = 'interval-label';
        intervalLabel.textContent = 'ms';

        const stopBtn = document.createElement('button');
        stopBtn.className = `btn-icon btn-stop ${clicker.active ? '' : 'is-stopped'}`;
        stopBtn.textContent = clicker.active ? 'Stop' : 'Start';

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn-icon btn-remove';
        removeBtn.textContent = 'Del';

        controls.appendChild(intervalInput);
        controls.appendChild(intervalLabel);
        controls.appendChild(stopBtn);
        controls.appendChild(removeBtn);

        item.appendChild(header);
        item.appendChild(controls);

        nameInput.addEventListener('input', (e) => {
          clicker.name = e.target.value;
          debouncedUpdateSilently(clickers);
        });

        nameInput.addEventListener('change', (e) => {
          clicker.name = e.target.value;
          updateClickersSilently(clickers);
        });

        intervalInput.addEventListener('input', (e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val) || val < 25) val = 25;
          clicker.interval = val;
          debouncedUpdateSilently(clickers);
        });

        intervalInput.addEventListener('change', (e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val) || val < 25) val = 25;
          clicker.interval = val;
          e.target.value = val; // Ensure visual correction
          updateClickersSilently(clickers);
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
          
          // Update visual state in place without full DOM rebuild
          statusBadge.className = `status-badge ${clicker.active ? '' : 'stopped'}`;
          statusBadge.textContent = clicker.active ? 'Running' : 'Stopped';
          stopBtn.className = `btn-icon btn-stop ${clicker.active ? '' : 'is-stopped'}`;
          stopBtn.textContent = clicker.active ? 'Stop' : 'Start';
          
          updateClickersSilently(clickers);
        });

        removeBtn.addEventListener('click', () => {
          clickers.splice(index, 1);
          updateClicker(clickers);
        });

        listContainer.appendChild(item);
      });

      // Send the current list to the content script so it syncs its running intervals
      chrome.tabs.sendMessage(tab.id, { action: 'SYNC_CLICKERS', clickers: clickers, url: siteKey }).catch(() => {});
    });
  }

  function updateClicker(clickers) {
    const obj = {};
    obj[siteKey] = clickers;
    chrome.storage.local.set(obj, () => {
      loadAndRenderClickers();
    });
  }

  function updateClickersSilently(clickers) {
    const obj = {};
    obj[siteKey] = clickers;
    chrome.storage.local.set(obj, () => {
      chrome.tabs.sendMessage(tab.id, { action: 'SYNC_CLICKERS', clickers: clickers, url: siteKey }).catch(() => {});
    });
  }

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedUpdateSilently = debounce(updateClickersSilently, 300);
});
