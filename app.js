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

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <svg class="toast-icon" viewBox="0 0 20 20" fill="currentColor">
      ${type === 'success' ? '<path d="M8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"/>' :
        type === 'error' ? '<path d="M15 5L10 10L5 5L4 6L9 11L4 16L5 17L10 12L15 17L16 16L11 11L16 6L15 5Z"/>' :
        '<path d="M10 2C5.58 2 2 5.58 2 10C2 14.42 5.58 18 10 18C14.42 18 18 14.42 18 10C18 5.58 14.42 2 10 2ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z"/>'}
    </svg>
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  
  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Enhanced Input Validation
function validateInput(input, errorDiv, validationRules) {
  const wrapper = input.closest('.input-wrapper');
  const value = input.value.replace(/,/g, '');
  let error = '';

  // Remove existing validation classes
  wrapper.classList.remove('valid', 'invalid');

  // Check each validation rule
  for (const rule of validationRules) {
    if (!rule.validate(value)) {
      error = rule.message;
      wrapper.classList.add('invalid');
      break;
    }
  }

  // If no errors, mark as valid
  if (!error) {
    wrapper.classList.add('valid');
  }

  // Update error message
  errorDiv.textContent = error;
  input.setAttribute('aria-invalid', error ? 'true' : 'false');

  return !error;
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
  validateInput(apyInput, apyError, apyRules);
});

