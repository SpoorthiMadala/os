import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getAuthorizedEmails = () => {
  try {
    const filePath = path.join(__dirname, '../config/authorizedEmails.txt');
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    return fileContent
      .split('\n')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean);

  } catch (err) {
    console.error("Email file read error:", err);
    return [];
  }
};

export const isEmailAuthorized = (email) => {
  const normalizedEmail = email.toLowerCase().trim();
  const authorizedEmails = getAuthorizedEmails();
  return authorizedEmails.includes(normalizedEmail);
};
