/* ========================================================================
   MONEYFLOW - SETTINGS.JS
   Voice Selection, JSON Data Import/Export, Feedback Form WhatsApp
======================================================================== */

(function () {
    'use strict';

    // ----------------------------------------------------
    // VOICE AI DROPDOWN
    // ----------------------------------------------------
    const populateVoices = () => {
        const select = document.getElementById('voiceSelect');
        if(!select) return;
        select.innerHTML = '';
        
        const voices = window.speechSynthesis.getVoices();
        const savedURI = localStorage.getItem('fin_voiceURI');

        // Provide 10 distinct/high-quality voices if possible by filtering
        // Browsers handle voices differently, so we take top ones or standard english
        const englishVoices = voices.filter(v => v.lang.startsWith('en')).slice(0, 10);
        
        if (englishVoices.length === 0) {
            select.innerHTML = '<option value="">Default System Voice</option>';
            return;
        }

        englishVoices.forEach(voice => {
            const opt = document.createElement('option');
            opt.textContent = `${voice.name} (${voice.lang})`;
            opt.value = voice.voiceURI;
            if (voice.voiceURI === savedURI) opt.selected = true;
            select.appendChild(opt);
        });
    };

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

    // Voice Power Toggle
    const voiceToggle = document.getElementById('toggleVoiceBtn');
    if(voiceToggle) {
        const updateVoiceBtn = () => {
            const isOff = localStorage.getItem('voiceGreeting') === 'off';
            voiceToggle.textContent = isOff ? 'Turn ON' : 'Turn OFF';
            voiceToggle.className = isOff ? 
                'px-6 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border text-muted hover:text-white transition active:scale-95' :
                'px-6 py-2 rounded-xl text-sm font-bold bg-blue-500 text-white shadow-md active:scale-95 transition';
        };
        updateVoiceBtn();
        
        voiceToggle.addEventListener('click', () => {
            const isOff = localStorage.getItem('voiceGreeting') === 'off';
            localStorage.setItem('voiceGreeting', isOff ? 'on' : 'off');
            updateVoiceBtn();
            if(isOff) window.showSnackbar('Voice greeting enabled! 🗣️');
            else window.showSnackbar('Voice greeting disabled 🔇');
        });
    }

    // Haptic Power Toggle
    const hapticToggle = document.getElementById('toggleHapticBtn');
    if(hapticToggle) {
        const updateHapticBtn = () => {
            const val = localStorage.getItem('fin_haptic');
            const isOn = (val === null || val === 'true');
            hapticToggle.textContent = isOn ? 'Turn OFF' : 'Turn ON';
            hapticToggle.className = isOn ? 
                'px-6 py-2 rounded-xl text-sm font-bold bg-glass-bg border border-glass-border text-muted hover:text-white transition active:scale-95' :
                'px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white shadow-md active:scale-95 transition';
        };
        updateHapticBtn();
        
        hapticToggle.addEventListener('click', () => {
            const val = localStorage.getItem('fin_haptic');
            const isOn = (val === null || val === 'true');
            localStorage.setItem('fin_haptic', isOn ? 'false' : 'true');
            updateHapticBtn();
            if(!isOn) window.showSnackbar('Haptic feedback enabled! 📳');
            else window.showSnackbar('Haptic feedback disabled 🔇');
        });
    }

    // Currency Formatter Select
    const currencySelect = document.getElementById('currencySelect');
    if(currencySelect) {
        const savedCurr = localStorage.getItem('fin_currency') || '₹';
        currencySelect.value = savedCurr;
        currencySelect.addEventListener('change', (e) => {
            localStorage.setItem('fin_currency', e.target.value);
            window.showSnackbar(`Currency updated to ${e.target.value}`);
        });
    }

    // Personal Identity
    const nameInput = document.getElementById('usernameInput');
    if(nameInput) {
        nameInput.value = localStorage.getItem('fin_userName') || 'User';
        window.saveName = function() {
            const nm = nameInput.value.trim();
            localStorage.setItem('fin_userName', nm || 'User');
            window.showSnackbar('Name saved successfully! ✨');
        };
    }

    // ----------------------------------------------------
    // DATA EXPORT / IMPORT
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
        
        showSnackbar('Data Exported Successfully!');
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

    window.wipeData = function() {
        if(confirm('Are you ABSOLUTELY sure? This deletes ALL financial history.')) {
            if(confirm('Final warning: Delete everything?')) {
                localStorage.removeItem('fin_spendly');
                localStorage.removeItem('fin_pocketcal');
                window.showSnackbar('Data wiped. Fresh start.', 'warning');
            }
        }
    };

    // ----------------------------------------------------
    // FEEDBACK STARS & WHATSAPP
    // ----------------------------------------------------
    const stars = document.querySelectorAll('.star-rate');
    const ratingVal = document.getElementById('ratingValue');
    
    if(stars.length > 0) {
        // Init 5 stars
        const updateStars = (val) => {
            stars.forEach(s => {
                const sval = parseInt(s.getAttribute('data-val'));
                if(sval <= val) {
                    s.classList.remove('text-muted');
                    s.classList.add('text-amber-500', 'fill-amber-500');
                } else {
                    s.classList.add('text-muted');
                    s.classList.remove('text-amber-500', 'fill-amber-500');
                }
            });
        };
        updateStars(5);

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const val = parseInt(star.getAttribute('data-val'));
                ratingVal.value = val;
                updateStars(val);
            });
        });

        document.getElementById('settingsFeedbackForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const starsRating = ratingVal.value;
            const msg = document.getElementById('feedbackMsg').value;
            
            const starText = '⭐'.repeat(starsRating);
            const finalMsg = `*MoneyFlow Rating:* ${starText}\n\n*Feedback:*\n${msg}`;
            
            const phone = "918097814934"; // Provided WhatsApp Number
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(finalMsg)}`, '_blank');
        });
    }

})();
