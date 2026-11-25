const STORAGE_KEY_METAS = 'portal_metas';

const modal = document.getElementById('dynamicModal');
const form = document.getElementById('dynamicForm');
const modalTitle = document.getElementById('modalTitle');
const modalTypeInput = document.getElementById('modalType');
const modalFields = document.getElementById('modalFields');

function isGuest() {
    return localStorage.getItem('rolUsuario') === 'invitado';
}

function escapeHtml(text) {
    return String(text || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

const formConfigs = {
    'interes': {
        title: 'Editar Intereses',
        fields: `
            <div>
                <label class="block text-xs font-bold text-brand-textMuted mb-2">TUS INTERESES PROFESIONALES</label>
                <textarea id="inputValue" rows="3" required placeholder="Ej. Liderar equipos, aprender nuevas tecnologías..." 
                       class="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-brand-textMain text-sm font-medium focus:outline-none focus:border-brand-beigeDark focus:bg-white transition-colors placeholder:text-gray-400 resize-none"></textarea>
            </div>
        `
    },
    'aficion': {
        title: 'Nueva Afición',
        fields: `
            <div>
                <label class="block text-xs font-bold text-brand-textMuted mb-2">NOMBRE DE LA AFICIÓN</label>
                <input type="text" id="inputValue" required placeholder="Ej. Fotografía, Lectura..." 
                       class="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-brand-textMain text-sm font-medium focus:outline-none focus:border-brand-beigeDark focus:bg-white transition-colors placeholder:text-gray-400">
            </div>
        `
    },
    'meta': {
        title: 'Nueva Meta de Desarrollo',
        fields: `
            <div>
                <label class="block text-xs font-bold text-brand-textMuted mb-2">PLAZO</label>
                <select id="plazoMeta" class="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-brand-textMain text-sm font-medium focus:outline-none focus:border-brand-beigeDark focus:bg-white transition-colors mb-4 appearance-none">
                    <option value="3-meses">Próximos 3 meses</option>
                    <option value="6-meses">En 6 meses</option>
                    <option value="1-ano">En 1 año</option>
                </select>
            </div>
            <div>
                <label class="block text-xs font-bold text-brand-textMuted mb-2">DESCRIPCIÓN DE LA META</label>
                <textarea id="inputValue" rows="2" required placeholder="Ej. Completar certificación en Gestión Ágil..." 
                       class="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-brand-textMain text-sm font-medium focus:outline-none focus:border-brand-beigeDark focus:bg-white transition-colors placeholder:text-gray-400 resize-none"></textarea>
            </div>
        `
    }
};

function getMetasState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_METAS));
        return {
            interes: saved?.interes || '',
            aficiones: Array.isArray(saved?.aficiones) ? saved.aficiones : [],
            metas: {
                '3-meses': Array.isArray(saved?.metas?.['3-meses']) ? saved.metas['3-meses'] : [],
                '6-meses': Array.isArray(saved?.metas?.['6-meses']) ? saved.metas['6-meses'] : [],
                '1-ano': Array.isArray(saved?.metas?.['1-ano']) ? saved.metas['1-ano'] : []
            }
        };
    } catch {
        return { interes: '', aficiones: [], metas: { '3-meses': [], '6-meses': [], '1-ano': [] } };
    }
}

function saveMetasState(state) {
    if (isGuest()) return;
    localStorage.setItem(STORAGE_KEY_METAS, JSON.stringify(state));
}

