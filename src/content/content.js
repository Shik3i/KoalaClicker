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

  // Note: MAIN-world compatibility script is injected natively by popup.js to resist CSP blocks.

  banner.querySelector('#koala-cancel-btn').addEventListener('click', () => {
    exitSelectionMode();
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'PING') {
      sendResponse({ status: 'OK' });
      return true; // Keep message channel open for async safety
    } else if (message.action === 'ENTER_SELECTION_MODE') {
      currentSiteKey = message.url;
      enterSelectionMode();
    } else if (message.action === 'SYNC_CLICKERS') {
      currentSiteKey = message.url;
      syncClickers(message.clickers);
    } else if (message.action === 'HIGHLIGHT_ELEMENT') {
      document.querySelectorAll('.koala-clicker-highlight').forEach(el => 
        el.classList.remove('koala-clicker-highlight')
      );
      try {
        const el = document.querySelector(message.selector);
        if (el) el.classList.add('koala-clicker-highlight');
      } catch (e) {
        console.warn("KoalaClicker: Invalid selector prevented highlight execution.", e);
      }
    } else if (message.action === 'UNHIGHLIGHT_ELEMENT') {
      document.querySelectorAll('.koala-clicker-highlight').forEach(el => 
        el.classList.remove('koala-clicker-highlight')
      );
    }
    return false;
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
    // Check for stable data attributes first
    if (el.hasAttribute('data-testid')) {
      return `[data-testid="${CSS.escape(el.getAttribute('data-testid'))}"]`;
    }
    if (el.hasAttribute('data-cy')) {
      return `[data-cy="${CSS.escape(el.getAttribute('data-cy'))}"]`;
    }
    
    // Checks if any segment of the class is an alphanumeric hash (e.g., "css-1ab2c3")
    const isDynamicId = (str) => {
      if (!str || str.length > 30) return true;
      const parts = str.split(/[_-]/);
      return parts.some(part => part.length >= 5 && /\d/.test(part) && /[a-zA-Z]/.test(part));
    };
    if (el.id && !isDynamicId(el.id)) {
      return '#' + CSS.escape(el.id);
    }

    let path = [];
    let current = el;
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let selector = current.nodeName.toLowerCase();
      
      if (current.id && !isDynamicId(current.id)) {
        selector += '#' + CSS.escape(current.id);
        path.unshift(selector);
        break;
      } else {
        if (current.className && typeof current.className === 'string') {
          const classes = current.className.split(/\s+/).filter(c => c && !isDynamicId(c));
          if (classes.length > 0) {
            selector += '.' + classes.map(c => CSS.escape(c)).join('.');
          }
        }
        
        let sibling = current;
        let nth = 1;
        while (sibling = sibling.previousElementSibling) {
          if (sibling.nodeName.toLowerCase() == current.nodeName.toLowerCase()) {
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

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'koala-clicker-toast';

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('width', '16');
    icon.setAttribute('height', '16');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', '#bd93f9');
    icon.setAttribute('stroke-width', '2.5');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.style.flexShrink = '0';

    const check = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    check.setAttribute('points', '20 6 9 17 4 12');
    icon.appendChild(check);

    const text = document.createElement('span');
    text.textContent = message;

    toast.appendChild(icon);
    toast.appendChild(text);
    document.documentElement.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Remove toast after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function saveNewClicker(selector) {
    chrome.storage.local.get([currentSiteKey], (result) => {
      const clickers = result[currentSiteKey] || [];
      if (clickers.length >= 50) {
        alert("KoalaClicker: Maximum of 50 clickers per website reached.");
        return;
      }
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
        showToast(`${clickerName} successfully added!`);
      });
    });
  }

  function syncClickers(clickers) {
    const newActiveIds = clickers.filter(c => c.active).map(c => c.id);
    
    // Stop deleted or deactivated clickers
    for (const id in activeTimers) {
      if (!newActiveIds.includes(id)) {
        clearInterval(activeTimers[id].timer || activeTimers[id]);
        delete activeTimers[id];
      }
    }

    // Start or update active clickers safely
    clickers.forEach(clicker => {
      if (clicker.active) {
        const safeInterval = Math.max(25, parseInt(clicker.interval, 10) || 250);
        const existing = activeTimers[clicker.id];
        
        // ONLY restart if the timer doesn't exist, or the timing value changed
        if (!existing || existing.interval !== safeInterval) {
          if (existing) clearInterval(existing.timer || existing);
          
          activeTimers[clicker.id] = {
            interval: safeInterval,
            timer: setInterval(() => triggerClick(clicker.selector), safeInterval)
          };
        }
      }
    });
  }

  const elementCache = {};

  function triggerClick(selector) {
    try {
      let cached = elementCache[selector];
      
      // Refresh cache if element is missing or disconnected from DOM
      if (!cached || !cached.el.isConnected) {
        delete elementCache[selector]; // Prevent memory leak of detached nodes
        const el = document.querySelector(selector);
        if (!el) return; // Element not found, gracefully skip
        
        cached = { el };
        elementCache[selector] = cached;
      }

      // Compute element coordinates dynamically on every tick to support moving elements
      const rect = cached.el.getBoundingClientRect();
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
      cached.el.dispatchEvent(new MouseEvent('mousedown', eventOptions));
      cached.el.dispatchEvent(new MouseEvent('mouseup', eventOptions));
      cached.el.dispatchEvent(new MouseEvent('click', eventOptions));
    } catch(e) {
      // Selector might be invalid if DOM changed drastically
      console.error("KoalaClicker Error:", e);
    }
  }
})();
