/* ========================================================================
   MONEYFLOW - INDEX.JS (The Hub Logic)
   Calculate Stats, Speak Greetings, Handle PWA Install
======================================================================== */

(function () {
    'use strict';

    // State
    const state = {
        spendlyData: [],
        pocketData: [],
        username: localStorage.getItem('fin_userName') || 'User'
    };

    // ----------------------------------------------------
    // LOAD DATA & COMPUTE STATS
    // ----------------------------------------------------
    function updateDashboard() {
        state.spendlyData = loadData('fin_spendly') || [];
        state.pocketData = loadData('fin_pocketcal') || [];

        const today = new Date().toISOString().split('T')[0];
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Compute
        const todayExpense = state.spendlyData
            .filter(t => t.date === today && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const monthlyExpense = state.spendlyData
            .filter(t => t.date && t.date.startsWith(currentMonth) && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const monthlyIncome = state.spendlyData
            .filter(t => t.date && t.date.startsWith(currentMonth) && t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalIncome = state.spendlyData
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalExpense = state.spendlyData
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalBalance = totalIncome - totalExpense;

        const monthPocket = state.pocketData
            .filter(p => p.date && p.date.startsWith(currentMonth))
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        // Smart Insight calculation
        let historicalIncome = monthlyIncome;
        if (monthlyIncome <= 0) {
            // Calculate 3-month average income as fallback
            const pastInc = state.spendlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const monthsSet = new Set(state.spendlyData.map(t => t.date.slice(0, 7)));
            const numMonths = Math.max(monthsSet.size, 1);
            historicalIncome = pastInc / numMonths;
        }

        let percent = 0;
        let budget = monthPocket > 0 ? monthPocket : (historicalIncome > 0 ? historicalIncome : 0);

        // Calculate category with highest spend this month
        const categorySpends = {};
        state.spendlyData.filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonth)).forEach(t => {
            const cat = t.category || 'General';
            categorySpends[cat] = (categorySpends[cat] || 0) + Number(t.amount || 0);
        });
        const topCategory = Object.keys(categorySpends).length > 0 
            ? Object.entries(categorySpends).sort((a, b) => b[1] - a[1])[0] 
            : null;

        // Apply to DOM
        animateValueUpdate('todayExpense', todayExpense);
        animateValueUpdate('monthExpense', monthlyExpense);
        animateValueUpdate('monthPocket', monthPocket);
        animateValueUpdate('totalBalance', totalBalance);

        // Advanced AI Spend Predictor Logic
        const currentMonthTotalDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
        const currentDay = new Date().getDate();
        
        let runRate = 0;
        let predictedSpend = 0;
        let daysLeft = currentMonthTotalDays - currentDay + 1;

        if (currentDay > 0) {
            runRate = monthlyExpense / currentDay;
            
            // AI Weighted Prediction based on recency (last 7 days have higher weight)
            const last7Days = new Date();
            last7Days.setDate(currentDay - 7);
            const recentExpense = state.spendlyData
                .filter(t => t.type === 'expense' && new Date(t.date) >= last7Days && t.date.startsWith(currentMonth))
                .reduce((sum, t) => sum + Number(t.amount || 0), 0);
            
            const recentDays = Math.min(currentDay, 7);
            const recentRunRate = recentDays > 0 ? recentExpense / recentDays : runRate;
            
            // Blended Prediction: 70% recent trend + 30% overall month trend
            const smartRunRate = (recentRunRate * 0.7) + (runRate * 0.3);
            
            // Projected spend = what we've already spent + (smart run rate * remaining days)
            predictedSpend = monthlyExpense + (smartRunRate * Math.max(daysLeft, 0));
        }

        if (budget > 0) {
            percent = Math.round((monthlyExpense / budget) * 100);
        }

        const aiPredictedSpendEl = document.getElementById('aiPredictedSpend');
        const aiRunRateEl = document.getElementById('aiRunRate');
        const aiPredictorBarEl = document.getElementById('aiPredictorBar');

        if(aiPredictedSpendEl) aiPredictedSpendEl.textContent = `₹${predictedSpend.toFixed(0)}`;
        if(aiRunRateEl) aiRunRateEl.textContent = `₹${runRate.toFixed(0)} / day`;
        
        if(aiPredictorBarEl) {
            let barBudget = budget > 0 ? budget : (predictedSpend > 0 ? predictedSpend * 1.2 : 100); 
            let barWidth = Math.min((predictedSpend / barBudget) * 100, 100);
            aiPredictorBarEl.style.width = `${barWidth}%`;
            
            if(barWidth > 90) aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-rose-500";
            else if(barWidth > 70) aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-amber-500";
            else aiPredictorBarEl.className = "h-full transition-all duration-1000 ease-out bg-emerald-500";
        }

        // Recent Transactions UI Logic
        const recentListEl = document.getElementById('recentTransactionsList');
        if (recentListEl) {
            const sortedData = [...state.spendlyData].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);
            const latest = sortedData.slice(0, 4);
            
            if (latest.length > 0) {
                recentListEl.innerHTML = latest.map((t, idx) => `
                    <div class="flex items-center justify-between p-4 ${idx !== latest.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/5 transition-colors rounded-2xl group cursor-pointer" onclick="window.location.href='spendly.html'">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center ${t.type === 'expense' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'} group-hover:scale-110 transition-transform">
                                <i data-lucide="${t.type === 'expense' ? 'arrow-down-right' : 'arrow-up-right'}" class="w-6 h-6"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-white/90 capitalize">${t.category || t.type}</h4>
                                <p class="text-xs text-muted">${new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                            </div>
                        </div>
                        <span class="font-extrabold text-lg ${t.type === 'expense' ? 'text-white' : 'text-emerald-400'}">
                            ${t.type === 'expense' ? '-' : '+'}₹${Number(t.amount || 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                `).join('');
                if (window.lucide) window.lucide.createIcons();
            } else {
                recentListEl.innerHTML = '<div class="p-8 text-center text-muted text-sm font-medium">No recent transactions. Log some in Spendly!</div>';
            }
        }

        generateInsight(percent, predictedSpend, budget, monthlyIncome, topCategory, daysLeft);
    }

    function animateValueUpdate(elementId, value) {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = fmt(value);

        // Trigger reflow for animation restart
        el.classList.remove('flash-update');
        void el.offsetWidth;
        el.classList.add('flash-update');
    }

    function generateInsight(percent, predictedSpend, budget, actualIncome, topCategory, daysLeft) {
        const insightEl = document.getElementById('financeInsightMsg');
        if (!insightEl) return;

        let message = '';
        const topCatStr = topCategory ? `<br><span class="text-sm text-emerald-400 mt-2 block"><i data-lucide="alert-circle" class="w-4 h-4 inline mb-1"></i> Highest spend on <b class="capitalize">${topCategory[0]}</b> (₹${topCategory[1].toLocaleString('en-IN')})</span>` : '';

        if (budget <= 0) {
            message = `🧠 AI requires budget data. Log income or set a PocketCal budget!`;
        } else if (predictedSpend > budget) {
            const excess = predictedSpend - budget;
            message = `<span class="text-rose-400 font-bold">🚨 Overspend Risk</span><br>AI predicts you'll exceed budget by ₹${excess.toLocaleString('en-IN')}. Slow down with ${daysLeft} days left!${topCatStr}`;
        } else if (percent >= 90) {
            message = `<span class="text-amber-400 font-bold">⚠️ Warning</span><br>You've used ${percent}% of budget. Very tight margin ahead!${topCatStr}`;
        } else if (percent >= 70) {
            message = `<span class="text-yellow-400 font-bold">💡 Steady</span><br>You've used ${percent}% of budget. Consider limiting non-essential expenses.${topCatStr}`;
        } else if (percent >= 50) {
            const saving = budget - predictedSpend;
            message = `<span class="text-emerald-400 font-bold">👍 Balanced</span><br>Flow is steady. AI projects you'll save ₹${saving.toLocaleString('en-IN')} this month.${topCatStr}`;
        } else {
            const saving = budget - predictedSpend;
            message = `<span class="text-blue-400 font-bold">💎 Optimal</span><br>Excellent discipline! Projected monthly savings: ₹${saving.toLocaleString('en-IN')}.${topCatStr}`;
        }

        insightEl.innerHTML = message;
        if (window.lucide) window.lucide.createIcons();
    }

    // ----------------------------------------------------
    // WEATHER & GREETINGS
    // ----------------------------------------------------
    async function initWeather() {
        const weatherBadge = document.getElementById('weatherBadge');
        if (!weatherBadge) return;

        const setWeatherUI = (temp, code) => {
            let icon = 'cloud';
            let color = 'text-gray-400';
            let condition = 'Cloudy';
            let animation = 'animate-pulse';

            if (code === 0) { icon = 'sun'; color = 'text-amber-400'; condition = 'Clear Sky'; animation = 'animate-[spin_10s_linear_infinite]'; }
            else if (code >= 1 && code <= 3) { icon = 'cloud-sun'; color = 'text-blue-300'; condition = 'Partly Cloudy'; animation = 'animate-pulse'; }
            else if (code >= 45 && code <= 48) { icon = 'wind'; color = 'text-gray-400'; condition = 'Foggy'; animation = 'animate-pulse'; }
            else if (code >= 51 && code <= 67) { icon = 'cloud-rain'; color = 'text-blue-400'; condition = 'Rainy'; animation = 'animate-bounce'; }
            else if (code >= 71 && code <= 77) { icon = 'snowflake'; color = 'text-cyan-200'; condition = 'Snowing'; animation = 'animate-[spin_3s_linear_infinite]'; }
            else if (code >= 80 && code <= 82) { icon = 'cloud-rain'; color = 'text-blue-500'; condition = 'Showers'; animation = 'animate-bounce'; }
            else if (code >= 95) { icon = 'cloud-lightning'; color = 'text-yellow-400'; condition = 'Thunderstorm'; animation = 'animate-pulse'; }

            // Custom Temperature Overrides
            if (temp >= 35) { icon = 'sun'; color = 'text-amber-500'; condition = 'Hot & Sunny'; animation = 'animate-[spin_4s_linear_infinite]'; }
            if (temp < 25 && temp > 15 && code === 0) { icon = 'sun'; color = 'text-amber-300'; condition = 'Pleasant'; }
            if (temp < 10) { icon = 'snowflake'; color = 'text-cyan-200'; condition = 'Freezing'; animation = 'animate-[spin_3s_linear_infinite]'; }

            weatherBadge.innerHTML = `<i data-lucide="${icon}" class="w-4 h-4 ${color} ${animation}"></i> <span class="text-white/80">${temp}°C • ${condition}</span>`;
            if (window.lucide) lucide.createIcons();
        };

        const fetchWeather = async (lat, lon) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`);
                const data = await res.json();
                const temp = Math.round(data.current.temperature_2m);
                const code = data.current.weather_code;
                setWeatherUI(temp, code);
            } catch (e) {
                weatherBadge.innerHTML = `<i data-lucide="cloud-off" class="w-4 h-4 text-red-400"></i> <span class="text-white/50">Weather Offline</span>`;
                if (window.lucide) lucide.createIcons();
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => setWeatherUI(28, 1) // Fallback if denied
            );
        } else {
            setWeatherUI(28, 1);
        }
    }

    function updateTextGreeting() {
        const welcomeEl = document.getElementById('welcomeText');
        if (!welcomeEl) return;

        const date = new Date();
        const hour = date.getHours();

        const emojiArray = [
            '🌌', '🌃', '🦉', '🦇', '🐺', '🌅', '🌄', '☕', '🍳', '🌞', '😎', '🏖️',
            '🏜️', '🏙️', '🚶', '🏃', '🌇', '🌆', '🌙', '🌟', '🌠', '🛌', '😴', '💤'
        ];
        const currentEmoji = emojiArray[hour];
        let randEmoji = ['✨', '💫', '🌟', '🔥', '🥂'][Math.floor(Math.random() * 5)];

        if (window.MoneyFlowVoiceEngine) {
            const langCode = localStorage.getItem('fin_language') || 'en';
            const username = localStorage.getItem('fin_userName') || state.username || 'User';
            const useNameStr = localStorage.getItem('fin_useName');
            const useName = useNameStr !== 'false';
            
            const timeKey = window.MoneyFlowVoiceEngine.getTimeKey(hour);
            const langData = window.MoneyFlowVoiceEngine.greetings['en']; // ALWAYS ENGLISH FOR VISUAL TEXT
            const timeGreeting = langData[timeKey] || langData.morning;
            
            let finalGreeting = `${timeGreeting} ${currentEmoji}<br><span class="text-gradient">${useName ? username : ''}</span> ${randEmoji}`;
            
            if (date.getDay() === 5) { // Show Jummah Mubarak for everyone on Friday visually
                finalGreeting = `Jummah Mubarak 🕌<br><span class="text-gradient">${useName ? username : ''}</span> - Good ${timeKey} ${currentEmoji}`;
            }
            welcomeEl.innerHTML = finalGreeting;
        } else {
            let greeting = "Good day";
            let finalGreeting = `${greeting} ${currentEmoji}<br><span class="text-gradient">${state.username}</span> ${randEmoji}`;
            welcomeEl.innerHTML = finalGreeting;
        }
    }

    // ----------------------------------------------------
    // PROFESSIONAL VOICE GREETING (Web Speech API)
    // ----------------------------------------------------
    function speakAssistantGreeting(forcePlay = false) {
        if (window.MoneyFlowVoiceEngine) {
            window.MoneyFlowVoiceEngine.speak(forcePlay);
        }
    }

    // ----------------------------------------------------
    // PWA INSTALL LOGIC
    // ----------------------------------------------------
    let deferredPrompt;
    function initPWA() {
        const promptEl = document.getElementById('installPrompt');
        const overlayEl = document.getElementById('pwaOverlay');
        
        // Hide by default initially
        if (promptEl) promptEl.style.display = 'none';
        if (overlayEl) overlayEl.style.display = 'none';

        if (window.matchMedia('(display-mode: standalone)').matches) {
            localStorage.setItem("appInstalled", "true");
            return; // Already installed, do not show
        }

        const isInstalled = localStorage.getItem("appInstalled") === "true";
        if (isInstalled || localStorage.getItem('installDismissed') === 'true') {
            return;
        }

        const showPrompt = () => {
            if (promptEl) {
                promptEl.style.display = 'flex';
                if (overlayEl) overlayEl.style.display = 'block';
                
                // Trigger CSS transition
                setTimeout(() => {
                    promptEl.style.transform = 'translateY(0)';
                    promptEl.style.opacity = '1';
                    if (overlayEl) {
                        overlayEl.style.opacity = '1';
                        overlayEl.style.pointerEvents = 'auto';
                    }
                }, 100);
            }
        };

        const hidePrompt = () => {
            if (promptEl) {
                promptEl.style.transform = 'translateY(100%)';
                promptEl.style.opacity = '0';
                if (overlayEl) {
                    overlayEl.style.opacity = '0';
                    overlayEl.style.pointerEvents = 'none';
                }
                setTimeout(() => {
                    promptEl.style.display = 'none';
                    if (overlayEl) overlayEl.style.display = 'none';
                }, 700);
            }
        };

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            showPrompt();
        });

        const installBtn = document.getElementById('installBtn');
        const installBtnText = document.getElementById('installBtnText');
        const dismissBtn = document.getElementById('dismissBtn');

        if (installBtn) {
            installBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!deferredPrompt) {
                    if (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) {
                        showSnackbar('Tap Share icon then "Add to Home Screen" to install.', 'info');
                    } else {
                        showSnackbar('Install prompt not available right now. You can install from browser menu.', 'warning');
                    }
                    return;
                }
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem("appInstalled", "true");
                    showSnackbar('MoneyFlow installed successfully! ✨');
                    
                    if (installBtnText) installBtnText.textContent = 'Installed ✓';
                    installBtn.className = 'bg-white/10 text-emerald-400 px-8 py-3.5 rounded-2xl text-sm font-extrabold cursor-not-allowed flex items-center justify-center gap-2';
                    installBtn.disabled = true;
                    
                    setTimeout(hidePrompt, 2000);
                }
                deferredPrompt = null;
            });
        }

        if (dismissBtn) {
            dismissBtn.addEventListener('click', (e) => {
                e.preventDefault();
                hidePrompt();
                localStorage.setItem('installDismissed', 'true');
            });
        }
        
        // Handle iOS fallback
        if (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())) {
            showPrompt();
        }
    }

    // ----------------------------------------------------
    // BOOTSTRAP
    // ----------------------------------------------------
    window.addEventListener('DOMContentLoaded', () => {
        initWeather();
        updateTextGreeting();
        updateDashboard();
        initPWA();

        // Voice greeting after a tiny timeout to ensure it feels natural
        setTimeout(speakAssistantGreeting, 1200);

        // Auto refresh
        setInterval(updateDashboard, 60000);
    });

})();
