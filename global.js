/* =========================
   MONEYFLOW - GLOBAL UTILITIES
   Enhanced with error handling and animations
========================= */

(function() {
  'use strict';

  // ========================================
  // DOM SELECTORS
  // ========================================
  window.$ = (selector, parent = document) => {
    try {
      return parent.querySelector(selector);
    } catch (e) {
      console.error('Selector error:', e);
      return null;
    }
  };

  window.$$ = (selector, parent = document) => {
    try {
      return Array.from(parent.querySelectorAll(selector));
    } catch (e) {
      console.error('Selector error:', e);
      return [];
    }
  };

  // ========================================
  // CURRENCY FORMATTER (INR)
  // ========================================
  window.fmt = (amount) => {
    try {
      const num = Number(amount) || 0;
      return '₹' + num.toLocaleString('en-IN', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 2 
      });
    } catch (e) {
      console.error('Format error:', e);
      return '₹0';
    }
  };

  // ========================================
  // DASHBOARD BALANCE CALCULATION
  // (Shows only Spendly balance: Income - Expense)
  // ========================================
  window.calculateDashboardBalance = function() {
    try {
      const spendlyData = loadData('fin_spendly') || [];
      
      const totalIncome = spendlyData
        .filter(d => d.type === 'income')
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);
      
      const totalExpense = spendlyData
        .filter(d => d.type === 'expense')
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);
      
      const balance = totalIncome - totalExpense;
      
      return {
        income: totalIncome,
        expense: totalExpense,
        balance: balance
      };
    } catch (e) {
      console.error('Balance calculation error:', e);
      return {
        income: 0,
        expense: 0,
        balance: 0
      };
    }
  };

  // ========================================
  // THEME TOGGLE
  // ========================================
  window.initThemeToggle = function() {
    try {
      const theme = localStorage.getItem('fin_theme') || 'light';
      document.documentElement.setAttribute('data-theme', theme);
      
      const toggle = $('.theme-toggle');
      if (!toggle) return;
      
      const updateIcon = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const slider = $('.theme-toggle-slider');
        if (slider) {
          slider.innerHTML = currentTheme === 'dark' ? '🌙' : '☀️';
        }
      };
      
      updateIcon();
      
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const newTheme = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('fin_theme', newTheme);
        updateIcon();
        
        // Add smooth transition
        document.body.style.transition = 'background 0.4s ease, color 0.4s ease';
        setTimeout(() => {
          document.body.style.transition = '';
        }, 400);
        
        // Trigger custom event for chart updates
        document.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));
      });
    } catch (e) {
      console.error('Theme toggle error:', e);
    }
  };

  // ========================================
  // LIVE CLOCK
  // ========================================
  window.startClock = function(selector = '#timeNow') {
    try {
      const el = $(selector);
      if (!el) return;
      
      function update() {
        try {
          const now = new Date();
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          const seconds = String(now.getSeconds()).padStart(2, '0');
          const date = now.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
          el.textContent = `${date} • ${hours}:${minutes}:${seconds}`;
        } catch (e) {
          console.error('Clock update error:', e);
        }
      }
      
      update();
      const interval = setInterval(update, 1000);
      
      // Store interval for cleanup
      window._clockInterval = interval;
    } catch (e) {
      console.error('Clock initialization error:', e);
    }
  };

  // ========================================
  // BOTTOM NAVIGATION
  // ========================================
  window.attachBottomNav = function(activeId) {
    try {
      const nav = $('.bottom-nav');
      if (!nav) return;
      
      const items = $$('.nav-item', nav);
      items.forEach((item, index) => {
        item.classList.remove('active');
        
        if (item.id === activeId) {
          item.classList.add('active');
          nav.setAttribute('data-active', index);
        }
        
        // Add click animation
        item.addEventListener('click', function(e) {
          // Don't prevent navigation
          items.forEach(i => i.classList.remove('active'));
          this.classList.add('active');
          nav.setAttribute('data-active', index);
          
          // Haptic feedback (if supported)
          if ('vibrate' in navigator) {
            navigator.vibrate(10);
          }
          
          // Add ripple effect
          const ripple = document.createElement('span');
          ripple.style.cssText = `
            position: absolute;
            border-radius: 50%;
            background: rgba(16, 185, 129, 0.5);
            width: 100px;
            height: 100px;
            margin-top: -50px;
            margin-left: -50px;
            animation: ripple 0.6s;
            pointer-events: none;
          `;
          this.appendChild(ripple);
          setTimeout(() => ripple.remove(), 600);
        });
      });
      
      // Add ripple animation
      if (!document.getElementById('ripple-style')) {
        const style = document.createElement('style');
        style.id = 'ripple-style';
        style.textContent = `
          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  // ========================================
  // LOCAL STORAGE
  // ========================================
  window.saveData = (key, data) => {
    try {
      const jsonData = JSON.stringify(data || []);
      localStorage.setItem(key, jsonData);
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      if (e.name === 'QuotaExceededError') {
        showSnackbar('Storage full! Please export and clear old data.', 'error');
      } else {
        showSnackbar('Failed to save data', 'error');
      }
      return false;
    }
  };

  window.loadData = (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Load error:', e);
      return [];
    }
  };

  // ========================================
  // MODAL HELPERS
  // ========================================
  window.openModal = (modalId) => {
    try {
      const modal = $(modalId);
      if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Focus trap
        const focusableElements = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal);
        if (focusableElements.length > 0) {
          setTimeout(() => focusableElements[0].focus(), 100);
        }
      }
    } catch (e) {
      console.error('Modal open error:', e);
    }
  };

  window.closeModal = (modalId) => {
    try {
      const modal = $(modalId);
      if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    } catch (e) {
      console.error('Modal close error:', e);
    }
  };

  // Close modal on backdrop click
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
      closeModal(`#${e.target.id}`);
    }
  });

  // Close modal on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModals = $$('.modal.show');
      openModals.forEach(modal => {
        closeModal(`#${modal.id}`);
      });
    }
  });

  // ========================================
  // SNACKBAR NOTIFICATIONS
  // ========================================
  window.showSnackbar = function(message, type = 'success') {
    try {
      // Remove existing snackbar
      const existing = $('.snackbar');
      if (existing) existing.remove();
      
      const snackbar = document.createElement('div');
      snackbar.className = 'snackbar';
      snackbar.textContent = message;
      
      const bgColor = type === 'success' ? 'var(--accent)' : 
                      type === 'error' ? 'var(--danger)' : 
                      type === 'warning' ? 'var(--warning)' : 
                      'var(--info)';
      
      snackbar.style.cssText = `
        position: fixed;
        bottom: calc(var(--navbar-height) + 20px);
        left: 50%;
        transform: translateX(-50%) translateY(100px);
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: var(--radius);
        box-shadow: var(--shadow-hover);
        z-index: 3000;
        font-weight: 600;
        font-size: 14px;
        max-width: 90%;
        text-align: center;
        transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55), opacity 0.3s;
      `;
      
      document.body.appendChild(snackbar);
      
      // Animate in
      setTimeout(() => {
        snackbar.style.transform = 'translateX(-50%) translateY(0)';
      }, 10);
      
      // Animate out and remove
      setTimeout(() => {
        snackbar.style.transform = 'translateX(-50%) translateY(100px)';
        snackbar.style.opacity = '0';
        setTimeout(() => snackbar.remove(), 300);
      }, 3000);
    } catch (e) {
      console.error('Snackbar error:', e);
    }
  };

  // ========================================
  // EXPORT TO JSON
  // ========================================
  window.exportJSON = function(data, filename) {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'export.json';
      a.click();
      URL.revokeObjectURL(url);
      showSnackbar('Exported successfully! 📤');
    } catch (e) {
      console.error('Export error:', e);
      showSnackbar('Failed to export data', 'error');
    }
  };

  // ========================================
  // EXPORT TO CSV
  // ========================================
  window.exportCSV = function(data, filename, headers) {
    try {
      if (!data || data.length === 0) {
        showSnackbar('No data to export', 'error');
        return;
      }
      
      // Escape CSV values
      const escapeCSV = (value) => {
        if (value === null || value === undefined) return '';
        const str = String(value);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(h => escapeCSV(row[h])).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'export.csv';
      a.click();
      URL.revokeObjectURL(url);
      showSnackbar('CSV exported! 📊');
    } catch (e) {
      console.error('CSV export error:', e);
      showSnackbar('Failed to export CSV', 'error');
    }
  };

  // ========================================
  // IMPORT JSON
  // ========================================
  window.importJSON = function(callback) {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          showSnackbar('File too large (max 10MB)', 'error');
          return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            callback(data);
            showSnackbar('Imported successfully! 📥');
          } catch (err) {
            console.error('JSON parse error:', err);
            showSnackbar('Invalid JSON file', 'error');
          }
        };
        
        reader.onerror = () => {
          showSnackbar('Failed to read file', 'error');
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    } catch (e) {
      console.error('Import error:', e);
      showSnackbar('Failed to import', 'error');
    }
  };

  // ========================================
  // SCROLL ANIMATIONS
  // ========================================
  window.initScrollAnimations = function() {
    try {
      const observers = [];
      
      // Fade in animation
      const fadeElements = $$('.scroll-fade-in');
      if (fadeElements.length > 0) {
        const fadeObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, { 
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });
        
        fadeElements.forEach(el => fadeObserver.observe(el));
        observers.push(fadeObserver);
      }
      
      // Blur animation
      const blurElements = $$('.scroll-blur');
      if (blurElements.length > 0) {
        const blurObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
            }
          });
        }, { 
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });
        
        blurElements.forEach(el => blurObserver.observe(el));
        observers.push(blurObserver);
      }
      
      return observers;
    } catch (e) {
      console.error('Scroll animation error:', e);
      return [];
    }
  };

  // ========================================
  // GEOLOCATION
  // ========================================
  window.getLocation = function(callback) {
    try {
      if (!('geolocation' in navigator)) {
        callback(null);
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Fetch location details from BigDataCloud API
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(res => res.json())
            .then(data => {
              callback({
                city: data.city || data.locality || 'Unknown',
                region: data.principalSubdivision || '',
                country: data.countryName || '',
                lat: latitude,
                lng: longitude
              });
            })
            .catch((err) => {
              console.error('Geocoding error:', err);
              callback({
                city: 'Unknown',
                region: '',
                country: '',
                lat: latitude,
                lng: longitude
              });
            });
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          callback(null);
        },
        {
          timeout: 10000,
          maximumAge: 600000
        }
      );
    } catch (e) {
      console.error('Location error:', e);
      callback(null);
    }
  };

  // ========================================
  // SERVICE WORKER REGISTRATION
  // ========================================
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }

  // ========================================
  // PERFORMANCE OPTIMIZATION
  // ========================================
  
  // Debounce function for performance
  window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Throttle function for scroll events
  window.throttle = function(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  };

  // ========================================
  // COPY TO CLIPBOARD
  // ========================================
  window.copyToClipboard = function(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          showSnackbar('Copied to clipboard! 📋');
        }).catch(() => {
          fallbackCopy(text);
        });
      } else {
        fallbackCopy(text);
      }
    } catch (e) {
      console.error('Copy error:', e);
      showSnackbar('Failed to copy', 'error');
    }
  };

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      showSnackbar('Copied to clipboard! 📋');
    } catch (e) {
      showSnackbar('Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
  }

  // ========================================
  // NETWORK STATUS DETECTION
  // ========================================
  window.addEventListener('online', () => {
    showSnackbar('Back online! 🌐');
  });

  window.addEventListener('offline', () => {
    showSnackbar('You are offline', 'warning');
  });

  // ========================================
  // AUTO INITIALIZATION
  // ========================================
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initThemeToggle();
      initScrollAnimations();
      console.log('✅ MoneyFlow Global initialized');
    } catch (e) {
      console.error('Initialization error:', e);
    }
  });

  // ========================================
  // CLEANUP ON PAGE UNLOAD
  // ========================================
  window.addEventListener('beforeunload', () => {
    if (window._clockInterval) {
      clearInterval(window._clockInterval);
    }
  });

  // ========================================
  // HAPTIC FEEDBACK (for supported devices)
  // ========================================
  window.haptic = function(type = 'light') {
    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: 10,
          medium: 20,
          heavy: 30,
          success: [10, 50, 10],
          error: [20, 50, 20, 50, 20]
        };
        navigator.vibrate(patterns[type] || 10);
      }
    } catch (e) {
      // Fail silently
    }
  };

})();

// ========================================
// PWA INSTALL PROMPT
// ========================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  console.log('Install prompt triggered');
  e.preventDefault();
  deferredPrompt = e;
  
  const installPrompt = $('#installPrompt');
  if (installPrompt) {
    installPrompt.style.display = 'block';
  }
});

// Install button click
const installBtn = $('#installBtn');
if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
      showSnackbar('Installation not available', 'warning');
      return;
    }
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      showSnackbar('App installed successfully! 🎉');
    }
    
    deferredPrompt = null;
    const installPrompt = $('#installPrompt');
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
  });
}

// Dismiss button
const dismissBtn = $('#dismissBtn');
if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    const installPrompt = $('#installPrompt');
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
    localStorage.setItem('installDismissed', 'true');
  });
}

// Check if already installed
window.addEventListener('appinstalled', () => {
  console.log('PWA installed');
  showSnackbar('MoneyFlow installed! 🎉');
  const installPrompt = $('#installPrompt');
  if (installPrompt) {
    installPrompt.style.display = 'none';
  }
});
