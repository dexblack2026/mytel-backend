// Appwrite Execution Configurations
const FUNCTION_URL = "https://sgp.cloud.appwrite.io/v1/functions/6a7adcb8003a40f95152/executions";
const PROJECT_ID = "6a7ada870019eb567002";

// 1. Request OTP Function
async function requestOtp() {
  const phoneInput = document.getElementById('login-phone');
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!phone || phone.length < 9) {
    return showToast('❌ Phone number မှန်ကန်စွာ ဖြည့်ပါ');
  }

  showToast('⚡ Sending OTP Request...');

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-appwrite-project': PROJECT_ID
      },
      body: JSON.stringify({
        action: 'get-otp',
        phone: phone
      })
    });
    
    const data = await res.json();
    let responseBody = data;
    
    // Appwrite Execution Response String ဖြစ်နေပါက Parse လုပ်ခြင်း
    if (data.responseBody) {
      responseBody = typeof data.responseBody === 'string' ? JSON.parse(data.responseBody) : data.responseBody;
    }

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

// 2. Validate OTP & Login Function
async function handleLogin() {
  const phoneInput = document.getElementById('login-phone');
  const otpInput = document.getElementById('login-otp');

  const phone = phoneInput ? phoneInput.value.trim() : '';
  const otp = otpInput ? otpInput.value.trim() : '';

  if (!phone || !otp) {
    return showToast('❌ Phone number နှင့် OTP ဖြည့်ပါ');
  }

  showToast('⚡ Validating OTP...');

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-appwrite-project': PROJECT_ID
      },
      body: JSON.stringify({
        action: 'login',
        phone: phone,
        otp: otp
      })
    });

    const data = await res.json();
    let result = data;

    if (data.responseBody) {
      result = typeof data.responseBody === 'string' ? JSON.parse(data.responseBody) : data.responseBody;
    }

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
