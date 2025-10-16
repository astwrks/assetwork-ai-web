import bcrypt from 'bcryptjs';

// Industry standard: OWASP recommends 12+ rounds for bcrypt
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt with industry-standard salt rounds
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  // Validate password strength before hashing
  validatePasswordStrength(password);

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Validate password meets minimum security requirements
 * @param password - Plain text password
 * @throws Error if password doesn't meet requirements
 */
export function validatePasswordStrength(password: string): void {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  // Check for at least one uppercase, one lowercase, one number, and one special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    throw new Error(
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    );
  }

  // Check for common weak passwords
  const commonPasswords = ['password', '12345678', 'qwerty', 'admin123', 'welcome'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    throw new Error('Password is too common. Please choose a stronger password');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
