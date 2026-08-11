// Appwrite Configuration & Custom Domain setup
const APPWRITE_ENDPOINT = "https://sgp.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6a7ada870019eb567002";
const APPWRITE_FUNCTION_ID = "6a7adcb8003a40f95152";

// Backend URL targeting Appwrite Function
const BACKEND_URL = `${APPWRITE_ENDPOINT}/functions/${APPWRITE_FUNCTION_ID}/executions`;

let timerInterval = null;
let selectedPackageUssd = null;

const packagesData = {
  MPT: [
    { id: 1, size: '925 MB', price: '1,000 Ks', days: '30 Days', ussd: '*979*1*1#' },
    { id: 2, size: '1.8 GB', price: '1,999 Ks', days: '30 Days', ussd: '*979*1*2#' }
  ],
  ATOM: [
    { id: 1, size: '1 GB', price: '1,200 Ks', days: '30 Days', ussd: '*979*1#' },
    { id: 2, size: '2.5 GB', price: '2,500 Ks', days: '30 Days', ussd: '*979*2#' }
  ],
  Ooredoo: [
    { id: 1, size: '1.2 GB', price: '1,250 Ks', days: '30 Days', ussd: '*140*1#' },
    { id: 2, size: '3 GB', price: '2,900 Ks', days: '30 Days', ussd: '*140*2#' }
  ],
  MyTel: [
    { id: 1, size: '1.5 GB', price: '1,100 Ks', days: '30 Days', ussd: '*966*1#' },
    { id: 2, size: '4 GB', price: '2,800 Ks', days: '30 Days', ussd: '*966*2#' }
  ]
};

window.onload = function() {
  const token = localStorage.getItem('access_token') || localStorage.getItem('thirdPartyToken');
  const savedPhone = localStorage.getItem('user_phone');
  
  if (token && savedPhone) {
    showDashboard(savedPhone);
  }
};

function showToast(message) {
  const toast = document.getElementById('status-toast');
  if (toast) {
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function startTimer(seconds) {
  const sendBtn = document.getElementById('send-otp-btn');
  if (!sendBtn) return;  
  sendBtn.disabled = true;
  let timeLeft = seconds;
  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      sendBtn.innerText = "Send OTP";
      sendBtn.disabled = false;
    } else {
      sendBtn.innerText = `${timeLeft}s`;
      timeLeft--;
    }
  }, 1000);
}

