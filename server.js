const axios = require('axios');

module.exports = async ({ req, res, log, error }) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Preflight Request Options Handling
  if (req.method === 'OPTIONS') {
    return res.empty({ headers });
  }

  const MYTEL_BASE_URL = "https://apis.mytel.com.mm";
  const commonHeaders = {
    'User-Agent': 'okhttp/4.9.1',
    'Accept-Language': 'en',
    'Accept-Encoding': 'gzip'
  };

  const path = req.path;

  try {
    // 1. GET OTP Request
    if (path === '/api/get-otp' || req.query.action === 'get-otp') {
      const phone = req.query.phone;
      if (!phone) {
        return res.json({ success: false, message: 'Phone number is required' }, 400, headers);
      }

      await axios.get(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/action/check-account`, {
        params: { phoneNumber: phone },
        headers: commonHeaders
      });

      const otpRes = await axios.get(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/method/otp/get-otp`, {
        params: { phoneNumber: phone },
        headers: commonHeaders
      });

      return res.json({ success: true, data: otpRes.data }, 200, headers);
    }

    // 2. VALIDATE OTP & LOGIN Request
    if (path === '/api/login' || req.query.action === 'login') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { phone, otp, deviceId } = body;

      if (!phone || !otp) {
        return res.json({ success: false, message: 'Phone and OTP are required' }, 400, headers);
      }

      const payload = {
        appVersion: "1.0.96",
        buildVersionApp: "227",
        deviceId: deviceId || "dbf31bc085200074",
        imei: deviceId || "dbf31bc085200074",
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

    return res.json({ success: false, message: 'Endpoint not found' }, 404, headers);

  } catch (err) {
    error("Error Details: " + err.message);
    return res.json({
      success: false,
      message: err.message,
      error: err.response?.data || null
    }, 500, headers);
  }
};
