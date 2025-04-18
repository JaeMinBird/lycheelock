import { authenticator } from 'otplib';
import qrcode from 'qrcode-generator';

/**
 * Generate a random secret for TOTP
 */
export const generateTotpSecret = (): string => {
  return authenticator.generateSecret();
};

/**
 * Generate a TOTP based on the secret
 */
export const generateTotp = (secret: string): string => {
  return authenticator.generate(secret);
};

/**
 * Verify a TOTP
 */
export const verifyTotp = (token: string, secret: string): boolean => {
  return authenticator.verify({ token, secret });
};

/**
 * Generate a QR code for setting up TOTP in an authenticator app
 */
export const generateQRCode = (username: string, secret: string): string => {
  const otpAuthUrl = authenticator.keyuri(username, 'LycheeLock', secret);
  
  const qr = qrcode(0, 'L');
  qr.addData(otpAuthUrl);
  qr.make();
  
  return qr.createDataURL(4);
}; 