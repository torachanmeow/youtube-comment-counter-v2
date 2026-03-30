export function sanitizeHTML(str: string): string {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.textContent;
}

export function toHalfWidth(str: string): string {
  if (!str) return '';
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0),
  );
}

export function parseNumber(value: string): number {
  return parseFloat(toHalfWidth(value));
}
