const DEC: { [key: string]: number } = {
  'A': 0, 'B': 1, 'C': 2, 'D': 3, 'E': 4, 'F': 5, 'G': 6, 'H': 7,
  'I': 8, 'J': 9, 'K': 10, 'L': 11, 'M': 12, 'N': 13, 'O': 14, 'P': 15,
  'Q': 16, 'R': 17, 'S': 18, 'T': 19, 'U': 20, 'V': 21, 'W': 22, 'X': 23,
  'Y': 24, 'Z': 25, '2': 26, '3': 27, '4': 28, '5': 29, '6': 30, '7': 31
};

export async function generateTOTP(secret: string): Promise<{code: string, timeLeft: number, progress: number}> {
  // 1. Sanitize input: Remove spaces, dashes, make uppercase
  const cleanSecret = secret.toUpperCase().replace(/[^A-Z2-7]/g, '');
  
  // If secret is too short or empty, return placeholder
  if (!cleanSecret || cleanSecret.length < 8) {
    return { code: '------', timeLeft: 0, progress: 0 };
  }

  try {
    // 2. Base32 Decode
    const length = cleanSecret.length;
    let bits = 0;
    let value = 0;
    let index = 0;
    // Rough estimation of buffer size
    const data = new Uint8Array(Math.ceil(length * 5 / 8));

    for (let i = 0; i < length; i++) {
      const val = DEC[cleanSecret[i]];
      if (val === undefined) continue;
      
      value = (value << 5) | val;
      bits += 5;
      if (bits >= 8) {
        data[index++] = (value >>> (bits - 8)) & 0xFF;
        bits -= 8;
      }
    }
    
    // Slice to actual data length
    const keyBytes = data.slice(0, index);

    // 3. Calculate Counter
    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = 30;
    const counter = Math.floor(epoch / timeStep);
    const timeLeft = timeStep - (epoch % timeStep);
    const progress = (timeLeft / timeStep) * 100;

    const counterBuf = new ArrayBuffer(8);
    const counterView = new DataView(counterBuf);
    
    // Set 64-bit integer (counter) into buffer, big-endian
    // Javascript uses 32-bit bitwise ops, so we split high/low 32 bits
    // Since counter won't exceed 32 bits for many years (2106), we can leave high bits 0
    counterView.setUint32(4, counter, false); 

    // 4. HMAC-SHA1 Signing
    const key = await window.crypto.subtle.importKey(
      'raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
    );
    
    const signature = await window.crypto.subtle.sign('HMAC', key, counterBuf);
    const hmac = new Uint8Array(signature);

    // 5. Dynamic Truncation
    const offset = hmac[hmac.length - 1] & 0xf;
    const binary = ((hmac[offset] & 0x7f) << 24) |
                   ((hmac[offset + 1] & 0xff) << 16) |
                   ((hmac[offset + 2] & 0xff) << 8) |
                   (hmac[offset + 3] & 0xff);
    
    // 6. Generate 6 digits
    const token = binary % 1000000;
    const code = token.toString().padStart(6, '0');

    return { code, timeLeft, progress };
  } catch (e) {
    console.error("TOTP Gen Error", e);
    return { code: 'ERROR', timeLeft: 0, progress: 0 };
  }
}