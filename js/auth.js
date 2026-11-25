const STORAGE_KEY_USERS = 'portal_usuarios_registrados';
const STORAGE_KEY_SESSION = 'portal_sesion_activa';
const STORAGE_KEY_PERFIL_AUTH = 'portal_perfil_info';

// Registrar Service Worker para la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
}

// Hash determinístico ligero para no guardar la contraseña en texto plano
function hashPassword(password) {
    let hash = 5381;
    for (let i = 0; i < password.length; i++) {
        hash = ((hash << 5) + hash) + password.charCodeAt(i);
        hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(16) + '_' + password.length;
}

function getRegisteredUsers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS)) || [];
    } catch {
        return [];
    }
}

function saveRegisteredUsers(users) {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function showAuthAlert(message, type = 'error') {
    const alertBox = document.getElementById('authAlert');
    const alertText = document.getElementById('authAlertText');
    const alertIcon = document.getElementById('authAlertIcon');
    if (!alertBox || !alertText) return;

    alertText.textContent = message;
    alertBox.classList.remove(
        'hidden',
        'bg-red-50', 'text-red-700', 'border-red-200',
        'bg-emerald-50', 'text-emerald-700', 'border-emerald-200'
    );
    alertBox.classList.add('border');

    if (type === 'success') {
        alertBox.classList.add('bg-emerald-50', 'text-emerald-700', 'border-emerald-200');
        if (alertIcon) alertIcon.setAttribute('data-lucide', 'check-circle-2');
    } else {
        alertBox.classList.add('bg-red-50', 'text-red-700', 'border-red-200');
        if (alertIcon) alertIcon.setAttribute('data-lucide', 'alert-circle');
    }

    if (window.lucide) lucide.createIcons();
}

// Compatibilidad con index.html (togglePassword) y registro.html (togglePasswordVisibility)
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    const icon = btn.querySelector('i');
    if (icon) {
        icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        if (window.lucide) lucide.createIcons();
    }
}

function togglePassword(inputId, btn) {
    togglePasswordVisibility(inputId, btn);
}

// 1. VERIFICACIÓN Y CREACIÓN DE CUENTA (registro.html)
function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('regName').value.trim();
    const role = document.getElementById('regRole').value.trim();
    const email = document.getElementById('regEmail').value.trim().toLowerCase();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !role || !email) {
        showAuthAlert('Por favor completa todos los campos obligatorios.');
        return;
    }

    if (!emailRegex.test(email)) {
        showAuthAlert('Ingresa un correo electrónico válido.');
        return;
    }

    if (password.length < 6) {
        showAuthAlert('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    if (password !== confirmPassword) {
        showAuthAlert('Las contraseñas no coinciden. Verifícalas.');
        return;
    }

    const users = getRegisteredUsers();
    if (users.some(u => u.email === email)) {
        showAuthAlert('Este correo ya está registrado. Inicia sesión o usa otro correo.');
        return;
    }

    const newUser = {
        id: Date.now(),
        name,
        role,
        email,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveRegisteredUsers(users);

    let currentPerfil = {};
    try {
        currentPerfil = JSON.parse(localStorage.getItem(STORAGE_KEY_PERFIL_AUTH)) || {};
    } catch {
        currentPerfil = {};
    }

    localStorage.setItem(STORAGE_KEY_PERFIL_AUTH, JSON.stringify({
        ...currentPerfil,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email
    }));

    showAuthAlert('Cuenta creada y verificada correctamente. Redirigiendo al login...', 'success');
    setTimeout(() => {
        window.location.href = 'index.html?registered=1';
    }, 1200);
}

// 2. AUTENTICACIÓN DE USUARIO REGISTRADO (index.html)
function handleLogin(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email') || document.getElementById('loginEmail');
    const passwordInput = document.getElementById('password') || document.getElementById('loginPassword');
    const emailError = document.getElementById('emailError');
    const passwordError = document.getElementById('passwordError');

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let hasFieldError = false;
    if (!email || !emailRegex.test(email)) {
        if (emailError) emailError.classList.remove('hidden');
        hasFieldError = true;
    } else if (emailError) {
        emailError.classList.add('hidden');
    }

    if (!password) {
        if (passwordError) passwordError.classList.remove('hidden');
        hasFieldError = true;
    } else if (passwordError) {
        passwordError.classList.add('hidden');
    }

    if (hasFieldError) return;

    const users = getRegisteredUsers();
    if (users.length === 0) {
        showAuthAlert('No hay cuentas registradas todavía. Haz clic en "Crear cuenta" primero.');
        return;
    }

    const matchedUser = users.find(u => u.email === email);
    if (!matchedUser) {
        showAuthAlert('No existe ninguna cuenta asociada a este correo electrónico.');
        return;
    }

    if (matchedUser.passwordHash !== hashPassword(password)) {
        showAuthAlert('Contraseña incorrecta. Verifica tus credenciales.');
        return;
    }

    localStorage.setItem('rolUsuario', 'admin');
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({
        authenticated: true,
        role: 'admin',
        userId: matchedUser.id,
        email: matchedUser.email,
        loginAt: Date.now()
    }));

    window.location.href = 'perfil-usuario.html';
}

// Acceso como Invitado (Solo lectura)
function loginAsGuest() {
    localStorage.setItem('rolUsuario', 'invitado');
    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify({
        authenticated: true,
        role: 'invitado',
        loginAt: Date.now()
    }));

    window.location.href = 'perfil-usuario.html';
}

// Cerrar sesión limpia credenciales activas
function logoutUser() {
    localStorage.removeItem('rolUsuario');
    localStorage.removeItem(STORAGE_KEY_SESSION);
    window.location.href = 'index.html';
}

// 3. AUTORIZACIÓN Y GUARDIA DE RUTAS
function enforceAuthorization() {
    const path = window.location.pathname.toLowerCase();
    const isPublicPage = path.endsWith('index.html') || path.endsWith('registro.html') || path.endsWith('/');

    if (isPublicPage) {
        const params = new URLSearchParams(window.location.search);
        if (params.get('registered') === '1') {
            showAuthAlert('¡Cuenta lista! Ingresa tu correo y contraseña para entrar.', 'success');
        }
        return;
    }

    const rol = localStorage.getItem('rolUsuario');
    let session = null;
    try {
        session = JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION));
    } catch {
        session = null;
    }

    if (!session || !session.authenticated || (rol !== 'admin' && rol !== 'invitado')) {
        window.location.replace('index.html');
        return;
    }

    if (rol === 'admin') {
        const users = getRegisteredUsers();
        const validAdmin = users.some(u => u.email === session.email && u.id === session.userId);
        if (!validAdmin) {
            localStorage.removeItem('rolUsuario');
            localStorage.removeItem(STORAGE_KEY_SESSION);
            window.location.replace('index.html');
        }
    }
}

enforceAuthorization();

document.addEventListener('DOMContentLoaded', () => {
    if (window.lucide) lucide.createIcons();

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const guestBtn = document.getElementById('guestBtn');
    if (guestBtn) {
        guestBtn.addEventListener('click', loginAsGuest);
    }
});