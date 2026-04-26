import { randomBytes } from 'node:crypto';

export function buildCardNo(prefix = 'YL'): string {
  const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
  const random = randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${stamp}${random}`;
}
