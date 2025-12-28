import axios from "axios";

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";

const sendOtpBrevo = async (toEmail, otp) => {
  try {
    const response = await axios.post(
      BREVO_URL,
      {
        sender: {
          email: process.env.BREVO_SENDER_EMAIL,
          name: process.env.BREVO_SENDER_NAME || "App"
        },
        to: [{ email: toEmail }],
        subject: "OTP Verification",
        htmlContent: `
          <h2>OTP Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This OTP is valid for 5 minutes.</p>
        `
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY, // 🔑 THIS FIXES 401
          "Content-Type": "application/json",
          Accept: "application/json"
        },
        timeout: 5000
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "Brevo API Error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send OTP email");
  }
};

export default sendOtpBrevo;
