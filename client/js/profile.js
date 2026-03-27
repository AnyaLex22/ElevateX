// ============================================================
//  Elevate X — profile.js
//  Auth guard + fetch/update profile from MySQL via /api/profile
//  Change password via /api/profile/password
// ============================================================

const API_URL = 'https://elevatex-pfo1.onrender.com';

// ─── AUTH GUARD ──────────────────────────────────────────────
const token = localStorage.getItem('token');
if (!token) window.location.href = 'login.html';

// ─── DOM REFS ────────────────────────────────────────────────
const form    = document.getElementById('profileForm');
const saveBtn = document.getElementById('saveBtn');

// ─── TOAST ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = 'toast'; }, 3500);
}

// ─── SKELETON HELPERS ────────────────────────────────────────
const SKELETON_IDS = ['skelName', 'skelEmail', 'skelHeight', 'skelWeight', 'skelGoal'];
const FIELD_IDS    = ['name', 'emailRow', 'height', 'weight', 'goal'];

function showSkeletons() {
    SKELETON_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'block';
    });
    FIELD_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    saveBtn.style.display = 'none';
}

function hideSkeletons() {
    SKELETON_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    FIELD_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = (id === 'emailRow') ? 'flex' : 'block';
    });
    saveBtn.style.display = 'block';
}

// ─── LOAD PROFILE ────────────────────────────────────────────
async function loadProfile() {
    showSkeletons();
    try {
        const res  = await fetch(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (res.status === 401 || res.status === 403) {
            logout();
            return;
        }

        const data = await res.json();

        if (!res.ok) {
            showToast(data.msg || 'Failed to load profile.', 'error');
            hideSkeletons();
            return;
        }

        document.getElementById('name').value   = data.name   || '';
        document.getElementById('email').value  = data.email  || '';
        document.getElementById('height').value = data.height || '';
        document.getElementById('weight').value = data.weight || '';
        document.getElementById('goal').value   = data.goal   || '';

        hideSkeletons();
    } catch (err) {
        showToast('Server error. Could not load profile.', 'error');
        hideSkeletons();
    }
}

// ─── SAVE PROFILE ────────────────────────────────────────────
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
        name:   document.getElementById('name').value.trim(),
        height: document.getElementById('height').value || null,
        weight: document.getElementById('weight').value || null,
        goal:   document.getElementById('goal').value.trim() || null,
    };

    if (!body.name) {
        showToast('Name cannot be empty.', 'error');
        return;
    }

    saveBtn.classList.add('loading');
    saveBtn.textContent = 'Saving…';

    try {
        const res  = await fetch(`${API_URL}/api/profile`, {
            method:  'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();

        if (res.ok) {
            showToast('Profile updated successfully! ✓', 'success');
        } else {
            showToast(data.msg || 'Failed to update profile.', 'error');
        }
    } catch (err) {
        showToast('Server error. Please try again.', 'error');
    } finally {
        saveBtn.classList.remove('loading');
        saveBtn.textContent = 'Save Profile';
    }
});

// ─── LOGOUT ──────────────────────────────────────────────────
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('streak_checked_today');
    localStorage.removeItem('daily_tasks');
    window.location.href = 'login.html';
}

// ─── PASSWORD MODAL ──────────────────────────────────────────
const modalPwdChecks = {
    'm-rule-len':     v => v.length >= 8,
    'm-rule-upper':   v => /[A-Z]/.test(v),
    'm-rule-lower':   v => /[a-z]/.test(v),
    'm-rule-num':     v => /\d/.test(v),
    'm-rule-special': v => /[^A-Za-z0-9]/.test(v),
};

function openPasswordModal() {
    document.getElementById('pwdModal').classList.add('open');
    document.getElementById('currentPwd').value   = '';
    document.getElementById('newPwd').value        = '';
    document.getElementById('confirmNewPwd').value = '';
    document.getElementById('modalErr').textContent = '';
    document.getElementById('modalPwdRules').classList.remove('visible');
    Object.keys(modalPwdChecks).forEach(id => {
        const li = document.getElementById(id);
        if (li) { li.classList.remove('pass', 'fail'); }
    });
}

function closePasswordModal() {
    document.getElementById('pwdModal').classList.remove('open');
}

// Live validation inside modal
document.getElementById('newPwd').addEventListener('focus', () => {
    document.getElementById('modalPwdRules').classList.add('visible');
});

document.getElementById('newPwd').addEventListener('input', function() {
    const val = this.value;
    Object.entries(modalPwdChecks).forEach(([id, fn]) => {
        const li = document.getElementById(id);
        if (!li) return;
        li.classList.toggle('pass', fn(val));
        li.classList.toggle('fail', val.length > 0 && !fn(val));
    });
});

// Close on overlay click
document.getElementById('pwdModal').addEventListener('click', function(e) {
    if (e.target === this) closePasswordModal();
});

async function changePassword() {
    const currentPassword = document.getElementById('currentPwd').value;
    const newPassword     = document.getElementById('newPwd').value;
    const confirmNew      = document.getElementById('confirmNewPwd').value;
    const errEl           = document.getElementById('modalErr');
    const savePwdBtn      = document.getElementById('savePwdBtn');

    errEl.textContent = '';

    if (!currentPassword) { errEl.textContent = 'Enter your current password.'; return; }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!strongPassword.test(newPassword)) {
        errEl.textContent = 'New password does not meet requirements.';
        return;
    }

    if (newPassword !== confirmNew) {
        errEl.textContent = 'New passwords do not match.';
        return;
    }

    savePwdBtn.classList.add('loading');
    savePwdBtn.textContent = 'Updating…';

    try {
        const res  = await fetch(`${API_URL}/api/profile/password`, {
            method:  'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await res.json();

        if (res.ok) {
            closePasswordModal();
            showToast('Password changed successfully! 🔒', 'success');
        } else {
            errEl.textContent = data.msg || 'Failed to change password.';
        }
    } catch (err) {
        errEl.textContent = 'Server error. Please try again.';
    } finally {
        savePwdBtn.classList.remove('loading');
        savePwdBtn.textContent = 'Update Password';
    }
}

// ─── INIT ────────────────────────────────────────────────────
loadProfile();