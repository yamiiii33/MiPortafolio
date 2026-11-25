document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitBtn = document.getElementById('submitBtn');
    const guestBtn = document.getElementById('guestBtn');

    const isValidEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    };

    const showError = (input, show) => {
        const group = input.closest('.form-group');
        const errorMsg = group.querySelector('.error-message');

        if (show) {
            input.classList.remove('border-brand-input-border');
            input.classList.add('border-brand-error');
            errorMsg.classList.remove('hidden');
            group.classList.add('error-shake');

            setTimeout(() => {
                group.classList.remove('error-shake');
            }, 500);
        } else {
            input.classList.add('border-brand-input-border');
            input.classList.remove('border-brand-error');
            errorMsg.classList.add('hidden');
        }
    };

    emailInput.addEventListener('input', () => showError(emailInput, false));
    passwordInput.addEventListener('input', () => showError(passwordInput, false));

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        let hasErrors = false;

        if (!emailInput.value.trim() || !isValidEmail(emailInput.value.trim())) {
            showError(emailInput, true);
            hasErrors = true;
        }

        if (!passwordInput.value) {
            showError(passwordInput, true);
            hasErrors = true;
        }

        if (!hasErrors) {
            // Guardamos el rol de administrador (acceso total)
            localStorage.setItem('rolUsuario', 'admin');

            submitBtn.innerHTML = `<i data-lucide="loader-2" class="w-[18px] h-[18px] stroke-[2.5] animate-spin"></i> <span>Iniciando...</span>`;
            lucide.createIcons();
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-75', 'cursor-not-allowed');

            setTimeout(() => {
                window.location.href = 'perfil-usuario.html';
            }, 1000);
        }
    });

    guestBtn.addEventListener('click', () => {
        // Guardamos el rol de invitado (estrictamente solo lectura)
        localStorage.setItem('rolUsuario', 'invitado');

        guestBtn.innerHTML = `<i data-lucide="loader-2" class="w-[16px] h-[16px] stroke-[2.5] animate-spin"></i> <span>Entrando...</span>`;
        lucide.createIcons();
        guestBtn.disabled = true;

        setTimeout(() => {
            window.location.href = 'perfil-usuario.html';
        }, 800);
    });
});