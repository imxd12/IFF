/* =========================
   INDEX PAGE - DASHBOARD LOGIC
   Complete with FIXED export system and all features
========================= */

// Initialize global functions
startClock('#timeNow');
attachBottomNav('nav-home');

// Dynamic year in footer
document.getElementById('currentYear').textContent = new Date().getFullYear();

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

  // DOM helper functions (safe fallbacks)
  function $(selector) {
    return document.querySelector(selector);
  }
  
  function $$(selector) {
    return document.querySelectorAll(selector);
  }

  // Safe localStorage wrapper
  function loadData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e);
      return null;
    }
  }

  function saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
      return false;
    }
  }

  // Safe formatting
  function fmt(value) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(value);
  }

  // Safe snackbar (fallback to alert)
  function showSnackbar(message, type = 'info') {
    try {
      // Try global snackbar first
      if (typeof window.showSnackbar === 'function') {
        window.showSnackbar(message, type);
        return;
      }
    } catch (e) {}
    
    // Fallback to alert
    alert(message);
  }

  // ========================================
  // PERSONALIZED GREETING - HOURLY CASUAL GREETINGS
  // ========================================
  function updateWelcome() {
    const hour = new Date().getHours();
    let greeting;
    
    // Dynamic casual greeting for every hour (0-23)
    const greetings = [
      `Late night 🌙, ${username}❤️`, `Midnight vibes 🌌, ${username}💜`, `Past midnight 🌃, ${username}💙`,
      `Early dawn 🌆, ${username}🧡`, `Pre-sunrise 🌄, ${username}💚`, `Early morning' 🌅, ${username}💛`,
      `Gudd morning' ☀️, ${username}🧡`, `Rise n' shine ☀️, ${username}💖`, `Morning' champ 🌤️, ${username}💜`,
      `Late morning' 🌞, ${username}💙`, `Mid-morning' ☀️, ${username}❤️`, `Almost noon 🌤️, ${username}💚`,
      `Gudd noon 🌞, ${username}💛`, `Early noon 🌤️, ${username}💙`, `Noon vibes ☀️, ${username}💜`,
      `Mid noon 🌤️, ${username}💖`, `Late noon 🌅, ${username}💚`, `Early eve' 🌆, ${username}❤️`,
      `Gudd eve' 🌇, ${username}🧡`, `Evenin' time 🌙, ${username}💙`, `Gudd night 🌃, ${username}❤️`,
      `Late Night 🌌, ${username}💛`, `Sleepsy' time 🌙, ${username}💖`, `Almost midnight 🌃, ${username}💚`
    ];
    
    greeting = greetings[hour] || `Hey there, ${username}❤️`;
    
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
    
    // Calculate All-Time Balance
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
  // FIXED EXPORT ALL DATA - BULLETPROOF
  // ========================================
  window.exportAllData = function() {
    try {
      console.log('🔄 Starting export process...');
      
      // Step 1: Safely load all data with fallbacks
      let spendlyData = [];
      let nexusData = [];
      let pocketData = [];
      
      try {
        spendlyData = loadData('fin_spendly') || [];
        nexusData = loadData('fin_nexus') || [];
        pocketData = loadData('fin_pocketcal') || [];
        console.log('✅ Data loaded:', {
          spendly: spendlyData.length,
          nexus: nexusData.length,
          pocketcal: pocketData.length
        });
      } catch (loadError) {
        console.error('Load error:', loadError);
        spendlyData = [];
        nexusData = [];
        pocketData = [];
      }
      
      // Step 2: Create robust export data structure
      const exportData = {
        version: '2.1.0',
        exportDate: new Date().toISOString(),
        exportFormat: 'moneyflow-backup-v2',
        timestamp: Date.now(),
        userName: localStorage.getItem('fin_userName') || 'User',
        profileImage: localStorage.getItem('fin_profileImage') || null,
        modules: {
          spendly: Array.isArray(spendlyData) ? spendlyData : [],
          nexus: Array.isArray(nexusData) ? nexusData : [],
          pocketcal: Array.isArray(pocketData) ? pocketData : []
        },
        settings: {
          theme: localStorage.getItem('fin_theme') || 'light'
        },
        stats: {
          totalTransactions: (spendlyData || []).length,
          totalNexusEntries: (nexusData || []).length,
          totalPocketEntries: (pocketData || []).length,
          totalBalance: 0, // Simplified
          totalItems: ((spendlyData || []).length + (nexusData || []).length + (pocketData || []).length)
        }
      };
      
      console.log('📦 Export data prepared:', exportData.stats);
      
      // Step 3: Create Blob safely
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      console.log('💾 Blob created, size:', blob.size, 'bytes');
      
      // Step 4: Create robust download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `moneyflow-backup-${new Date().toISOString().slice(0,10)}-${Date.now()}.json`;
      
      // Append to DOM temporarily
      document.body.appendChild(link);
      link.style.display = 'none';
      
      // Step 5: Trigger download
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('✅ Export completed successfully!');
      showSnackbar(`✅ Export successful! ${exportData.stats.totalItems} items saved 📤`, 'success');
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      
      // Emergency fallback - copy to clipboard
      try {
        const fallbackData = {
          error: 'Emergency export',
          timestamp: Date.now(),
          message: 'Copy this JSON and save as .json file',
          data: {
            spendly: loadData('fin_spendly') || [],
            nexus: loadData('fin_nexus') || [],
            pocketcal: loadData('fin_pocketcal') || []
          }
        };
        
        navigator.clipboard.writeText(JSON.stringify(fallbackData, null, 2)).then(() => {
          showSnackbar('⚠️ Download failed. Data copied to clipboard! 📋', 'warning');
        });
      } catch (clipboardError) {
        showSnackbar('❌ Export failed completely. Check console.', 'error');
      }
    }
  };

  // ========================================
  // SAVE USER NAME
  // ========================================
  window.saveName = function(e) {
    e.preventDefault();
    
    const nameInput = $('#userName');
    if (!nameInput) return;
    
    const newUsername = nameInput.value.trim();
    
    // Validate input
    if (!newUsername || newUsername.length < 2 || newUsername.length > 50) {
      showSnackbar('Name must be 2-50 characters', 'error');
      return;
    }
    
    // Save to localStorage
    try {
      username = newUsername;
      localStorage.setItem('fin_userName', username);
      updateWelcome();
      closeModal('#nameModal');
      showSnackbar(`Welcome, ${username}! 👋`);
      nameInput.value = '';
    } catch (e) {
      showSnackbar('Failed to save name', 'error');
    }
  };

  // ========================================
  // IMPORT DATA (unchanged but robust)
  // ========================================
  document.getElementById('importFile')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.json')) {
      showSnackbar('Please select a .json backup file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        importFileData = JSON.parse(event.target.result);
        
        if (!importFileData.modules) {
          throw new Error('Invalid backup structure');
        }

        const preview = $('#importPreview');
        if (preview) {
          preview.innerHTML = `
            <div class="preview-stats">
              <div class="stat-item"><strong>${importFileData.modules.spendly?.length || 0}</strong><span>Spendly</span></div>
              <div class="stat-item"><strong>${importFileData.modules.nexus?.length || 0}</strong><span>Nexus</span></div>
              <div class="stat-item"><strong>${importFileData.modules.pocketcal?.length || 0}</strong><span>PocketCal</span></div>
              <div class="stat-item total"><strong>${Object.values(importFileData.modules || {}).reduce((a, b) => a + (b?.length || 0), 0)}</strong><span>Total</span></div>
            </div>
          `;
          preview.style.display = 'block';
        }
        
        $('#confirmImportBtn').disabled = false;
        showSnackbar('✅ File validated successfully!', 'success');
        
      } catch (error) {
        showSnackbar('❌ Invalid JSON file format', 'error');
        importFileData = null;
        $('#confirmImportBtn').disabled = true;
        $('#importPreview').style.display = 'none';
      }
    };
    reader.readAsText(file);
  });

  window.processImport = function() {
    if (!importFileData || !confirm('⚠️ This will REPLACE all existing data! Continue?')) {
      return;
    }

    try {
      // Backup first
      const backupKey = `backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify({
        spendly: loadData('fin_spendly'),
        nexus: loadData('fin_nexus'),
        pocketcal: loadData('fin_pocketcal')
      }));

      // Import
      if (importFileData.modules.spendly) saveData('fin_spendly', importFileData.modules.spendly);
      if (importFileData.modules.nexus) saveData('fin_nexus', importFileData.modules.nexus);
      if (importFileData.modules.pocketcal) saveData('fin_pocketcal', importFileData.modules.pocketcal);

      closeModal('#importModal');
      updateDashboard();
      updateWelcome();
      showSnackbar('✅ Import successful! Data restored 🎉', 'success');
      
    } catch (error) {
      showSnackbar('❌ Import failed', 'error');
    }
  };

  // ========================================
  // DEVELOPER FUNCTIONS (simplified)
  // ========================================
  window.clearAllData = function() {
    if (!confirm('⚠️ Delete ALL data?') || !confirm('Absolutely sure?')) return;
    
    localStorage.clear();
    showSnackbar('🗑️ All data cleared');
    setTimeout(() => location.reload(), 1500);
  };

  window.viewStorage = function() {
    let totalSize = 0;
    let breakdown = [];
    
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        const size = (localStorage[key].length * 2); // Rough byte estimate
        totalSize += size;
        breakdown.push(`${key}: ${(size/1024).toFixed(1)}KB`);
      }
    }
    
    alert(`📊 Storage: ${(totalSize/1024).toFixed(1)}KB total\n\n${breakdown.slice(0,10).join('\n')}`);
  };

  window.downloadBackup = window.exportAllData;

  // ========================================
  // HIDE SPLASH SCREEN
  // ========================================
  function hideSplashScreen() {
    setTimeout(() => {
      const splash = $('#splashScreen');
      if (splash) splash.style.display = 'none';
    }, 2000);
  }

  // ========================================
  // INITIALIZATION
  // ========================================
  function init() {
    try {
      updateWelcome();
      updateDashboard();
      hideSplashScreen();
      
      // Auto refresh every 60s
      setInterval(updateDashboard, 60000);
      
      console.log('✅ MoneyFlow Dashboard initialized');
      
    } catch (error) {
      console.error('Init error:', error);
    }
  }

  // Modal helpers (fallback safe)
  window.openModal = function(selector) {
    const modal = $(selector);
    if (modal) modal.classList.add('show');
  };

  window.closeModal = function(selector) {
    const modal = $(selector);
    if (modal) modal.classList.remove('show');
  };

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
