import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Mock Web Crypto API for testing
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: webcrypto.subtle,
    randomUUID: webcrypto.randomUUID.bind(webcrypto),
  },
});

// Polyfill structuredClone for Node.js environments that don't have it
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}
