/**
 * Base64 encoding/decoding utilities
 * Polyfill for React Native (atob/btoa are browser-only)
 */

/**
 * Decode base64 string
 * Polyfill for atob() which is not available in React Native
 */
export const base64Decode = (str: string): string => {
  try {
    // For React Native, we need to implement base64 decoding
    // Using a simple implementation that works in React Native
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    str = str.replace(/[^A-Za-z0-9\+\/\=]/g, '');

    for (let i = 0; i < str.length; i += 4) {
      const enc1 = chars.indexOf(str.charAt(i));
      const enc2 = chars.indexOf(str.charAt(i + 1));
      const enc3 = chars.indexOf(str.charAt(i + 2));
      const enc4 = chars.indexOf(str.charAt(i + 3));

      const chr1 = (enc1 << 2) | (enc2 >> 4);
      const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
      const chr3 = ((enc3 & 3) << 6) | enc4;

      output += String.fromCharCode(chr1);

      if (enc3 !== 64) {
        output += String.fromCharCode(chr2);
      }
      if (enc4 !== 64) {
        output += String.fromCharCode(chr3);
      }
    }

    return output;
  } catch (error) {
    console.error('Base64 decode error:', error);
    throw new Error('Failed to decode base64 string');
  }
};

/**
 * Encode string to base64
 * Polyfill for btoa() which is not available in React Native
 */
export const base64Encode = (str: string): string => {
  try {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';

    for (let i = 0; i < str.length; i += 3) {
      const enc1 = str.charCodeAt(i) >> 2;
      const enc2 = ((str.charCodeAt(i) & 3) << 4) | (str.charCodeAt(i + 1) >> 4);
      let enc3 = ((str.charCodeAt(i + 1) & 15) << 2) | (str.charCodeAt(i + 2) >> 6);
      let enc4 = str.charCodeAt(i + 2) & 63;

      if (isNaN(str.charCodeAt(i + 1))) {
        enc3 = enc4 = 64;
      } else if (isNaN(str.charCodeAt(i + 2))) {
        enc4 = 64;
      }

      output +=
        chars.charAt(enc1) +
        chars.charAt(enc2) +
        chars.charAt(enc3) +
        chars.charAt(enc4);
    }

    return output;
  } catch (error) {
    console.error('Base64 encode error:', error);
    throw new Error('Failed to encode string to base64');
  }
};
