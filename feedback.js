/* ========================================
   MONEYFLOW FEEDBACK SYSTEM — PRO v2
   Complete Feedback Engine
======================================== */

document.addEventListener("DOMContentLoaded", () => {
    initFeedbackSystem();
});

/* ========================================
   INIT
======================================== */
function initFeedbackSystem() {
    initStarRating();
    initCharacterCounter();
    initMoodSelector();
    initBugSelector();
    initFormSubmit();
    loadUserName();
    loadDraft();
    renderFeedbackHistory();
    setDeviceInfo();
    updateTime();
    setInterval(updateTime, 1000);
}

/* ========================================
   DEVICE INFO
======================================== */
function setDeviceInfo() {
    const deviceInfo = document.getElementById("deviceInfo");
    if (!deviceInfo) return;

    deviceInfo.value =
        navigator.userAgent +
        " | " +
        screen.width +
        "x" +
        screen.height +
        " | " +
        navigator.platform;
}

/* ========================================
   STAR RATING
======================================== */
function initStarRating() {
    const stars = document.querySelectorAll(".star");
    const ratingValue = document.getElementById("ratingValue");
    const ratingText = document.getElementById("ratingText");

    let selected = 0;

    const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

    stars.forEach((star, i) => {
        star.addEventListener("mouseenter", () => highlight(i + 1));
        star.addEventListener("click", () => {
            selected = i + 1;
            ratingValue.value = selected;
            highlight(selected);
            updateText(selected);
        });
    });

    document.getElementById("starRating").addEventListener("mouseleave", () => {
        highlight(selected);
        if (selected === 0) ratingText.textContent = "No rating selected";
    });

    function highlight(r) {
        stars.forEach((s, i) => {
            s.classList.toggle("active", i < r);
        });
    }

    function updateText(r) {
        ratingText.textContent = `${r}/5 - ${labels[r - 1]}`;
    }
}

/* ========================================
   MOOD SELECTOR
======================================== */
function initMoodSelector() {
    const moods = document.querySelectorAll(".mood-select span");
    const moodValue = document.getElementById("moodValue");

    moods.forEach(el => {
        el.addEventListener("click", () => {
            moods.forEach(m => m.classList.remove("active"));
            el.classList.add("active");
            moodValue.value = el.dataset.mood;
        });
    });
}

/* ========================================
   BUG TYPE SELECTOR
======================================== */
function initBugSelector() {
    const type = document.getElementById("feedbackType");
    const bugFields = document.querySelectorAll(".bug-only");

    if (!type) return;

    type.addEventListener("change", () => {
        bugFields.forEach(el => {
            el.style.display = type.value === "Bug Report" ? "block" : "none";
        });
    });
}

/* ========================================
   CHARACTER COUNTER
======================================== */
function initCharacterCounter() {
    const msg = document.getElementById("feedbackMessage");
    const count = document.getElementById("charCount");

    if (!msg) return;

    msg.maxLength = 1000;

    msg.addEventListener("input", () => {
        count.textContent = msg.value.length;
    });
}

/* ========================================
   FORM SUBMIT
======================================== */
function initFormSubmit() {
    const form = document.getElementById("feedbackForm");
    if (!form) return;

    form.addEventListener("submit", e => {
        e.preventDefault();
        if (!validateForm()) return;

        const data = collectFormData();
        saveFeedbackHistory(data);
        clearDraft();

        const message = buildWhatsAppMessage(data);
        showSuccess(message);

        trackEvent("submit", data);
    });
}

/* ========================================
   COLLECT DATA
======================================== */
function collectFormData() {
    return {
        type: getVal("feedbackType"),
        name: getVal("userName"),
        email: getVal("userEmail"),
        rating: getVal("ratingValue"),
        message: getVal("feedbackMessage"),
        mood: getVal("moodValue"),
        bugPage: getVal("bugPage"),
        device: getVal("deviceInfo"),
        version: getVal("appVersion"),
        contact: document.getElementById("contactPermission")?.checked || false,
        time: new Date().toISOString()
    };
}

function getVal(id) {
    return document.getElementById(id)?.value || "";
}

