import * as crypto from 'crypto';
import { machineIdSync } from 'node-machine-id';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export class CryptoAdapter {
  private salt: string;

  constructor() {
    // Use machine ID as part of the salt for key derivation
    // This makes the encryption machine-specific
    const machineId = machineIdSync();
    this.salt = `notegit-${machineId}`;
  }

  /**
   * Encrypts a string value
   * @param plaintext The text to encrypt
   * @returns Base64 encoded encrypted data with IV and auth tag
   */
  encrypt(plaintext: string): string {
    // Generate a random salt for this encryption
    const salt = crypto.randomBytes(SALT_LENGTH);
    
    // Derive key from password (machine-specific salt)
    const key = crypto.pbkdf2Sync(this.salt, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine salt + iv + authTag + encrypted data
    const result = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'base64'),
    ]);
    
    return result.toString('base64');
  }

  /**
   * Decrypts an encrypted string
   * @param ciphertext Base64 encoded encrypted data
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    // Decode from base64
    const buffer = Buffer.from(ciphertext, 'base64');
    
    // Extract components
    const salt = buffer.subarray(0, SALT_LENGTH);
    const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = buffer.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + TAG_LENGTH
    );
    const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
    
    // Derive key from password (machine-specific salt)
    const key = crypto.pbkdf2Sync(this.salt, salt, ITERATIONS, KEY_LENGTH, 'sha512');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted.toString('base64'), 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

