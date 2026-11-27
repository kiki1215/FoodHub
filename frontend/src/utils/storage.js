const TOKEN_KEY = 'foodhub_access_token';
const USER_KEY = 'foodhub_user_info';

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
}

export function setAuthStorage(token, user, remember = true) {
  clearAuthStorage();
  const targetStorage = remember ? localStorage : sessionStorage;
  if (token) {
    targetStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    // Tuyệt đối không bao giờ lưu mật khẩu
    const safeUser = { ...user };
    delete safeUser.password;
    targetStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  }
}

export function updateStoredUser(user) {
  if (!user) return;
  const safeUser = { ...user };
  delete safeUser.password;
  if (localStorage.getItem(TOKEN_KEY)) {
    localStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  } else if (sessionStorage.getItem(TOKEN_KEY)) {
    sessionStorage.setItem(USER_KEY, JSON.stringify(safeUser));
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const jsonStr = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

export function isJwtExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowSeconds + 5;
}
