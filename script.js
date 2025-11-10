// script.js — client-side validation and toast notifications for registration
document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.querySelector('.register-form');
    const loginForm = document.querySelector('.login-form');

    // create toast container
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }

    function showToast(message, type = 'info', timeout = 3500) {
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.innerText = message;
        toastContainer.appendChild(toast);
        // force reflow for transition
        window.getComputedStyle(toast).opacity;
        toast.classList.add('toast--visible');

        if (timeout > 0) {
            setTimeout(() => {
                toast.classList.remove('toast--visible');
                toast.addEventListener('transitionend', () => toast.remove(), { once: true });
            }, timeout);
        }
    }

    function clearFieldErrors(form) {
        form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    }

    function validateForm(form) {
        const errors = [];
        clearFieldErrors(form);

        const username = form.querySelector('input[name="username"]') || form.querySelector('#username');
        const password = form.querySelector('input[type="password"]');
        const email = form.querySelector('input[name="email"]');
        const terms = form.querySelector('#terms-agree');
        const phone = form.querySelector('input[name="phone"]');

        if (!username || !username.value.trim() || username.value.trim().length < 3) {
            errors.push('Username must be at least 3 characters.');
            if (username) username.classList.add('input-error');
        }

        if (!password || password.value.trim().length < 6) {
            errors.push('Password must be at least 6 characters.');
            if (password) password.classList.add('input-error');
        }

        if (!email || !/^\S+@\S+\.\S+$/.test(email.value.trim())) {
            errors.push('Enter a valid email address.');
            if (email) email.classList.add('input-error');
        }

        if (phone && phone.value.trim()) {
            const digits = phone.value.replace(/\D/g, '');
            if (digits.length < 7) {
                errors.push('Enter a valid phone number (at least 7 digits).');
                phone.classList.add('input-error');
            }
        }

        if (terms && !terms.checked) {
            errors.push('You must agree to the Terms & Conditions.');
            terms.classList.add('input-error');
        }

        return errors;
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const errors = validateForm(registerForm);
            if (errors.length) {
                showToast(errors.join(' \n'), 'error', 6000);
                return;
            }

            const formData = new FormData(registerForm);
            const payload = {};
            formData.forEach((v, k) => payload[k] = v);

            showToast('Registering...', 'info', 2000);
            try {
                const resp = await fetch(registerForm.action || '/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });

                let json;
                const ct = resp.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    try { json = await resp.json(); } catch (e) { json = null; }
                } else {
                    const text = await resp.text().catch(() => '');
                    json = { success: resp.ok, message: text || `HTTP ${resp.status}` };
                }

                if (!resp.ok || !json || !json.success) {
                    const msg = (json && json.message) ? json.message : `HTTP ${resp.status}`;
                    showToast(msg || 'Registration failed', 'error', 5000);
                    return;
                }
                showToast('Registration successful!', 'success', 2000);
                setTimeout(() => { window.location.href = 'Login.html'; }, 900);
            } catch (err) {
                console.error(err);
                showToast('Network error', 'error', 4000);
            }
        });
    }

    // Optional: login form handler (if present on page)
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = new FormData(loginForm);
            const payload = {};
            formData.forEach((v, k) => payload[k] = v);
            showToast('Signing in...', 'info', 1200);
            try {
                const resp = await fetch(loginForm.action || '/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify(payload)
                });
                let json;
                const ct = resp.headers.get('content-type') || '';
                if (ct.includes('application/json')) {
                    try { json = await resp.json(); } catch (e) { json = null; }
                } else {
                    const text = await resp.text().catch(() => '');
                    json = { success: resp.ok, message: text || `HTTP ${resp.status}` };
                }

                if (!resp.ok || !json || !json.success) {
                    const msg = (json && json.message) ? json.message : `HTTP ${resp.status}`;
                    showToast(msg || 'Login failed', 'error', 4000);
                    return;
                }
                showToast('Login successful!', 'success', 1000);
                setTimeout(() => { window.location.href = 'mainmenu.html'; }, 700);
            } catch (err) {
                console.error(err);
                showToast('Network error', 'error', 4000);
            }
        });
    }
});
