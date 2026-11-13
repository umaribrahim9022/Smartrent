// Safe localStorage helper for user authentication state

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw || raw === 'undefined' || raw === 'null' || raw === '[object Object]') {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (e) {
    console.warn('[authStorage] Invalid user in localStorage, resetting:', e.message);
    try { localStorage.removeItem('user'); } catch (_) {}
    return {};
  }
};

export const getStoredToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token || token === 'undefined' || token === 'null') {
      return null;
    }
    return token;
  } catch (e) {
    try { localStorage.removeItem('token'); } catch (_) {}
    return null;
  }
};

export const setStoredAuth = (token, user) => {
  try {
    if (token && token !== 'undefined') {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }

    if (user && typeof user === 'object') {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  } catch (e) {
    console.warn('[authStorage] Failed to store auth:', e.message);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (_) {}
};
