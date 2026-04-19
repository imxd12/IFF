/* ========================================================================
   MONEYFLOW - GLOBAL JAVASCRIPT & ANTIGRAVITY ENGINE
   Smooth Scrolling (Lenis), GSAP setup, Data Core, Inky Theme Toggle
======================================================================== */

(function () {
  'use strict';

  // ----------------------------------------------------
  // 1. DATA CORE & LOCALSTORAGE SHARING
  // ----------------------------------------------------
  window.loadData = function (key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn(`Failed to load ${key}:`, e);
      return null;
    }
  };

  window.saveData = function (key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Failed to save ${key}:`, e);
      if (e.name === 'QuotaExceededError') {
        window.showSnackbar('Storage full! Please clear old data.', 'error');
      }
      return false;
    }
  };

  window.fmt = function (amount) {
    const sym = localStorage.getItem('fin_currency') || '₹';
    const numstr = Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return sym + numstr;
  };

  // ----------------------------------------------------
  // 2. SNACKBAR NOTIFICATION
  // ----------------------------------------------------
  window.showSnackbar = function (message, type = 'success') {
    let snackbar = document.getElementById('globalSnackbar');
    if (!snackbar) {
      snackbar = document.createElement('div');
      snackbar.id = 'globalSnackbar';
      snackbar.className = 'snackbar';
      document.body.appendChild(snackbar);
    }
    
    snackbar.textContent = message;
    
    if (type === 'error') snackbar.style.borderLeft = '4px solid var(--accent-danger)';
    else if (type === 'warning') snackbar.style.borderLeft = '4px solid orange';
    else snackbar.style.borderLeft = '4px solid var(--accent-primary)';

    snackbar.classList.add('show');
    
    clearTimeout(window.snackbarTimer);
    window.snackbarTimer = setTimeout(() => {
      snackbar.classList.remove('show');
    }, 3000);
  };

  // ----------------------------------------------------
  // 3. MUSIC PLAYER (Beat Sync & Progress Ring)
  // ----------------------------------------------------
  let isPlaying = false;
  let audioCtx, analyser, dataArray;

  function initAudioEngine(player) {
      if(audioCtx) return;
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const src = audioCtx.createMediaElementSource(player);
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      analyser.connect(audioCtx.destination);
      dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  function renderBeat() {
      if(!isPlaying) {
          const btn = document.getElementById('musicIconBtn');
          if(btn) btn.style.transform = `scale(1)`;
          return;
      }
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for(let i=0; i < dataArray.length; i++) sum += dataArray[i];
      let avg = sum / dataArray.length; // 0 to 255
      
      // Fallback for local files where CORS blocks AnalyserNode
      if (sum === 0) {
          const t = Date.now() / 250; 
          avg = (Math.sin(t) + 1) * 127;
      }
      
      const btn = document.getElementById('musicIconBtn');
      if(btn) {
          const scale = 1 + (avg / 255) * 0.25; 
          btn.style.transform = `scale(${scale})`;
      }
      requestAnimationFrame(renderBeat);
  }

  window.toggleGlobalMusic = function () {
    const player = document.getElementById("globalMusicPlayer");
    const icon = document.getElementById("musicStatusIcon");
    if (!player) return;

    if (!audioCtx) initAudioEngine(player);
    if (audioCtx.state === 'suspended') audioCtx.resume();

    if (!isPlaying) {
      player.play().catch(e => console.log("Audio play blocked", e));
      if(icon) {
          icon.setAttribute('data-lucide', 'pause');
          icon.style.marginLeft = '0px'; 
      }
      isPlaying = true;
      renderBeat();
    } else {
      player.pause();
      if(icon) {
          icon.setAttribute('data-lucide', 'play');
          icon.style.marginLeft = '2px';
      }
      isPlaying = false;
    }
    if (window.lucide) lucide.createIcons();
  };

  // Bind Progress Ring globally 
  window.addEventListener('DOMContentLoaded', () => {
      const player = document.getElementById("globalMusicPlayer");
      if(player) {
          player.addEventListener('timeupdate', () => {
              const ring = document.getElementById('musicProgressRing');
              if(ring && player.duration) {
                  const progress = player.currentTime / player.duration;
                  const circumference = 113;
                  ring.style.strokeDashoffset = circumference - (progress * circumference);
              }
          });
      }
  });

  // ----------------------------------------------------
  // 4. THE INKY THEME TOGGLE ENGINE
  // ----------------------------------------------------
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fin_theme', theme);

    const themeNames = document.querySelectorAll('.theme-name-display');
    themeNames.forEach(el => {
      el.textContent = theme === 'dark' ? 'Obsidian Black' : 'Ceramic White';
    });
  }

  window.initInkyTheme = function () {
    const savedTheme = localStorage.getItem('fin_theme') || 'light';
    applyTheme(savedTheme);

    const toggleBtn = document.getElementById('themeToggleBtn');
    if (!toggleBtn) return;

    // Set initial icon
    toggleBtn.innerHTML = savedTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';

    toggleBtn.addEventListener('click', (e) => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const nextTheme = isDark ? 'light' : 'dark';

      // Advanced ViewTransitions API for the Inky effect if supported
      if (document.startViewTransition) {
        // Calculate crop circle radius
        const x = e.clientX;
        const y = e.clientY;
        const endRadius = Math.hypot(
          Math.max(x, innerWidth - x),
          Math.max(y, innerHeight - y)
        );

        const transition = document.startViewTransition(() => {
          applyTheme(nextTheme);
          toggleBtn.innerHTML = nextTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
          if (window.lucide) lucide.createIcons();
        });

        transition.ready.then(() => {
          const clipPath = [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`
          ];

          // Animate the root using clip-path
          document.documentElement.animate(
            {
              clipPath: isDark ? [...clipPath].reverse() : clipPath
            },
            {
              duration: 600,
              easing: 'ease-in-out',
              pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)'
            }
          );
        });
      } else {
        // Fallback for browsers without ViewTransitions API
        applyTheme(nextTheme);
        toggleBtn.innerHTML = nextTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        if (window.lucide) lucide.createIcons();
      }
    });
  };

  // ----------------------------------------------------
  // 5. BOTTOM NAVIGATION DOCK LOGIC
  // ----------------------------------------------------
  window.initDockIndicator = function() {
    // Removed for minimalistic navbar design
  };

  // ----------------------------------------------------
  // 6. GSAP ANTIGRAVITY ENGINE & LENIS SCROLLING
  // ----------------------------------------------------
  window.initAntigravity = function () {
    // 1. Initialize Lenis
    if (typeof Lenis !== 'undefined') {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
      
      // Keep scrolltrigger in sync
      if(typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add((time)=>{
          lenis.raf(time * 1000);
        });
      }
    }

    // 2. Setup GSAP ScrollTrigger physics
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      // Find all elements with data-speed attribute for floating parallax
      const parallaxLocs = document.querySelectorAll("[data-speed]");
      parallaxLocs.forEach(el => {
        const speed = el.getAttribute("data-speed");
        gsap.to(el, {
          y: (i, target) => -1 * parseFloat(speed) * 100,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5 // Smooth catch up
          }
        });
      });

      // General reveal animation for cards
      const floatCards = document.querySelectorAll(".ag-card-reveal");
      floatCards.forEach((card, i) => {
        gsap.fromTo(card, 
          { y: 80, opacity: 0, scale: 0.95 },
          { 
            y: 0, 
            opacity: 1, 
            scale: 1, 
            duration: 1, 
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: card,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          }
        );
      });
    }
  };

  // ----------------------------------------------------
  // 7. NEW ANTIGRAVITY UPGRADES (SOUND, SKILLS, BIRTHDAY, SPLASH, RIPPLE)
  // ----------------------------------------------------

  // A. Advanced UI Sound Engine (Web Audio API Synth - Zero Delay)
  let _audioCtx = null;
  
  window.playUISound = function(type = 'tap') {
    if (localStorage.getItem('fin_sound') === 'off') return;

    try {
      if (!_audioCtx) {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (_audioCtx.state === 'suspended') _audioCtx.resume();

      const osc = _audioCtx.createOscillator();
      const gain = _audioCtx.createGain();
      const t = _audioCtx.currentTime;

      osc.connect(gain);
      gain.connect(_audioCtx.destination);

      if (type === 'tap') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(300, t + 0.05);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
      } else if (type === 'on') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.linearRampToValueAtTime(800, t + 0.1);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
      } else if (type === 'off') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.15);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.15);
        osc.start(t);
        osc.stop(t + 0.15);
      } else if (type === 'whoosh') {
        // Quick noise burst for "back / swipe"
        const bufferSize = _audioCtx.sampleRate * 0.15;
        const buffer = _audioCtx.createBuffer(1, bufferSize, _audioCtx.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1; // white noise
        }
        const whiteNoise = _audioCtx.createBufferSource();
        whiteNoise.buffer = buffer;
        
        // Filter it
        const filter = _audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, t);
        filter.frequency.linearRampToValueAtTime(100, t + 0.15);
        
        whiteNoise.connect(filter);
        filter.connect(gain);
        
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        
        whiteNoise.start(t);
        whiteNoise.stop(t + 0.15);
      }
    } catch(e) { /* Ignore */ }
  };

  // Backwards compat wrap
  window.playClickSound = () => window.playUISound('tap');

  window.initClickSound = function() {
    document.body.addEventListener('pointerdown', (e) => {
      const target = e.target.closest('button, a, .list-item, select, input, .ag-card-reveal, .skill-box');
      if (target) {
        // Check if back button
        if(target.innerHTML && target.innerHTML.includes('arrow-left')) {
            window.playUISound('whoosh');
        } else {
            window.playUISound('tap');
        }
      }
    });
  };

  // B. Ripple Effect
  window.initRippleEffect = function() {
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('button, a.glass-button, .ripple-btn');
      if (target) {
        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        const diameter = Math.max(rect.width, rect.height);
        const radius = diameter / 2;
        
        ripple.style.width = ripple.style.height = `${diameter}px`;
        ripple.style.left = `${e.clientX - rect.left - radius}px`;
        ripple.style.top = `${e.clientY - rect.top - radius}px`;
        ripple.classList.add('ripple-span');
        
        target.classList.add('ripple-btn');
        target.appendChild(ripple);
        
        setTimeout(() => {
          ripple.remove();
        }, 600);
      }
    });
  };

  // C. Smart Birthday Feature
  window.initBirthdayCheck = function() {
    const dob = localStorage.getItem('userDOB');
    if (!dob) return;
    
    const username = localStorage.getItem('username') || 'User';
    const dobDate = new Date(dob);
    const today = new Date();
    
    if (dobDate.getMonth() === today.getMonth() && dobDate.getDate() === today.getDate()) {
      // Check if already wished today
      const lastWished = localStorage.getItem('lastWishedYear');
      if (lastWished != today.getFullYear()) {
        localStorage.setItem('lastWishedYear', today.getFullYear());
        
        // Create popup
        const div = document.createElement('div');
        div.className = 'mf-birthday-popup';
        div.innerHTML = `
          <div class="text-4xl mb-4">🎉🎂🎁</div>
          <h2>Happy Birthday,<br>${username}!</h2>
          <p class="text-muted mt-2">Wishing you a fantastic day from MoneyFlow!</p>
        `;
        document.body.appendChild(div);
        
        // Confetti
        const cContainer = document.createElement('div');
        cContainer.className = 'confetti-container';
        document.body.appendChild(cContainer);
        
        const colors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff'];
        for(let i=0; i<50; i++) {
          const c = document.createElement('div');
          c.className = 'confetti';
          c.style.left = Math.random() * 100 + 'vw';
          c.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          cContainer.appendChild(c);
          
          gsap.fromTo(c, 
            { y: -10, opacity: 1, rotation: 0 }, 
            { 
              y: window.innerHeight + 10, 
              opacity: 0, 
              rotation: Math.random() * 360, 
              duration: 2 + Math.random() * 2,
              delay: Math.random(),
              ease: "power1.out"
            }
          );
        }
        
        // Show Popup
        setTimeout(() => {
          div.classList.add('show');
          if(window.playClickSound) window.playClickSound(); // Ding!
          
          setTimeout(() => {
            div.classList.remove('show');
            setTimeout(() => {
              div.remove();
              cContainer.remove();
            }, 600);
          }, 5000);
        }, 1000);
      }
    }
  };

  // D. Splash Screen
  window.initSplashScreen = function() {
    const splash = document.getElementById('mfSplashScreen');
    if (!splash) return;
    
    // Play splash only on first open across app session
    if (sessionStorage.getItem('mf_splash_seen') === 'true') {
        splash.style.display = 'none'; // Instant hide with no animation if already seen
        return;
    }
    
    // Set to true so it doesn't play repeatedly on refresh
    sessionStorage.setItem('mf_splash_seen', 'true');
    
    const messages = [
        "Initializing Neural Engine...",
        "Syncing Data Core...",
        "Establishing Secure Context...",
        "Loading Antigravity UI...",
        "Welcome to MoneyFlow..."
    ];
    
    const textEl = document.getElementById('splashLoadText');
    let mIdx = 0;
    
    if (textEl) {
        const txtInterval = setInterval(() => {
            mIdx++;
            if(mIdx < messages.length) textEl.textContent = messages[mIdx];
            else clearInterval(txtInterval);
        }, 1100);
    }
    
    // 5.8 seconds total runtime to match loader bar
    setTimeout(() => {
        splash.classList.add('hidden');
        setTimeout(() => splash.remove(), 1000); // 1s wait for CSS opacity transition to complete
    }, 5500);
  };

  // E. Skill Popups logic
  const SKILL_DATA = {
    "HTML5": { desc: "The standard markup language for documents designed to be displayed in a web browser.", example: "Structuring the layout of the MoneyFlow dashboard." },
    "CSS3": { desc: "A style sheet language used for describing the presentation of a document written in HTML.", example: "Creating the glassmorphic Liquid Interface effects." },
    "JS Engine": { desc: "Programming language that conforms to the ECMAScript specification handling interactions.", example: "Powering the physics-based GSAP scroll animations." },
    "PWA INTERFACES": { desc: "Web applications that use modern web capabilities to provide a native app-like experience.", example: "Enabling MoneyFlow to be deeply installed offline on your mobile." },
    "Python": { desc: "A high-level passing programming language with rapid execution mechanics.", example: "Writing automation scripts and backend logic layers." },
    "ES6+": { desc: "Modern JavaScript updates that introduce simpler syntax and powerful new methods.", example: "Using Arrow Functions and Promises for data caching." },
    "C/C++": { desc: "Powerful general-purpose languages used for systemic and hardware-level tasks.", example: "Developing low-level robotic controllers." },
    "Arduino": { desc: "An open-source electronic prototyping platform enabling users to create interactive electronic objects.", example: "Reading sensor data from motors for robotics." },
    "Raspberry Pi": { desc: "A series of small single-board computers used to learn programming and create hardware projects.", example: "Acting as the brain for an automated attendance system." },
    "IoT": { desc: "Internet of Things represents connected sensor networks communicating via the Internet.", example: "Tracking remote EV diagnostic metrics." },
    "Git Versioning": { desc: "A distributed version control system tracking changes in source code.", example: "Managing code branches safely for MoneyFlow production." },
    "Chart.js Nodes": { desc: "A community maintained open-source visualization library.", example: "Rendering the responsive dual-chart analytics in Spendly." },
    "Automation Engines": { desc: "Systems designed to operate automatically with varied control loops.", example: "IRABOT TechEd manufacturing workflow processes." },
    "Robotic Kinematics": { desc: "Study of the motion of multi-degree of freedom robotic setups.", example: "Calculating joint degrees for an articulated arm." },
    "Embedded Systems": { desc: "A computer system with a dedicated function within a larger mechanical structure.", example: "Running real-time vehicle fault diagnostics." }
  };

  window.initSkillPopup = function() {
    const boxes = document.querySelectorAll('.skill-box');
    if (boxes.length === 0) return;
    
    // Ensure modal container exists
    let modal = document.getElementById('skillModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'skillModal';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content-glass max-w-sm w-full relative">
          <button class="absolute top-4 right-4 text-muted hover:text-red-500 transition-colors" onclick="document.getElementById('skillModal').classList.remove('active')">
            <i data-lucide="x"></i>
          </button>
          <div class="text-center">
            <div id="smIcon" class="w-16 h-16 mx-auto mb-4 bg-glass-hover rounded-2xl flex items-center justify-center border border-glass-border shadow-lg"></div>
            <h2 id="smTitle" class="text-2xl font-extrabold mb-2 text-gradient">Skill Name</h2>
            <p id="smDesc" class="text-sm text-muted mb-4">Description goes here.</p>
            <div class="bg-glass-bg border border-glass-border p-3 rounded-xl text-left">
              <span class="text-xs font-bold text-accent-primary uppercase tracking-wider mb-1 block">Real-Life Example</span>
              <p id="smExample" class="text-sm text-main font-medium">Example practical application.</p>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      // Click outside to close
      modal.addEventListener('click', (e) => {
        if(e.target === modal) modal.classList.remove('active');
      });
    }

    boxes.forEach(box => {
      box.addEventListener('click', function() {
        const textSpan = this.querySelector('span');
        const iconElem = this.querySelector('i');
        const skillName = textSpan ? textSpan.textContent.trim() : 'Unknown';
        
        const details = SKILL_DATA[skillName] || { desc: "A core competency mastered to deliver reliable professional solutions across stacks.", example: "Applied consistently to achieve high-quality results in modern development environments." };
        
        document.getElementById('smTitle').textContent = skillName;
        document.getElementById('smDesc').textContent = details.desc;
        document.getElementById('smExample').textContent = details.example;
        
        // Copy icon
        const iconContainer = document.getElementById('smIcon');
        if (iconElem) {
          iconContainer.innerHTML = '';
          const clonedIcon = iconElem.cloneNode(true);
          clonedIcon.classList.remove('w-8', 'h-8', 'w-10', 'h-10');
          clonedIcon.classList.add('w-8', 'h-8');
          iconContainer.appendChild(clonedIcon);
        }
        
        modal.classList.add('active');
        if(window.lucide) lucide.createIcons();
      });
    });
  };

  // ----------------------------------------------------
  // BOOTSTRAP
  // ----------------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    // 1. Theme
    initInkyTheme();
    // 2. Dock Indicator
    initDockIndicator();
    // 3. Antigravity & Smooth Scrolling
    initAntigravity();
    // 4. Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }
    // 5. Upgrade Initializations
    initClickSound();
    initRippleEffect();
    initSplashScreen();
    initBirthdayCheck();
    
    // Defer skill popups slightly to ensure DOM is ready
    setTimeout(initSkillPopup, 100);

    // 6. Global Haptics (10ms light tap)
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('button, a, .list-item, select, input, .ag-card-reveal, .skill-box');
      if (target) {
        if (localStorage.getItem('fin_haptic') !== 'false' && navigator.vibrate) {
          navigator.vibrate(10);
        }
      }
    });
  });

})();
