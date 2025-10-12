/* ========================================
   FEEDBACK PAGE JAVASCRIPT
======================================== */

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  initializeFeedback();
  initializeStarRating();
  initializeCharacterCounter();
  loadUserName();
  updateTime();
  setInterval(updateTime, 1000);
});

/* ========================================
   INITIALIZE FEEDBACK SYSTEM
======================================== */
function initializeFeedback() {
  const feedbackForm = document.getElementById('feedbackForm');
  
  if (feedbackForm) {
    feedbackForm.addEventListener('submit', handleFeedbackSubmit);
  }
  
  // Add input animations
  const inputs = document.querySelectorAll('.form-input');
  inputs.forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('focused');
    });
  });
}

/* ========================================
   STAR RATING SYSTEM
======================================== */
function initializeStarRating() {
  const stars = document.querySelectorAll('.star');
  const ratingValue = document.getElementById('ratingValue');
  const ratingText = document.getElementById('ratingText');
  
  let selectedRating = 0;
  
  const ratingLabels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };
  
  stars.forEach(star => {
    // Hover effect
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.getAttribute('data-rating'));
      highlightStars(rating);
      updateRatingText(rating);
    });
    
    // Click to select
    star.addEventListener('click', function() {
      selectedRating = parseInt(this.getAttribute('data-rating'));
      ratingValue.value = selectedRating;
      selectStars(selectedRating);
      updateRatingText(selectedRating);
      
      // Add animation
      this.style.animation = 'none';
      setTimeout(() => {
        this.style.animation = 'starPop 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
      }, 10);
    });
  });
  
  // Reset on mouse leave
  const starRating = document.getElementById('starRating');
  starRating.addEventListener('mouseleave', function() {
    if (selectedRating > 0) {
      highlightStars(selectedRating);
      updateRatingText(selectedRating);
    } else {
      resetStars();
      ratingText.textContent = 'No rating selected';
    }
  });
  
  function highlightStars(rating) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('hover');
      } else {
        star.classList.remove('hover');
      }
    });
  }
  
  function selectStars(rating) {
    stars.forEach((star, index) => {
      if (index < rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }
  
  function resetStars() {
    stars.forEach(star => {
      star.classList.remove('hover');
      if (selectedRating === 0) {
        star.classList.remove('active');
      }
    });
  }
  
  function updateRatingText(rating) {
    ratingText.textContent = `${rating} star${rating > 1 ? 's' : ''} - ${ratingLabels[rating]}`;
    ratingText.style.color = rating >= 4 ? 'var(--accent)' : rating >= 3 ? '#f59e0b' : '#ef4444';
  }
}

/* ========================================
   CHARACTER COUNTER
======================================== */
function initializeCharacterCounter() {
  const feedbackMessage = document.getElementById('feedbackMessage');
  const charCount = document.getElementById('charCount');
  const maxLength = 1000;
  
  if (feedbackMessage && charCount) {
    feedbackMessage.setAttribute('maxlength', maxLength);
    
    feedbackMessage.addEventListener('input', function() {
      const currentLength = this.value.length;
      charCount.textContent = currentLength;
      
      // Color coding
      if (currentLength > maxLength * 0.9) {
        charCount.style.color = '#ef4444';
      } else if (currentLength > maxLength * 0.7) {
        charCount.style.color = '#f59e0b';
      } else {
        charCount.style.color = 'var(--text-secondary)';
      }
    });
  }
}

/* ========================================
   LOAD USER NAME
======================================== */
function loadUserName() {
  const userName = localStorage.getItem('userName');
  const userNameInput = document.getElementById('userName');
  
  if (userName && userNameInput) {
    userNameInput.value = userName;
  }
}

/* ========================================
   HANDLE FEEDBACK SUBMISSION
======================================== */
function handleFeedbackSubmit(e) {
  e.preventDefault();
  
  // Get form values
  const feedbackType = document.getElementById('feedbackType').value;
  const userName = document.getElementById('userName').value;
  const userEmail = document.getElementById('userEmail').value;
  const ratingValue = document.getElementById('ratingValue').value;
  const feedbackMessage = document.getElementById('feedbackMessage').value;
  
  // Validate rating
  if (!ratingValue || ratingValue === '0') {
    showToast('Please select a rating', 'error');
    document.getElementById('starRating').scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  
  // Validate message
  if (feedbackMessage.trim().length < 10) {
    showToast('Please provide more details (at least 10 characters)', 'error');
    document.getElementById('feedbackMessage').focus();
    return;
  }
  
  // Create WhatsApp message
  const whatsappMessage = createWhatsAppMessage({
    type: feedbackType,
    name: userName,
    email: userEmail,
    rating: ratingValue,
    message: feedbackMessage
  });
  
  // Show success message and open WhatsApp
  showSuccessMessage(whatsappMessage);
}

/* ========================================
   CREATE WHATSAPP MESSAGE
======================================== */
function createWhatsAppMessage(data) {
  const stars = '⭐'.repeat(parseInt(data.rating));
  const ratingText = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][parseInt(data.rating) - 1];
  
  let message = `*MoneyFlow Feedback* 📱\n\n`;
  message += `*Type:* ${data.type}\n`;
  message += `*Name:* ${data.name}\n`;
  
  if (data.email) {
    message += `*Email:* ${data.email}\n`;
  }
  
  message += `*Rating:* ${stars} (${data.rating}/5 - ${ratingText})\n\n`;
  message += `*Message:*\n${data.message}\n\n`;
  message += `---\n`;
  message += `Sent from MoneyFlow App\n`;
  message += `Date: ${new Date().toLocaleString('en-IN', { 
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  })}`;
  
  return message;
}

/* ========================================
   SHOW SUCCESS MESSAGE
======================================== */
function showSuccessMessage(whatsappMessage) {
  const feedbackForm = document.querySelector('.feedback-form-container');
  const successMessage = document.getElementById('successMessage');
  const sendWhatsAppBtn = document.getElementById('sendWhatsAppBtn');
  
  // Hide form, show success message
  feedbackForm.querySelector('form').style.display = 'none';
  successMessage.style.display = 'block';
  
  // Animate success message
  successMessage.style.animation = 'fadeInUp165 0.6s cubic-bezier(0.19, 1, 0.22, 1)';
  
  // Add WhatsApp click handler
  sendWhatsAppBtn.onclick = function() {
    sendToWhatsApp(whatsappMessage);
  };
  
  // Auto-scroll to success message
  setTimeout(() => {
    successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 100);
  
  // Show toast
  showToast('Feedback prepared successfully!', 'success');
}

/* ========================================
   SEND TO WHATSAPP
======================================== */
function sendToWhatsApp(message) {
  const phoneNumber = '918097814934'; // Your WhatsApp number with country code
  const encodedMessage = encodeURIComponent(message);
  
  // Create WhatsApp URL
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  
  // Open WhatsApp
  window.open(whatsappURL, '_blank');
  
  // Show confirmation toast
  showToast('Opening WhatsApp...', 'info');
  
  // Reset form after a delay
  setTimeout(() => {
    resetFeedbackForm();
  }, 3000);
}

/* ========================================
   RESET FEEDBACK FORM
======================================== */
function resetFeedbackForm() {
  const feedbackForm = document.getElementById('feedbackForm');
  const successMessage = document.getElementById('successMessage');
  const feedbackFormContainer = document.querySelector('.feedback-form-container');
  
  // Hide success message
  successMessage.style.display = 'none';
  
  // Show and reset form
  feedbackForm.style.display = 'block';
  feedbackForm.reset();
  
  // Reset star rating
  const stars = document.querySelectorAll('.star');
  stars.forEach(star => star.classList.remove('active', 'hover'));
  
  document.getElementById('ratingValue').value = '0';
  document.getElementById('ratingText').textContent = 'No rating selected';
  document.getElementById('ratingText').style.color = 'var(--text-secondary)';
  
  // Reset character counter
  document.getElementById('charCount').textContent = '0';
  document.getElementById('charCount').style.color = 'var(--text-secondary)';
  
  // Scroll to top of form
  feedbackFormContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ========================================
   TOAST NOTIFICATION SYSTEM
======================================== */
function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) {
    existingToast.remove();
  }
  
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  
  // Set icon based on type
  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️'
  };
  
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;
  
  // Add to body
  document.body.appendChild(toast);
  
  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

/* ========================================
   UPDATE TIME DISPLAY
======================================== */
function updateTime() {
  const timeDisplay = document.getElementById('timeNow');
  if (!timeDisplay) return;
  
  const now = new Date();
  const options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  };
  
  const timeString = now.toLocaleString('en-IN', options);
  const dateOptions = {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  };
  const dateString = now.toLocaleString('en-IN', dateOptions);
  
  timeDisplay.innerHTML = `
    <div style="font-size: 0.9em; opacity: 0.8;">${dateString}</div>
    <div style="font-weight: 700;">${timeString}</div>
  `;
}

/* ========================================
   FORM FIELD VALIDATION HELPERS
======================================== */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validateForm() {
  const userName = document.getElementById('userName').value.trim();
  const feedbackType = document.getElementById('feedbackType').value;
  const ratingValue = document.getElementById('ratingValue').value;
  const feedbackMessage = document.getElementById('feedbackMessage').value.trim();
  const userEmail = document.getElementById('userEmail').value.trim();
  
  if (!userName) {
    showToast('Please enter your name', 'error');
    return false;
  }
  
  if (!feedbackType) {
    showToast('Please select a feedback type', 'error');
    return false;
  }
  
  if (!ratingValue || ratingValue === '0') {
    showToast('Please select a rating', 'error');
    return false;
  }
  
  if (feedbackMessage.length < 10) {
    showToast('Message must be at least 10 characters', 'error');
    return false;
  }
  
  if (userEmail && !validateEmail(userEmail)) {
    showToast('Please enter a valid email address', 'error');
    return false;
  }
  
  return true;
}

/* ========================================
   KEYBOARD SHORTCUTS
======================================== */
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + Enter to submit form
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm && document.activeElement.tagName === 'TEXTAREA') {
      feedbackForm.dispatchEvent(new Event('submit'));
    }
  }
  
  // Escape to clear form
  if (e.key === 'Escape') {
    const feedbackForm = document.getElementById('feedbackForm');
    if (feedbackForm && confirm('Clear all fields?')) {
      resetFeedbackForm();
    }
  }
});

