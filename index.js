/* =========================
   INDEX PAGE - DASHBOARD LOGIC
   Complete with all features and error handling
========================= */

// Initialize global functions
startClock('#timeNow');
attachBottomNav('nav-home');

(function() {
  'use strict';

  // ========================================
  // STATE MANAGEMENT
  // ========================================
  let username = localStorage.getItem('fin_userName') || 'User';
  let dashboardData = {
    spendly: [],
    nexus: [],
    pocketcal: []
  };

  // ========================================
  // PERSONALIZED GREETING
// ========================================  
// PERSONALIZED GREETING (CUTE EDITION)  
// ========================================  
function updateWelcome() {  
  const hour = new Date().getHours();  
  let greeting;  
    
  // Cute & cozy greetings 💫  
  if (hour >= 0 && hour < 3) greeting = `Midnight Vibes 🌙, ${username}💤`;  
  else if (hour >= 3 && hour < 5) greeting = `Sleepy Hours 🌌, ${username}🥱`;  
  else if (hour >= 5 && hour < 7) greeting = `Sunrise Glow 🌅, ${username}🌸`;  
  else if (hour >= 7 && hour < 9) greeting = `Mornyy ☀️, ${username}🩵`;  
  else if (hour >= 9 && hour < 12) greeting = `Late Mornin’ 🌤️, ${username}🌼`;  
  else if (hour >= 12 && hour < 14) greeting = `Noonie 🌞, ${username}🍱`;  
  else if (hour >= 14 && hour < 16) greeting = `Aftery ☁️, ${username}💫`;  
  else if (hour >= 16 && hour < 18) greeting = `Sunset Babe 🌇, ${username}🧡`;  
  else if (hour >= 18 && hour < 20) greeting = `Evenyy 🌙, ${username}💖`;  
  else if (hour >= 20 && hour < 22) greeting = `Nighty ✨, ${username}🌌`;  
  else greeting = `Dreamy Time 🌃, ${username}💤`;  
    
  const welcomeEl = document.querySelector('#welcomeText');  
  if (welcomeEl) {  
    welcomeEl.textContent = greeting;  
  }  
}

  // ========================================
  // LOAD DASHBOARD DATA
  // ========================================
  function loadDashboardData() {
    try {
      dashboardData.spendly = loadData('fin_spendly') || [];
      dashboardData.nexus = loadData('fin_nexus') || [];
      dashboardData.pocketcal = loadData('fin_pocketcal') || [];
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showSnackbar('Error loading data', 'error');
    }
  }

  // ========================================
  // UPDATE DASHBOARD SUMMARY
  // ========================================
  function updateDashboard() {
    loadDashboardData();
    
    const spendly = dashboardData.spendly;
    const nexus = dashboardData.nexus;
    const pocket = dashboardData.pocketcal;
    
    // Get current date and month
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Calculate Today's Expense (Spendly)
    const todayExpense = spendly
      .filter(t => t.date === today && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    // Calculate This Month Pocket Money
    const monthPocket = pocket
      .filter(p => p.date && p.date.startsWith(currentMonth))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    // Calculate This Month Nexus Earnings
    const monthNexus = nexus
      .filter(n => n.date && n.date.startsWith(currentMonth))
      .reduce((sum, n) => sum + Number(n.payout || 0), 0);
    
    // Calculate All-Time Balance
    // Formula: (Total Income - Total Expense) + Nexus + Pocket
    const totalIncome = spendly
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const totalExpense = spendly
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);    
    const totalNexus = nexus
      .reduce((sum, n) => sum + Number(n.payout || 0), 0);
    
    const totalPocket = pocket
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const balance = totalIncome - totalExpense ;
    
    // Update UI elements with smooth animation
    updateValueWithAnimation('#todayExpense', todayExpense);
    updateValueWithAnimation('#monthPocket', monthPocket);
    updateValueWithAnimation('#monthNexus', monthNexus);
    updateValueWithAnimation('#totalBalance', balance);
  }

  // ========================================
  // ANIMATE VALUE UPDATES
  // ========================================
  function updateValueWithAnimation(selector, value) {
    const element = $(selector);
    if (!element) return;
    
    // Add flash animation class
    element.style.animation = 'flash 0.5s ease';
    
    // Update value
    element.textContent = fmt(value);
    
    // Remove animation class after animation completes
    setTimeout(() => {
      element.style.animation = '';
    }, 500);
  }

  // ========================================
  // SAVE USER NAME
  // ========================================
  window.saveName = function(e) {
    e.preventDefault();
    
    const nameInput = $('#userName');
    if (!nameInput) return;
    
    const newUsername = nameInput.value.trim();
    
    // Validate input
    if (!newUsername) {
      showSnackbar('Please enter a valid name', 'error');
      return;
    }
    
    if (newUsername.length < 2) {
      showSnackbar('Name must be at least 2 characters', 'error');
      return;
    }
    
    if (newUsername.length > 50) {
      showSnackbar('Name must be less than 50 characters', 'error');
      return;
    }
    
    // Save to localStorage
    username = newUsername;
    localStorage.setItem('fin_userName', username);
    
    // Update UI
    updateWelcome();
    closeModal('#nameModal');
    showSnackbar(`Welcome, ${username}! 👋`);
    
    // Clear form
    nameInput.value = '';
  };

  // ========================================
  // EXPORT ALL DATA
  // ========================================
  window.exportAllData = function() {
    try {
      const data = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        userName: localStorage.getItem('fin_userName') || 'User',
        modules: {
          spendly: loadData('fin_spendly') || [],
          nexus: loadData('fin_nexus') || [],
          pocketcal: loadData('fin_pocketcal') || []
        },
        settings: {
          theme: localStorage.getItem('fin_theme') || 'light'
        },
        stats: {
          totalTransactions: (loadData('fin_spendly') || []).length,
          totalNexusEntries: (loadData('fin_nexus') || []).length,
          totalPocketEntries: (loadData('fin_pocketcal') || []).length
        }
      };
      
      exportJSON(data, `moneyflow-backup-${new Date().toISOString().split('T')[0]}.json`);
      showSnackbar('Data exported successfully! 📤');
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('Failed to export data', 'error');
    }
  };

  // ========================================
  // IMPORT DATA
  // ========================================
  window.importData = function() {
    importJSON((data) => {
      try {
        if (!data.modules) {
          throw new Error('Invalid backup file format');
        }
        
        // Confirm import
        const totalEntries = 
          (data.modules.spendly || []).length +
          (data.modules.nexus || []).length +
          (data.modules.pocketcal || []).length;
        
        if (!confirm(`Import ${totalEntries} entries? This will overwrite existing data.`)) {
          return;
        }
        
        // Import data
        if (data.modules.spendly) saveData('fin_spendly', data.modules.spendly);
        if (data.modules.nexus) saveData('fin_nexus', data.modules.nexus);
        if (data.modules.pocketcal) saveData('fin_pocketcal', data.modules.pocketcal);
        
        // Import settings
        if (data.userName) localStorage.setItem('fin_userName', data.userName);
        if (data.settings && data.settings.theme) {
          localStorage.setItem('fin_theme', data.settings.theme);
        }
        
        // Refresh dashboard
        updateDashboard();
        showSnackbar('Data imported successfully! 🎉');
        
        // Reload page after 2 seconds
        setTimeout(() => location.reload(), 2000);
        
      } catch (error) {
        console.error('Import error:', error);
        showSnackbar('Failed to import data. Invalid file format.', 'error');
      }
    });
  };

  // ========================================
  // CLEAR ALL DATA
  // ========================================
  window.clearAllData = function() {
    // Double confirmation for safety
    if (!confirm('⚠️ WARNING: This will delete ALL data permanently!')) {
      return;
    }
    
    if (!confirm('Are you absolutely sure? This cannot be undone!')) {
      return;
    }
    
    try {
      // Clear all localStorage
      localStorage.clear();
      
      // Show success message
      showSnackbar('All data cleared successfully! 🗑️');
      
      // Reload page after 1.5 seconds
      setTimeout(() => {
        location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Clear data error:', error);
      showSnackbar('Failed to clear data', 'error');
    }
  };

  // ========================================
  // VIEW STORAGE INFO
  // ========================================
  window.viewStorage = function() {
    try {
      const storageData = JSON.stringify(localStorage);
      const size = storageData.length;
      const kb = (size / 1024).toFixed(2);
      const mb = (size / (1024 * 1024)).toFixed(2);
      
      // Get storage breakdown
      const breakdown = [];
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          const itemSize = (localStorage.getItem(key).length / 1024).toFixed(2);
          breakdown.push(`${key}: ${itemSize} KB`);
        }
      }
      
      // Display info
      alert(
        `📊 Storage Information\n\n` +
        `Total Size: ${kb} KB (${mb} MB)\n` +
        `Total Keys: ${Object.keys(localStorage).length}\n\n` +
        `Breakdown:\n${breakdown.join('\n')}\n\n` +
        `Browser Limit: ~5-10 MB`
      );
      
    } catch (error) {
      console.error('Storage view error:', error);
      showSnackbar('Failed to view storage info', 'error');
    }
  };

  // ========================================
  // DOWNLOAD BACKUP (ALIAS)
  // ========================================
  window.downloadBackup = function() {
    exportAllData();
  };

  // ========================================
  // LOAD USER LOCATION
  // ========================================
  function loadUserLocation() {
    getLocation((loc) => {
      const locEl = $('#userLocation');
      if (!locEl) return;
      
      if (loc && loc.city) {
        locEl.innerHTML = `
          <span>📍</span>
          <span>${loc.city}, ${loc.region}, ${loc.country}</span>
        `;
      } else {
        locEl.innerHTML = `
          <span>📍</span>
          <span>Location unavailable</span>
        `;
      }
    });
  }

  // ========================================
  // LOAD PROFILE IMAGE
  // ========================================
  function loadProfileImage() {
    const savedImage = localStorage.getItem('fin_profileImage');
    
    if (savedImage) {
      const profileImg = $('#profileImage');
      const profileImgLarge = $('#profileImageLarge');
      
      if (profileImg) profileImg.src = savedImage;
      if (profileImgLarge) profileImgLarge.src = savedImage;
    }
  }

  // ========================================
  // UPLOAD PROFILE IMAGE
  // ========================================
  window.uploadProfileImage = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        showSnackbar('Image size must be less than 1MB', 'error');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showSnackbar('Please select a valid image file', 'error');
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const imageData = event.target.result;
        
        // Save to localStorage
        localStorage.setItem('fin_profileImage', imageData);
        
        // Update UI
        loadProfileImage();
        showSnackbar('Profile image updated! 📸');
      };
      
      reader.onerror = () => {
        showSnackbar('Failed to read image file', 'error');
      };
      
      reader.readAsDataURL(file);
    };
    
    input.click();
  };

  // ========================================
  // HIDE SPLASH SCREEN
  // ========================================
  function hideSplashScreen() {
    setTimeout(() => {
      const splash = $('#splashScreen');
      if (splash) {
        splash.style.display = 'none';
      }
    }, 3000);
  }

  // ========================================
  // REFRESH DASHBOARD
  // ========================================
  window.refreshDashboard = function() {
    updateDashboard();
    showSnackbar('Dashboard refreshed! 🔄');
  };

  // ========================================
  // AUTO REFRESH DASHBOARD
  // ========================================
  function startAutoRefresh() {
    // Refresh dashboard every 60 seconds
    setInterval(() => {
      updateDashboard();
    }, 60000);
  }

  // ========================================
  // KEYBOARD SHORTCUTS
  // ========================================
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + E: Export data
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportAllData();
      }
      
      // Ctrl/Cmd + K: Open developer options
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openModal('#devModal');
      }
      
      // Ctrl/Cmd + H: Open help
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        openModal('#helpModal');
      }
      
      // Escape: Close all modals
      if (e.key === 'Escape') {
        const modals = $$('.modal.show');
        modals.forEach(modal => {
          modal.classList.remove('show');
        });
        document.body.style.overflow = '';
      }
    });
  }

  // ========================================
  // INITIALIZE TOOLTIPS
  // ========================================
  function initTooltips() {
    const tooltipElements = $$('[data-tooltip]');
    
    tooltipElements.forEach(el => {
      el.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = el.getAttribute('data-tooltip');
        tooltip.style.position = 'absolute';
        tooltip.style.background = 'var(--bg)';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = 'var(--radius-sm)';
        tooltip.style.fontSize = '12px';
        tooltip.style.zIndex = '10000';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.boxShadow = 'var(--shadow)';
        
        document.body.appendChild(tooltip);
        
        const rect = el.getBoundingClientRect();
        tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
        tooltip.style.left = (rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)) + 'px';
        
        el._tooltip = tooltip;
      });
      
      el.addEventListener('mouseleave', () => {
        if (el._tooltip) {
          el._tooltip.remove();
          el._tooltip = null;
        }
      });
    });
  }

  // ========================================
  // ERROR HANDLER
  // ========================================
  window.addEventListener('error', (e) => {
    console.error('Global error:', e);
    // Optionally show user-friendly error message
    // showSnackbar('An error occurred', 'error');
  });

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    try {
      // Load and update data
      updateWelcome();
      updateDashboard();
      
      // Load user preferences
      loadUserLocation();
      loadProfileImage();
      
      // Hide splash screen
      hideSplashScreen();
      
      // Initialize features
      initKeyboardShortcuts();
      initTooltips();
      startAutoRefresh();
      
      console.log('✅ MoneyFlow Dashboard initialized successfully');
      
    } catch (error) {
      console.error('Initialization error:', error);
      showSnackbar('Failed to initialize dashboard', 'error');
    }
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


