const STORAGE_KEY_HABILIDADES = 'portal_habilidades';

const modal = document.getElementById('addSkillModal');
const form = document.getElementById('addSkillForm');
const inputName = document.getElementById('skillName');
const listaBlandas = document.getElementById('lista-blandas');
const listaTecnicas = document.getElementById('lista-tecnicas');

function isGuest() {
    return localStorage.getItem('rolUsuario') === 'invitado';
}

function getSkills() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_HABILIDADES)) || [];
    } catch {
        return [];
    }
}

function saveSkills(skills) {
    if (isGuest()) return;
    localStorage.setItem(STORAGE_KEY_HABILIDADES, JSON.stringify(skills));
}

function renderSkills() {
    const skills = getSkills();
    const guest = isGuest();
    listaBlandas.innerHTML = '';
    listaTecnicas.innerHTML = '';

    skills.forEach(skill => {
        const chip = document.createElement('div');
        chip.className = 'bg-brand-surface/60 backdrop-blur-md text-brand-textMain text-[11px] font-bold px-3.5 py-2 rounded-lg border border-white/40 shadow-sm animate-fade-in flex items-center gap-1.5';

        const iconName = skill.type === 'blanda' ? 'users' : 'code';
        chip.innerHTML = `
            <i data-lucide="${iconName}" class="w-3 h-3 text-brand-textMuted"></i>
            <span>${skill.name}</span>
            ${!guest ? `
            <button type="button" onclick="deleteSkill(${skill.id})" class="ml-1 text-brand-textMuted hover:text-red-500 transition-colors" title="Quitar habilidad">
                <i data-lucide="x" class="w-3 h-3"></i>
            </button>
            ` : ''}
        `;

        if (skill.type === 'blanda') {
            listaBlandas.appendChild(chip);
        } else {
            listaTecnicas.appendChild(chip);
        }
    });

    lucide.createIcons();
}

function deleteSkill(id) {
    if (isGuest()) return;
    const filtradas = getSkills().filter(s => s.id !== id);
    saveSkills(filtradas);
    renderSkills();
}

function openModal() {
    if (isGuest()) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => inputName.focus(), 100);
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    form.reset();
}

modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isGuest()) return;

    const name = inputName.value.trim();
    const type = document.querySelector('input[name="skillType"]:checked').value;

    if (name) {
        const skills = getSkills();
        skills.push({
            id: Date.now(),
            name,
            type
        });
        saveSkills(skills);
        renderSkills();
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (isGuest()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
    renderSkills();
});