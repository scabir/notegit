import { CryptoAdapter } from "../../../backend/adapters/CryptoAdapter";

describe("CryptoAdapter", () => {
  const SALT_LENGTH = 64;
  const IV_LENGTH = 16;
  const TAG_LENGTH = 16;
  const MIN_ENCRYPTED_BYTES = SALT_LENGTH + IV_LENGTH + TAG_LENGTH;
  let cryptoAdapter: CryptoAdapter;

  beforeEach(() => {
    cryptoAdapter = new CryptoAdapter();
  });

  describe("encrypt", () => {
    it("should encrypt a string", () => {
      const plaintext = "my-secret-token";
      const encrypted = cryptoAdapter.encrypt(plaintext);

      expect(encrypted).toBeDefined();
      expect(typeof encrypted).toBe("string");
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it("should produce different output each time (random IV)", () => {
      const plaintext = "same-secret-token";
      const encrypted1 = cryptoAdapter.encrypt(plaintext);
      const encrypted2 = cryptoAdapter.encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it("should handle empty string", () => {
      const encrypted = cryptoAdapter.encrypt("");
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(0);
    });

    it("should handle special characters", () => {
      const plaintext = "token@#$%^&*()_+-=[]{}|;:,.<>?/~`";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      expect(encrypted).toBeDefined();
    });

    it("should handle unicode characters", () => {
      const plaintext = "你好世界 🌍 مرحبا";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      expect(encrypted).toBeDefined();
    });

    it("produces base64 ciphertext with expected binary envelope", () => {
      const plaintext = "my-secret-token";
      const encrypted = cryptoAdapter.encrypt(plaintext);

      expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/u);

      const decoded = Buffer.from(encrypted, "base64");
      expect(decoded.length).toBeGreaterThan(MIN_ENCRYPTED_BYTES);
    });

    it("does not expose plaintext in ciphertext payload", () => {
      const plaintext = "my-very-unique-secret-token-12345";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      const decodedAsUtf8 = Buffer.from(encrypted, "base64").toString("utf8");

      expect(decodedAsUtf8).not.toContain(plaintext);
    });
  });

  describe("decrypt", () => {
    it("should decrypt an encrypted string", () => {
      const plaintext = "my-secret-token";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      const decrypted = cryptoAdapter.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle empty string", () => {
      const plaintext = "";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      const decrypted = cryptoAdapter.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle long strings", () => {
      const plaintext = "a".repeat(1000);
      const encrypted = cryptoAdapter.encrypt(plaintext);
      const decrypted = cryptoAdapter.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle special characters", () => {
      const plaintext = "token@#$%^&*()_+-=[]{}|;:,.<>?/~`";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      const decrypted = cryptoAdapter.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should handle unicode characters", () => {
      const plaintext = "你好世界 🌍 مرحبا";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      const decrypted = cryptoAdapter.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it("should throw error for invalid encrypted data", () => {
      expect(() => {
        cryptoAdapter.decrypt("invalid-base64-data");
      }).toThrow();
    });

    it("should throw error for corrupted data", () => {
      const plaintext = "test";
      const encrypted = cryptoAdapter.encrypt(plaintext);
      const corrupted =
        encrypted.substring(0, encrypted.length - 10) + "X".repeat(10);

      expect(() => {
        cryptoAdapter.decrypt(corrupted);
      }).toThrow();
    });
  });

  describe("encryption roundtrip", () => {
    it("should correctly encrypt and decrypt multiple times", () => {
      const plaintext = "my-secret-token";

      for (let i = 0; i < 10; i++) {
        const encrypted = cryptoAdapter.encrypt(plaintext);
        const decrypted = cryptoAdapter.decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }
    });

    it("should work with different instances", () => {
      const adapter1 = new CryptoAdapter();
      const adapter2 = new CryptoAdapter();

      const plaintext = "cross-instance-test";
      const encrypted = adapter1.encrypt(plaintext);
      const decrypted = adapter2.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });
  });
});
