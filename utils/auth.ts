
// --- Basic Password Hashing Utility ---
// This is a simple, non-cryptographic hashing function for demonstration purposes.
// In a real-world application, you would use a robust, battle-tested library like
// bcrypt.js or Argon2 on a server. This simulation prevents storing plain-text passwords.

const SALT = "proscout-super-secret-salt-!@#$";

async function digestMessage(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function hashPassword(password: string): Promise<string> {
    const saltedPassword = password + SALT;
    return await digestMessage(saltedPassword);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const newHash = await hashPassword(password);
    return newHash === hash;
}
