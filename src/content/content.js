// KoalaClicker content script
(() => {
  if (window.koalaClickerInjected) return;
  window.koalaClickerInjected = true;

  let isSelectionMode = false;
  let hoveredElement = null;
  let activeTimers = {};
  let currentSiteKey = '';
  
  // Create banner for selection mode
  const banner = document.createElement('div');
  banner.className = 'koala-clicker-banner';
  banner.style.display = 'none';
  banner.innerHTML = `
    <span>KoalaClicker: Click an element to auto-click it.</span>
    <button id="koala-cancel-btn">Cancel</button>
  `;
  document.documentElement.appendChild(banner);

  banner.querySelector('#koala-cancel-btn').addEventListener('click', () => {
    exitSelectionMode();
  });

  // Listen for messages from popup
  let currentlyHighlighted = null;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'PING') {
      sendResponse({ status: 'OK' });
    } else if (message.action === 'ENTER_SELECTION_MODE') {
      currentSiteKey = message.url;
      enterSelectionMode();
    } else if (message.action === 'SYNC_CLICKERS') {
      currentSiteKey = message.url;
      syncClickers(message.clickers);
    } else if (message.action === 'HIGHLIGHT_ELEMENT') {
      if (currentlyHighlighted) {
        currentlyHighlighted.classList.remove('koala-clicker-highlight');
      }
      const el = document.querySelector(message.selector);
      if (el) {
        el.classList.add('koala-clicker-highlight');
        currentlyHighlighted = el;
      }
    } else if (message.action === 'UNHIGHLIGHT_ELEMENT') {
      if (currentlyHighlighted) {
        currentlyHighlighted.classList.remove('koala-clicker-highlight');
        currentlyHighlighted = null;
      }
    }
  });

  function enterSelectionMode() {
    isSelectionMode = true;
    banner.style.display = 'flex';
    document.addEventListener('mouseover', onMouseOver, true);
    document.addEventListener('mouseout', onMouseOut, true);
    document.addEventListener('click', onClick, true);
  }

  function exitSelectionMode() {
    isSelectionMode = false;
    banner.style.display = 'none';
    if (hoveredElement) {
      hoveredElement.classList.remove('koala-clicker-highlight');
      hoveredElement = null;
    }
    document.removeEventListener('mouseover', onMouseOver, true);
    document.removeEventListener('mouseout', onMouseOut, true);
    document.removeEventListener('click', onClick, true);
  }

  function onMouseOver(e) {
    if (!isSelectionMode) return;
    if (banner.contains(e.target)) return;
    
    hoveredElement = e.target;
    hoveredElement.classList.add('koala-clicker-highlight');
  }

  function onMouseOut(e) {
    if (!isSelectionMode) return;
    if (hoveredElement) {
      hoveredElement.classList.remove('koala-clicker-highlight');
      hoveredElement = null;
    }
  }

  function onClick(e) {
    if (!isSelectionMode) return;
    if (banner.contains(e.target)) return; // Don't intercept clicks on banner
    
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    const selector = generateSelector(target);
    
    exitSelectionMode();
    saveNewClicker(selector);
  }

  function generateSelector(el) {
    if (el.id) {
      return '#' + CSS.escape(el.id);
    }
    let path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.nodeName.toLowerCase();
      if (current.id) {
        selector += '#' + CSS.escape(current.id);
        path.unshift(selector);
        break;
      } else {
        let sibling = current;
        let nth = 1;
        while (sibling = sibling.previousElementSibling) {
          if (sibling.nodeName.toLowerCase() == selector) {
            nth++;
          }
        }
        if (nth != 1) {
          selector += ':nth-of-type(' + nth + ')';
        }
      }
      path.unshift(selector);
      current = current.parentNode;
    }
    return path.join(' > ');
  }

  function saveNewClicker(selector) {
    chrome.storage.local.get([currentSiteKey], (result) => {
      const clickers = result[currentSiteKey] || [];
      const clickerName = "Clicker " + (clickers.length + 1);
      
      clickers.push({
        selector: selector,
        name: clickerName,
        interval: 250, // Default interval
        active: true,
        id: Date.now().toString()
      });
      
      const obj = {};
      obj[currentSiteKey] = clickers;
      chrome.storage.local.set(obj, () => {
        syncClickers(clickers);
      });
    });
  }

  function syncClickers(clickers) {
    // Stop all running timers that are not in the new active list
    const newActiveIds = clickers.filter(c => c.active).map(c => c.id);
    
    for (const id in activeTimers) {
      if (!newActiveIds.includes(id)) {
        clearInterval(activeTimers[id]);
        delete activeTimers[id];
      }
    }

    // Start or update timers for active clickers
    clickers.forEach(clicker => {
      if (clicker.active) {
        // Clear and restart it to ensure new interval is applied
        if (activeTimers[clicker.id]) {
          clearInterval(activeTimers[clicker.id]);
        }
        
        activeTimers[clicker.id] = setInterval(() => {
          triggerClick(clicker.selector);
        }, clicker.interval);
      }
    });
  }

  function triggerClick(selector) {
    try {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const clientX = rect.left + (rect.width / 2);
        const clientY = rect.top + (rect.height / 2);

        const eventOptions = {
          view: window,
          bubbles: true,
          cancelable: true,
          clientX: clientX,
          clientY: clientY
        };

        // Simulate a complete real click sequence
        el.dispatchEvent(new MouseEvent('mousedown', eventOptions));
        el.dispatchEvent(new MouseEvent('mouseup', eventOptions));
        el.dispatchEvent(new MouseEvent('click', eventOptions));
      }
    } catch(e) {
      // Selector might be invalid if DOM changed drastically
      console.error("KoalaClicker Error:", e);
    }
  }
})();