amountInput.addEventListener('input', () => {
  let val = amountInput.value.replace(/,/g, '');
  amountInput.value = val;
  validateInput(amountInput, amountError, amountRules);
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

function createChart(principal, yearEarn, monthEarn, dayEarn) {
  const ctx = document.getElementById('earningsChart').getContext('2d');
  
  if (earningsChart) {
    earningsChart.destroy();
  }

  // Calculate additional metrics for enhanced visualization
  const totalEarnings = yearEarn;
  const dailyPercentage = (dayEarn / totalEarnings) * 100;
  const monthlyPercentage = (monthEarn / totalEarnings) * 100;
  const yearlyPercentage = 100;

  const data = {
    labels: ['Daily', 'Monthly', 'Yearly'],
    datasets: [{
      label: 'Earnings',
      data: [dayEarn, monthEarn, yearEarn],
      backgroundColor: [
        'rgba(52, 122, 255, 0.7)',
        'rgba(52, 122, 255, 0.8)',
        'rgba(52, 122, 255, 0.9)'
      ],
      borderColor: [
        'rgba(52, 122, 255, 1)',
        'rgba(52, 122, 255, 1)',
        'rgba(52, 122, 255, 1)'
      ],
      borderWidth: 1
    }]
  };

  // Add percentage dataset for radar chart
  const percentageData = {
    labels: ['Daily', 'Monthly', 'Yearly'],
    datasets: [{
      label: 'Percentage of Yearly Earnings',
      data: [dailyPercentage, monthlyPercentage, yearlyPercentage],
      backgroundColor: 'rgba(52, 122, 255, 0.2)',
      borderColor: 'rgba(52, 122, 255, 1)',
      borderWidth: 2,
      pointBackgroundColor: 'rgba(52, 122, 255, 1)',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: 'rgba(52, 122, 255, 1)'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            if (chartType === 'radar') {
              return `${value.toFixed(1)}% of yearly earnings`;
            }
            return `$${formatNumber(value)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            if (chartType === 'radar') {
              return value + '%';
            }
            return '$' + formatNumber(value);
          }
        }
      }
    }
  };

  // Add chart type specific options
  switch (chartType) {
    case 'line':
      options.elements = {
        line: {
          tension: 0.4
        },
        point: {
          radius: 4,
          hoverRadius: 6
        }
      };
      break;
    case 'pie':
    case 'doughnut':
      options.plugins.legend.display = true;
      options.plugins.legend.position = 'bottom';
      if (chartType === 'doughnut') {
        options.cutout = '60%';
      }
      break;
    case 'radar':
      options.scales.r = {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.7)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          backdropColor: 'transparent'
        }
      };
      break;
    case 'polarArea':
      options.plugins.legend.display = true;
      options.plugins.legend.position = 'bottom';
      options.scales.r = {
        ticks: {
          display: false
        }
      };
      break;
  }

  earningsChart = new Chart(ctx, {
    type: chartType,
    data: chartType === 'radar' ? percentageData : data,
    options: options
  });

  // Add chart type selector
  const chartContainer = document.querySelector('.chart-container');
  if (!document.querySelector('.chart-type-selector')) {
    const selector = document.createElement('div');
    selector.className = 'chart-type-selector';
    selector.innerHTML = `
      <button class="chart-type-btn active" data-type="bar">Bar</button>
      <button class="chart-type-btn" data-type="line">Line</button>
      <button class="chart-type-btn" data-type="pie">Pie</button>
      <button class="chart-type-btn" data-type="doughnut">Doughnut</button>
      <button class="chart-type-btn" data-type="radar">Radar</button>
      <button class="chart-type-btn" data-type="polarArea">Polar</button>
    `;
    chartContainer.insertBefore(selector, chartContainer.firstChild);

    // Add event listeners for chart type buttons
    selector.querySelectorAll('.chart-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        selector.querySelectorAll('.chart-type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chartType = btn.dataset.type;
        createChart(principal, yearEarn, monthEarn, dayEarn);
      });
    });
  }
}

// Share Functionality
const shareBtn = document.getElementById('share-btn');
const exportBtn = document.getElementById('export-btn');

function createShareSheet() {
  const shareSheet = document.createElement('div');
  shareSheet.className = 'share-sheet';
  shareSheet.innerHTML = `
    <div class="share-header">
      <h3>Share Results</h3>
      <button class="close-btn" aria-label="Close">×</button>
    </div>
    <div class="share-options">
      <div class="share-option" data-type="copy">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z"/>
        </svg>
        <span>Copy</span>
      </div>
      <div class="share-option" data-type="whatsapp">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M16.75 13.96C17 13.94 17.24 13.93 17.5 13.93C19.43 13.93 21 15.5 21 17.43C21 19.36 19.43 20.93 17.5 20.93C15.57 20.93 14 19.36 14 17.43C14 17.17 14.01 16.93 14.03 16.68L16.75 13.96ZM12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/>
        </svg>
        <span>WhatsApp</span>
      </div>
      <div class="share-option" data-type="telegram">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM16.64 8.8C16.49 10.38 15.84 14.22 15.51 15.99C15.37 16.74 15.09 16.99 14.83 17.02C14.25 17.07 13.81 16.64 13.25 16.27C12.37 15.69 11.87 15.33 11.02 14.77C10.89 14.68 10.76 14.59 10.62 14.5C10.55 14.45 10.48 14.4 10.41 14.35C10.34 14.3 10.27 14.25 10.2 14.2C10.13 14.15 10.06 14.1 9.99 14.05C9.92 14 9.85 13.95 9.78 13.9C9.71 13.85 9.64 13.8 9.57 13.75C9.5 13.7 9.43 13.65 9.36 13.6C9.29 13.55 9.22 13.5 9.15 13.45C9.08 13.4 9.01 13.35 8.94 13.3C8.87 13.25 8.8 13.2 8.73 13.15C8.66 13.1 8.59 13.05 8.52 13C8.45 12.95 8.38 12.9 8.31 12.85C8.24 12.8 8.17 12.75 8.1 12.7C8.03 12.65 7.96 12.6 7.89 12.55C7.82 12.5 7.75 12.45 7.68 12.4C7.61 12.35 7.54 12.3 7.47 12.25C7.4 12.2 7.33 12.15 7.26 12.1C7.19 12.05 7.12 12 7.05 11.95C6.98 11.9 6.91 11.85 6.84 11.8C6.77 11.75 6.7 11.7 6.63 11.65C6.56 11.6 6.49 11.55 6.42 11.5C6.35 11.45 6.28 11.4 6.21 11.35C6.14 11.3 6.07 11.25 6 11.2C5.93 11.15 5.86 11.1 5.79 11.05C5.72 11 5.65 10.95 5.58 10.9C5.51 10.85 5.44 10.8 5.37 10.75C5.3 10.7 5.23 10.65 5.16 10.6C5.09 10.55 5.02 10.5 4.95 10.45C4.88 10.4 4.81 10.35 4.74 10.3C4.67 10.25 4.6 10.2 4.53 10.15C4.46 10.1 4.39 10.05 4.32 10C4.25 9.95 4.18 9.9 4.11 9.85C4.04 9.8 3.97 9.75 3.9 9.7C3.83 9.65 3.76 9.6 3.69 9.55C3.62 9.5 3.55 9.45 3.48 9.4C3.41 9.35 3.34 9.3 3.27 9.25C3.2 9.2 3.13 9.15 3.06 9.1C2.99 9.05 2.92 9 2.85 8.95C2.78 8.9 2.71 8.85 2.64 8.8C2.57 8.75 2.5 8.7 2.43 8.65C2.36 8.6 2.29 8.55 2.22 8.5C2.15 8.45 2.08 8.4 2.01 8.35C1.94 8.3 1.87 8.25 1.8 8.2C1.73 8.15 1.66 8.1 1.59 8.05C1.52 8 1.45 7.95 1.38 7.9C1.31 7.85 1.24 7.8 1.17 7.75C1.1 7.7 1.03 7.65 0.96 7.6C0.89 7.55 0.82 7.5 0.75 7.45C0.68 7.4 0.61 7.35 0.54 7.3C0.47 7.25 0.4 7.2 0.33 7.15C0.26 7.1 0.19 7.05 0.12 7C0.05 6.95 0 6.9 0 6.85C0 6.8 0 6.75 0 6.7C0 6.65 0 6.6 0 6.55C0 6.5 0 6.45 0 6.4C0 6.35 0 6.3 0 6.25C0 6.2 0 6.15 0 6.1C0 6.05 0 6 0 5.95C0 5.9 0 5.85 0 5.8C0 5.75 0 5.7 0 5.65C0 5.6 0 5.55 0 5.5C0 5.45 0 5.4 0 5.35C0 5.3 0 5.25 0 5.2C0 5.15 0 5.1 0 5.05C0 5 0 4.95 0 4.9C0 4.85 0 4.8 0 4.75C0 4.7 0 4.65 0 4.6C0 4.55 0 4.5 0 4.45C0 4.4 0 4.35 0 4.3C0 4.25 0 4.2 0 4.15C0 4.1 0 4.05 0 4C0 3.95 0 3.9 0 3.85C0 3.8 0 3.75 0 3.7C0 3.65 0 3.6 0 3.55C0 3.5 0 3.45 0 3.4C0 3.35 0 3.3 0 3.25C0 3.2 0 3.15 0 3.1C0 3.05 0 3 0 2.95C0 2.9 0 2.85 0 2.8C0 2.75 0 2.7 0 2.65C0 2.6 0 2.55 0 2.5C0 2.45 0 2.4 0 2.35C0 2.3 0 2.25 0 2.2C0 2.15 0 2.1 0 2.05C0 2 0 1.95 0 1.9C0 1.85 0 1.8 0 1.75C0 1.7 0 1.65 0 1.6C0 1.55 0 1.5 0 1.45C0 1.4 0 1.35 0 1.3C0 1.25 0 1.2 0 1.15C0 1.1 0 1.05 0 1C0 0.95 0 0.9 0 0.85C0 0.8 0 0.75 0 0.7C0 0.65 0 0.6 0 0.55C0 0.5 0 0.45 0 0.4C0 0.35 0 0.3 0 0.25C0 0.2 0 0.15 0 0.1C0 0.05 0 0 0 0Z"/>
        </svg>
        <span>Telegram</span>
      </div>
      <div class="share-option" data-type="twitter">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M22.46 6C21.69 6.35 20.86 6.58 20 6.69C20.88 6.16 21.56 5.32 21.88 4.31C21.05 4.81 20.13 5.16 19.16 5.36C18.37 4.5 17.26 4 16 4C13.65 4 11.73 5.92 11.73 8.29C11.73 8.63 11.77 8.96 11.84 9.27C8.28 9.09 5.11 7.38 3 4.79C2.63 5.42 2.42 6.16 2.42 6.94C2.42 8.43 3.17 9.75 4.33 10.5C3.62 10.5 2.96 10.3 2.38 10C2.38 10 2.38 10 2.38 10.03C2.38 12.11 3.86 13.85 5.82 14.24C5.46 14.34 5.08 14.39 4.69 14.39C4.42 14.39 4.15 14.36 3.89 14.31C4.43 16 6 17.26 7.89 17.29C6.43 18.45 4.58 19.13 2.56 19.13C2.22 19.13 1.88 19.11 1.54 19.07C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79C20.33 8.6 20.33 8.42 20.32 8.23C21.16 7.63 21.88 6.87 22.46 6Z"/>
        </svg>
        <span>Twitter</span>
      </div>
    </div>
  `;

  document.body.appendChild(shareSheet);

  // Handle share options
  shareSheet.querySelectorAll('.share-option').forEach(option => {
    option.addEventListener('click', () => {
      const type = option.dataset.type;
      shareResults(type);
      shareSheet.classList.remove('visible');
    });
  });

  // Handle close button
  shareSheet.querySelector('.close-btn').addEventListener('click', () => {
    shareSheet.classList.remove('visible');
  });

  return shareSheet;
}

function shareResults(type) {
  const resultText = resultDiv.innerText;
  const shareData = {
    title: 'APY Interest Calculator Results',
    text: resultText,
    url: window.location.href
  };

  switch (type) {
    case 'copy':
      navigator.clipboard.writeText(resultText)
        .then(() => showToast('Results copied to clipboard!', 'success'))
        .catch(() => showToast('Failed to copy results.', 'error'));
      break;
    case 'whatsapp':
      window.open(`https://wa.me/?text=${encodeURIComponent(resultText)}`);
      break;
    case 'telegram':
      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(resultText)}`);
      break;
    case 'twitter':
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(resultText)}&url=${encodeURIComponent(window.location.href)}`);
      break;
  }
}

// Export Functionality
function createExportOptions() {
  const exportOptions = document.createElement('div');
  exportOptions.className = 'export-options';
  exportOptions.innerHTML = `
    <div class="export-option" data-type="pdf">Export as PDF</div>
    <div class="export-option" data-type="csv">Export as CSV</div>
  `;

  document.body.appendChild(exportOptions);

  exportOptions.querySelectorAll('.export-option').forEach(option => {
    option.addEventListener('click', () => {
      const type = option.dataset.type;
      exportResults(type);
      exportOptions.classList.remove('visible');
    });
  });

  return exportOptions;
}

function exportResults(type) {
  const resultText = resultDiv.innerText;
  
  switch (type) {
    case 'pdf':
      // Implement PDF export
      showToast('PDF export coming soon!', 'info');
      break;
    case 'csv':
      // Implement CSV export
      const csv = `Type,Amount\nPrincipal,${amountInput.value}\nAPY,${apyInput.value}%\n${resultText.split('\n').join('\n')}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'apy-calculator-results.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      break;
  }
}

// Enhanced Calculation
async function calculate() {
  const apy = parseFloat(apyInput.value.replace(/,/g, ''));
  const amount = parseFloat(amountInput.value.replace(/,/g, ''));
  
  const isApyValid = validateInput(apyInput, apyError, apyRules);
  const isAmountValid = validateInput(amountInput, amountError, amountRules);
  
  if (!isApyValid || !isAmountValid) {
    showToast('Please fix the errors before calculating.', 'error');
    showResult('', false);
    return;
  }

  showLoading();
  
  try {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Compounding APY calculation (daily compounding)
    const n = 365;
    const r = apy / 100;
    const P = amount;
    const A_year = P * Math.pow(1 + r / n, n * 1);
    const yearEarn = A_year - P;
    const A_month = P * Math.pow(1 + r / n, n / 12);
    const monthEarn = A_month - P;
    const A_day = P * Math.pow(1 + r / n, 1);
    const dayEarn = A_day - P;
    
    const summary = `With $${formatNumber(P)} at ${formatNumber(apy, 2)}% APY, you'll earn:`;
    const total = P + yearEarn;
    
    const html = `
      <div style="margin-bottom:0.7em;">${summary}</div>
      <div>Year Earn: <b>$${formatNumber(yearEarn)}</b></div>
      <div>Month Earn: <b>$${formatNumber(monthEarn)}</b></div>
      <div>Day Earn: <b>$${formatNumber(dayEarn)}</b></div>
      <div style="margin-top:0.7em;">Total after 1 year: <b>$${formatNumber(total)}</b></div>
    `;
    
    // Show results and create chart
    showResult(html, true);
    createChart(P, yearEarn, monthEarn, dayEarn);
    
    // Show action buttons
    copyBtn.style.display = 'flex';
    shareBtn.style.display = 'flex';
    exportBtn.style.display = 'flex';
    
    showToast('Calculation completed successfully!', 'success');
  } catch (error) {
    showToast('An error occurred during calculation.', 'error');
    showResult('', false);
  } finally {
    hideLoading();
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

// Check for updates every hour
setInterval(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.update();
      }
    });
  }
}, 3600000); // 1 hour

// Listen for the custom update message from the service worker
navigator.serviceWorker.addEventListener('message', event => {
  if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
    showUpdateNotification(event.data.version);
  }
});

// Handle the waiting service worker
navigator.serviceWorker.addEventListener('controllerchange', () => {
  if (refreshing) return;
  refreshing = true;
  window.location.reload();
});

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
  document.getElementById('updateNow').addEventListener('click', () => {
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    updateBanner.remove();
  });

  document.getElementById('updateLater').addEventListener('click', () => {
    updateBanner.remove();
  });
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification
            showUpdateNotification('new');
          }
        });
      });
    });
  });
}

// PWA install prompt
let deferredPrompt;
const installBanner = document.getElementById('installBanner');
const installBtn = document.getElementById('installBtn');
const dismissBtn = document.getElementById('dismissBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.style.display = 'flex';
});
installBtn.addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      installBanner.style.display = 'none';
    }
    deferredPrompt = null;
  }
});
dismissBtn.addEventListener('click', () => {
  installBanner.style.display = 'none';
}); 