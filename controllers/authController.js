import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { isEmailAuthorized } from '../utils/emailAuth.js';

// Configure Brevo API client
const brevoClient = axios.create({
    baseURL: 'https://api.brevo.com/v3',
    headers: {
        'accept': 'application/json',
        'content-type': 'application/json'
    }
});

// In-memory cache to prevent duplicate email sends
const emailSendCache = new Map();

const canSendEmail = (email) => {
    const now = Date.now();
    const lastSent = emailSendCache.get(email);

    // Allow sending if never sent or last sent was more than 30 seconds ago
    if (!lastSent || (now - lastSent) > 30000) {
        emailSendCache.set(email, now);
        return true;
    }

    console.log('⚠️ Duplicate email send prevented for:', email);
    return false;
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP to email
export const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        // Check if email is authorized (from file)
        if (!isEmailAuthorized(email)) {
            return res.status(403).json({
                success: false,
                message: 'This email is not authorized. Please contact the administrator.'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save or update user with OTP
        let user = await User.findOne({ email: email.toLowerCase() });

        // Prevent duplicate OTP sends within 1 minute
        if (user && user.otpExpiry && user.otpExpiry > new Date()) {
            const timeSinceLastOTP = Date.now() - (user.otpExpiry.getTime() - 10 * 60 * 1000);
            if (timeSinceLastOTP < 60000) { // Less than 1 minute
                return res.status(429).json({
                    success: false,
                    message: 'OTP already sent. Please wait before requesting again.'
                });
            }
        }

        if (user) {
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            await user.save();
        } else {
            user = await User.create({
                email: email.toLowerCase(),
                otp,
                otpExpiry
            });
        }

        // Send OTP via Brevo API (with duplicate prevention)
        if (!canSendEmail(email)) {
            // Email was already sent recently, skip sending but still return success
            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully to your email'
            });
        }

        const emailData = {
            sender: {
                name: 'Marks Management System',
                email: process.env.BREVO_SENDER_EMAIL || 'noreply@marksmanagement.com'
            },
            to: [{ email: email }],
            subject: 'Your OTP for Marks Management System',
            htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">Marks Management System</h1>
                </div>
                <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hello,</p>
                    <p style="font-size: 16px; color: #374151; margin-bottom: 30px;">Your OTP for verification is:</p>
                    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #4F46E5; font-size: 48px; letter-spacing: 12px; margin: 0; font-weight: bold;">${otp}</h1>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                        <strong>⏰ This OTP will expire in 10 minutes.</strong>
                    </p>
                    <p style="font-size: 14px; color: #6b7280; margin-bottom: 30px;">
                        Please do not share this OTP with anyone for security reasons.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
                        If you didn't request this OTP, please ignore this email.
                    </p>
                </div>
            </div>
        `
        };

        console.log('📧 Sending OTP email to:', email);
        await brevoClient.post('/smtp/email', emailData, {
            headers: {
                'api-key': process.env.BREVO_API_KEY
            }
        });
        console.log('✅ OTP email sent successfully');

        res.status(200).json({
            success: true,
            message: 'OTP sent successfully to your email'
        });

    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP. Please try again.',
            error: error.message
        });
    }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check OTP expiry
        if (user.otpExpiry < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Verify OTP
        if (user.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Mark user as verified
        user.isVerified = true;
        user.otp = null;
        user.otpExpiry = null;
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            token,
            user: {
                email: user.email,
                isVerified: user.isVerified,
                hasSubmittedMarks: user.hasSubmittedMarks
            }
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP. Please try again.',
            error: error.message
        });
    }
};
