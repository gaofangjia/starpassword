export enum GeneratorMode {
  CUSTOM = 'CUSTOM',
  PIN = 'PIN',
  UUID = 'UUID',
  MAC = 'MAC'
}

export interface PasswordConfig {
  length: number;
  useUppercase: boolean;
  useLowercase: boolean;
  useNumbers: boolean;
  useSymbols: boolean;
  pinLength: number;
  macSeparator: string; // ':', '-', or ''
}

export interface EntropyResult {
  score: number; // 0-100 (relative strength)
  bits: number;  // Actual bits of entropy
  label: string; // Text description
  color: string; // Tailwind color class
}

export interface GenerationResult {
  text: string;
  entropy: EntropyResult;
}