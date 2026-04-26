/* ========================================================================
   MONEYFLOW - SETTINGS.JS
   Premium Settings Logic, Tabs, Custom Drops, Data Management
======================================================================== */

(function () {
    'use strict';

    // ----------------------------------------------------
    // TAB NAVIGATION
    // ----------------------------------------------------
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const tabSwitcherPill = document.getElementById('tabSwitcherPill');

    tabBtns.forEach((btn, idx) => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            
            tabBtns.forEach(b => {
                b.classList.remove('text-white');
                b.classList.add('text-muted');
            });
            tabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('text-white');
            btn.classList.remove('text-muted');
            document.getElementById(targetId).classList.add('active');
            
            // Move pill (assuming 4 tabs = 100% / 4 = 25% each, so translateX of 0, 100%, 200%, 300% of the pill's own width works)
            if (tabSwitcherPill) {
                tabSwitcherPill.style.transform = `translateX(${idx * 100}%)`;
            }
            
            if (window.playUISound) window.playUISound('whoosh');
        });
    });

    // ----------------------------------------------------
    // VOICE AI DROPDOWN
    // ----------------------------------------------------
    const populateVoices = () => {
        const select = document.getElementById('voiceSelect');
        if(!select) return;
        select.innerHTML = '';
        
        const voices = window.speechSynthesis.getVoices();
        const savedURI = localStorage.getItem('fin_voiceURI');

        // Show all voices, prioritize native ones
        let displayVoices = voices.filter(v => v.lang.includes('en') || v.localService);
        if(displayVoices.length === 0) displayVoices = voices.slice(0, 50);
        
        if (displayVoices.length === 0) {
            select.innerHTML = '<option value="">Default System Voice</option>';
            return;
        }

        displayVoices.forEach(voice => {
            const opt = document.createElement('option');
            opt.textContent = `${voice.name} (${voice.lang})`;
            opt.value = voice.voiceURI;
            if (voice.voiceURI === savedURI) opt.selected = true;
            select.appendChild(opt);
        });
    };

    // Voice Toggle Logic
    const toggleVoiceBtn = document.getElementById('toggleVoiceBtn');
    if (toggleVoiceBtn) {
        const isVoiceOff = localStorage.getItem("voiceGreeting") === "off";
        toggleVoiceBtn.textContent = isVoiceOff ? "Off" : "On";
        toggleVoiceBtn.className = isVoiceOff ? 
            'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition' :
            'px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white transition shadow-md';
            
        toggleVoiceBtn.addEventListener('click', () => {
            const currentIsOff = localStorage.getItem("voiceGreeting") === "off";
            localStorage.setItem("voiceGreeting", currentIsOff ? "on" : "off");
            toggleVoiceBtn.textContent = currentIsOff ? "On" : "Off";
            toggleVoiceBtn.className = currentIsOff ? 
                'px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white transition shadow-md' :
                'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
        });
    }

    // Theme Toggle Logic (Button update)
    const toggleAppThemeBtn = document.getElementById('toggleAppThemeBtn');
    if (toggleAppThemeBtn) {
        const currentTheme = localStorage.getItem('fin_theme') || 'light';
        toggleAppThemeBtn.textContent = currentTheme === 'dark' ? 'Obsidian Black' : 'Ceramic White';
        toggleAppThemeBtn.className = currentTheme === 'dark' ? 
            'px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 text-white transition shadow-md border-slate-700' :
            'px-4 py-2 rounded-xl text-sm font-bold bg-white text-slate-800 transition shadow-md border-slate-200';
            
        toggleAppThemeBtn.addEventListener('click', () => {
            const globalToggle = document.getElementById('themeToggleBtn');
            if (globalToggle) {
                globalToggle.click(); // Trigger the global clip-path animation
                setTimeout(() => {
                    const newTheme = localStorage.getItem('fin_theme') || 'light';
                    toggleAppThemeBtn.textContent = newTheme === 'dark' ? 'Obsidian Black' : 'Ceramic White';
                    toggleAppThemeBtn.className = newTheme === 'dark' ? 
                        'px-4 py-2 rounded-xl text-sm font-bold bg-slate-800 text-white transition shadow-md border-slate-700' :
                        'px-4 py-2 rounded-xl text-sm font-bold bg-white text-slate-800 transition shadow-md border-slate-200';
                }, 500);
            }
        });
    }

    if (window.speechSynthesis) {
        if (speechSynthesis.getVoices().length !== 0) populateVoices();
        else speechSynthesis.addEventListener('voiceschanged', populateVoices);
        
        const select = document.getElementById('voiceSelect');
        if(select) {
            select.addEventListener('change', (e) => {
                localStorage.setItem('fin_voiceURI', e.target.value);
                
                // Test the voice
                const msg = new SpeechSynthesisUtterance("Voice configured.");
                const voice = speechSynthesis.getVoices().find(v => v.voiceURI === e.target.value);
                if(voice) msg.voice = voice;
                speechSynthesis.speak(msg);
                
                showSnackbar('Assistant Voice Updated!');
            });
        }
    }

    // ----------------------------------------------------
    // INTENSITY SLIDERS & PREFERENCES (GENERAL)
    // ----------------------------------------------------
    const hapticSlider = document.getElementById('hapticSlider');
    const hapticBadge = document.getElementById('hapticBadge');
    
    if (hapticSlider) {
        const savedHaptic = localStorage.getItem('fin_haptic_intensity') || '50';
        hapticSlider.value = savedHaptic;
        hapticSlider.style.setProperty('--val', savedHaptic + '%');
        hapticBadge.textContent = savedHaptic + '%';
        
        hapticSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            hapticSlider.style.setProperty('--val', val + '%');
            hapticBadge.textContent = val + '%';
            
            // Light continuous haptic feedback while dragging
            if (navigator.vibrate && val > 0 && val % 5 === 0) {
                navigator.vibrate(Math.max(1, Math.floor(val * 0.1)));
            }
        });
        hapticSlider.addEventListener('change', (e) => {
            localStorage.setItem('fin_haptic_intensity', e.target.value);
            if (navigator.vibrate && e.target.value > 0) {
                navigator.vibrate(Math.max(5, Math.floor(e.target.value * 0.6)));
            }
        });
    }

    const soundSlider = document.getElementById('soundSlider');
    const soundBadge = document.getElementById('soundBadge');
    
    if (soundSlider) {
        const savedSound = localStorage.getItem('fin_sound_intensity') || '50';
        soundSlider.value = savedSound;
        soundSlider.style.setProperty('--val', savedSound + '%');
        soundBadge.textContent = savedSound + '%';
        
        soundSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            soundSlider.style.setProperty('--val', val + '%');
            soundBadge.textContent = val + '%';
            
            // Light haptic feedback on drag for tactile feel
            if (navigator.vibrate && val % 10 === 0) {
                navigator.vibrate(2);
            }
        });
        soundSlider.addEventListener('change', (e) => {
            localStorage.setItem('fin_sound_intensity', e.target.value);
            if (window.playUISound) window.playUISound('tap');
        });
    }

    const toggleMotionBtn = document.getElementById('toggleMotionBtn');
    if (toggleMotionBtn) {
        const isReduced = localStorage.getItem('fin_reduce_motion') === 'true';
        toggleMotionBtn.textContent = isReduced ? 'On' : 'Off';
        toggleMotionBtn.className = isReduced ? 
            'px-4 py-2 rounded-xl text-sm font-bold bg-blue-500 text-white transition shadow-md' :
            'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
            
        toggleMotionBtn.addEventListener('click', () => {
            const current = localStorage.getItem('fin_reduce_motion') === 'true';
            localStorage.setItem('fin_reduce_motion', current ? 'false' : 'true');
            window.location.reload();
        });
    }

    // ----------------------------------------------------
    // PERSONAL IDENTITY
    // ----------------------------------------------------
    const nameInput = document.getElementById('usernameInput');
    const dobInput = document.getElementById('dobInput');
    const genderInput = document.getElementById('genderInput');
    const bloodInput = document.getElementById('bloodInput');
    const bioInput = document.getElementById('bioInput');
    const locationInput = document.getElementById('locationInput');
    const initialsDisplay = document.getElementById('avatarInitials');
    
    if(nameInput) {
        const savedName = localStorage.getItem('fin_userName') || '';
        nameInput.value = savedName;
        if (savedName) initialsDisplay.textContent = savedName.charAt(0).toUpperCase();
        
        if(dobInput) dobInput.value = localStorage.getItem('userDOB') || '';
        if(genderInput) genderInput.value = localStorage.getItem('userGender') || '';
        if(bloodInput) bloodInput.value = localStorage.getItem('userBlood') || '';
        if(bioInput) bioInput.value = localStorage.getItem('userBio') || '';
        if(locationInput) locationInput.value = localStorage.getItem('userLocation') || '';

        window.saveIdentity = function() {
            const newName = nameInput.value.trim() || 'User';
            localStorage.setItem('fin_userName', newName);
            initialsDisplay.textContent = newName.charAt(0).toUpperCase();
            
            if(dobInput) localStorage.setItem('userDOB', dobInput.value);
            if(genderInput) localStorage.setItem('userGender', genderInput.value);
            if(bloodInput) localStorage.setItem('userBlood', bloodInput.value);
            if(bioInput) localStorage.setItem('userBio', bioInput.value.trim());
            if(locationInput) localStorage.setItem('userLocation', locationInput.value.trim());
            
            window.showSnackbar('Profile saved successfully! ✨');
        };
    }

    // ----------------------------------------------------
    // FINANCE PREFERENCES & CURRENCY DROPDOWN
    // ----------------------------------------------------
    const currencies = [
        { sym: '₹', code: 'INR', name: 'Indian Rupee' },
        { sym: '$', code: 'USD', name: 'US Dollar' },
        { sym: '€', code: 'EUR', name: 'Euro' },
        { sym: '£', code: 'GBP', name: 'British Pound' },
        { sym: '¥', code: 'JPY', name: 'Japanese Yen' },
        { sym: 'A$', code: 'AUD', name: 'Australian Dollar' },
        { sym: 'C$', code: 'CAD', name: 'Canadian Dollar' },
        { sym: 'CHF', code: 'CHF', name: 'Swiss Franc' },
        { sym: 'CN¥', code: 'CNY', name: 'Chinese Yuan' },
        { sym: 'kr', code: 'SEK', name: 'Swedish Krona' },
        { sym: 'NZ$', code: 'NZD', name: 'New Zealand Dollar' },
        { sym: 'MX$', code: 'MXN', name: 'Mexican Peso' },
        { sym: 'S$', code: 'SGD', name: 'Singapore Dollar' },
        { sym: 'HK$', code: 'HKD', name: 'Hong Kong Dollar' },
        { sym: 'kr', code: 'NOK', name: 'Norwegian Krone' },
        { sym: '₩', code: 'KRW', name: 'South Korean Won' },
        { sym: '₺', code: 'TRY', name: 'Turkish Lira' },
        { sym: '₽', code: 'RUB', name: 'Russian Ruble' },
        { sym: 'R$', code: 'BRL', name: 'Brazilian Real' },
        { sym: 'R', code: 'ZAR', name: 'South African Rand' }
    ];

    const currencyDropdown = document.getElementById('currencyDropdown');
    const currencyToggleBtn = document.getElementById('currencyToggleBtn');
    const currencySearch = document.getElementById('currencySearch');
    const currencyList = document.getElementById('currencyList');
    const selectedCurrencyDisplay = document.getElementById('selectedCurrencyDisplay');
    
    if (currencyDropdown) {
        let currentCur = localStorage.getItem('fin_currency') || '₹';
        let currentCode = localStorage.getItem('fin_currency_code') || 'INR';
        
        const updateDisplay = (sym, code, name) => {
            selectedCurrencyDisplay.textContent = `${sym} ${code} (${name})`;
        };

        const renderList = (filter = '') => {
            currencyList.innerHTML = '';
            currencies.forEach(c => {
                if (c.code.toLowerCase().includes(filter.toLowerCase()) || c.name.toLowerCase().includes(filter.toLowerCase())) {
                    const opt = document.createElement('div');
                    opt.className = 'currency-option';
                    if (c.sym === currentCur) opt.classList.add('selected');
                    opt.innerHTML = `<span>${c.sym} ${c.code}</span> <span class="text-xs opacity-70">${c.name}</span>`;
                    opt.addEventListener('click', () => {
                        currentCur = c.sym;
                        currentCode = c.code;
                        localStorage.setItem('fin_currency', c.sym);
                        localStorage.setItem('fin_currency_code', c.code);
                        updateDisplay(c.sym, c.code, c.name);
                        currencyDropdown.classList.remove('open');
                        window.showSnackbar(`Currency updated to ${c.code}`);
                        renderList(currencySearch.value);
                    });
                    currencyList.appendChild(opt);
                }
            });
        };

        const initCur = currencies.find(c => c.sym === currentCur) || currencies[0];
        updateDisplay(initCur.sym, initCur.code, initCur.name);
        renderList();

        currencyToggleBtn.addEventListener('click', () => {
            currencyDropdown.classList.toggle('open');
            if (currencyDropdown.classList.contains('open')) {
                currencySearch.focus();
            }
        });

        currencySearch.addEventListener('input', (e) => {
            renderList(e.target.value);
        });

        document.addEventListener('click', (e) => {
            if (!currencyDropdown.contains(e.target)) {
                currencyDropdown.classList.remove('open');
            }
        });
    }

    const dateFormatInput = document.getElementById('dateFormatInput');
    if (dateFormatInput) {
        dateFormatInput.value = localStorage.getItem('fin_date_format') || 'DD/MM/YYYY';
        dateFormatInput.addEventListener('change', (e) => {
            localStorage.setItem('fin_date_format', e.target.value);
        });
    }

    const togglePrivacyBtn = document.getElementById('togglePrivacyBtn');
    if (togglePrivacyBtn) {
        const isPrivacy = localStorage.getItem('fin_privacy_mode') === 'true';
        togglePrivacyBtn.textContent = isPrivacy ? 'On' : 'Off';
        togglePrivacyBtn.className = isPrivacy ? 
            'px-4 py-2 rounded-xl text-sm font-bold bg-blue-500 text-white transition shadow-md' :
            'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
            
        togglePrivacyBtn.addEventListener('click', () => {
            const current = localStorage.getItem('fin_privacy_mode') === 'true';
            localStorage.setItem('fin_privacy_mode', current ? 'false' : 'true');
            togglePrivacyBtn.textContent = !current ? 'On' : 'Off';
            togglePrivacyBtn.className = !current ? 
                'px-4 py-2 rounded-xl text-sm font-bold bg-blue-500 text-white transition shadow-md' :
                'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
            
            document.body.classList.toggle('privacy-mode', !current);
        });
    }

    const toggleBudgetBtn = document.getElementById('toggleBudgetBtn');
    if (toggleBudgetBtn) {
        const isAlert = localStorage.getItem('fin_budget_alerts') !== 'false';
        toggleBudgetBtn.textContent = isAlert ? 'On' : 'Off';
        toggleBudgetBtn.className = isAlert ? 
            'px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white transition shadow-md' :
            'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
            
        toggleBudgetBtn.addEventListener('click', () => {
            const current = localStorage.getItem('fin_budget_alerts') !== 'false';
            localStorage.setItem('fin_budget_alerts', current ? 'false' : 'true');
            toggleBudgetBtn.textContent = !current ? 'On' : 'Off';
            toggleBudgetBtn.className = !current ? 
                'px-4 py-2 rounded-xl text-sm font-bold bg-amber-500 text-white transition shadow-md' :
                'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
        });
    }

    // ----------------------------------------------------
    // CATEGORY MANAGER (ADVANCED)
    // ----------------------------------------------------
    const catTypeExpenseBtn = document.getElementById('catTypeExpense');
    const catTypeIncomeBtn = document.getElementById('catTypeIncome');
    const mainCategorySelect = document.getElementById('mainCategorySelect');
    const mainCategorySelectContainer = document.getElementById('mainCategorySelectContainer');
    const newCategoryInput = document.getElementById('newCategoryInput');
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const customCategoryList = document.getElementById('customCategoryList');

    let currentCatType = 'expense';
    
    const defaultCategoryMap = {
        Travel: ['🛺 Auto/Rickshaw', '🤝 Shared Auto', '🚍 BEST/City Bus', '🚇 Metro', '🚆 Local Train', '🚌 Long Journey', '🛵 Bike Petrol', '⛽ Fuel/Diesel', '🚗 Taxi/Cab', '🚲 Bicycle', '🛤️ Toll/Parking', '🎫 Monthly Pass', 'All'],
        Food: ['🥛 Milk/Doodh', '🌾 Ration/Kirana', '🥬 Vegetables/Mandi', '🍎 Fruits', '🍞 Bakery/Bread', '🍗 Non-Veg/Meat', '🌶️ Masala/Spices', '🍳 Breakfast', '🍛 Lunch/Dinner', '☕ Tea/Chai', '🥙 Street Food', '🍔 Outside Junk', '🥤 Cold Drinks', 'All'],
        'Home & Rent': ['🏠 House Rent', '🏡 PG/Hostel', '🧹 Maid/Bai', '🔥 Gas Cylinder', '🚰 Drinking Water/Can', '🔌 Hardware/Tools', '🧴 Detergent/Soaps', '📰 Newspaper', 'All'],
        Bills: ['💡 Electricity Bill', '📱 Mobile Recharge', '🌐 WiFi/Broadband', '📺 Cable/DTH', '🏦 Bank Charges', '💳 Credit Card Bill', '🌊 Water Bill', 'All'],
        Shopping: ['👕 Clothes', '👟 Shoes/Chappal', '🧢 Daily Wear', '🧴 Personal Care', '🧵 Tailor/Stitching', '📱 Gadgets', '🛍️ Online Sale', 'All'],
        Health: ['💊 Medicines/Pharmacy', '🩺 Doctor Visit/Clinic', '🏥 Hospital', '🩸 Blood Test/Pathology', '🦷 Dental', '🧴 Skin Care', '🧘 Yoga/Gym', 'All'],
        Education: ['🖨️ Printout/Xerox', '📄 Assignment/Project', '📚 Text Books', '📓 Notebooks/Registers', '🖊️ Stationary (Pens/Pencils)', '🎒 Bag/Accessories', '🏫 School/College Fees', '🧑‍🏫 Tuition/Coaching', '📝 Exam Form/Fees', '💻 Cyber Cafe', '💻 Online Course', 'All'],
        Entertainment: ['🎬 Movies/Theater', '🎥 OTT (Netflix/Prime)', '🍿 Outing/Mela', '🎮 Games', '🎡 Fun Activities', '🎵 Spotify/Music', 'All'],
        Savings: ['🏦 Bank Deposit', '💰 Cash Piggubank', '📈 Mutual Funds/SIP', '🏅 Gold/Jewelry', '🚨 Emergency Fund', 'All'],
        Family: ['🎉 Festivals/Puja', '🎁 Gifts/Shagun', '👶 Kids Fees/Toys', '🍛 Family Dinner', '👵 Parent Medicine', '🏠 Home Repair', 'All'],
        Other: ['💇 Haircut/Barber', '👚 Laundry/Dhobi', '📦 Courier/Post', '🚗 Bike/Auto Service', '💵 Charity/Zakat', '💸 Lost/Stolen', '🚬 Smoking/Pan', '🍺 Alcohol', 'All']
    };

    let fullCategoryMap = window.loadData('fin_full_category_map') || {
        expenseMap: JSON.parse(JSON.stringify(defaultCategoryMap)),
        incomeList: [] // Additional custom incomes
    };

    function populateMainCategoryDropdown() {
        if (!mainCategorySelect) return;
        mainCategorySelect.innerHTML = Object.keys(fullCategoryMap.expenseMap)
            .map(c => `<option value="${c}">${c}</option>`).join('');
    }

    function renderAdvancedCategories() {
        if (!customCategoryList) return;
        customCategoryList.innerHTML = '';
        
        let list = [];
        if (currentCatType === 'expense') {
            if(mainCategorySelectContainer) mainCategorySelectContainer.style.display = 'block';
            const selCat = mainCategorySelect.value;
            if (selCat && fullCategoryMap.expenseMap[selCat]) {
                list = fullCategoryMap.expenseMap[selCat];
            }
        } else {
            if(mainCategorySelectContainer) mainCategorySelectContainer.style.display = 'none';
            list = fullCategoryMap.incomeList;
        }
        
        if(list.length === 0) {
            customCategoryList.innerHTML = `<p class="text-xs text-muted italic text-center py-2">No custom items.</p>`;
            return;
        }

        list.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5';
            div.innerHTML = `
                <span class="text-sm theme-text">${item}</span>
                <div class="flex gap-2">
                    <button class="text-blue-500 hover:text-blue-400" onclick="editAdvancedCategory(${index})"><i data-lucide="edit-2" class="w-4 h-4"></i></button>
                    <button class="text-rose-500 hover:text-rose-400" onclick="deleteAdvancedCategory(${index})"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                </div>
            `;
            customCategoryList.appendChild(div);
        });
        if(window.lucide) window.lucide.createIcons();
    }

    if(catTypeExpenseBtn && catTypeIncomeBtn) {
        populateMainCategoryDropdown();
        
        if (mainCategorySelect) {
            mainCategorySelect.addEventListener('change', renderAdvancedCategories);
        }

        catTypeExpenseBtn.addEventListener('click', () => {
            currentCatType = 'expense';
            catTypeExpenseBtn.className = 'flex-1 py-2 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-500 transition-all';
            catTypeIncomeBtn.className = 'flex-1 py-2 rounded-lg text-sm font-bold text-muted transition-all';
            renderAdvancedCategories();
            if(window.playUISound) window.playUISound('tap');
        });

        catTypeIncomeBtn.addEventListener('click', () => {
            currentCatType = 'income';
            catTypeIncomeBtn.className = 'flex-1 py-2 rounded-lg text-sm font-bold bg-amber-500/20 text-amber-500 transition-all';
            catTypeExpenseBtn.className = 'flex-1 py-2 rounded-lg text-sm font-bold text-muted transition-all';
            renderAdvancedCategories();
            if(window.playUISound) window.playUISound('tap');
        });

        addCategoryBtn.addEventListener('click', () => {
            const val = newCategoryInput.value.trim();
            if(!val) return;
            
            if (currentCatType === 'expense') {
                const selCat = mainCategorySelect.value;
                if (!selCat) return;
                fullCategoryMap.expenseMap[selCat].push(val);
            } else {
                fullCategoryMap.incomeList.push(val);
            }
            
            window.saveData('fin_full_category_map', fullCategoryMap);
            newCategoryInput.value = '';
            renderAdvancedCategories();
            if(window.playUISound) window.playUISound('success');
            window.showSnackbar(`Added successfully`);
        });

        window.deleteAdvancedCategory = function(index) {
            window.showConfirmModal('Delete Category?', 'This category will be permanently removed.', 'Delete', () => {
                if (currentCatType === 'expense') {
                    const selCat = mainCategorySelect.value;
                    fullCategoryMap.expenseMap[selCat].splice(index, 1);
                } else {
                    fullCategoryMap.incomeList.splice(index, 1);
                }
                window.saveData('fin_full_category_map', fullCategoryMap);
                renderAdvancedCategories();
            });
        };

        window.editAdvancedCategory = function(index) {
            let currentStr = "";
            let targetList = [];
            
            if (currentCatType === 'expense') {
                const selCat = mainCategorySelect.value;
                targetList = fullCategoryMap.expenseMap[selCat];
                currentStr = targetList[index];
            } else {
                targetList = fullCategoryMap.incomeList;
                currentStr = targetList[index];
            }
            
            window.showPromptModal('Edit Category', currentStr, 'e.g. 🍔 Food', (newVal) => {
                if(newVal !== null && newVal.trim() !== '') {
                    targetList[index] = newVal.trim();
                    window.saveData('fin_full_category_map', fullCategoryMap);
                    renderAdvancedCategories();
                }
            });
        };

        renderAdvancedCategories();
    }

    // ----------------------------------------------------
    // DATA EXPORT / IMPORT / SIMULATION
    // ----------------------------------------------------
    window.exportDataJSON = function() {
        const payload = {
            fin_spendly: loadData('fin_spendly') || [],
            fin_pocketcal: loadData('fin_pocketcal') || [],
            fin_userName: localStorage.getItem('fin_userName') || '',
            fin_theme: localStorage.getItem('fin_theme') || 'light'
        };
        
        const str = JSON.stringify(payload, null, 2);
        const blob = new Blob([str], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `MoneyFlow_Backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showSnackbar('JSON Data Exported!');
    };

    window.exportDataCSV = function() {
        const spendlyData = loadData('fin_spendly') || [];
        if (spendlyData.length === 0) {
            showSnackbar('No Spendly data to export', 'warning');
            return;
        }

        let csvContent = "Date,Category,Type,Amount,Note\n";
        spendlyData.forEach(tx => {
            const date = new Date(tx.timestamp).toLocaleDateString();
            const note = tx.note ? tx.note.replace(/,/g, "") : "";
            csvContent += `${date},${tx.category},${tx.type},${tx.amount},${note}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const d = new Date().toISOString().split('T')[0];
        a.download = `MoneyFlow_Txns_${d}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSnackbar('CSV Data Exported!');
    };

    window.importDataJSON = function(input) {
        const file = input.files[0];
        if(!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                if(data.fin_spendly) saveData('fin_spendly', data.fin_spendly);
                if(data.fin_pocketcal) saveData('fin_pocketcal', data.fin_pocketcal);
                if(data.fin_userName) localStorage.setItem('fin_userName', data.fin_userName);
                if(data.fin_theme) localStorage.setItem('fin_theme', data.fin_theme);
                
                showSnackbar('Data Imported! Reloading...');
                setTimeout(() => location.reload(), 1500);
            } catch (err) {
                console.error(err);
                showSnackbar('Invalid JSON backup file.', 'error');
            }
        };
        reader.readAsText(file);
    };

    const lastBackupText = document.getElementById('lastBackupText');
    if (lastBackupText) {
        const last = localStorage.getItem('fin_last_backup');
        if (last) {
            lastBackupText.textContent = `Last: ${new Date(parseInt(last)).toLocaleString()}`;
        }
    }

    window.runSimulatedBackup = function() {
        const now = Date.now();
        localStorage.setItem('fin_last_backup', now);
        if (lastBackupText) {
            lastBackupText.textContent = `Last: ${new Date(now).toLocaleString()}`;
        }
        showSnackbar('Data synced to simulated cloud.');
    };

    window.wipeData = function() {
        window.showConfirmModal(
            'Wipe All Data?', 
            'Are you ABSOLUTELY sure? This deletes ALL financial history permanently.', 
            'Wipe', 
            () => {
                window.showConfirmModal(
                    'Final Warning', 
                    'There is no going back. Delete everything?', 
                    'Yes, Delete', 
                    () => {
                        localStorage.removeItem('fin_spendly');
                        localStorage.removeItem('fin_pocketcal');
                        window.showSnackbar('Data wiped. Fresh start.', 'warning');
                    }
                );
            }
        );
    };

})();
