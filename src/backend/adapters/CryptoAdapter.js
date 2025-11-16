"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoAdapter = void 0;
const crypto = __importStar(require("crypto"));
const node_machine_id_1 = require("node-machine-id");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;
class CryptoAdapter {
    constructor() {
        // Use machine ID as part of the salt for key derivation
        // This makes the encryption machine-specific
        const machineId = (0, node_machine_id_1.machineIdSync)();
        this.salt = `notegit-${machineId}`;
    }
    /**
     * Encrypts a string value
     * @param plaintext The text to encrypt
     * @returns Base64 encoded encrypted data with IV and auth tag
     */
    encrypt(plaintext) {
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
    decrypt(ciphertext) {
        // Decode from base64
        const buffer = Buffer.from(ciphertext, 'base64');
        // Extract components
        const salt = buffer.subarray(0, SALT_LENGTH);
        const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
        const authTag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
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
exports.CryptoAdapter = CryptoAdapter;
