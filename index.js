/* ========================================================================
   MONEYFLOW - INDEX.JS (The Hub Logic)
   Calculate Stats, Speak Greetings, Handle PWA Install
======================================================================== */

(function () {
    'use strict';

    // State
    const state = {
        spendlyData: [],/* ========================================================================
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
    function countDays(year, month, startDay, endDay) {
        let weekdays = 0;
        let weekends = 0;
        for (let d = startDay; d <= endDay; d++) {
            const date = new Date(year, month, d);
            const day = date.getDay();
            if (day === 0 || day === 5 || day === 6) { // Fri, Sat, Sun are weekends
                weekends++;
            } else {
                weekdays++;
            }
        }
        return { weekdays, weekends };
    }

    function detectRecurringBills(currentMonthStr) {
        const pastExpenses = state.spendlyData.filter(t => t.type === 'expense' && t.date && t.date < currentMonthStr + '-01');
        const candidates = {};
        
        pastExpenses.forEach(t => {
            const amount = Number(t.amount || 0);
            if (amount < 200) return; // Ignore small noise
            
            // Clean notes to find common patterns
            const cleanNote = (t.notes || '').toLowerCase().trim().replace(/\d+/g, '').replace(/[^a-z\s]/g, '').trim();
            const words = cleanNote.split(/\s+/).slice(0, 2).join(' '); // first 2 words
            
            // Create a key based on category, amount (within 10% bucket) and note prefix
            const roundedAmt = Math.round(amount / 50) * 50;
            const monthStr = t.date.slice(0, 7);
            
            const key = `${t.category}__${roundedAmt}__${words}`;
            if (!candidates[key]) {
                candidates[key] = {
                    category: t.category,
                    amount: amount,
                    notes: t.notes || t.category,
                    months: new Set(),
                    daysOfMonth: []
                };
            }
            candidates[key].months.add(monthStr);
            const day = new Date(t.date).getDate();
            candidates[key].daysOfMonth.push(day);
        });
        
        const aiDetected = [];
        Object.values(candidates).forEach(c => {
            if (c.months.size >= 2) {
                const avgDay = Math.round(c.daysOfMonth.reduce((a, b) => a + b, 0) / c.daysOfMonth.length);
                aiDetected.push({
                    id: 'ai_' + Math.random().toString(36).substr(2, 9),
                    name: c.notes || c.category,
                    amount: c.amount,
                    category: c.category,
                    dayOfMonth: avgDay,
                    isInferred: true
                });
            }
        });
        return aiDetected;
    }

    function updateDashboard() {
        state.spendlyData = loadData('fin_spendly') || [];
        state.pocketData = loadData('fin_pocketcal') || [];
        state.recurringBills = loadData('fin_spendly_recurring') || [];

        const todayDate = new Date();
        const todayStr = todayDate.toISOString().split('T')[0];
        const currentMonthStr = todayDate.toISOString().slice(0, 7);
        const currentYear = todayDate.getFullYear();
        const currentMonth = todayDate.getMonth();
        const currentDay = todayDate.getDate();
        const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const daysLeft = Math.max(totalDaysInMonth - currentDay + 1, 0);

        // Raw calculations
        const todayExpense = state.spendlyData
            .filter(t => t.date === todayStr && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const monthlyExpense = state.spendlyData
            .filter(t => t.date && t.date.startsWith(currentMonthStr) && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const monthlyIncome = state.spendlyData
            .filter(t => t.date && t.date.startsWith(currentMonthStr) && t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalIncome = state.spendlyData
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalExpense = state.spendlyData
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const totalBalance = totalIncome - totalExpense;

        const monthPocket = state.pocketData
            .filter(p => p.date && p.date.startsWith(currentMonthStr))
            .reduce((sum, p) => sum + Number(p.amount || 0), 0);

        let historicalIncome = monthlyIncome;
        if (monthlyIncome <= 0) {
            const pastInc = state.spendlyData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const monthsSet = new Set(state.spendlyData.map(t => t.date.slice(0, 7)));
            const numMonths = Math.max(monthsSet.size, 1);
            historicalIncome = pastInc / numMonths;
        }

        let percent = 0;
        let budget = monthPocket > 0 ? monthPocket : (historicalIncome > 0 ? historicalIncome : 0);

        // Category with highest spend this month
        const categorySpends = {};
        state.spendlyData.filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonthStr)).forEach(t => {
            const cat = t.category || 'General';
            categorySpends[cat] = (categorySpends[cat] || 0) + Number(t.amount || 0);
        });
        const topCategory = Object.keys(categorySpends).length > 0 
            ? Object.entries(categorySpends).sort((a, b) => b[1] - a[1])[0] 
            : null;

        animateValueUpdate('todayExpense', todayExpense);
        animateValueUpdate('monthExpense', monthlyExpense);
        animateValueUpdate('monthPocket', monthPocket);
        animateValueUpdate('totalBalance', totalBalance);

        // ====================================================
        // ADVANCED AI FORECAST & ANOMALY ENGINE UPGRADED
        // ====================================================

        // A. Set up recurring bills (user + inferred)
        const aiRecurring = detectRecurringBills(currentMonthStr);
        const allRecurring = [...state.recurringBills];
        aiRecurring.forEach(aiBill => {
            const duplicate = allRecurring.some(uBill => 
                uBill.category === aiBill.category && 
                Math.abs(uBill.amount - aiBill.amount) / uBill.amount < 0.15
            );
            if (!duplicate) {
                allRecurring.push(aiBill);
            }
        });
        state.allRecurring = allRecurring;

        // Helper to check if transaction is a recurring bill
        const isRecurringTransaction = (t) => {
            if (t.notes && t.notes.includes('Auto-logged Recurring')) return true;
            return allRecurring.some(bill => 
                t.category === bill.category && 
                Math.abs(Number(t.amount || 0) - bill.amount) / bill.amount < 0.15
            );
        };

        const currentMonthExpenses = state.spendlyData.filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonthStr));
        const currentMonthExpenseTotal = currentMonthExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // Separate fixed (recurring) vs variable expenses in current month
        const variableExpenses = currentMonthExpenses.filter(t => !isRecurringTransaction(t));
        const variableTotal = variableExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // B. Anomaly detection on variable expenses with Cold Start handling
        let baseRunRate = 0;
        let totalSpikes = 0;
        const variableAmounts = variableExpenses.map(t => Number(t.amount || 0));

        let normalVariableExpenses = [...variableExpenses];
        if (variableAmounts.length >= 5) {
            const avgExpense = variableTotal / variableAmounts.length;
            const variance = variableAmounts.reduce((sum, amt) => sum + Math.pow(amt - avgExpense, 2), 0) / variableAmounts.length;
            const stdDev = Math.sqrt(variance);
            const spikeThreshold = Math.max(avgExpense + 1.8 * stdDev, 1500);

            normalVariableExpenses = variableExpenses.filter(t => {
                const amt = Number(t.amount || 0);
                if (amt >= spikeThreshold) {
                    totalSpikes += amt;
                    return false;
                }
                return true;
            });
        } else {
            // Cold start: compute anomaly threshold from historical variable expenses
            const pastExpenses = state.spendlyData.filter(t => t.type === 'expense' && t.date && t.date < currentMonthStr + '-01');
            const pastVariable = pastExpenses.filter(t => !isRecurringTransaction(t));
            const pastVariableAmts = pastVariable.map(t => Number(t.amount || 0));
            if (pastVariableAmts.length >= 5) {
                const pastTotal = pastVariableAmts.reduce((s, a) => s + a, 0);
                const avgExpense = pastTotal / pastVariableAmts.length;
                const variance = pastVariableAmts.reduce((sum, amt) => sum + Math.pow(amt - avgExpense, 2), 0) / pastVariableAmts.length;
                const stdDev = Math.sqrt(variance);
                const spikeThreshold = Math.max(avgExpense + 1.8 * stdDev, 1500);

                normalVariableExpenses = variableExpenses.filter(t => {
                    const amt = Number(t.amount || 0);
                    if (amt >= spikeThreshold) {
                        totalSpikes += amt;
                        return false;
                    }
                    return true;
                });
            }
        }
        const normalVariableTotal = normalVariableExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);

        // Keep track of isolated spikes in state
        state.isolatedSpikes = variableExpenses.filter(t => !normalVariableExpenses.includes(t));

        // C. Exact passed and remaining days in month
        const passedDaysInfo = countDays(currentYear, currentMonth, 1, currentDay);
        const totalDaysInfo = countDays(currentYear, currentMonth, 1, totalDaysInMonth);
        const passedWeekdays = passedDaysInfo.weekdays;
        const passedWeekends = passedDaysInfo.weekends;
        const remainingWeekdays = totalDaysInfo.weekdays - passedWeekdays;
        const remainingWeekends = totalDaysInfo.weekends - passedWeekends;

        // Current Month variable rates
        const passedWeekdayExpenses = normalVariableExpenses.filter(t => {
            const day = new Date(t.date).getDay();
            return day !== 0 && day !== 5 && day !== 6;
        });
        const passedWeekendExpenses = normalVariableExpenses.filter(t => {
            const day = new Date(t.date).getDay();
            return day === 0 || day === 5 || day === 6;
        });

        const currentMonthWeekdayRate = passedWeekdays > 0 ? (passedWeekdayExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0) / passedWeekdays) : 0;
        const currentMonthWeekendRate = passedWeekends > 0 ? (passedWeekendExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0) / passedWeekends) : 0;

        // D. Historical Daily, Weekday & Weekend Rates
        const pastExpenses = state.spendlyData.filter(t => t.type === 'expense' && t.date && t.date < currentMonthStr + '-01');
        const pastVariable = pastExpenses.filter(t => !isRecurringTransaction(t));

        let historicalWeekdayRate = budget > 0 ? (budget / totalDaysInMonth) * 0.8125 : 400;
        let historicalWeekendRate = budget > 0 ? (budget / totalDaysInMonth) * 1.35 : 650;
        let historicalDailyAvg = budget > 0 ? (budget / totalDaysInMonth) : 500;

        if (pastVariable.length > 0) {
            const pastMonthsList = [...new Set(pastVariable.map(t => t.date.slice(0, 7)))];
            let totalPastWeekdays = 0;
            let totalPastWeekends = 0;
            let totalPastDays = 0;
            pastMonthsList.forEach(m => {
                const y = parseInt(m.slice(0, 4), 10);
                const mn = parseInt(m.slice(5, 7), 10) - 1;
                const dMax = new Date(y, mn + 1, 0).getDate();
                const dInfo = countDays(y, mn, 1, dMax);
                totalPastWeekdays += dInfo.weekdays;
                totalPastWeekends += dInfo.weekends;
                totalPastDays += dMax;
            });

            const totalPastWeekdayExpenses = pastVariable.filter(t => {
                const day = new Date(t.date).getDay();
                return day !== 0 && day !== 5 && day !== 6;
            }).reduce((sum, t) => sum + Number(t.amount || 0), 0);

            const totalPastWeekendExpenses = pastVariable.filter(t => {
                const day = new Date(t.date).getDay();
                return day === 0 || day === 5 || day === 6;
            }).reduce((sum, t) => sum + Number(t.amount || 0), 0);

            historicalWeekdayRate = totalPastWeekdays > 0 ? (totalPastWeekdayExpenses / totalPastWeekdays) : historicalWeekdayRate;
            historicalWeekendRate = totalPastWeekends > 0 ? (totalPastWeekendExpenses / totalPastWeekends) : historicalWeekendRate;
            historicalDailyAvg = totalPastDays > 0 ? (pastVariable.reduce((sum, t) => sum + Number(t.amount || 0), 0) / totalPastDays) : historicalDailyAvg;
        }

        // E. Cold-Start Blend Weight
        const currentMonthWeight = Math.min(Math.max((currentDay - 1) / 9, normalVariableExpenses.length / 8), 1.0);
        
        const blendedWeekdayRate = historicalWeekdayRate * (1 - currentMonthWeight) + currentMonthWeekdayRate * currentMonthWeight;
        const blendedWeekendRate = historicalWeekendRate * (1 - currentMonthWeight) + currentMonthWeekendRate * currentMonthWeight;
        const blendedDailyRunRate = (blendedWeekdayRate * 4 + blendedWeekendRate * 3) / 7;

        state.aiDetails = {
            currentMonthWeight,
            historicalDailyAvg,
            historicalWeekdayRate,
            historicalWeekendRate,
            currentMonthWeekdayRate,
            currentMonthWeekendRate,
            blendedWeekdayRate,
            blendedWeekendRate,
            blendedDailyRunRate,
            passedWeekdays,
            passedWeekends,
            remainingWeekdays,
            remainingWeekends
        };

        // F. Project Variable Baseline Spend
        const projectedVariableSpend = (blendedWeekdayRate * remainingWeekdays) + (blendedWeekendRate * remainingWeekends);

        // G. Evaluate Expected Remaining Recurring Bills
        let projectedRecurringSpend = 0;
        const recurringTimeline = [];

        allRecurring.forEach(bill => {
            const loggedTx = currentMonthExpenses.find(t => 
                t.category === bill.category && 
                Math.abs(Number(t.amount || 0) - bill.amount) / bill.amount < 0.15
            );

            if (loggedTx) {
                recurringTimeline.push({
                    name: bill.name,
                    amount: bill.amount,
                    day: bill.dayOfMonth,
                    status: 'paid',
                    dateLogged: loggedTx.date,
                    isInferred: bill.isInferred || false
                });
            } else {
                projectedRecurringSpend += bill.amount;
                recurringTimeline.push({
                    name: bill.name,
                    amount: bill.amount,
                    day: bill.dayOfMonth,
                    status: 'upcoming',
                    isInferred: bill.isInferred || false
                });
            }
        });
        state.recurringTimeline = recurringTimeline;

        // Predicted Month End Spend = Spent So Far + Projected Variable Baseline + Spikes Offset + Projected Unpaid Recurring
        const predictedSpend = currentMonthExpenseTotal + projectedVariableSpend + projectedRecurringSpend;
        const dailyRunRate = currentDay > 0 ? (currentMonthExpenseTotal / currentDay) : 0;
        
        state.calculatedDailyRunRate = blendedDailyRunRate; // Share with Allowance Predictor

        if (budget > 0) {
            percent = Math.round((currentMonthExpenseTotal / budget) * 100);
        }

        const aiPredictedSpendEl = document.getElementById('aiPredictedSpend');
        const aiRunRateEl = document.getElementById('aiRunRate');
        const aiPredictorBarEl = document.getElementById('aiPredictorBar');

        if(aiPredictedSpendEl) aiPredictedSpendEl.textContent = `₹${predictedSpend.toFixed(0)}`;
        
        // H. Sliding-Window Velocity Calculation (crossing month boundaries)
        const tNow = new Date();
        const t7 = new Date(tNow.getFullYear(), tNow.getMonth(), tNow.getDate() - 6);
        const t14 = new Date(tNow.getFullYear(), tNow.getMonth(), tNow.getDate() - 13);
        
        const recent7Expenses = state.spendlyData
            .filter(t => t.type === 'expense' && t.date && new Date(t.date) >= t7)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);
        const prior7Expenses = state.spendlyData
            .filter(t => t.type === 'expense' && t.date && new Date(t.date) >= t14 && new Date(t.date) < t7)
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        let velocityPercent = 0;
        if (prior7Expenses > 0) {
            velocityPercent = ((recent7Expenses - prior7Expenses) / prior7Expenses) * 100;
        }
        state.velocityPercent = velocityPercent;

        if(aiRunRateEl) {
            const velText = prior7Expenses > 0 
                ? `<br><span class="text-[10px] ${velocityPercent > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}">${velocityPercent >= 0 ? '▲' : '▼'} ${Math.abs(velocityPercent).toFixed(0)}% momentum</span>`
                : '';
            aiRunRateEl.innerHTML = `₹${dailyRunRate.toFixed(0)} / day${velText}`;
        }
        
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

        const remainingSafe = budget - currentMonthExpenseTotal;
        const remainingSafeDaily = daysLeft > 0 ? (remainingSafe / daysLeft) : 0;

        generateInsight(percent, predictedSpend, budget, monthlyIncome, topCategory, daysLeft, remainingSafeDaily, velocityPercent);
        updateHomeForecastAndRequests();

        // Store execution results for modal renderer
        state.predictionResults = {
            spentSoFar: currentMonthExpenseTotal,
            projectedVariableSpend,
            projectedRecurringSpend,
            totalSpikes,
            predictedSpend,
            daysLeft,
            budget,
            remainingSafeDaily
        };
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

    function generateInsight(percent, predictedSpend, budget, actualIncome, topCategory, daysLeft, remainingSafeDaily, velocityPercent) {
        const insightEl = document.getElementById('financeInsightMsg');
        if (!insightEl) return;

        let message = '';
        const topCatStr = topCategory ? `<br><span class="text-sm text-emerald-400 mt-2 block"><i data-lucide="alert-circle" class="w-4 h-4 inline mb-1"></i> Highest spend on <b class="capitalize">${topCategory[0]}</b> (₹${topCategory[1].toLocaleString('en-IN')})</span>` : '';
        const velocityStr = velocityPercent > 5 
            ? `<span class="text-xs text-rose-400 block mt-1"><i data-lucide="trending-up" class="w-3.5 h-3.5 inline mr-1"></i> Spending momentum is accelerating (+${velocityPercent.toFixed(0)}% over last week).</span>`
            : (velocityPercent < -5 ? `<span class="text-xs text-emerald-400 block mt-1"><i data-lucide="trending-down" class="w-3.5 h-3.5 inline mr-1"></i> Spending momentum is decelerating (${velocityPercent.toFixed(0)}% over last week).</span>` : '');

        if (budget <= 0) {
            message = `🧠 AI requires budget data. Log income or set a PocketCal budget!`;
        } else if (predictedSpend > budget) {
            const excess = predictedSpend - budget;
            const suggestStr = remainingSafeDaily > 0 
                ? `<br><span class="text-xs text-amber-300 font-bold block mt-2">💡 Target Allowance: Spend max ₹${remainingSafeDaily.toFixed(0)}/day for the next ${daysLeft} days to recover.</span>`
                : `<br><span class="text-xs text-rose-300 font-bold block mt-2">🚨 Halt Spending: Safe allowance is exhausted. Avoid non-essential transactions.</span>`;
            
            message = `<span class="text-rose-400 font-bold">🚨 Overspend Risk</span><br>AI predicts you'll exceed budget by ₹${excess.toLocaleString('en-IN')}. ${velocityStr}${suggestStr}${topCatStr}`;
        } else if (percent >= 90) {
            const suggestStr = remainingSafeDaily > 0 
                ? `<br><span class="text-xs text-amber-300 font-bold block mt-2">💡 Target Allowance: Limit to ₹${remainingSafeDaily.toFixed(0)}/day to secure your safety margin.</span>`
                : '';
            message = `<span class="text-amber-400 font-bold">⚠️ Warning</span><br>You've used ${percent}% of budget. Very tight margin ahead! ${velocityStr}${suggestStr}${topCatStr}`;
        } else {
            const saving = budget - predictedSpend;
            const suggestStr = remainingSafeDaily > 0 
                ? `<br><span class="text-xs text-emerald-300 font-bold block mt-2">💡 Daily Allowance: You can spend up to ₹${remainingSafeDaily.toFixed(0)}/day and remain safe.</span>`
                : '';
            message = `<span class="text-emerald-400 font-bold">👍 Healthy Balance</span><br>Flow is steady. AI projects you'll save ₹${saving.toLocaleString('en-IN')} this month. ${velocityStr}${suggestStr}${topCatStr}`;
        }

        insightEl.innerHTML = message;
        if (window.lucide) window.lucide.createIcons();
    }

    function updateHomeForecastAndRequests() {
        const pocketData = state.pocketData || [];
        const spendlyData = state.spendlyData || [];
        const requestsData = loadData('fin_pocketcal_requests') || [];
        
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        const curMonthAllowance = pocketData.filter(d => d.date && d.date.startsWith(currentMonthStr))
                                            .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        
        const curMonthExpenses = spendlyData.filter(d => d.type === 'expense' && d.date && d.date.startsWith(currentMonthStr))
                                           .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        
        const today = new Date();
        const daysPassed = today.getDate();
        
        // Use AI blended daily run-rate for allowance forecast if available
        const aiBurnRate = state.calculatedDailyRunRate || 0;
        const burnRate = aiBurnRate > 0 ? aiBurnRate : (curMonthExpenses / (daysPassed || 1));
        const remaining = curMonthAllowance - curMonthExpenses;
        
        const daysEl = document.getElementById('homeForecastDays');
        const badgeEl = document.getElementById('homeForecastBadge');
        const dateEl = document.getElementById('homeForecastDate');
        
        let daysRemaining = Infinity;
        if (burnRate > 0) {
            daysRemaining = remaining / burnRate;
        }
        
        if (daysEl) {
            if (remaining <= 0) {
                daysEl.textContent = '0';
                daysEl.className = 'text-4xl font-extrabold text-red-500';
            } else if (daysRemaining === Infinity) {
                daysEl.textContent = '∞';
                daysEl.className = 'text-4xl font-extrabold text-emerald-400';
            } else {
                daysEl.textContent = Math.max(0, Math.floor(daysRemaining));
                daysEl.className = daysRemaining < 5 ? 'text-4xl font-extrabold text-amber-500' : 'text-4xl font-extrabold text-blue-400';
            }
        }
        
        if (badgeEl && dateEl) {
            if (remaining <= 0) {
                badgeEl.textContent = 'RUN OUT 🚨';
                badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30';
                dateEl.textContent = 'Ask Dad Today!';
            } else if (burnRate === 0) {
                badgeEl.textContent = 'STABLE 🛡️';
                badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                dateEl.textContent = 'No expenses logged';
            } else {
                const predictAsk = new Date();
                predictAsk.setDate(today.getDate() + Math.max(0, Math.floor(daysRemaining)));
                const opt = { day: '2-digit', month: 'short', year: 'numeric' };
                dateEl.textContent = `Next request needed: ${predictAsk.toLocaleDateString('en-IN', opt)}`;
                
                if (daysRemaining < 5) {
                    badgeEl.textContent = 'WARN ⚠️';
                    badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30';
                } else {
                    badgeEl.textContent = 'GOOD ✅';
                    badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                }
            }
        }
        
        // Update requests widget
        const pendingRequests = requestsData.filter(r => r.status === 'Pending');
        const countEl = document.getElementById('homePendingReqCount');
        const previewEl = document.getElementById('homePendingReqPreview');
        
        if (countEl) countEl.textContent = pendingRequests.length;
        if (previewEl) {
            if (pendingRequests.length > 0) {
                const latest = pendingRequests.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                previewEl.innerHTML = `<span class="text-white font-bold">Latest:</span> ₹${latest.amount.toLocaleString('en-IN')} for ${latest.notes} (Ask ${latest.source})`;
                previewEl.className = 'text-xs text-slate-300';
            } else {
                previewEl.textContent = 'No active requests. Tap to open tracker.';
                previewEl.className = 'text-xs text-muted italic';
            }
        }
    }

    function openAiDetailsModal() {
        const overlay = document.getElementById('aiDetailsOverlay');
        if (!overlay) return;

        // Populate values dynamically
        const results = state.predictionResults;
        const diag = state.aiDetails;
        
        document.getElementById('modalSpentSoFar').textContent = `₹${results.spentSoFar.toLocaleString('en-IN')}`;
        document.getElementById('modalProjectedVar').textContent = `₹${results.projectedVariableSpend.toLocaleString('en-IN')}`;
        document.getElementById('modalProjectedVarSub').textContent = `For remaining ${results.daysLeft} days`;
        document.getElementById('modalUpcomingBills').textContent = `₹${results.projectedRecurringSpend.toLocaleString('en-IN')}`;
        document.getElementById('modalIsolatedSpikes').textContent = `₹${results.totalSpikes.toLocaleString('en-IN')}`;
        document.getElementById('modalPredictedTotal').textContent = `₹${results.predictedSpend.toLocaleString('en-IN')}`;
        
        // Calibration Diagnostics
        document.getElementById('diagBlendWeight').textContent = `${(diag.currentMonthWeight * 100).toFixed(0)}%`;
        document.getElementById('diagHistDaily').textContent = `₹${diag.historicalDailyAvg.toFixed(0)} / day`;
        document.getElementById('diagHistWdWe').textContent = `₹${diag.historicalWeekdayRate.toFixed(0)} / ₹${diag.historicalWeekendRate.toFixed(0)}`;
        document.getElementById('diagActiveWdWe').textContent = `₹${diag.currentMonthWeekdayRate.toFixed(0)} / ₹${diag.currentMonthWeekendRate.toFixed(0)}`;
        document.getElementById('diagBlendedDaily').textContent = `₹${diag.blendedDailyRunRate.toFixed(0)} / day`;

        // Allowance box
        const allowanceAmtEl = document.getElementById('modalAllowanceAmount');
        const allowanceBoxEl = document.getElementById('modalAllowanceBox');
        if (results.remainingSafeDaily > 0) {
            allowanceAmtEl.textContent = `₹${results.remainingSafeDaily.toFixed(0)} / day`;
            allowanceBoxEl.className = "mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between";
        } else {
            allowanceAmtEl.textContent = `₹0 / day`;
            allowanceBoxEl.className = "mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-between";
        }

        // Speedometer Gauge rotation
        const needle = document.getElementById('speedometerNeedle');
        const velocityText = document.getElementById('velocityText');
        const velocitySubtext = document.getElementById('velocitySubtext');
        
        const velocity = state.velocityPercent || 0;
        let angle = Math.max(-90, Math.min(90, velocity * 1.2)); // map 1% to 1.2deg rotation
        if (needle) {
            needle.style.transform = `rotate(${angle}deg)`;
        }

        if (velocityText) {
            if (velocity > 15) {
                velocityText.innerHTML = `<span class="text-rose-400">Accelerating 🚀</span>`;
            } else if (velocity < -15) {
                velocityText.innerHTML = `<span class="text-emerald-400">Cooling Down ❄️</span>`;
            } else {
                velocityText.innerHTML = `<span class="text-slate-300">Steady 🛡️</span>`;
            }
        }
        
        if (velocitySubtext) {
            velocitySubtext.textContent = `Spend is ${velocity >= 0 ? 'up' : 'down'} by ${Math.abs(velocity).toFixed(0)}% vs last week`;
        }

        // Render recurring bills timeline
        const listEl = document.getElementById('modalRecurringList');
        if (listEl) {
            const sortedTimeline = [...state.recurringTimeline].sort((a, b) => a.day - b.day);
            if (sortedTimeline.length > 0) {
                listEl.innerHTML = sortedTimeline.map(item => `
                    <div class="recurring-timeline-item ${item.status} glass-panel p-3.5 flex justify-between items-center rounded-2xl bg-white/5 border border-white/5">
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center ${item.status === 'paid' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-500 text-slate-500'}">
                                <i data-lucide="${item.status === 'paid' ? 'check' : 'minus'}" class="w-3.5 h-3.5"></i>
                            </div>
                            <div class="text-left">
                                <span class="font-extrabold text-sm text-slate-200 capitalize">${item.name}</span>
                                <span class="text-[9px] text-muted block">Expected: Day ${item.day} ${item.isInferred ? '• Inferred by AI 🧠' : '• Subscription 📅'}</span>
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="font-bold text-sm text-white">₹${item.amount.toLocaleString('en-IN')}</span>
                            <span class="text-[9px] ${item.status === 'paid' ? 'text-emerald-400 font-extrabold' : 'text-amber-400 font-extrabold'} block uppercase tracking-wider">${item.status === 'paid' ? 'Paid & Logged' : 'Upcoming'}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                listEl.innerHTML = '<div class="text-center text-xs text-muted p-4">No active subscription logs or recurring trends.</div>';
            }
        }

        // Recommendations
        const recListEl = document.getElementById('modalRecommendations');
        if (recListEl) {
            const recs = [];
            if (results.predictedSpend > results.budget && results.budget > 0) {
                const excess = results.predictedSpend - results.budget;
                recs.push(`<li>🚨 <b>Overspend Risk:</b> You are projected to exceed your budget by <b>₹${excess.toLocaleString('en-IN')}</b>. Limit variable spending to <b>₹${results.remainingSafeDaily.toFixed(0)}/day</b> for the next ${results.daysLeft} days to recover.</li>`);
            } else if (results.budget > 0) {
                const saving = results.budget - results.predictedSpend;
                recs.push(`<li>✨ <b>Healthy Budget:</b> You are on track to save <b>₹${saving.toLocaleString('en-IN')}</b> this month! Keep up the good work.</li>`);
            }

            if (velocity > 15) {
                recs.push(`<li>📈 <b>Spending Acceleration:</b> Discretionary spend velocity has increased by <b>${velocity.toFixed(0)}%</b> compared to last week. Consider pausing non-essential checkout carts.</li>`);
            } else if (velocity < -15) {
                recs.push(`<li>📉 <b>Spending Deceleration:</b> Excellent! Your spend velocity has decreased by <b>${Math.abs(velocity).toFixed(0)}%</b> vs last week. You are in the green zone.</li>`);
            }

            if (state.isolatedSpikes && state.isolatedSpikes.length > 0) {
                state.isolatedSpikes.forEach(spike => {
                    recs.push(`<li>💡 <b>Anomaly Isolated:</b> A one-off transaction of <b>₹${Number(spike.amount).toLocaleString('en-IN')}</b> for <b>${spike.category || 'General'}</b> was excluded from daily projections to keep variable run-rate accurate.</li>`);
                });
            }

            // Calculate category with highest spend this month for recommendation
            const categorySpends = {};
            state.spendlyData.filter(t => t.type === 'expense' && t.date && t.date.startsWith(currentMonthStr)).forEach(t => {
                const cat = t.category || 'General';
                categorySpends[cat] = (categorySpends[cat] || 0) + Number(t.amount || 0);
            });
            const topCategory = Object.keys(categorySpends).length > 0 
                ? Object.entries(categorySpends).sort((a, b) => b[1] - a[1])[0] 
                : null;

            if (topCategory && topCategory[1] > 1000) {
                recs.push(`<li>🔍 <b>Category Alert:</b> You've spent <b>₹${topCategory[1].toLocaleString('en-IN')}</b> on <b>${topCategory[0]}</b>. This is your highest variable category.</li>`);
            }

            if (recs.length === 0) {
                recs.push(`<li>✨ <b>Steady State:</b> Spends are healthy and within standard limits. Log more expenses to calibrate AI.</li>`);
            }

            recListEl.innerHTML = recs.join('');
        }

        if (window.lucide) window.lucide.createIcons();

        overlay.classList.add('active');
        window.history.pushState({ overlay: 'ai-details' }, '');
    }

    function closeAiDetailsModal() {
        const overlay = document.getElementById('aiDetailsOverlay');
        if (overlay && overlay.classList.contains('active')) {
            overlay.classList.remove('active');
            if (window.history.state && window.history.state.overlay === 'ai-details') {
                window.history.back();
            }
        }
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

        // Wire up AI Details interactive overlay event listeners
        const aiInsightCard = document.getElementById('aiInsightCard');
        const aiPredictorCard = document.getElementById('aiPredictorCard');
        const closeAiDetailsBtn = document.getElementById('closeAiDetailsBtn');

        if (aiInsightCard) aiInsightCard.addEventListener('click', openAiDetailsModal);
        if (aiPredictorCard) aiPredictorCard.addEventListener('click', openAiDetailsModal);
        if (closeAiDetailsBtn) closeAiDetailsBtn.addEventListener('click', closeAiDetailsModal);

        window.addEventListener('popstate', (e) => {
            const overlay = document.getElementById('aiDetailsOverlay');
            if (overlay) {
                if (e.state && e.state.overlay === 'ai-details') {
                    overlay.classList.add('active');
                } else {
                    overlay.classList.remove('active');
                }
            }
        });

        // Voice greeting after a tiny timeout to ensure it feels natural
        setTimeout(speakAssistantGreeting, 1200);

        // Auto refresh
        setInterval(updateDashboard, 60000);
    });

})();
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
        updateHomeForecastAndRequests();
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

    function updateHomeForecastAndRequests() {
        const pocketData = state.pocketData || [];
        const spendlyData = state.spendlyData || [];
        const requestsData = loadData('fin_pocketcal_requests') || [];
        
        const currentMonthStr = new Date().toISOString().slice(0, 7);
        const curMonthAllowance = pocketData.filter(d => d.date && d.date.startsWith(currentMonthStr))
                                            .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        
        const curMonthExpenses = spendlyData.filter(d => d.type === 'expense' && d.date && d.date.startsWith(currentMonthStr))
                                           .reduce((sum, d) => sum + Number(d.amount || 0), 0);
        
        const today = new Date();
        const daysPassed = today.getDate();
        
        const burnRate = curMonthExpenses / (daysPassed || 1);
        const remaining = curMonthAllowance - curMonthExpenses;
        
        const daysEl = document.getElementById('homeForecastDays');
        const badgeEl = document.getElementById('homeForecastBadge');
        const dateEl = document.getElementById('homeForecastDate');
        
        let daysRemaining = Infinity;
        if (burnRate > 0) {
            daysRemaining = remaining / burnRate;
        }
        
        if (daysEl) {
            if (remaining <= 0) {
                daysEl.textContent = '0';
                daysEl.className = 'text-4xl font-extrabold text-red-500';
            } else if (daysRemaining === Infinity) {
                daysEl.textContent = '∞';
                daysEl.className = 'text-4xl font-extrabold text-emerald-400';
            } else {
                daysEl.textContent = Math.max(0, Math.floor(daysRemaining));
                daysEl.className = daysRemaining < 5 ? 'text-4xl font-extrabold text-amber-500' : 'text-4xl font-extrabold text-blue-400';
            }
        }
        
        if (badgeEl && dateEl) {
            if (remaining <= 0) {
                badgeEl.textContent = 'RUN OUT 🚨';
                badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30';
                dateEl.textContent = 'Ask Dad Today!';
            } else if (burnRate === 0) {
                badgeEl.textContent = 'STABLE 🛡️';
                badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                dateEl.textContent = 'No expenses logged';
            } else {
                const predictAsk = new Date();
                predictAsk.setDate(today.getDate() + Math.max(0, Math.floor(daysRemaining)));
                const opt = { day: '2-digit', month: 'short', year: 'numeric' };
                dateEl.textContent = `Next request needed: ${predictAsk.toLocaleDateString('en-IN', opt)}`;
                
                if (daysRemaining < 5) {
                    badgeEl.textContent = 'WARN ⚠️';
                    badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30';
                } else {
                    badgeEl.textContent = 'GOOD ✅';
                    badgeEl.className = 'px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                }
            }
        }
        
        // Update requests widget
        const pendingRequests = requestsData.filter(r => r.status === 'Pending');
        const countEl = document.getElementById('homePendingReqCount');
        const previewEl = document.getElementById('homePendingReqPreview');
        
        if (countEl) countEl.textContent = pendingRequests.length;
        if (previewEl) {
            if (pendingRequests.length > 0) {
                const latest = pendingRequests.sort((a,b) => new Date(b.date) - new Date(a.date))[0];
                previewEl.innerHTML = `<span class="text-white font-bold">Latest:</span> ₹${latest.amount.toLocaleString('en-IN')} for ${latest.notes} (Ask ${latest.source})`;
                previewEl.className = 'text-xs text-slate-300';
            } else {
                previewEl.textContent = 'No active requests. Tap to open tracker.';
                previewEl.className = 'text-xs text-muted italic';
            }
        }
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
