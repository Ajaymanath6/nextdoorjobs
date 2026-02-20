import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey() {
  const raw = process.env.CHAT_ENCRYPTION_KEY;
  if (!raw || typeof raw !== "string") {
    throw new Error("CHAT_ENCRYPTION_KEY is not set or invalid");
  }
  return crypto.scryptSync(raw, "salt", KEY_LENGTH);
}

/**
 * Encrypt plaintext for storage. Returns hex-encoded iv:authTag:ciphertext.
 */
function encrypt(plaintext) {
  if (plaintext == null) return null;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, enc]).toString("hex");
}

/**
 * Decrypt hex-encoded payload (iv:authTag:ciphertext) to plaintext.
 */
function decrypt(hexPayload) {
  if (!hexPayload) return null;
  const key = getKey();
  const buf = Buffer.from(hexPayload, "hex");
  if (buf.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = buf.subarray(0, IV_LENGTH);
  const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(ciphertext) + decipher.final("utf8");
}

export { encrypt, decrypt };