/* ========================================
   VALIDATION
======================================== */
function validateForm() {
    if (!getVal("userName")) return toast("Enter name", "error");
    if (!getVal("feedbackType")) return toast("Select type", "error");
    if (!getVal("ratingValue") || getVal("ratingValue") === "0")
        return toast("Select rating", "error");
    if (getVal("feedbackMessage").length < 10)
        return toast("Message too short", "error");

    const email = getVal("userEmail");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return toast("Invalid email", "error");

    return true;
}

/* ========================================
   WHATSAPP MESSAGE
======================================== */
function buildWhatsAppMessage(d) {
    let msg = `*MoneyFlow Feedback* 📱\n\n`;

    msg += `*Type:* ${d.type}\n`;
    msg += `*Name:* ${d.name}\n`;

    if (d.email) msg += `*Email:* ${d.email}\n`;
    if (d.mood) msg += `*Mood:* ${d.mood}\n`;

    msg += `*Rating:* ${"⭐".repeat(d.rating)} (${d.rating}/5)\n`;

    if (d.bugPage) msg += `*Page:* ${d.bugPage}\n`;

    msg += `\n*Message:*\n${d.message}\n\n`;

    msg += `---\n`;
    msg += `Device: ${d.device}\n`;
    msg += `App: ${d.version}\n`;
    msg += `Contact OK: ${d.contact ? "Yes" : "No"}\n`;
    msg += `Time: ${new Date(d.time).toLocaleString("en-IN")}`;

    return msg;
}

/* ========================================
   SUCCESS + WHATSAPP
======================================== */
function showSuccess(message) {
    const form = document.getElementById("feedbackForm");
    const box = document.getElementById("successMessage");
    const btn = document.getElementById("sendWhatsAppBtn");

    form.style.display = "none";
    box.style.display = "block";

    btn.onclick = () => openWhatsApp(message);

    toast("Feedback ready", "success");
}

function openWhatsApp(msg) {
    const phone = "918097814934";
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
}

/* ========================================
   FEEDBACK HISTORY
======================================== */
function saveFeedbackHistory(data) {
    const list = JSON.parse(localStorage.getItem("feedbackHistory") || "[]");
    list.unshift(data);
    localStorage.setItem("feedbackHistory", JSON.stringify(list.slice(0, 20)));
}

function renderFeedbackHistory() {
    const container = document.getElementById("feedbackList");
    if (!container) return;

    const list = JSON.parse(localStorage.getItem("feedbackHistory") || "[]");

    if (list.length === 0) {
        container.innerHTML = "<p>No previous feedback</p>";
        return;
    }

    container.innerHTML = list
        .map(
            f => `
    <div class="feedback-card">
      <div class="fb-top">
        <span>${f.type}</span>
        <span>${"⭐".repeat(f.rating)}</span>
      </div>
      <div class="fb-msg">${f.message}</div>
      <div class="fb-date">${new Date(f.time).toLocaleDateString()}</div>
    </div>
  `
        )
        .join("");
}

/* ========================================
   DRAFT SAVE
======================================== */
function loadDraft() {
    const d = JSON.parse(localStorage.getItem("feedbackDraft") || "null");
    if (!d) return;

    Object.keys(d).forEach(k => {
        if (document.getElementById(k)) {
            document.getElementById(k).value = d[k];
        }
    });

    toast("Draft restored", "info");
}

function clearDraft() {
    localStorage.removeItem("feedbackDraft");
}

/* ========================================
   TOAST
======================================== */
function toast(msg, type = "info") {
    const t = document.createElement("div");
    t.className = `toast toast-${type}`;
    t.textContent = msg;
    document.body.appendChild(t);

    setTimeout(() => t.classList.add("show"), 10);
    setTimeout(() => t.remove(), 3000);

    return false;
}

/* ========================================
   TIME
======================================== */
function updateTime() {
    const el = document.getElementById("timeNow");
    if (!el) return;

    const now = new Date();

    el.innerHTML = `
    <div>${now.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</div>
    <div style="font-weight:700">
      ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
    </div>
  `;
}

/* ========================================
   ANALYTICS
======================================== */
function trackEvent(action, data) {
    console.log("Feedback:", action, data);
}

/* ========================================
   UTIL
======================================== */
function loadUserName() {
    const n = localStorage.getItem("userName");
    if (n && document.getElementById("userName"))
        document.getElementById("userName").value = n;
}

console.log("MoneyFlow Feedback PRO loaded ✅");
