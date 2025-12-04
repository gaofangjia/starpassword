import { PasswordConfig } from '../types';

const ALPHABET_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const ALPHABET_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const HEX_UPPER = '0123456789ABCDEF';
const HEX_LOWER = '0123456789abcdef';

export const generateCustomPassword = (config: PasswordConfig): string => {
  let chars = '';
  if (config.useLowercase) chars += ALPHABET_LOWER;
  if (config.useUppercase) chars += ALPHABET_UPPER;
  if (config.useNumbers) chars += NUMBERS;
  if (config.useSymbols) chars += SYMBOLS;

  if (chars.length === 0) return '';

  let password = '';
  const array = new Uint32Array(config.length);
  window.crypto.getRandomValues(array);

  for (let i = 0; i < config.length; i++) {
    password += chars[array[i] % chars.length];
  }

  return password;
};

export const generatePin = (length: number): string => {
  let pin = '';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  
  for (let i = 0; i < length; i++) {
    pin += NUMBERS[array[i] % NUMBERS.length];
  }
  return pin;
};

export const generateUUID = (): string => {
  return crypto.randomUUID();
};

export const generateMacAddress = (separator: string, uppercase: boolean): string => {
  const hexChars = uppercase ? HEX_UPPER : HEX_LOWER;
  const array = new Uint32Array(6); // 6 bytes
  window.crypto.getRandomValues(array);
  
  const parts: string[] = [];
  for (let i = 0; i < 6; i++) {
    // Use the random value to pick two hex chars
    const val = array[i];
    const char1 = hexChars[(val & 0xF)];
    const char2 = hexChars[(val >> 4) & 0xF];
    parts.push(`${char1}${char2}`);
  }
  
  return parts.join(separator);
};