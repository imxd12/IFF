/* =========================
   MONEYFLOW - ULTRA SMOOTH GLOBAL UTILITIES
   Enhanced Animations | Haptic Feedback | Performance Optimized
========================= */

(function() {
  'use strict';

  // ========================================
  // DOM SELECTORS (Optimized)
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
  // THEME TOGGLE - Ultra Smooth
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
        
        // Add transition class for smooth theme change
        document.body.classList.add('theme-transitioning');
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('fin_theme', newTheme);
        updateIcon();
        
        // Haptic feedback
        haptic('light');
        
        // Remove transition class after animation
        setTimeout(() => {
          document.body.classList.remove('theme-transitioning');
        }, 600);
        
        // Trigger custom event for chart updates
        document.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme: newTheme } 
        }));
        
        // Show confirmation
        showSnackbar(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`);
      });
    } catch (e) {
      console.error('Theme toggle error:', e);
    }
  };

  // ========================================
  // LIVE CLOCK - Smooth Updates
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
          
          // Add fade animation
          el.style.opacity = '0.7';
          setTimeout(() => {
            el.textContent = `${date} • ${hours}:${minutes}:${seconds}`;
            el.style.opacity = '1';
          }, 100);
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
  // BOTTOM NAVIGATION - Liquid Smooth
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
        
        // Enhanced click animation
        item.addEventListener('click', function(e) {
          items.forEach(i => i.classList.remove('active'));
          this.classList.add('active');
          nav.setAttribute('data-active', index);
          
          // Haptic feedback
          haptic('light');
          
          // Add ripple effect
          createRipple(this, e);
          
          // Add bounce effect
          this.style.transform = 'scale(0.9)';
          setTimeout(() => {
            this.style.transform = '';
          }, 150);
        });
        
        // Hover effect
        item.addEventListener('mouseenter', function() {
          if (!this.classList.contains('active')) {
            this.style.transform = 'scale(1.05) translateY(-3px)';
          }
        });
        
        item.addEventListener('mouseleave', function() {
          if (!this.classList.contains('active')) {
            this.style.transform = '';
          }
        });
      });
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  // ========================================
  // RIPPLE EFFECT CREATOR
  // ========================================
  function createRipple(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.6);
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      transform: scale(0);
      animation: rippleEffect 0.6s ease-out;
      pointer-events: none;
      z-index: 0;
    `;
    
    // Add ripple keyframes if not exists
    if (!document.getElementById('ripple-keyframes')) {
      const style = document.createElement('style');
      style.id = 'ripple-keyframes';
      style.textContent = `
        @keyframes rippleEffect {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
  }

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
  // MODAL HELPERS - Enhanced
  // ========================================
  window.openModal = (modalId) => {
    try {
      const modal = $(modalId);
      if (modal) {
        // Add opening animation
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        
        requestAnimationFrame(() => {
          modal.classList.add('show');
          modal.style.opacity = '1';
        });
        
        document.body.style.overflow = 'hidden';
        
        // Haptic feedback
        haptic('medium');
        
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
        // Add closing animation
        modal.style.opacity = '0';
        
        setTimeout(() => {
          modal.classList.remove('show');
          modal.style.display = 'none';
          document.body.style.overflow = '';
        }, 300);
        
        // Haptic feedback
        haptic('light');
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
  // SNACKBAR NOTIFICATIONS - Ultra Smooth
  // ========================================
  window.showSnackbar = function(message, type = 'success') {
    try {
      // Remove existing snackbar
      const existing = $('.snackbar');
      if (existing) {
        existing.style.transform = 'translateX(-50%) translateY(100px) scale(0.8)';
        existing.style.opacity = '0';
        setTimeout(() => existing.remove(), 300);
      }
      
      const snackbar = document.createElement('div');
      snackbar.className = 'snackbar';
      
      // Add icon based on type
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      
      snackbar.innerHTML = `<span>${icons[type] || '💬'}</span> ${message}`;
      
      const colors = {
        success: 'var(--accent)',
        error: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)'
      };
      
      snackbar.style.cssText = `
        position: fixed;
        bottom: calc(var(--navbar-height) + 20px);
        left: 50%;
        transform: translateX(-50%) translateY(100px) scale(0.8);
        background: ${colors[type] || 'var(--accent)'};
        color: white;
        padding: 15px 25px;
        border-radius: var(--radius-lg);
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 3000;
        font-weight: 600;
        font-size: 14px;
        max-width: 90%;
        text-align: center;
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0;
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
      `;
      
      document.body.appendChild(snackbar);
      
      // Haptic feedback based on type
      const hapticType = type === 'success' ? 'success' : type === 'error' ? 'error' : 'light';
      haptic(hapticType);
      
      // Animate in
      requestAnimationFrame(() => {
        snackbar.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        snackbar.style.opacity = '1';
      });
      
      // Animate out and remove
      setTimeout(() => {
        snackbar.style.transform = 'translateX(-50%) translateY(100px) scale(0.8)';
        snackbar.style.opacity = '0';
        setTimeout(() => snackbar.remove(), 400);
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('Exported successfully! 📤');
      haptic('success');
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSnackbar('CSV exported! 📊');
      haptic('success');
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
            haptic('success');
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
  // SCROLL ANIMATIONS - Smooth Observer
  // ========================================
  window.initScrollAnimations = function() {
    try {
      const observers = [];
      
      const fadeElements = $$('.scroll-fade-in');
      if (fadeElements.length > 0) {
        const fadeObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                entry.target.classList.add('visible');
              }, index * 100); // Stagger animation
            }
          });
        }, { 
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });
        
        fadeElements.forEach(el => fadeObserver.observe(el));
        observers.push(fadeObserver);
      }
      
      const blurElements = $$('.scroll-blur');
      if (blurElements.length > 0) {
        const blurObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                entry.target.classList.add('visible');
              }, index * 150);
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
          haptic('light');
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
      haptic('light');
    } catch (e) {
      showSnackbar('Failed to copy', 'error');
    }
    document.body.removeChild(textarea);
  }

  // ========================================
  // HAPTIC FEEDBACK - Enhanced
  // ========================================
  window.haptic = function(type = 'light') {
    try {
      if ('vibrate' in navigator) {
        const patterns = {
          light: 10,
          medium: 20,
          heavy: 30,
          success: [10, 50, 10],
          error: [20, 50, 20, 50, 20],
          double: [10, 100, 10]
        };
        navigator.vibrate(patterns[type] || 10);
      }
    } catch (e) {
      // Fail silently
    }
  };

  // ========================================
  // NETWORK STATUS DETECTION
  // ========================================
  window.addEventListener('online', () => {
    showSnackbar('Back online! 🌐', 'success');
  });

  window.addEventListener('offline', () => {
    showSnackbar('You are offline ⚠️', 'warning');
  });

  // ========================================
  // PAGE VISIBILITY - Pause animations when hidden
  // ========================================
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Pause animations when tab is hidden
      document.body.classList.add('page-hidden');
    } else {
      // Resume animations
      document.body.classList.remove('page-hidden');
    }
  });

  // ========================================
  // AUTO INITIALIZATION
  // ========================================
  document.addEventListener('DOMContentLoaded', () => {
    try {
      initThemeToggle();
      initScrollAnimations();
      
      // Add smooth transition class
      document.body.classList.add('loaded');
      
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
      installPrompt.style.opacity = '0';
      installPrompt.style.transform = 'translateY(50px) scale(0.9)';
      
      requestAnimationFrame(() => {
        installPrompt.style.transition = 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
        installPrompt.style.opacity = '1';
        installPrompt.style.transform = 'translateY(0) scale(1)';
      });
    }
  });

  // Install button click
  window.addEventListener('load', () => {
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
          showSnackbar('App installed successfully! 🎉', 'success');
          haptic('success');
        }
        
        deferredPrompt = null;
        const installPrompt = $('#installPrompt');
        if (installPrompt) {
          installPrompt.style.opacity = '0';
          installPrompt.style.transform = 'translateY(50px) scale(0.9)';
          setTimeout(() => {
            installPrompt.style.display = 'none';
          }, 400);
        }
      });
    }

    // Dismiss button
    const dismissBtn = $('#dismissBtn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        const installPrompt = $('#installPrompt');
        if (installPrompt) {
          installPrompt.style.opacity = '0';
          installPrompt.style.transform = 'translateY(50px) scale(0.9)';
          setTimeout(() => {
            installPrompt.style.display = 'none';
          }, 400);
        }
        localStorage.setItem('installDismissed', 'true');
        haptic('light');
      });
    }
  });

  // Check if already installed
  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    showSnackbar('MoneyFlow installed! 🎉', 'success');
    haptic('success');
    const installPrompt = $('#installPrompt');
    if (installPrompt) {
      installPrompt.style.display = 'none';
    }
  });

  // Add CSS for smooth transitions
  const style = document.createElement('style');
  style.textContent = `
    body.theme-transitioning * {
      transition: background-color 0.6s ease, 
                  color 0.6s ease, 
                  border-color 0.6s ease,
                  box-shadow 0.6s ease !important;
    }
    
    body.loaded {
      animation: bodyFadeIn 0.6s ease;
    }
    
    @keyframes bodyFadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    body.page-hidden * {
      animation-play-state: paused !important;
    }
  `;
  document.head.appendChild(style);

})();
