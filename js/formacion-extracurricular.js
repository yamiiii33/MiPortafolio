const STORAGE_KEY_EXTRACURRICULAR = 'portal_extracurricular';

const isGuest = () => localStorage.getItem('rolUsuario') === 'invitado';

let activities = loadActivities();
let selectedActivityId = null;

function loadActivities() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_EXTRACURRICULAR)) || [];
    } catch {
        return [];
    }
}

function saveActivities() {
    if (isGuest()) return;
    localStorage.setItem(STORAGE_KEY_EXTRACURRICULAR, JSON.stringify(activities));
}

document.addEventListener('DOMContentLoaded', () => {
    if (isGuest()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
    lucide.createIcons();
    renderActivities();
});

function renderActivities() {
    const listEl = document.getElementById('activitiesList');
    const emptyEl = document.getElementById('emptyState');
    const summaryText = document.getElementById('summaryCountText');
    const guest = isGuest();

    listEl.innerHTML = '';

    if (summaryText) {
        const total = activities.length;
        summaryText.textContent = total === 1
            ? '1 formación extracurricular registrada en tu portafolio.'
            : `${total} formaciones extracurriculares registradas en tu portafolio.`;
    }

    if (activities.length === 0) {
        emptyEl.style.display = 'block';
        const emptyText = document.getElementById('emptyStateText');
        if (emptyText && guest) {
            emptyText.textContent = 'Aún no hay cursos, talleres o certificaciones registradas.';
        }
        return;
    } else {
        emptyEl.style.display = 'none';
    }

    activities.forEach(act => {
        const card = document.createElement('div');
        card.className = 'bg-brand-surface rounded-[20px] p-4 shadow-card border border-white/50 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] animate-fade-in';
        card.onclick = () => openDetailModal(act.id);

        card.innerHTML = `
            <div class="min-w-0 flex-1">
                <span class="inline-block px-2 py-0.5 rounded-md bg-brand-btnBg/50 text-brand-textMain text-[9px] font-bold uppercase tracking-wider mb-1.5">
                    ${escapeHtml(act.type)}
                </span>
                <h3 class="text-sm font-bold text-brand-textMain leading-snug truncate">${escapeHtml(act.title)}</h3>
                <div class="flex items-center gap-1.5 text-[11px] text-brand-textMuted font-medium mt-1">
                    <span class="truncate">${escapeHtml(act.institution)}</span>
                    <span>•</span>
                    <span>${escapeHtml(String(act.year))}</span>
                </div>
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-brand-textMain shrink-0" aria-label="Ver detalles">
                <i data-lucide="arrow-up-right" class="w-4 h-4"></i>
            </div>
        `;

        listEl.appendChild(card);
    });

    lucide.createIcons();
}

function openAddModal() {
    if (isGuest()) return;
    document.getElementById('addActivityForm').reset();
    openModal('addModal');
    setTimeout(() => document.getElementById('actTitle').focus(), 100);
}

function openSparkleModal() {
    openModal('sparkleModal');
}

function openDetailModal(id) {
    const act = activities.find(a => a.id === id);
    if (!act) return;

    selectedActivityId = id;

    document.getElementById('detailTitle').textContent = act.title;
    document.getElementById('detailType').textContent = act.type;
    document.getElementById('detailInstitution').textContent = act.institution;
    document.getElementById('detailDate').textContent = `Completado en ${act.year}`;
    document.getElementById('detailHours').textContent = act.hours || 'Horas no especificadas';
    document.getElementById('detailDescription').textContent = act.description || 'Sin descripción adicional proporcionada.';

    const deleteBtn = document.getElementById('deleteActBtn');
    if (deleteBtn) {
        deleteBtn.style.display = isGuest() ? 'none' : 'flex';
    }

    openModal('detailModal');
}

function openModal(modalId) {
    if (modalId === 'addModal' && isGuest()) return;
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function handleBackdropClick(event, modalId) {
    if (event.target.id === modalId) {
        closeModal(modalId);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal('addModal');
        closeModal('detailModal');
        closeModal('sparkleModal');
    }
});

function handleSaveActivity(e) {
    e.preventDefault();
    if (isGuest()) return;

    const title = document.getElementById('actTitle').value.trim();
    const type = document.getElementById('actType').value;
    const institution = document.getElementById('actInstitution').value.trim();
    const year = document.getElementById('actYear').value;
    const hours = document.getElementById('actHours').value.trim();
    const desc = document.getElementById('actDesc').value.trim();

    if (!title || !institution) return;

    const newAct = {
        id: Date.now(),
        title,
        type,
        institution,
        year: year || '2026',
        hours: hours ? `${hours} hrs` : 'Duración variable',
        description: desc || 'Actividad registrada en el Portal de Evidencias.'
    };

    activities.unshift(newAct);
    saveActivities();
    renderActivities();
    closeModal('addModal');
    showToast('Actividad agregada exitosamente');
}

function deleteCurrentActivity() {
    if (isGuest() || selectedActivityId === null) return;

    activities = activities.filter(a => a.id !== selectedActivityId);
    selectedActivityId = null;
    saveActivities();
    renderActivities();
    closeModal('detailModal');
    showToast('Actividad eliminada');
}

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    const msgEl = document.getElementById('toastMessage');
    msgEl.textContent = message;

    toast.classList.remove('translate-y-[-200%]', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-[-200%]', 'opacity-0');
    }, 2600);
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, function (m) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[m];
    });
}