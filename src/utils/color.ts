export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const clamped = Math.max(0, Math.min(1, alpha));
  const value = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${normalized}${value}`;
}

export function shadeHex(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const channels = [0, 2, 4].map((offset) => parseInt(normalized.slice(offset, offset + 2), 16));
  const target = amount < 0 ? 0 : 255;
  const ratio = Math.min(1, Math.abs(amount));
  const shifted = channels.map((channel) =>
    Math.round(channel + (target - channel) * ratio)
      .toString(16)
      .padStart(2, '0'),
  );
  return `#${shifted.join('')}`;
}