function renderMetasState() {
    const state = getMetasState();
    const guest = isGuest();

    // 1. Intereses profesionales
    const textEl = document.getElementById('intereses-text');
    if (state.interes) {
        textEl.textContent = state.interes;
        textEl.classList.remove('text-brand-textMuted', 'text-center');
        textEl.classList.add('text-brand-textMain', 'font-medium', 'text-left');
    } else {
        textEl.textContent = guest
            ? 'Aún no hay intereses profesionales registrados.'
            : 'Toca para añadir tus intereses profesionales...';
        textEl.classList.add('text-brand-textMuted', 'text-center');
        textEl.classList.remove('text-brand-textMain', 'font-medium', 'text-left');
    }

    // 2. Aficiones (3 slots con botón de borrar para administrador)
    const aficionesGrid = document.getElementById('aficiones-grid');
    const existingEmptyMsg = document.getElementById('empty-aficiones-guest');
    if (existingEmptyMsg) existingEmptyMsg.remove();

    const aficionesContainers = document.querySelectorAll('#aficiones-grid > div');
    aficionesContainers.forEach((container, index) => {
        const aficion = state.aficiones[index];
        container.classList.add('relative');

        if (aficion) {
            container.style.display = 'flex';
            container.removeAttribute('onclick');
            container.classList.remove('cursor-pointer', 'hover:bg-gray-50');

            container.innerHTML = `
                ${!guest ? `
                <button type="button" onclick="deleteAficion(${index}, event)"
                        class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gray-100 hover:bg-red-50 text-brand-textMuted hover:text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                        title="Eliminar afición">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
                ` : ''}
                <span class="text-sm font-bold text-brand-textMain text-center px-2 break-words line-clamp-2 animate-fade-in">${escapeHtml(aficion)}</span>
            `;
        } else {
            if (guest) {
                container.style.display = 'none';
            } else {
                container.style.display = 'flex';
                container.setAttribute('onclick', "openModal('aficion')");
                container.classList.add('cursor-pointer', 'hover:bg-gray-50');
                container.innerHTML = `<i data-lucide="plus" class="w-6 h-6 text-brand-textMuted"></i>`;
            }
        }
    });

    if (guest && state.aficiones.length === 0 && aficionesGrid) {
        aficionesGrid.insertAdjacentHTML(
            'beforeend',
            `<p id="empty-aficiones-guest" class="col-span-3 text-xs text-brand-textMuted">Aún no hay aficiones registradas.</p>`
        );
    }

    // 3. Metas por plazo
    ['3-meses', '6-meses', '1-ano'].forEach(plazo => {
        const container = document.getElementById(`meta-${plazo}`);
        if (!container) return;
        container.innerHTML = '';

        state.metas[plazo].forEach(meta => {
            const metaHtml = `
                <div class="flex items-start justify-between gap-2 mt-2 animate-fade-in bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <div class="flex items-start gap-2">
                        <i data-lucide="target" class="w-4 h-4 text-brand-textMuted mt-0.5 shrink-0"></i>
                        <span>${escapeHtml(meta.text)}</span>
                    </div>
                    ${!guest ? `
                    <button type="button" onclick="deleteMeta('${plazo}', ${meta.id})" class="text-brand-textMuted hover:text-red-500 transition-colors p-0.5 shrink-0" title="Eliminar meta">
                        <i data-lucide="x" class="w-3.5 h-3.5"></i>
                    </button>
                    ` : ''}
                </div>
            `;
            container.insertAdjacentHTML('beforeend', metaHtml);
        });
    });

    lucide.createIcons();
}

function deleteAficion(index, event) {
    if (event) event.stopPropagation();
    if (isGuest()) return;

    const state = getMetasState();
    state.aficiones.splice(index, 1);
    saveMetasState(state);
    renderMetasState();
}

function deleteMeta(plazo, id) {
    if (isGuest()) return;
    const state = getMetasState();
    state.metas[plazo] = state.metas[plazo].filter(m => m.id !== id);
    saveMetasState(state);
    renderMetasState();
}

function openModal(type) {
    if (isGuest()) return;
    const config = formConfigs[type];
    if (!config) return;

    modalTitle.textContent = config.title;
    modalTypeInput.value = type;
    modalFields.innerHTML = config.fields;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    setTimeout(() => {
        const input = document.getElementById('inputValue');
        if (input) input.focus();

        if (type === 'interes') {
            const state = getMetasState();
            if (state.interes) input.value = state.interes;
        }
    }, 100);
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

    const type = modalTypeInput.value;
    const value = document.getElementById('inputValue').value.trim();
    if (!value) return;

    const state = getMetasState();

    if (type === 'interes') {
        state.interes = value;
    } else if (type === 'aficion') {
        if (state.aficiones.length < 3) {
            state.aficiones.push(value);
        } else {
            alert('Has alcanzado el límite de 3 aficiones mostradas.');
        }
    } else if (type === 'meta') {
        const plazo = document.getElementById('plazoMeta').value;
        if (state.metas[plazo]) {
            state.metas[plazo].push({
                id: Date.now(),
                text: value
            });
        }
    }

    saveMetasState(state);
    renderMetasState();
    closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
    if (isGuest()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });

        const interesesCard = document.getElementById('interesesCard');
        if (interesesCard) {
            interesesCard.removeAttribute('onclick');
            interesesCard.classList.remove('cursor-pointer', 'hover:bg-gray-50', 'group');
        }
    }
    renderMetasState();
});