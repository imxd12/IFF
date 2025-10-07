/* =========================
   INDEX PAGE - DASHBOARD LOGIC
========================= */

// Initialize
startClock('#timeNow');
attachBottomNav('nav-home');

(function() {
  'use strict';

  // Load username
  let username = localStorage.getItem('fin_userName') || 'User';

  // Personalized greeting
  function updateWelcome() {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour >= 0 && hour < 3) greeting = `Good midnight 🌙, ${username}!`;
    else if (hour >= 3 && hour < 5) greeting = `Early dawn 🌌, ${username}!`;
    else if (hour >= 5 && hour < 7) greeting = `Good early morning 🌅, ${username}!`;
    else if (hour >= 7 && hour < 9) greeting = `Good morning ☀️, ${username}!`;
    else if (hour >= 9 && hour < 12) greeting = `Late morning 🌤️, ${username}!`;
    else if (hour >= 12 && hour < 14) greeting = `Good noon 🌞, ${username}!`;
    else if (hour >= 14 && hour < 16) greeting = `Early afternoon 🌤️, ${username}!`;
    else if (hour >= 16 && hour < 18) greeting = `Late afternoon 🌇, ${username}!`;
    else if (hour >= 18 && hour < 20) greeting = `Good evening 🌙, ${username}!`;
    else if (hour >= 20 && hour < 22) greeting = `Good night 🌃, ${username}!`;
    else greeting = `Late night 🌌, ${username}!`;
    
    $('#welcomeText').textContent = greeting;
  }

  // Update dashboard summary
  function updateDashboard() {
    const spendly = loadData('fin_spendly') || [];
    const nexus = loadData('fin_nexus') || [];
    const pocket = loadData('fin_pocketcal') || [];
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Today's expense (Spendly)
    const todayExpense = spendly
      .filter(t => t.date === today && t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    // This month pocket money
    const monthPocket = pocket
      .filter(p => p.date.startsWith(currentMonth))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    // This month nexus earnings
    const monthNexus = nexus
      .filter(n => n.date.startsWith(currentMonth))
      .reduce((sum, n) => sum + Number(n.payout || 0), 0);
    
    // All-time balance (Income - Expense from Spendly + Nexus + Pocket)
    const totalIncome = spendly
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const totalExpense = spendly
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    
    const totalNexus = nexus.reduce((sum, n) => sum + Number(n.payout || 0), 0);
    const totalPocket = pocket.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    
    const balance = totalIncome - totalExpense + totalNexus + totalPocket;
    
    // Update UI
    $('#todayExpense').textContent = fmt(todayExpense);
    $('#monthPocket').textContent = fmt(monthPocket);
    $('#monthNexus').textContent = fmt(monthNexus);
    $('#totalBalance').textContent = fmt(balance);
  }

  // Save name
  window.saveName = function(e) {
    e.preventDefault();
    username = $('#userName').value.trim();
    if (username) {
      localStorage.setItem('fin_userName', username);
      updateWelcome();
      closeModal('#nameModal');
      showSnackbar('Name saved successfully!');
    }
  };

  // Export all data
  window.exportAllData = function() {
    const data = {
      spendly: loadData('fin_spendly'),
      nexus: loadData('fin_nexus'),
      pocketcal: loadData('fin_pocketcal'),
      userName: localStorage.getItem('fin_userName'),
      exportDate: new Date().toISOString()
    };
    exportJSON(data, 'moneyflow-backup.json');
  };

  // Clear all data
  window.clearAllData = function() {
    if (confirm('Are you sure? This will delete ALL data permanently!')) {
      localStorage.clear();
      location.reload();
    }
  };

  // View storage
  window.viewStorage = function() {
    const size = JSON.stringify(localStorage).length;
    const kb = (size / 1024).toFixed(2);
    alert(`Storage used: ${kb} KB\n\nKeys: ${Object.keys(localStorage).join(', ')}`);
  };

  // Download backup
  window.downloadBackup = function() {
    exportAllData();
  };

  // Load user location
  getLocation((loc) => {
    const locEl = $('#userLocation');
    if (loc) {
      locEl.innerHTML = `<span>📍</span><span>${loc.city}, ${loc.region}, ${loc.country}</span>`;
    } else {
      locEl.innerHTML = `<span>📍</span><span>Location unavailable</span>`;
    }
  });

  // Hide splash screen
  setTimeout(() => {
    $('#splashScreen').style.display = 'none';
  }, 3000);

  // Initialize
  updateWelcome();
  updateDashboard();
  
  // Set profile image if available
  const savedImage = localStorage.getItem('fin_profileImage');
  if (savedImage) {
    $('#profileImage').src = savedImage;
    $('#profileImageLarge').src = savedImage;
  }

})();