/* ========================================
   AUTO-SAVE DRAFT (OPTIONAL)
======================================== */
let autoSaveTimeout;

function enableAutoSave() {
  const inputs = ['feedbackType', 'userName', 'userEmail', 'feedbackMessage'];
  
  inputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('input', function() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
          saveDraft();
        }, 1000);
      });
    }
  });
  
  // Load draft on page load
  loadDraft();
}

function saveDraft() {
  const draft = {
    type: document.getElementById('feedbackType').value,
    name: document.getElementById('userName').value,
    email: document.getElementById('userEmail').value,
    message: document.getElementById('feedbackMessage').value,
    rating: document.getElementById('ratingValue').value,
    timestamp: Date.now()
  };
  
  localStorage.setItem('feedbackDraft', JSON.stringify(draft));
}

function loadDraft() {
  const draftJSON = localStorage.getItem('feedbackDraft');
  if (!draftJSON) return;
  
  const draft = JSON.parse(draftJSON);
  
  // Check if draft is less than 24 hours old
  const hoursSinceDraft = (Date.now() - draft.timestamp) / (1000 * 60 * 60);
  if (hoursSinceDraft > 24) {
    localStorage.removeItem('feedbackDraft');
    return;
  }
  
  // Restore draft values
  if (draft.type) document.getElementById('feedbackType').value = draft.type;
  if (draft.name) document.getElementById('userName').value = draft.name;
  if (draft.email) document.getElementById('userEmail').value = draft.email;
  if (draft.message) {
    document.getElementById('feedbackMessage').value = draft.message;
    document.getElementById('charCount').textContent = draft.message.length;
  }
  if (draft.rating && draft.rating !== '0') {
    document.getElementById('ratingValue').value = draft.rating;
    const stars = document.querySelectorAll('.star');
    stars.forEach((star, index) => {
      if (index < parseInt(draft.rating)) {
        star.classList.add('active');
      }
    });
  }
  
  showToast('Draft restored', 'info');
}

function clearDraft() {
  localStorage.removeItem('feedbackDraft');
}

// Enable auto-save feature
enableAutoSave();

/* ========================================
   ANALYTICS (OPTIONAL)
======================================== */
function trackFeedbackEvent(action, data) {
  // Add your analytics tracking here
  console.log('Feedback Event:', action, data);
  
  // Example: Google Analytics
  // if (typeof gtag !== 'undefined') {
  //   gtag('event', action, {
  //     event_category: 'Feedback',
  //     event_label: data.type,
  //     value: data.rating
  //   });
  // }
}

/* ========================================
   UTILITY FUNCTIONS
======================================== */
function sanitizeInput(input) {
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
}

function formatDateTime(date) {
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

// Log initialization
console.log('Feedback system initialized successfully! ✅');
