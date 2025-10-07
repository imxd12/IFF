/* =========================
   MONEYFLOW - GLOBAL UTILITIES
   Theme, Navigation, Storage, Exports
========================= */

(function() {
  'use strict';

  // DOM Selectors
  window.$ = (selector, parent = document) => parent.querySelector(selector);
  window.$$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  // Currency Formatter (INR)
  window.fmt = (amount) => {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  // ===== THEME TOGGLE =====
  window.initThemeToggle = function() {
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
    });
  };

  // ===== LIVE CLOCK =====
  window.startClock = function(selector = '#timeNow') {
    const el = $(selector);
    if (!el) return;

    function update() {
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
    }

    update();
    setInterval(update, 1000);
  };

  // ===== BOTTOM NAVIGATION =====
  window.attachBottomNav = function(activeId) {
    const nav = $('.bottom-nav');
    if (!nav) return;

    const items = $$('.nav-item', nav);
    items.forEach((item, index) => {
      if (item.id === activeId) {
        item.classList.add('active');
        nav.setAttribute('data-active', index);
      } else {
        item.classList.remove('active');
      }
    });
  };

  // ===== LOCAL STORAGE =====
  window.saveData = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data || []));
    } catch (e) {
      console.error('Storage error:', e);
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

  // ===== MODAL HELPERS =====
  window.openModal = (modalId) => {
    const modal = $(modalId);
    if (modal) {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeModal = (modalId) => {
    const modal = $(modalId);
    if (modal) {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    }
  };

  // ===== SNACKBAR NOTIFICATIONS =====
  window.showSnackbar = function(message, type = 'success') {
    const existing = $('.snackbar');
    if (existing) existing.remove();

    const snackbar = document.createElement('div');
    snackbar.className = 'snackbar';
    snackbar.textContent = message;
    snackbar.style.cssText = `
      position: fixed;
      bottom: calc(var(--navbar-height) + 20px);
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? 'var(--accent)' : 'var(--danger)'};
      color: white;
      padding: 15px 25px;
      border-radius: var(--radius);
      box-shadow: var(--shadow-hover);
      z-index: 3000;
      animation: slideInUp 0.3s ease;
      font-weight: 600;
    `;

    document.body.appendChild(snackbar);

    setTimeout(() => {
      snackbar.style.animation = 'fadeOut 0.3s ease';
      setTimeout(() => snackbar.remove(), 300);
    }, 3000);
  };

  // ===== EXPORT TO JSON =====
  window.exportJSON = function(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showSnackbar('Exported successfully!');
  };

  // ===== EXPORT TO CSV =====
  window.exportCSV = function(data, filename, headers) {
    if (!data.length) {
      showSnackbar('No data to export', 'error');
      return;
    }

    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
    ].join('
'); // <-- Proper line breaks

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showSnackbar('CSV exported!');
  };

  // ===== IMPORT JSON =====
  window.importJSON = function(callback) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          callback(data);
          showSnackbar('Imported successfully!');
        } catch (err) {
          showSnackbar('Invalid JSON file', 'error');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // ===== SCROLL ANIMATIONS =====
  window.initScrollAnimations = function() {
    const fadeElements = $$('.scroll-fade-in');
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    fadeElements.forEach(el => fadeObserver.observe(el));

    const blurElements = $$('.scroll-blur');
    const blurObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    blurElements.forEach(el => blurObserver.observe(el));
  };

  // ===== GEOLOCATION =====
  window.getLocation = function(callback) {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`)
            .then(res => res.json())
            .then(data => {
              callback({
                city: data.city || data.locality,
                region: data.principalSubdivision,
                country: data.countryName,
                lat: latitude,
                lng: longitude
              });
            })
            .catch(() => callback(null));
        },
        () => callback(null)
      );
    } else {
      callback(null);
    }
  };

  // ===== SERVICE WORKER =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => {
          console.log('SW registered', reg);
        })
        .catch(err => console.log('SW error:', err));
    });
  }

  // Auto-init on load
  document.addEventListener('DOMContentLoaded', () => {
    initThemeToggle();
    initScrollAnimations();
  });

})();
