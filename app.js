// Utility: format number with thousands separator and fixed decimals
function formatNumber(num, decimals = 2) {
  if (isNaN(num)) return '';
  return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

// Real-time validation and formatting
const apyInput = document.getElementById('apy');
const amountInput = document.getElementById('amount');
const apyError = document.getElementById('apy-error');
const amountError = document.getElementById('amount-error');
const resultDiv = document.getElementById('result');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const form = document.getElementById('calc-form');
const calcBtn = document.getElementById('calc-btn');

// UI State Management
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

function showLoading() {
  loadingOverlay.classList.add('visible');
}

function hideLoading() {
  loadingOverlay.classList.remove('visible');
}

// Enhanced Toast Notification System
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'polite');
  
  document.body.appendChild(toast);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
  });

  // Auto dismiss
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Debug utility
const debug = {
  log: (message, data = null) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error);
  },
  warn: (message) => {
    console.warn(`[WARN] ${message}`);
  }
};

// Enhanced Input Validation with Visual Feedback
function validateInput(input) {
  debug.log('Validating input:', input.id);
  
  const wrapper = input.closest('.input-wrapper');
  const value = parseFloat(input.value.replace(/,/g, ''));
  
  debug.log('Input value:', value);
  
  wrapper.classList.remove('valid', 'invalid');
  
  if (isNaN(value)) {
    debug.warn('Invalid number');
    wrapper.classList.add('invalid');
    showToast('Please enter a valid number', 'error');
    return false;
  }
  
  if (value <= 0) {
    debug.warn('Value must be positive');
    wrapper.classList.add('invalid');
    showToast('Value must be greater than 0', 'error');
    return false;
  }
  
  // Additional validation for APY
  if (input.id === 'apy' && value > 1000) {
    debug.warn('APY too high');
    wrapper.classList.add('invalid');
    showToast('APY cannot exceed 1000%', 'error');
    return false;
  }
  
  // Additional validation for amount
  if (input.id === 'amount' && value > 1000000000) {
    debug.warn('Amount too high');
    wrapper.classList.add('invalid');
    showToast('Amount cannot exceed $1 billion', 'error');
    return false;
  }
  
  wrapper.classList.add('valid');
  debug.log('Input validated successfully');
  return true;
}

// Enhanced Loading State
function setLoading(isLoading) {
  const overlay = document.querySelector('.loading-overlay');
  const submitBtn = document.querySelector('button[type="submit"]');
  
  if (isLoading) {
    overlay.classList.add('visible');
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.setAttribute('aria-busy', 'true');
  } else {
    overlay.classList.remove('visible');
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');
    submitBtn.removeAttribute('aria-busy');
  }
}

// Validation Rules
const apyRules = [
  {
    validate: value => value !== '' && !isNaN(value),
    message: 'APY is required.'
  },
  {
    validate: value => value > 0,
    message: 'APY must be greater than 0.'
  },
  {
    validate: value => value <= 100,
    message: 'APY must be 100 or less.'
  }
];

const amountRules = [
  {
    validate: value => value !== '' && !isNaN(value),
    message: 'Amount is required.'
  },
  {
    validate: value => value >= 1,
    message: 'Amount must be at least $1.'
  },
  {
    validate: value => value <= 10000000,
    message: 'Amount must be $10,000,000 or less.'
  }
];

// Enhanced Input Event Listeners
apyInput.addEventListener('input', () => {
  let val = apyInput.value.replace(/,/g, '');
  apyInput.value = val;
  validateInput(apyInput);
});

amountInput.addEventListener('input', () => {
  let val = amountInput.value.replace(/,/g, '');
  amountInput.value = val;
  validateInput(amountInput);
});

// Enter key triggers calculation
[apyInput, amountInput].forEach(input => {
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      calcBtn.focus();
      form.requestSubmit();
    }
  });
});

// Chart Configuration
let earningsChart = null;
let chartType = 'bar'; // Default chart type

