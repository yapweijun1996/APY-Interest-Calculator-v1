document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('calc-form');
  const resultDiv = document.getElementById('result');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const apyInput = document.getElementById('apy').value;
    const amountInput = document.getElementById('amount').value;

    const apy = parseFloat(apyInput);
    const P = parseFloat(amountInput);

    if (isNaN(apy) || isNaN(P) || apy < 0 || P < 0) {
      resultDiv.textContent = 'Please enter valid positive numbers for APY and amount.';
      return;
    }

    // APY (Annual Percentage Yield) to decimal
    const r = apy / 100;
    // Daily compounding rate
    const dailyRate = Math.pow(1 + r, 1 / 365) - 1;

    // Earnings calculations
    const dayEarn = P * dailyRate;
    const monthEarn = P * (Math.pow(1 + dailyRate, 30) - 1);
    const yearEarn = P * (Math.pow(1 + r, 1) - 1);
    const total = P + yearEarn;

    // Display results
    resultDiv.innerHTML = `
      <p>Daily Earnings: $${dayEarn.toFixed(2)}</p>
      <p>Monthly Earnings: $${monthEarn.toFixed(2)}</p>
      <p>Yearly Earnings: $${yearEarn.toFixed(2)}</p>
      <p>Total after 1 year: $${total.toFixed(2)}</p>
    `;
  });

  // PWA: register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('SW registration failed', err));
  }

  // Version check and update banner logic
  const updateBanner = document.getElementById('update-banner');
  const reloadBtn = document.getElementById('reload-btn');
  let currentVersion;

  async function checkVersion() {
    try {
      const res = await fetch('version.json', { cache: 'no-store' });
      const data = await res.json();
      if (!currentVersion) {
        currentVersion = data.version;
      } else if (data.version !== currentVersion) {
        updateBanner.style.display = 'block';
      }
    } catch (err) {
      console.error('Version check failed', err);
    }
  }

  checkVersion();
  setInterval(checkVersion, 60000); // check every minute

  reloadBtn.addEventListener('click', () => location.reload(true));
}); 