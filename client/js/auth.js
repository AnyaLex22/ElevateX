const API = "https://elevatex-pfo1.onrender.com/api/auth";

// ─── TOAST HELPER ────────────────────────────────────────────
function showToast(message, type = 'success', duration = 3500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => { toast.className = 'toast'; }, duration);
}
 
// ─── LOADING STATE ───────────────────────────────────────────
function setLoading(btnId, isLoading, label = 'Submit') {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (isLoading) {
        btn.classList.add('loading');
        btn.textContent = 'Please wait…';
    } else {
        btn.classList.remove('loading');
        btn.textContent = label;
    }
}

//LOGIN
async function login() {
    const email    = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
 
    if (!email || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
    }
 
    setLoading('loginBtn', true, 'Login');
    try {
        const res  = await fetch(API + '/login', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ email, password })
        });
        const data = await res.json();
 
        if (data.token) {
            localStorage.setItem('token', data.token);
            showToast('Login successful! Redirecting…', 'success');
            setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
        } else {
            showToast(data.message || 'Login failed. Check your credentials.', 'error');
        }
    } catch (err) {
        showToast('Server error. Please try again.', 'error');
    } finally {
        setLoading('loginBtn', false, 'Login');
    }
}

// ─── PASSWORD STRENGTH CHECK ─────────────────────────────────
function isStrongPassword(pwd) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pwd);
}

//REGISTER
async function register() {
    const name            = document.getElementById('name').value.trim();
    const email           = document.getElementById('email').value.trim();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
 
    // Clear old errors
    ['nameErr', 'emailErr'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '';
    });
    ['name', 'email', 'password', 'confirmPassword'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('input-error');
    });
 
    let hasError = false;
 
    if (!name) {
        document.getElementById('nameErr').textContent = 'Name is required.';
        document.getElementById('name').classList.add('input-error');
        hasError = true;
    }
 
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('emailErr').textContent = 'Enter a valid email address.';
        document.getElementById('email').classList.add('input-error');
        hasError = true;
    }
 
    if (!isStrongPassword(password)) {
        showToast('Password does not meet requirements.', 'error');
        document.getElementById('password').classList.add('input-error');
        hasError = true;
    }
 
    if (confirmPassword !== undefined && password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        document.getElementById('confirmPassword').classList.add('input-error');
        hasError = true;
    }
 
    if (hasError) return;
 
    setLoading('registerBtn', true, 'Register');
    try {
        const res  = await fetch(API + '/register', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name, email, password })
        });
        const data = await res.json();
 
        if (res.ok) {
            showToast('Account created! Redirecting to login…', 'success');
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        } else {
            showToast(data.message || data.error || 'Registration failed.', 'error');
        }
    } catch (err) {
        showToast('Server error. Please try again.', 'error');
    } finally {
        setLoading('registerBtn', false, 'Register');
    }
}