// Enhanced Chart Creation with Animations
function createChart(data) {
  const ctx = document.getElementById('earningsChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.earningsChart) {
    window.earningsChart.destroy();
  }
  
  // Chart configuration with enhanced animations
  const config = {
    type: chartType,
    data: {
      labels: ['Daily', 'Monthly', 'Yearly'],
      datasets: [{
        data: [data.daily, data.monthly, data.yearly],
        backgroundColor: [
          'rgba(52, 122, 255, 0.8)',
          'rgba(52, 122, 255, 0.6)',
          'rgba(52, 122, 255, 0.4)'
        ],
        borderColor: [
          'rgba(52, 122, 255, 1)',
          'rgba(52, 122, 255, 0.8)',
          'rgba(52, 122, 255, 0.6)'
        ],
        borderWidth: 2,
        borderRadius: 4,
        hoverBackgroundColor: [
          'rgba(52, 122, 255, 1)',
          'rgba(52, 122, 255, 0.8)',
          'rgba(52, 122, 255, 0.6)'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(34, 44, 55, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: function(context) {
              return `$${context.raw.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: '#b3c6e0',
            callback: function(value) {
              return '$' + value.toLocaleString();
            }
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: '#b3c6e0'
          }
        }
      }
    }
  };
  
  // Create chart with animation
  window.earningsChart = new Chart(ctx, config);
  
  // Animate chart container
  const container = document.querySelector('.chart-container');
  container.style.opacity = '0';
  container.style.transform = 'translateY(20px)';
  
  requestAnimationFrame(() => {
    container.style.opacity = '1';
    container.style.transform = 'translateY(0)';
  });
}

// Enhanced Share Functionality
function shareResults(data) {
  const shareSheet = document.querySelector('.share-sheet');
  const shareOptions = document.querySelectorAll('.share-option');
  
  // Animate share options
  shareOptions.forEach((option, index) => {
    option.style.opacity = '0';
    option.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
      option.style.opacity = '1';
      option.style.transform = 'translateY(0)';
    }, 100 * index);
  });
  
  // Show share sheet with animation
  shareSheet.style.transform = 'translateY(0)';
  
  // Handle share options
  shareOptions.forEach(option => {
    option.addEventListener('click', async () => {
      const type = option.dataset.type;
      let success = false;
      
      try {
        switch(type) {
          case 'copy':
            await navigator.clipboard.writeText(
              `APY Calculator Results:\nPrincipal: $${data.principal}\nAPY: ${data.apy}%\nDaily: $${data.daily}\nMonthly: $${data.monthly}\nYearly: $${data.yearly}`
            );
            success = true;
            break;
            
          case 'whatsapp':
            window.open(`https://wa.me/?text=${encodeURIComponent(
              `Check out my APY calculation:\nPrincipal: $${data.principal}\nAPY: ${data.apy}%\nDaily: $${data.daily}\nMonthly: $${data.monthly}\nYearly: $${data.yearly}`
            )}`);
            success = true;
            break;
            
          case 'telegram':
            window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(
              `Check out my APY calculation:\nPrincipal: $${data.principal}\nAPY: ${data.apy}%\nDaily: $${data.daily}\nMonthly: $${data.monthly}\nYearly: $${data.yearly}`
            )}`);
            success = true;
            break;
            
          case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `Check out my APY calculation:\nPrincipal: $${data.principal}\nAPY: ${data.apy}%\nDaily: $${data.daily}\nMonthly: $${data.monthly}\nYearly: $${data.yearly}`
            )}`);
            success = true;
            break;
        }
        
        if (success) {
          showToast('Shared successfully!', 'success');
        }
      } catch (error) {
        showToast('Failed to share. Please try again.', 'error');
      }
      
      // Hide share sheet with animation
      shareSheet.style.transform = 'translateY(100%)';
    });
  });
}

// Enhanced Export Functionality
function exportResults(data, format) {
  try {
    if (format === 'pdf') {
      // Create PDF with enhanced styling
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.setTextColor(52, 122, 255);
      doc.text('APY Calculator Results', 20, 20);
      
      // Add results
      doc.setFontSize(12);
      doc.setTextColor(34, 44, 55);
      doc.text([
        `Principal: $${data.principal.toLocaleString()}`,
        `APY: ${data.apy}%`,
        `Daily Earnings: $${data.daily.toLocaleString()}`,
        `Monthly Earnings: $${data.monthly.toLocaleString()}`,
        `Yearly Earnings: $${data.yearly.toLocaleString()}`
      ], 20, 40);
      
      // Add chart
      const canvas = document.getElementById('earningsChart');
      const imgData = canvas.toDataURL('image/png');
      doc.addImage(imgData, 'PNG', 20, 80, 170, 100);
      
      // Save PDF
      doc.save('apy-calculator-results.pdf');
      showToast('PDF exported successfully!', 'success');
    } else if (format === 'csv') {
      // Create CSV with enhanced formatting
      const csv = [
        ['Category', 'Value'],
        ['Principal', `$${data.principal}`],
        ['APY', `${data.apy}%`],
        ['Daily Earnings', `$${data.daily}`],
        ['Monthly Earnings', `$${data.monthly}`],
        ['Yearly Earnings', `$${data.yearly}`]
      ].map(row => row.join(',')).join('\n');
      
      // Download CSV
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'apy-calculator-results.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      showToast('CSV exported successfully!', 'success');
    }
  } catch (error) {
    showToast('Export failed. Please try again.', 'error');
  }
}

// Enhanced Chart Type Selection
function updateChartType(type) {
  chartType = type;
  
  // Update active state
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  
  // Recreate chart with new type
  const data = {
    daily: parseFloat(document.getElementById('dailyEarnings').textContent.replace(/[^0-9.-]+/g, '')),
    monthly: parseFloat(document.getElementById('monthlyEarnings').textContent.replace(/[^0-9.-]+/g, '')),
    yearly: parseFloat(document.getElementById('yearlyEarnings').textContent.replace(/[^0-9.-]+/g, ''))
  };
  
  createChart(data);
  showToast(`Chart type changed to ${type}`, 'info');
}

// Initialize enhanced UI
document.addEventListener('DOMContentLoaded', () => {
  // Add chart type selector
  const chartTypeSelector = document.createElement('div');
  chartTypeSelector.className = 'chart-type-selector';
  chartTypeSelector.innerHTML = `
    <button class="chart-type-btn active" data-type="bar">Bar</button>
    <button class="chart-type-btn" data-type="line">Line</button>
    <button class="chart-type-btn" data-type="pie">Pie</button>
    <button class="chart-type-btn" data-type="doughnut">Doughnut</button>
  `;
  
  document.querySelector('.chart-container').prepend(chartTypeSelector);
  
  // Add chart type event listeners
  document.querySelectorAll('.chart-type-btn').forEach(btn => {
    btn.addEventListener('click', () => updateChartType(btn.dataset.type));
  });
  
  // Add input validation
  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => validateInput(input));
    input.addEventListener('blur', () => validateInput(input));
  });
  
  // Add keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const shareSheet = document.querySelector('.share-sheet');
      if (shareSheet.style.transform === 'translateY(0)') {
        shareSheet.style.transform = 'translateY(100%)';
      }
    }
  });
});

// Enhanced Calculation
async function calculate() {
  debug.log('Starting calculation...');
  
  try {
    // Parse and validate inputs
    const apy = parseFloat(apyInput.value.replace(/,/g, ''));
    const amount = parseFloat(amountInput.value.replace(/,/g, ''));
    
    debug.log('Input values:', { apy, amount });
    
    const isApyValid = validateInput(apyInput);
    const isAmountValid = validateInput(amountInput);
    
    debug.log('Validation results:', { isApyValid, isAmountValid });
    
    if (!isApyValid || !isAmountValid) {
      debug.warn('Validation failed');
      showToast('Please fix the errors before calculating.', 'error');
      showResult('', false);
      return;
    }

    setLoading(true);
    debug.log('Loading state set');
    
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // APY calculation with daily compounding
      const r = apy / 100; // Convert percentage to decimal
      const P = amount; // Principal amount
      
      debug.log('Initial values:', { r, P });
      
      // Calculate daily rate (APY to daily rate conversion)
      const dailyRate = Math.pow(1 + r, 1/365) - 1;
      debug.log('Daily rate calculated:', dailyRate);
      
      // Calculate earnings
      const dayEarn = P * dailyRate;
      const monthEarn = P * (Math.pow(1 + dailyRate, 30) - 1);
      const yearEarn = P * r; // APY is already annualized
      
      debug.log('Earnings calculated:', {
        dayEarn,
        monthEarn,
        yearEarn
      });
      
      const total = P + yearEarn;
      debug.log('Total calculated:', total);
      
      // Format numbers with appropriate precision
      const formattedDayEarn = formatNumber(dayEarn, 4);
      const formattedMonthEarn = formatNumber(monthEarn, 2);
      const formattedYearEarn = formatNumber(yearEarn, 2);
      const formattedTotal = formatNumber(total, 2);
      
      debug.log('Formatted results:', {
        formattedDayEarn,
        formattedMonthEarn,
        formattedYearEarn,
        formattedTotal
      });
      
      const summary = `With $${formatNumber(P)} at ${formatNumber(apy, 2)}% APY, you'll earn:`;
      
      const html = `
        <div style="margin-bottom:0.7em;">${summary}</div>
        <div>Daily: <b>$${formattedDayEarn}</b></div>
        <div>Monthly: <b>$${formattedMonthEarn}</b></div>
        <div>Yearly: <b>$${formattedYearEarn}</b></div>
        <div style="margin-top:0.7em;">Total after 1 year: <b>$${formattedTotal}</b></div>
      `;
      
      debug.log('HTML generated');
      
      // Show results and create chart with animation
      await new Promise(resolve => {
        showResult(html, true);
        createChart({ 
          daily: parseFloat(formattedDayEarn.replace(/,/g, '')), 
          monthly: parseFloat(formattedMonthEarn.replace(/,/g, '')), 
          yearly: parseFloat(formattedYearEarn.replace(/,/g, ''))
        });
        setTimeout(resolve, 200);
      });
      
      debug.log('Results displayed');
      
      // Show action buttons
      copyBtn.style.display = 'flex';
      shareBtn.style.display = 'flex';
      exportBtn.style.display = 'flex';
      
      showToast('Calculation completed successfully!', 'success');
      debug.log('Calculation completed successfully');
    } catch (error) {
      debug.error('Calculation error:', error);
      showToast('An error occurred during calculation.', 'error');
      showResult('', false);
    } finally {
      setTimeout(() => setLoading(false), 100);
      debug.log('Loading state cleared');
    }
  } catch (error) {
    debug.error('Critical error:', error);
    showToast('A critical error occurred. Please try again.', 'error');
  }
}

