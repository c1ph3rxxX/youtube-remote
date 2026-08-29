import crypto from 'crypto';
import { addDevice, validateToken } from '../db/devices';
import { logger } from '../logger';

let currentPin: string | null = null;
let pinExpiry: number | null = null;
// Default 24 hours (86400000 ms) so PIN doesn't expire prematurely
const PIN_TIMEOUT = parseInt(process.env.PAIRING_TIMEOUT_MS || '86400000');

export function generatePin(): string {
  if (!currentPin || (pinExpiry && Date.now() > pinExpiry)) {
    currentPin = Math.floor(1000 + Math.random() * 9000).toString();
    pinExpiry = Date.now() + PIN_TIMEOUT;
    logger.info(`Pairing PIN: ${currentPin}`);
  }
  return currentPin;
}

export function validatePin(pin: string): boolean {
  if (!currentPin) generatePin();
  if (pinExpiry && Date.now() > pinExpiry) {
    generatePin();
  }
  return String(pin).trim() === currentPin;
}

export function consumePin(pin: string, deviceName: string = 'iPhone'): string | null {
  if (!validatePin(pin)) return null;
  const token = crypto.randomBytes(32).toString('hex');
  addDevice(token, deviceName);
  logger.info(`Device paired successfully: ${deviceName}`);
  return token;
}

export function isAuthenticated(token: string): boolean {
  if (!token) return false;
  const device = validateToken(token);
  return !!device;
}

export function forceGeneratePin(): string {
  currentPin = Math.floor(1000 + Math.random() * 9000).toString();
  pinExpiry = Date.now() + PIN_TIMEOUT;
  logger.info(`Pairing PIN regenerated: ${currentPin}`);
  return currentPin;
}

export function getPin(): string | null {
  if (!currentPin || (pinExpiry && Date.now() > pinExpiry)) {
    generatePin();
  }
  return currentPin;
}

