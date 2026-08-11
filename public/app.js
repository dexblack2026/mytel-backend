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
        query: { phone: phone },
        phone: phone
      })
    });
    
    const data = await res.json();
    let responseBody = data;
    
    // Parse Appwrite Function Execution Response
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