function showResult(html, visible) {
  resultDiv.innerHTML = html;
  if (visible) {
    resultDiv.classList.add('visible');
    copyBtn.style.display = 'block';
  } else {
    resultDiv.classList.remove('visible');
    copyBtn.style.display = 'none';
  }
}

form.addEventListener('submit', function(e) {
  e.preventDefault();
  calculate();
});

// Initialize share and export functionality
const shareSheet = createShareSheet();
const exportOptions = createExportOptions();

shareBtn.addEventListener('click', () => {
  shareSheet.classList.add('visible');
});

exportBtn.addEventListener('click', () => {
  exportOptions.classList.add('visible');
});

// Close share sheet and export options when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.share-sheet') && !e.target.closest('#share-btn')) {
    shareSheet.classList.remove('visible');
  }
  if (!e.target.closest('.export-options') && !e.target.closest('#export-btn')) {
    exportOptions.classList.remove('visible');
  }
});

// Focus styles for accessibility
[apyInput, amountInput, calcBtn, clearBtn, copyBtn].forEach(el => {
  el.addEventListener('focus', e => {
    e.target.classList.add('focus-visible');
  });
  el.addEventListener('blur', e => {
    e.target.classList.remove('focus-visible');
  });
});

// Tooltip accessibility
document.querySelectorAll('.info-icon').forEach(icon => {
  icon.addEventListener('focus', function() {
    this.nextElementSibling.style.display = 'block';
  });
  icon.addEventListener('blur', function() {
    this.nextElementSibling.style.display = 'none';
  });
});

