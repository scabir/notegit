export declare class CryptoAdapter {
    private salt;
    constructor();
    /**
     * Encrypts a string value
     * @param plaintext The text to encrypt
     * @returns Base64 encoded encrypted data with IV and auth tag
     */
    encrypt(plaintext: string): string;
    /**
     * Decrypts an encrypted string
     * @param ciphertext Base64 encoded encrypted data
     * @returns Decrypted plaintext
     */
    decrypt(ciphertext: string): string;
}
