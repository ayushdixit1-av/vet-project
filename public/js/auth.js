async function handleLogin(email, password) {
  try {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('vetcrack_token', data.token);
    localStorage.setItem('vetcrack_user', JSON.stringify(data));
    return data;
  } catch (error) {
    throw error;
  }
}

async function handleRegister(name, email, password) {
  try {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    localStorage.setItem('vetcrack_token', data.token);
    localStorage.setItem('vetcrack_user', JSON.stringify(data));
    return data;
  } catch (error) {
    throw error;
  }
}

async function handleGoogleLogin() {
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth_.signInWithPopup(provider);
    const user = result.user;

    const data = await apiRequest('/auth/google-login', {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        name: user.displayName,
        idToken: user.getIdToken ? await user.getIdToken() : ''
      })
    });

    localStorage.setItem('vetcrack_token', data.token);
    localStorage.setItem('vetcrack_user', JSON.stringify(data));
    return data;
  } catch (error) {
    throw error;
  }
}

function logout() {
  localStorage.removeItem('vetcrack_token');
  localStorage.removeItem('vetcrack_user');
  auth_.signOut().catch(() => {});
  window.location.href = '/';
}

function getCurrentUser() {
  try {
    const userStr = localStorage.getItem('vetcrack_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch { return null; }
}

function isLoggedIn() {
  return !!localStorage.getItem('vetcrack_token');
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

function requireAuth(redirectTo = '/pages/login.html') {
  if (!isLoggedIn()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/login.html';
    return false;
  }
  if (!isAdmin()) {
    window.location.href = '/';
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });

  const userLogoutBtn = document.getElementById('userLogoutBtn');
  if (userLogoutBtn) userLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });

  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  if (adminLogoutBtn) adminLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });

  const cvLogoutBtn = document.getElementById('cvLogoutBtn');
  if (cvLogoutBtn) cvLogoutBtn.addEventListener('click', (e) => { e.preventDefault(); logout(); });

  const user = getCurrentUser();
  if (user) {
    const loginLink = document.getElementById('loginLink');
    const registerLink = document.getElementById('registerLink');
    const adminLink = document.getElementById('adminLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const logoutBtnEl = document.getElementById('logoutBtn');

    if (loginLink) loginLink.style.display = 'none';
    if (registerLink) registerLink.style.display = 'none';
    if (logoutBtnEl) logoutBtnEl.style.display = 'inline-block';
    if (dashboardLink) {
      dashboardLink.style.display = 'inline-block';
      dashboardLink.textContent = 'Dashboard';
    }
    if (adminLink && user.role === 'admin') {
      adminLink.style.display = 'inline-block';
    }

    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = user.name || 'Student';
    const userEmailEl = document.getElementById('userEmail');
    if (userEmailEl) userEmailEl.textContent = user.email || '';
    const adminNameEl = document.getElementById('adminName');
    if (adminNameEl) adminNameEl.textContent = user.name || 'Admin';
  }

  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
});

if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');
    const text = document.getElementById('loginText');
    const loader = document.getElementById('loginLoader');
    const error = document.getElementById('authError');

    btn.disabled = true;
    text.style.display = 'none';
    loader.style.display = 'inline';
    error.style.display = 'none';

    try {
      const data = await handleLogin(email, password);
      if (data.role === 'admin') window.location.href = 'admin-dashboard.html';
      else window.location.href = 'user-dashboard.html';
    } catch (err) {
      error.textContent = err.message;
      error.style.display = 'block';
    } finally {
      btn.disabled = false;
      text.style.display = 'inline';
      loader.style.display = 'none';
    }
  });
}

if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirmPassword').value;
    const btn = document.getElementById('registerBtn');
    const text = document.getElementById('registerText');
    const loader = document.getElementById('registerLoader');
    const error = document.getElementById('authError');

    if (password !== confirm) {
      error.textContent = 'Passwords do not match';
      error.style.display = 'block';
      return;
    }

    btn.disabled = true;
    text.style.display = 'none';
    loader.style.display = 'inline';
    error.style.display = 'none';

    try {
      await handleRegister(name, email, password);
      window.location.href = 'user-dashboard.html';
    } catch (err) {
      error.textContent = err.message;
      error.style.display = 'block';
    } finally {
      btn.disabled = false;
      text.style.display = 'inline';
      loader.style.display = 'none';
    }
  });
}

if (document.getElementById('googleLoginBtn') || document.getElementById('googleRegisterBtn')) {
  const googleBtn = document.getElementById('googleLoginBtn') || document.getElementById('googleRegisterBtn');
  googleBtn.addEventListener('click', async () => {
    try {
      const data = await handleGoogleLogin();
      if (data.role === 'admin') window.location.href = 'admin-dashboard.html';
      else window.location.href = 'user-dashboard.html';
    } catch (err) {
      const error = document.getElementById('authError');
      if (error) { error.textContent = err.message; error.style.display = 'block'; }
    }
  });
}

document.querySelectorAll('.toggle-password').forEach(el => {
  el.addEventListener('click', function() {
    const input = this.previousElementSibling;
    if (input.type === 'password') { input.type = 'text'; this.classList.replace('fa-eye', 'fa-eye-slash'); }
    else { input.type = 'password'; this.classList.replace('fa-eye-slash', 'fa-eye'); }
  });
});
