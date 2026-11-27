const GATEWAY_ORIGIN =
  import.meta.env.VITE_GATEWAY_ORIGIN ||
  (import.meta.env.VITE_API_BASE_URL
    ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '')
    : 'http://localhost:8080');

export function formatCurrencyVnd(amount) {
  const num = Number(amount || 0);
  return num.toLocaleString('vi-VN') + 'đ';
}

export function resolveImageUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${GATEWAY_ORIGIN}${url}`;
  }
  return `${GATEWAY_ORIGIN}/${url}`;
}

export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidVietnamPhone(phone) {
  if (!phone) return false;
  return /^(0|\+84)[0-9]{8,10}$/.test(phone.trim());
}
