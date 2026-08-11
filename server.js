const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Preflight Request Handle လုပ်ခြင်း
  if (req.method === 'OPTIONS') {
    return res.empty({ headers });
  }

  const MYTEL_BASE_URL = "https://apis.mytel.com.mm";
  const commonHeaders = {
    'User-Agent': 'okhttp/4.9.1',
    'Accept-Language': 'en',
    'Accept-Encoding': 'gzip'
  };

  // Request Body ကို Parse လုပ်ခြင်း
  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
  } catch (e) {
    body = {};
  }

  // Appwrite Function သို့ ပို့လိုက်သော Action / Path / Query များကို ရယူခြင်း
  const action = body.action || req.query?.action || body.path || req.path;
  const phone = body.phone || req.query?.phone;
  const otp = body.otp || req.query?.otp;

  log(`Action Triggered: ${action}`);
  log(`Request Method: ${req.method}`);

  try {
    // 1. GET OTP (action/path ကို စစ်ဆေးခြင်း)
    if (action === 'get-otp' || action === '/api/get-otp') {
      if (!phone) {
        return res.json({ success: false, message: 'Phone number is required' }, 400, headers);
      }

      // Check Account
      await axios.get(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/action/check-account`, {
        params: { phoneNumber: phone },
        headers: commonHeaders
      });

      // Send OTP
      const otpRes = await axios.get(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/method/otp/get-otp`, {
        params: { phoneNumber: phone },
        headers: commonHeaders
      });

      return res.json({ success: true, data: otpRes.data }, 200, headers);
    }

    // 2. VALIDATE OTP / LOGIN
    if (action === 'login' || action === '/api/login') {
      const deviceId = body.deviceId || "dbf31bc085200074";

      if (!phone || !otp) {
        return res.json({ success: false, message: 'Phone and OTP are required' }, 400, headers);
      }

      const payload = {
        appVersion: "1.0.96",
        buildVersionApp: "227",
        deviceId: deviceId,
        imei: deviceId,
        os: "ANDROID OPPO PDVM00",
        osApp: "ANDROID",
        password: otp,
        phoneNumber: phone,
        version: "11"
      };

      const loginRes = await axios.post(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/method/otp/validate-otp`, payload, {
        headers: { ...commonHeaders, 'Content-Type': 'application/json; charset=UTF-8' }
      });

      return res.json({ success: true, data: loginRes.data }, 200, headers);
    }

    // Default Fallback Response (404 မပြန်ဘဲ 200 နဲ့ Error Message ပြန်ပေးမည်)
    return res.json({
      success: false,
      message: `Invalid action or route: ${action}`,
      receivedData: { action, phone }
    }, 200, headers);

  } catch (err) {
    error("Server Error Details: " + err.message);
    return res.json({
      success: false,
      message: err.message,
      error: err.response?.data || null
    }, 500, headers);
  }
};
