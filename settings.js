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
        let displayVoices = voices;
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
                if(window.MoneyFlowVoiceEngine) window.MoneyFlowVoiceEngine.speak(true);
                showSnackbar('Assistant Voice Updated!');
            });
        }
    }

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect) {
        languageSelect.value = localStorage.getItem('fin_language') || 'en';
        languageSelect.addEventListener('change', (e) => {
            const langCode = e.target.value;
            localStorage.setItem('fin_language', langCode);
            
            // Auto-select a voice for the new language if possible
            if (window.speechSynthesis && window.MoneyFlowVoiceEngine) {
                const preferred = window.MoneyFlowVoiceEngine.getVoiceForLang(langCode);
                if (preferred) {
                    localStorage.setItem('fin_voiceURI', preferred.voiceURI);
                    const vSelect = document.getElementById('voiceSelect');
                    if (vSelect) vSelect.value = preferred.voiceURI;
                }
            }
            if(window.MoneyFlowVoiceEngine) window.MoneyFlowVoiceEngine.speak(true);
            if (window.showSnackbar) window.showSnackbar('Greeting Language Updated!');
        });
    }

    const toggleVoiceBtn = document.getElementById('toggleVoiceBtn');
    if (toggleVoiceBtn) {
        const voiceState = localStorage.getItem('voiceGreeting') || 'on';
        toggleVoiceBtn.textContent = voiceState === 'on' ? 'On' : 'Off';
        toggleVoiceBtn.className = voiceState === 'on' ? 
            'px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white transition shadow-md' :
            'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
            
        toggleVoiceBtn.addEventListener('click', () => {
            const current = localStorage.getItem('voiceGreeting') || 'on';
            const next = current === 'on' ? 'off' : 'on';
            localStorage.setItem('voiceGreeting', next);
            toggleVoiceBtn.textContent = next === 'on' ? 'On' : 'Off';
            toggleVoiceBtn.className = next === 'on' ? 
                'px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white transition shadow-md' :
                'px-4 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border transition';
        });
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
    
    // New identity UI elements
    const avatarInput = document.getElementById('avatarFileInput');
    const avatarImg = document.getElementById('avatarImage');
    const avatarTrigger = document.getElementById('avatarUploadTrigger');
    const useNameToggleBtn = document.getElementById('toggleUseNameBtn');
    const nameLangInput = document.getElementById('nameLanguageInput');
    
    if(nameInput) {
        const savedName = localStorage.getItem('fin_userName') || '';
        nameInput.value = savedName;
        if (savedName) initialsDisplay.textContent = savedName.charAt(0).toUpperCase();
        
        // Load image
        const savedImg = localStorage.getItem('fin_profileImg');
        if (savedImg && avatarImg) {
            avatarImg.src = savedImg;
            avatarImg.classList.remove('hidden');
            initialsDisplay.classList.add('hidden');
        }
        
        // Avatar upload trigger
        if (avatarTrigger && avatarInput) {
            avatarTrigger.addEventListener('click', () => avatarInput.click());
            avatarInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if(file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = new Image();
                        img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 200;
                            const MAX_HEIGHT = 200;
                            let width = img.width;
                            let height = img.height;
                            
                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0, width, height);
                            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                            
                            if (avatarImg) {
                                avatarImg.src = dataUrl;
                                avatarImg.classList.remove('hidden');
                                initialsDisplay.classList.add('hidden');
                            }
                            localStorage.setItem('fin_profileImg', dataUrl);
                        };
                        img.src = e.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
        
        if(useNameToggleBtn) {
            const useNameState = localStorage.getItem('fin_useName') !== 'false';
            useNameToggleBtn.textContent = useNameState ? 'On' : 'Off';
            useNameToggleBtn.className = useNameState ? 
                'px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white transition shadow' :
                'px-4 py-1.5 rounded-xl text-xs font-bold bg-glass-bg border border-glass-border transition shadow-inner';
                
            useNameToggleBtn.addEventListener('click', () => {
                const current = localStorage.getItem('fin_useName') !== 'false';
                const next = !current;
                localStorage.setItem('fin_useName', next ? 'true' : 'false');
                useNameToggleBtn.textContent = next ? 'On' : 'Off';
                useNameToggleBtn.className = next ? 
                    'px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 text-white transition shadow' :
                    'px-4 py-1.5 rounded-xl text-xs font-bold bg-glass-bg border border-glass-border transition shadow-inner';
            });
        }
        
        if (nameLangInput) {
            nameLangInput.value = localStorage.getItem('fin_nameLanguage') || '';
        }
        
        if(dobInput) dobInput.value = localStorage.getItem('userDOB') || '';
        if(genderInput) genderInput.value = localStorage.getItem('userGender') || '';
        if(bloodInput) bloodInput.value = localStorage.getItem('userBlood') || '';
        if(bioInput) bioInput.value = localStorage.getItem('userBio') || '';
        if(locationInput) locationInput.value = localStorage.getItem('userLocation') || '';

        window.saveIdentity = function() {
            const newName = nameInput.value.trim() || 'User';
            localStorage.setItem('fin_userName', newName);
            initialsDisplay.textContent = newName.charAt(0).toUpperCase();
            
            if (nameLangInput) {
                if (nameLangInput.value) {
                    localStorage.setItem('fin_nameLanguage', nameLangInput.value);
                } else {
                    localStorage.removeItem('fin_nameLanguage');
                }
            }
            
            if(dobInput) localStorage.setItem('userDOB', dobInput.value);
            if(genderInput) localStorage.setItem('userGender', genderInput.value);
            if(bloodInput) localStorage.setItem('userBlood', bloodInput.value);
            if(bioInput) localStorage.setItem('userBio', bioInput.value.trim());
            if(locationInput) localStorage.setItem('userLocation', locationInput.value.trim());
            
            window.showSnackbar('Profile saved successfully! ✨');
            if(window.MoneyFlowVoiceEngine) window.MoneyFlowVoiceEngine.speak(true);
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
                    opt.className = 'custom-option';
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

        const catSwitcherPill = document.getElementById('catTypeSwitcherPill');
        const catSwitcherNeon = document.getElementById('catTypeSwitcherNeon');

        catTypeExpenseBtn.addEventListener('click', () => {
            currentCatType = 'expense';
            if (catSwitcherPill) {
                catSwitcherPill.style.transform = 'translateX(0%)';
                catSwitcherPill.style.boxShadow = '0 0 15px rgba(239, 68, 68, 0.3)';
            }
            if (catSwitcherNeon) {
                catSwitcherNeon.className = 'absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[3px] rounded-t-full bg-gradient-to-r from-rose-400 to-red-500 shadow-[0_0_12px_rgba(239,68,68,1)] transition-colors duration-500';
            }
            catTypeExpenseBtn.className = 'relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-white transition-colors duration-300 z-10 active:scale-95';
            catTypeIncomeBtn.className = 'relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-muted hover:text-white transition-colors duration-300 z-10 active:scale-95';
            
            renderAdvancedCategories();
            if(window.playUISound) window.playUISound('tap');
        });

        catTypeIncomeBtn.addEventListener('click', () => {
            currentCatType = 'income';
            if (catSwitcherPill) {
                catSwitcherPill.style.transform = 'translateX(100%)';
                catSwitcherPill.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.3)';
            }
            if (catSwitcherNeon) {
                catSwitcherNeon.className = 'absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[3px] rounded-t-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,1)] transition-colors duration-500';
            }
            catTypeIncomeBtn.className = 'relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-white transition-colors duration-300 z-10 active:scale-95';
            catTypeExpenseBtn.className = 'relative flex-1 py-3 text-xs sm:text-sm font-black tracking-widest uppercase rounded-[1.75rem] text-muted hover:text-white transition-colors duration-300 z-10 active:scale-95';
            
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
