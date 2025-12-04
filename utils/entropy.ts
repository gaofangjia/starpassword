import { EntropyResult } from '../types';

export const calculateEntropy = (password: string): EntropyResult => {
  if (!password) {
    return { score: 0, bits: 0, label: '空', color: 'bg-gray-700' };
  }

  // Determine pool size
  let poolSize = 0;
  if (/[a-z]/.test(password)) poolSize += 26;
  if (/[A-Z]/.test(password)) poolSize += 26;
  if (/[0-9]/.test(password)) poolSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += 32; // Rough estimate for symbols

  // Base entropy calculation: H = L * log2(N)
  const entropyBits = password.length * Math.log2(Math.max(poolSize, 1));
  const bits = Math.round(entropyBits);

  // Determine Label and Color based on bits
  // Standards: < 28 (Very Weak), < 36 (Weak), < 60 (Reasonable), < 128 (Strong)
  
  if (bits < 28) {
    return { score: 20, bits, label: '非常弱', color: 'bg-red-600' };
  } else if (bits < 45) {
    return { score: 40, bits, label: '弱', color: 'bg-orange-500' };
  } else if (bits < 60) {
    return { score: 60, bits, label: '良好', color: 'bg-yellow-400' };
  } else if (bits < 80) {
    return { score: 80, bits, label: '强', color: 'bg-green-500' };
  } else {
    return { score: 100, bits, label: '极强', color: 'bg-cyan-400' };
  }
};