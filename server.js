const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const MYTEL_BASE_URL = "https://apis.mytel.com.mm";

const commonHeaders = {
  'User-Agent': 'okhttp/4.9.1',
  'Accept-Language': 'en',
  'Accept-Encoding': 'gzip'
};

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ status: "online", message: "Mytel Proxy API is running" });
});

// 1. GET OTP (Check Account & Request OTP)
app.get('/api/get-otp', async (req, res) => {
  const { phone } = req.query;

  if (!phone) {
    return res.status(400).json({ success: false, message: 'Phone number is required' });
  }

  try {
    // Step A: Check Account
    await axios.get(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/action/check-account`, {
      params: { phoneNumber: phone },
      headers: commonHeaders
    });

    // Step B: Get OTP
    const otpResponse = await axios.get(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/method/otp/get-otp`, {
      params: { phoneNumber: phone },
      headers: commonHeaders
    });

    return res.json({
      success: true,
      data: otpResponse.data
    });
  } catch (error) {
    console.error("OTP Request Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to request OTP',
      error: error.response?.data || error.message
    });
  }
});

// 2. VALIDATE OTP (Validate OTP & Return Tokens)
app.post('/api/login', async (req, res) => {
  const { phone, otp, deviceId } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
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

  try {
    const response = await axios.post(`${MYTEL_BASE_URL}/myid/authen/v1.0/login/method/otp/validate-otp`, payload, {
      headers: {
        ...commonHeaders,
        'Content-Type': 'application/json; charset=UTF-8'
      }
    });

    return res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error("Login Error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: 'OTP Validation Failed',
      error: error.response?.data || error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
