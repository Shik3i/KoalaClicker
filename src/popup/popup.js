document.addEventListener('DOMContentLoaded', async () => {
  const addBtn = document.getElementById('add-clicker-btn');
  const listContainer = document.getElementById('clickers-list');
  const emptyState = document.getElementById('empty-state');

  // Set version label immediately — before any early returns so it's always visible
  const versionLabel = document.getElementById('version-label');
  const manifest = chrome.runtime.getManifest();
  if (versionLabel && manifest) {
    versionLabel.textContent = `v${manifest.version}`;
  }

  // Get current active tab
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tabs.length === 0) return;
  const tab = tabs[0];

  const urlObj = KoalaClickerModel.parseSiteUrl(tab.url);
  if (!urlObj) {
    addBtn.disabled = true;
    addBtn.style.opacity = '0.5';
    addBtn.style.cursor = 'not-allowed';
    emptyState.textContent = "Cannot run on this page.";
    emptyState.style.display = 'block';
    return;
  }

  const siteKey = urlObj.origin;
  const legacySiteKey = urlObj.origin + urlObj.pathname;

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
        files: ['shared/model.js', 'content/content.js']
      });
      // Inject native MAIN-world compatibility script (CSP immune)
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tabId },
          world: 'MAIN',
          files: ['content/compatibility.js']
        });
      } catch (compatibilityError) {
        console.warn("KoalaClicker: Failed to inject main-world compatibility script.", compatibilityError);
      }
      // Give it a tiny moment to initialize
      await new Promise(r => setTimeout(r, 50));
    }
  }

  async function loadAndRenderClickers() {
    chrome.storage.local.get([siteKey, legacySiteKey], (result) => {
      const storedClickers = result[siteKey] || result[legacySiteKey] || [];
      const clickers = KoalaClickerModel.normalizeClickers(storedClickers);

      if (!result[siteKey] && result[legacySiteKey]) {
        chrome.storage.local.set({ [siteKey]: clickers }, () => {
          chrome.storage.local.remove(legacySiteKey);
        });
      } else if (JSON.stringify(storedClickers) !== JSON.stringify(clickers)) {
        chrome.storage.local.set({ [siteKey]: clickers });
      }
      
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
        nameInput.maxLength = KoalaClickerModel.MAX_NAME_LENGTH;

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
        intervalInput.min = String(KoalaClickerModel.MIN_INTERVAL);
        intervalInput.max = String(KoalaClickerModel.MAX_INTERVAL);
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
          if (isNaN(val) || val < KoalaClickerModel.MIN_INTERVAL) val = KoalaClickerModel.MIN_INTERVAL;
          if (val > KoalaClickerModel.MAX_INTERVAL) val = KoalaClickerModel.MAX_INTERVAL;
          clicker.interval = val;
          debouncedUpdateSilently(clickers);
        });

        intervalInput.addEventListener('change', (e) => {
          let val = parseInt(e.target.value, 10);
          if (isNaN(val) || val < KoalaClickerModel.MIN_INTERVAL) val = KoalaClickerModel.MIN_INTERVAL;
          if (val > KoalaClickerModel.MAX_INTERVAL) val = KoalaClickerModel.MAX_INTERVAL;
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
          // Find the current index by id at deletion time to avoid stale-index bug
          const currentClickers = clickers;
          const idx = currentClickers.findIndex(c => c.id === clicker.id);
          if (idx !== -1) {
            currentClickers.splice(idx, 1);
            updateClicker(currentClickers);
          }
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
