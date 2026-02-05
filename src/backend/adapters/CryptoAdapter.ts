import * as crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
const HASH_ALGORITHM = 'sha512';
const ENCODING_UTF8 = 'utf8';
const ENCODING_BASE64 = 'base64';

export class CryptoAdapter {
  private salt: string;

  constructor() {
    // Use machine ID as part of the salt for key derivation
    // This makes the encryption machine-specific
    const machineId = machineIdSync();
    this.salt = `notegit-${machineId}`;
  }

  encrypt(plaintext: string): string {
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    const key = crypto.pbkdf2Sync(this.salt, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM);
    
    const iv = crypto.randomBytes(IV_LENGTH);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, ENCODING_UTF8, ENCODING_BASE64);
    encrypted += cipher.final(ENCODING_BASE64);
    
    const authTag = cipher.getAuthTag();
    
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, ENCODING_BASE64),
    ]);
    
    return result.toString(ENCODING_BASE64);
  }

  decrypt(ciphertext: string): string {
    const buffer = Buffer.from(ciphertext, ENCODING_BASE64);
    
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    const key = crypto.pbkdf2Sync(this.salt, salt, ITERATIONS, KEY_LENGTH, HASH_ALGORITHM);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted.toString(ENCODING_BASE64), ENCODING_BASE64, ENCODING_UTF8);
    decrypted += decipher.final(ENCODING_UTF8);
    
    return decrypted;
  }
}