// 1. Request OTP
async function requestOtp() {
  const phone = document.getElementById('login-phone').value.trim();

  if (!phone || phone.length < 9) {
    return showToast('❌ Phone number မှန်ကန်စွာ ဖြည့်ပါ');
  }

  showToast('⚡ Sending OTP Request...');

  try {
    const res = await fetch(`${BACKEND_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-appwrite-project': APPWRITE_PROJECT_ID
      },
      body: JSON.stringify({
        path: '/api/get-otp',
        method: 'GET',
        query: { phone }
      })
    });
    
    const data = await res.json();
    const responseBody = typeof data.responseBody === 'string' ? JSON.parse(data.responseBody) : data.responseBody;

    if (responseBody && responseBody.success) {
      showToast('✅ OTP code ပို့ပြီးပါပြီ');
      startTimer(60);
    } else {
      showToast(`⚠️ ${responseBody?.message || 'OTP တောင်းဆိုမှု မှားယွင်းနေပါသည်။'}`);
    }
  } catch (err) {
    console.error("OTP Error:", err);
    showToast('❌ Server Connection Error');
  }
}

// 2. Login
async function handleLogin() {
  const phone = document.getElementById('login-phone').value.trim();
  const otp = document.getElementById('login-otp').value.trim();

  if (!phone || !otp) {
    return showToast('❌ Phone number နှင့် OTP ဖြည့်ပါ');
  }

  showToast('⚡ Validating OTP...');

  try {
    const res = await fetch(`${BACKEND_URL}`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-appwrite-project": APPWRITE_PROJECT_ID
      },
      body: JSON.stringify({
        path: '/api/login',
        method: 'POST',
        body: JSON.stringify({ phone, otp })
      })
    });

    const data = await res.json();
    const result = typeof data.responseBody === 'string' ? JSON.parse(data.responseBody) : data.responseBody;

    if (result && result.success && result.data && result.data.errorCode === 200) {
      const resData = result.data.result;

      if (resData.access_token) localStorage.setItem("access_token", resData.access_token);
      if (resData.thirdPartyToken) localStorage.setItem("thirdPartyToken", resData.thirdPartyToken);
      if (resData.refresh_token) localStorage.setItem("refresh_token", resData.refresh_token);
      localStorage.setItem("user_phone", phone);

      showToast('✅ Login Successful!');
      setTimeout(() => showDashboard(phone), 500);
    } else {
      showToast(`❌ ${result?.message || 'OTP မှားယွင်းနေပါသည်။'}`);
    }
  } catch (error) {
    console.error("Login Error:", error);
    showToast('❌ Login မအောင်မြင်ပါ');
  }
}

function showDashboard(phone) {
  document.getElementById('login-page').classList.remove('active');
  document.getElementById('dashboard-page').classList.add('active');
  document.getElementById('logged-user').innerText = `Logged in: ${phone}`;
  
  document.getElementById('phone').value = phone;
  document.getElementById('data-phone').value = phone;
  detectOperator('phone', 'topup-phone-group', 'topup-op-text', 'topup-logo');
  handleDataPhoneInput();
}

function handleLogout() {
  localStorage.clear();
  document.getElementById('dashboard-page').classList.remove('active');
  document.getElementById('login-page').classList.add('active');
  showToast('Logged out');
}

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  
  if (tab === 'topup') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('topup-tab').style.display = 'block';
    document.getElementById('data-tab').style.display = 'none';
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('topup-tab').style.display = 'none';
    document.getElementById('data-tab').style.display = 'block';
  }
}

function detectOperator(inputId, group, textId, logoId) {
  const phoneInput = document.getElementById(inputId).value.trim();
  const phoneGroup = document.getElementById(group);
  const operatorText = document.getElementById(textId);
  const logoCircle = document.getElementById(logoId);

  phoneGroup.className = 'form-group';
  logoCircle.innerText = '?';

  if (/^(092|094|095|098)/.test(phoneInput)) {
    phoneGroup.classList.add('mpt-theme');
    operatorText.innerText = 'MPT';
    logoCircle.innerText = 'M';
    return 'MPT';
  } else if (/^097/.test(phoneInput)) {
    phoneGroup.classList.add('atom-theme');
    operatorText.innerText = 'ATOM';
    logoCircle.innerText = 'A';
    return 'ATOM';
  } else if (/^099/.test(phoneInput)) {
    phoneGroup.classList.add('ooredoo-theme');
    operatorText.innerText = 'Ooredoo';
    logoCircle.innerText = 'O';
    return 'Ooredoo';
  } else if (/^096/.test(phoneInput)) {
    phoneGroup.classList.add('mytel-theme');
    operatorText.innerText = 'MyTel';
    logoCircle.innerText = 'Y';
    return 'MyTel';
  } else {
    operatorText.innerText = 'Unknown Operator';
    return null;
  }
}

function handleDataPhoneInput() {
  const operator = detectOperator('data-phone', 'data-phone-group', 'data-op-text', 'data-logo');
  const grid = document.getElementById('package-grid');
  selectedPackageUssd = null;

  if (operator && packagesData[operator]) {
    grid.innerHTML = packagesData[operator].map(pkg => `
      <div class="package-card" onclick="selectPackage(this, '${pkg.ussd}')">
        <div class="package-size">${pkg.size}</div>
        <div class="package-validity">${pkg.days}</div>
        <div class="package-price">${pkg.price}</div>
      </div>
    `).join('');
  } else {
    grid.innerHTML = `<div style="grid-column: span 2; text-align: center; color: #888; padding: 20px 0;">ဖုန်းနံပါတ် ဖြည့်ပါ</div>`;
  }
}

function selectPackage(element, ussd) {
  document.querySelectorAll('.package-card').forEach(card => card.classList.remove('selected'));
  element.classList.add('selected');
  selectedPackageUssd = ussd;
}

function processTopUp() {
  const phone = document.getElementById('phone').value.trim();
  const pin = document.getElementById('pin').value.trim();
  if (!phone || !pin) return showToast('❌ PIN ဖြည့်ပါ');
  window.location.href = `tel:${encodeURIComponent(`*123*${pin}#`)}`;
}

function processDataBuy() {
  if (!selectedPackageUssd) return showToast('❌ Package ရွေးပါ');
  window.location.href = `tel:${encodeURIComponent(selectedPackageUssd)}`;
}
