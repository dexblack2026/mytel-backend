// Appwrite Configuration
// သင့် Appwrite Endpoint, Project ID နှင့် Function ID များကို စစ်ဆေးပါ
const APPWRITE_ENDPOINT = 'https://sgp.cloud.appwrite.io/v1';
const PROJECT_ID = '6a7ada870019eb567002';
const FUNCTION_ID = '6a7adcb8003a40f95152';

// Appwrite Client Initialise လုပ်ခြင်း
const client = new Appwrite.Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(PROJECT_ID);

const functions = new Appwrite.Functions(client);

/**
 * 1. Request OTP Function
 * Appwrite Function သို့ action: 'get-otp' ဖြင့် Request ပို့ခြင်း
 */
async function requestOtp() {
  const phoneInput = document.getElementById('login-phone');
  const phone = phoneInput ? phoneInput.value.trim() : '';

  if (!phone || phone.length < 9) {
    return showToast('❌ Mobile number မှန်ကန်စွာ ဖြည့်သွင်းပါ');
  }

  showToast('⚡ Sending OTP Request...');

  try {
    // createExecution သုံးခြင်းဖြင့် SDK က POST Method ဖြင့် သေချာ ပို့ပေးပါသည်
    const execution = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({
        action: 'get-otp',
        phone: phone
      }),
      false // Synchronous execution
    );

    let responseData = {};
    if (execution.responseBody) {
      responseData = typeof execution.responseBody === 'string' 
        ? JSON.parse(execution.responseBody) 
        : execution.responseBody;
    }

    if (responseData && responseData.success) {
      showToast('✅ OTP code ပို့ပြီးပါပြီ');
      startTimer(60);
    } else {
      showToast(`⚠️ ${responseData?.message || 'OTP တောင်းဆိုမှု မှားယွင်းနေပါသည်'}`);
    }
  } catch (err) {
    console.error("OTP Error Details:", err);
    showToast('❌ Server Connection Error');
  }
}

/**
 * 2. Handle Login & Validate OTP
 * Appwrite Function သို့ action: 'login' ဖြင့် OTP စစ်ဆေးရန် Request ပို့ခြင်း
 */
async function handleLogin() {
  const phoneInput = document.getElementById('login-phone');
  const otpInput = document.getElementById('login-otp');

  const phone = phoneInput ? phoneInput.value.trim() : '';
  const otp = otpInput ? otpInput.value.trim() : '';

  if (!phone || !otp) {
    return showToast('❌ Mobile number နှင့် OTP Code နှစ်ခုလုံး ဖြည့်ပါ');
  }

  showToast('⚡ Validating Session...');

  try {
    const execution = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({
        action: 'login',
        phone: phone,
        otp: otp
      }),
      false
    );

    let result = {};
    if (execution.responseBody) {
      result = typeof execution.responseBody === 'string' 
        ? JSON.parse(execution.responseBody) 
        : execution.responseBody;
    }

    if (result && result.success && result.data && result.data.errorCode === 200) {
      const resData = result.data.result;

      // Token များကို LocalStorage ထဲတွင် သိမ်းဆည်းခြင်း
      if (resData.access_token) localStorage.setItem("access_token", resData.access_token);
      if (resData.thirdPartyToken) localStorage.setItem("thirdPartyToken", resData.thirdPartyToken);
      if (resData.refresh_token) localStorage.setItem("refresh_token", resData.refresh_token);
      localStorage.setItem("user_phone", phone);

      showToast('✅ Login Successful!');
      setTimeout(() => showDashboard(phone), 500);
    } else {
      showToast(`❌ ${result?.message || 'OTP မှားယွင်းနေပါသည်'}`);
    }
  } catch (error) {
    console.error("Login Error Details:", error);
    showToast('❌ Login မအောင်မြင်ပါ');
  }
}
