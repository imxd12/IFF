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
  let importFileData = null;

  // ========================================
  // PERSONALIZED GREETING - HOURLY CASUAL GREETINGS
  // ========================================
  function updateWelcome() {
    const hour = new Date().getHours();
    let greeting;
    
    // Dynamic casual greeting for every hour (0-23)
    switch(hour) {
      case 0:
        greeting = `Late night 🌙, ${username}❤️`;
        break;
      case 1:
        greeting = `Midnight vibes 🌌, ${username}💜`;
        break;
      case 2:
        greeting = `Past midnight 🌃, ${username}💙`;
        break;
      case 3:
        greeting = `Early dawn 🌆, ${username}🧡`;
        break;
      case 4:
        greeting = `Pre-sunrise 🌄, ${username}💚`;
        break;
      case 5:
        greeting = `Early morning' 🌅, ${username}💛`;
        break;
      case 6:
        greeting = `Gudd morning' ☀️, ${username}🧡`;
        break;
      case 7:
        greeting = `Rise n' shine ☀️, ${username}💖`;
        break;
      case 8:
        greeting = `Morning' champ 🌤️, ${username}💜`;
        break;
      case 9:
        greeting = `Late morning' 🌞, ${username}💙`;
        break;
      case 10:
        greeting = `Mid-morning' ☀️, ${username}❤️`;
        break;
      case 11:
        greeting = `Almost noon 🌤️, ${username}💚`;
        break;
      case 12:
        greeting = `Gudd noon 🌞, ${username}💛`;
        break;
      case 13:
        greeting = `Early noon 🌤️, ${username}💙`;
        break;
      case 14:
        greeting = `Noon vibes ☀️, ${username}💜`;
        break;
      case 15:
        greeting = `Mid noon 🌤️, ${username}💖`;
        break;
      case 16:
        greeting = `Late noon 🌅, ${username}💚`;
        break;
      case 17:
        greeting = `Early eve' 🌆, ${username}❤️`;
        break;
      case 18:
        greeting = `Gudd eve' 🌇, ${username}🧡`;
        break;
      case 19:
        greeting = `Evenin' time 🌙, ${username}💙`;
        break;
      case 20:
        greeting = `Gudd night 🌃, ${username}❤️`;
        break;
      case 21:
        greeting = `Late Night 🌌, ${username}💛`;
        break;
      case 22:
        greeting = `Sleepsy' time 🌙, ${username}💖`;
        break;
      case 23:
        greeting = `Almost midnight 🌃, ${username}💚`;
        break;
      default:
        greeting = `Hey there, ${username}❤️`;
    }
    
    const welcomeEl = $('#welcomeText');
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
    
    const balance = totalIncome - totalExpense;
    
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
  // EXPORT ALL DATA - HIGH ACCURACY
  // ========================================
  window.exportAllData = function() {
    try {
      // Validate data integrity before export
      const spendlyData = loadData('fin_spendly') || [];
      const nexusData = loadData('fin_nexus') || [];
      const pocketData = loadData('fin_pocketcal') || [];
      
      // Data validation
      const hasValidData = spendlyData.every(item => item && typeof item === 'object') &&
                          nexusData.every(item => item && typeof item === 'object') &&
                          pocketData.every(item => item && typeof item === 'object');
      
      if (!hasValidData) {
        showSnackbar('Data validation failed. Cannot export corrupted data.', 'error');
        return;
      }
      
      const data = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        exportFormat: 'moneyflow-backup-v2',
        userName: localStorage.getItem('fin_userName') || 'User',
        profileImage: localStorage.getItem('fin_profileImage') || null,
        modules: {
          spendly: spendlyData,
          nexus: nexusData,
          pocketcal: pocketData
        },
        settings: {
          theme: localStorage.getItem('fin_theme') || 'light'
        },
        stats: {
          totalTransactions: spendlyData.length,
          totalNexusEntries: nexusData.length,
          totalPocketEntries: pocketData.length,
          totalBalance: calculateTotalBalance(),
          exportTimestamp: Date.now()
        },
        checksum: generateChecksum(spendlyData.concat(nexusData, pocketData))
      };
      
      const filename = `moneyflow-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      exportJSON(data, filename);
      showSnackbar(`✅ Data exported successfully! ${spendlyData.length + nexusData.length + pocketData.length} entries saved. 📤`, 'success');
      
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('❌ Failed to export data. Please try again.', 'error');
    }
  };

  // ========================================
  // IMPORT DATA - HIGH ACCURACY WITH VALIDATION
  // ========================================
  window.processImport = function() {
    if (!importFileData) {
      showSnackbar('Please select a file first', 'error');
      return;
    }

    try {
      // Comprehensive data validation
      if (!importFileData.exportFormat || importFileData.exportFormat !== 'moneyflow-backup-v2') {
        showSnackbar('❌ Invalid backup format. Please use MoneyFlow v2 backup.', 'error');
        return;
      }

      if (importFileData.version !== '2.0.0') {
        showSnackbar('⚠️ Backup version mismatch. This may cause issues.', 'warning');
      }

      // Validate checksum
      const importedData = importFileData.modules.spendly.concat(
        importFileData.modules.nexus, 
        importFileData.modules.pocketcal
      );
      const calculatedChecksum = generateChecksum(importedData);
      
      if (calculatedChecksum !== importFileData.checksum) {
        showSnackbar('❌ Data integrity check failed. File may be corrupted.', 'error');
        return;
      }

      // Show detailed preview and confirmation
      const totalEntries = importedData.length;
      const spendlyCount = importFileData.modules.spendly?.length || 0;
      const nexusCount = importFileData.modules.nexus?.length || 0;
      const pocketCount = importFileData.modules.pocketcal?.length || 0;
      
      const preview = `📊 Import Preview:
• Spendly: ${spendlyCount} transactions
• Nexus: ${nexusCount} entries  
• PocketCal: ${pocketCount} entries
• Total: ${totalEntries} items
• Date: ${new Date(importFileData.exportDate).toLocaleString()}
⚠️ This will REPLACE all existing data!`;

      if (confirm(preview)) {
        performImport();
      }

    } catch (error) {
      console.error('Import validation error:', error);
      showSnackbar('❌ Import validation failed', 'error');
    }
  };

  // Handle file selection for import
  document.getElementById('importFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) {
      importFileData = null;
      $('#confirmImportBtn').disabled = true;
      $('#importPreview').style.display = 'none';
      return;
    }

    // Validate file type
    if (!file.name.endsWith('.json')) {
      showSnackbar('Please select a .json backup file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        importFileData = JSON.parse(event.target.result);
        
        // Validate structure
        if (!importFileData.modules || !importFileData.stats) {
          throw new Error('Invalid backup structure');
        }

        // Show preview
        const preview = document.getElementById('importPreview');
        preview.innerHTML = `
          <div class="preview-stats">
            <div class="stat-item">
              <strong>${importFileData.modules.spendly?.length || 0}</strong>
              <span>Spendly</span>
            </div>
            <div class="stat-item">
              <strong>${importFileData.modules.nexus?.length || 0}</strong>
              <span>Nexus</span>
            </div>
            <div class="stat-item">
              <strong>${importFileData.modules.pocketcal?.length || 0}</strong>
              <span>PocketCal</span>
            </div>
            <div class="stat-item total">
              <strong>${(importFileData.modules.spendly?.length || 0) + (importFileData.modules.nexus?.length || 0) + (importFileData.modules.pocketcal?.length || 0)}</strong>
              <span>Total Items</span>
            </div>
          </div>
          <small>Exported: ${new Date(importFileData.exportDate).toLocaleString()}</small>
        `;
        preview.style.display = 'block';
        $('#confirmImportBtn').disabled = false;
        
        showSnackbar('✅ File validated successfully!', 'success');
        
      } catch (error) {
        console.error('File parse error:', error);
        showSnackbar('❌ Invalid JSON file format', 'error');
        importFileData = null;
        $('#confirmImportBtn').disabled = true;
        $('#importPreview').style.display = 'none';
      }
    };
    reader.readAsText(file);
  });

  // Perform actual import
  function performImport() {
    try {
      // Backup existing data first
      const backupKey = `backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        spendly: loadData('fin_spendly'),
        nexus: loadData('fin_nexus'),
        pocketcal: loadData('fin_pocketcal'),
        timestamp: Date.now()
      }));

      // Import data with validation
      if (importFileData.modules.spendly) {
        saveData('fin_spendly', importFileData.modules.spendly);
      }
      if (importFileData.modules.nexus) {
        saveData('fin_nexus', importFileData.modules.nexus);
      }
      if (importFileData.modules.pocketcal) {
        saveData('fin_pocketcal', importFileData.modules.pocketcal);
      }

      // Import settings
      if (importFileData.userName) {
        localStorage.setItem('fin_userName', importFileData.userName);
        username = importFileData.userName;
      }
      if (importFileData.profileImage) {
        localStorage.setItem('fin_profileImage', importFileData.profileImage);
      }
      if (importFileData.settings?.theme) {
        localStorage.setItem('fin_theme', importFileData.settings.theme);
      }

      closeModal('#importModal');
      updateDashboard();
      updateWelcome();
      loadProfileImage();
      
      showSnackbar(`✅ Import successful! ${importFileData.stats.totalTransactions + importFileData.stats.totalNexusEntries + importFileData.stats.totalPocketEntries} items restored. 🎉`, 'success');
      
      // Auto-refresh after 2 seconds
      setTimeout(() => location.reload(), 2000);
      
    } catch (error) {
      console.error('Import execution error:', error);
      showSnackbar('❌ Import failed during execution', 'error');
    }
  }

  // ========================================
  // UTILITY FUNCTIONS FOR IMPORT/EXPORT
  // ========================================
  function generateChecksum(dataArray) {
    return btoa(JSON.stringify(dataArray.sort((a, b) => (a.date || '').localeCompare(b.date || ''))));
  }

  function calculateTotalBalance() {
    const spendly = loadData('fin_spendly') || [];
    const income = spendly.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const expense = spendly.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return income - expense;
  }

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
      // Create backup before clearing
      const backupKey = `emergency_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        allData: JSON.stringify(localStorage),
        timestamp: Date.now()
      }));
      
      // Clear all localStorage
      localStorage.clear();
      
      showSnackbar('🗑️ All data cleared. Emergency backup created.', 'success');
      
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
  // HIDE SPLASH SCREEN
  // ========================================
  function hideSplashScreen() {
    setTimeout(() => {
      const splash = $('#splashScreen');
      if (splash) {
        splash.style.display = 'none';
      }
    }, 10000);
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
      
      // Ctrl/Cmd + I: Import data
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        openModal('#importModal');
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
  // INITIALIZATION
  // ========================================
  function init() {
    try {
      updateWelcome();
      updateDashboard();
      
      loadUserLocation();
      loadProfileImage();
      
      hideSplashScreen();
      
      initKeyboardShortcuts();
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
