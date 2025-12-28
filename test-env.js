// Quick test to check if environment variables are loaded
import dotenv from 'dotenv';
dotenv.config();

console.log('=== Environment Variables Check ===');
console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? '✅ SET (length: ' + process.env.BREVO_API_KEY.length + ')' : '❌ NOT SET');
console.log('BREVO_SENDER_EMAIL:', process.env.BREVO_SENDER_EMAIL ? '✅ SET' : '❌ NOT SET');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('===================================');
