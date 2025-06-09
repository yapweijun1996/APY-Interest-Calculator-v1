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

function validateAPY(value) {
  if (value === '' || isNaN(value)) return 'APY is required.';
  if (value <= 0) return 'APY must be greater than 0.';
  if (value > 100) return 'APY must be 100 or less.';
  return '';
}
function validateAmount(value) {
  if (value === '' || isNaN(value)) return 'Amount is required.';
  if (value < 1) return 'Amount must be at least $1.';
  if (value > 10000000) return 'Amount must be $10,000,000 or less.';
  return '';
}
function showError(input, error, errorDiv) {
  if (error) {
    errorDiv.textContent = error;
    input.setAttribute('aria-invalid', 'true');
  } else {
    errorDiv.textContent = '';
    input.removeAttribute('aria-invalid');
  }
}
function formatInputValue(input) {
  let val = input.value.replace(/,/g, '');
  if (val === '' || isNaN(val)) return;
  input.value = formatNumber(Number(val), 2);
}
apyInput.addEventListener('input', () => {
  let val = apyInput.value.replace(/,/g, '');
  apyInput.value = val;
  showError(apyInput, validateAPY(val), apyError);
});
amountInput.addEventListener('input', () => {
  let val = amountInput.value.replace(/,/g, '');
  amountInput.value = val;
  showError(amountInput, validateAmount(val), amountError);
});
apyInput.addEventListener('blur', () => formatInputValue(apyInput));
amountInput.addEventListener('blur', () => formatInputValue(amountInput));

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

// Calculation logic
function calculate() {
  const apy = parseFloat(apyInput.value.replace(/,/g, ''));
  const amount = parseFloat(amountInput.value.replace(/,/g, ''));
  const apyErr = validateAPY(apy);
  const amtErr = validateAmount(amount);
  showError(apyInput, apyErr, apyError);
  showError(amountInput, amtErr, amountError);
  if (apyErr || amtErr) {
    showResult('', false);
    return;
  }
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
  showResult(html, true);
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
clearBtn.addEventListener('click', () => {
  apyInput.value = '';
  amountInput.value = '';
  apyError.textContent = '';
  amountError.textContent = '';
  showResult('', false);
  apyInput.focus();
});
copyBtn.addEventListener('click', () => {
  const text = resultDiv.innerText;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy Results'; }, 1200);
  });
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
// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js');
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