// PWA Update Handling
let newWorker = null;
let refreshing = false;

// Debug logging for PWA
const pwaDebug = {
  log: function(message, type = 'info') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PWA ${type.toUpperCase()}] ${message}`);
    }
  },
  error: function(message, error) {
    console.error(`[PWA ERROR] ${message}`, error);
  }
};

// Enhanced Service Worker Registration
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    pwaDebug.log('Service Worker not supported', 'warn');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('service-worker.js');
    pwaDebug.log('Service Worker registered successfully', 'success');

    // Handle updates
    registration.addEventListener('updatefound', () => {
      newWorker = registration.installing;
      pwaDebug.log('New service worker installing...', 'info');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          pwaDebug.log('New content available', 'info');
          showUpdateNotification('new');
        }
      });
    });

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      pwaDebug.log('New service worker activated, reloading...', 'info');
      window.location.reload();
    });

    // Handle service worker errors
    registration.addEventListener('error', (error) => {
      pwaDebug.error('Service Worker registration failed', error);
    });

    return registration;
  } catch (error) {
    pwaDebug.error('Service Worker registration failed', error);
  }
}

// Enhanced Update Check
async function checkForUpdates() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      pwaDebug.log('Update check completed', 'info');
    }
  } catch (error) {
    pwaDebug.error('Update check failed', error);
  }
}

// Periodic update check
setInterval(checkForUpdates, 3600000); // 1 hour

// Enhanced Update Notification
function showUpdateNotification(version) {
  const updateBanner = document.createElement('div');
  updateBanner.className = 'update-banner';
  updateBanner.innerHTML = `
    <div class="update-content">
      <span>A new version (${version}) is available!</span>
      <div class="update-buttons">
        <button id="updateNow">Update Now</button>
        <button id="updateLater">Later</button>
      </div>
    </div>
  `;
  document.body.appendChild(updateBanner);

  // Add styles for the update banner
  const style = document.createElement('style');
  style.textContent = `
    .update-banner {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--container-bg);
      padding: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 -2px 10px #0005;
      backdrop-filter: blur(10px);
      z-index: 1000;
      animation: slideUp 0.3s ease-out;
    }
    .update-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    .update-buttons {
      display: flex;
      gap: 0.5rem;
    }
    .update-banner button {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }
    @media (max-width: 500px) {
      .update-content {
        flex-direction: column;
        text-align: center;
      }
      .update-buttons {
        width: 100%;
      }
      .update-buttons button {
        flex: 1;
      }
    }
  `;
  document.head.appendChild(style);

  // Handle update buttons
  document.getElementById('updateNow').addEventListener('click', async () => {
    try {
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        pwaDebug.log('Update initiated', 'info');
      }
      updateBanner.remove();
    } catch (error) {
      pwaDebug.error('Failed to initiate update', error);
      showToast('Failed to update. Please try again.', 'error');
    }
  });

  document.getElementById('updateLater').addEventListener('click', () => {
    updateBanner.remove();
    pwaDebug.log('Update postponed', 'info');
  });
}

// Enhanced PWA Install Prompt
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissBtn = document.getElementById('dismissBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  pwaDebug.log('Install prompt captured', 'info');
  
  // Show install banner after a delay
  setTimeout(() => {
    if (deferredPrompt) {
      installBanner.style.display = 'flex';
      pwaDebug.log('Install banner shown', 'info');
    }
  }, 3000);
});

installBtn.addEventListener('click', async () => {
  try {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        pwaDebug.log('PWA installed successfully', 'success');
        installBanner.style.display = 'none';
      } else {
        pwaDebug.log('PWA installation declined', 'info');
      }
      deferredPrompt = null;
    }
  } catch (error) {
    pwaDebug.error('PWA installation failed', error);
    showToast('Installation failed. Please try again.', 'error');
  }
});

dismissBtn.addEventListener('click', () => {
  installBanner.style.display = 'none';
  pwaDebug.log('Install banner dismissed', 'info');
});

// Initialize PWA
window.addEventListener('load', () => {
  registerServiceWorker().catch(error => {
    pwaDebug.error('Failed to initialize PWA', error);
  });
});

// Add loading overlay to DOM if it doesn't exist
if (!document.querySelector('.loading-overlay')) {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = `
    <div class="loading-spinner"></div>
  `;
  document.body.appendChild(loadingOverlay);
} 