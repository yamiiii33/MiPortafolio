const STORAGE_KEY_EXPERIENCIA = 'portal_experiencia';

const modal = document.getElementById('addExperienceModal');
const form = document.getElementById('addExperienceForm');
const inputTitle = document.getElementById('jobTitle');
const listaLaboral = document.getElementById('lista-laboral');
const listaPracticas = document.getElementById('lista-practicas');

const evidenceFileInput = document.getElementById('expEvidenceFile');
const evidenceFileNameSpan = document.getElementById('expEvidenceFileName');
const clearEvidenceBtn = document.getElementById('clearExpEvidenceBtn');

let pendingEvidenceFile = null;
let currentViewingExp = null;

function isGuest() {
    return localStorage.getItem('rolUsuario') === 'invitado';
}

function getExperiencias() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_EXPERIENCIA)) || [];
    } catch {
        return [];
    }
}

function saveExperiencias(lista) {
    if (isGuest()) return;
    try {
        localStorage.setItem(STORAGE_KEY_EXPERIENCIA, JSON.stringify(lista));
    } catch (e) {
        alert('El archivo adjunto es demasiado pesado para el almacenamiento local. Intenta con un archivo menor a 1.5 MB.');
    }
}

// Manejo de archivo de evidencia seleccionado
if (evidenceFileInput) {
    evidenceFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('El archivo supera los 2 MB permitidos. Selecciona un PDF o imagen más ligero.');
            evidenceFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
            pendingEvidenceFile = {
                name: file.name,
                type: file.type,
                dataUrl: evt.target.result
            };
            evidenceFileNameSpan.textContent = file.name;
            clearEvidenceBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    });
}

function clearExpEvidence() {
    pendingEvidenceFile = null;
    if (evidenceFileInput) evidenceFileInput.value = '';
    if (evidenceFileNameSpan) evidenceFileNameSpan.textContent = 'Adjuntar PDF o imagen (opcional)';
    if (clearEvidenceBtn) clearEvidenceBtn.classList.add('hidden');
}

function renderExperiencias() {
    const experiencias = getExperiencias();
    const guest = isGuest();
    listaLaboral.innerHTML = '';
    listaPracticas.innerHTML = '';

    let countLab = 0;
    let countPrac = 0;

    experiencias.forEach(exp => {
        if (exp.type === 'laboral') countLab++;
        else countPrac++;

        const hasEvidence = Boolean(exp.evidenceFile || (exp.evidenceNote && exp.evidenceNote.trim() !== ''));

        const card = document.createElement('div');
        card.className = 'exp-row-card flex items-center justify-between gap-3 group';

        const iconBg = exp.type === 'laboral'
            ? 'bg-[#F6F1FC] text-[#493653]'
            : 'bg-[#EDF9F4] text-[#389E82]';
        const iconName = exp.type === 'laboral' ? 'briefcase' : 'graduation-cap';

        card.innerHTML = `
            <div class="flex items-start gap-3.5 min-w-0 flex-1 ${hasEvidence ? 'cursor-pointer' : ''}" ${hasEvidence ? `onclick="openEvidenceModal(${exp.id})"` : ''}>
                <div class="w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0 mt-0.5">
                    <i data-lucide="${iconName}" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-[#1E1B24] text-sm leading-tight truncate">${exp.title}</h3>
                    <p class="text-xs font-medium text-[#726A80] truncate mt-0.5">${exp.company}</p>
                    <div class="flex flex-wrap items-center gap-2 mt-1.5">
                        <span class="text-[10px] font-semibold text-[#726A80] inline-flex items-center gap-1">
                            <i data-lucide="calendar" class="w-3 h-3"></i> ${exp.periodo}
                        </span>
                        ${hasEvidence ? `
                        <span class="text-[10px] font-bold text-[#389E82] bg-[#EDF9F4] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <i data-lucide="paperclip" class="w-2.5 h-2.5"></i> Ver evidencia
                        </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                ${hasEvidence ? `
                <button type="button" onclick="openEvidenceModal(${exp.id})" class="text-[#493653] hover:bg-[#F6F1FC] rounded-full p-1.5 transition-colors" title="Ver evidencia">
                    <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
                ` : ''}
                ${!guest ? `
                <button type="button" onclick="deleteExperiencia(${exp.id})" class="text-[#9A92A6] hover:text-red-500 transition-colors p-1.5" title="Eliminar">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
                ` : ''}
            </div>
        `;

        if (exp.type === 'laboral') {
            listaLaboral.appendChild(card);
        } else {
            listaPracticas.appendChild(card);
        }
    });

    // Estado vacío amigable si alguna lista no tiene elementos
    if (countLab === 0) {
        listaLaboral.innerHTML = `<div class="exp-row-card text-center py-6"><p class="text-xs text-[#726A80]">No hay experiencia laboral registrada aún.</p></div>`;
    }
    if (countPrac === 0) {
        listaPracticas.innerHTML = `<div class="exp-row-card text-center py-6"><p class="text-xs text-[#726A80]">No hay prácticas ni servicio social registrados.</p></div>`;
    }

    const badgeLab = document.getElementById('count-laboral');
    const badgePrac = document.getElementById('count-practicas');
    if (badgeLab) badgeLab.textContent = countLab;
    if (badgePrac) badgePrac.textContent = countPrac;

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openEvidenceModal(id) {
    const exp = getExperiencias().find(e => e.id === id);
    if (!exp) return;

    currentViewingExp = exp;
    const evModal = document.getElementById('viewEvidenceModal');
    const titleEl = document.getElementById('viewEvTitle');
    const subEl = document.getElementById('viewEvSubtitle');
    const previewEl = document.getElementById('viewEvPreview');
    const noteBox = document.getElementById('viewEvNoteBox');
    const noteText = document.getElementById('viewEvNoteText');
    const downloadBtn = document.getElementById('downloadEvBtn');

    titleEl.textContent = exp.title;
    subEl.textContent = `${exp.company} • ${exp.periodo}`;

    previewEl.innerHTML = '';
    previewEl.classList.add('hidden');
    downloadBtn.classList.add('hidden');

    if (exp.evidenceFile) {
        downloadBtn.classList.remove('hidden');
        previewEl.classList.remove('hidden');

        if (exp.evidenceFile.type && exp.evidenceFile.type.startsWith('image/')) {
            previewEl.innerHTML = `<img src="${exp.evidenceFile.dataUrl}" alt="Evidencia" class="w-full h-auto object-contain max-h-52">`;
        } else {
            previewEl.innerHTML = `
                <div class="p-4 flex items-center gap-3 w-full">
                    <div class="w-10 h-10 rounded-xl bg-[#F6F1FC] text-[#493653] flex items-center justify-center shrink-0">
                        <i data-lucide="file-check" class="w-5 h-5"></i>
                    </div>
                    <div class="min-w-0">
                        <span class="text-xs font-bold text-[#1E1B24] block truncate">${exp.evidenceFile.name}</span>
                        <span class="text-[10px] text-[#726A80]">Documento PDF adjunto</span>
                    </div>
                </div>
            `;
        }
    }

    if (exp.evidenceNote && exp.evidenceNote.trim() !== '') {
        noteBox.classList.remove('hidden');
        noteText.textContent = exp.evidenceNote;
    } else {
        noteBox.classList.add('hidden');
    }

    evModal.classList.remove('hidden');
    evModal.classList.add('flex');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeEvidenceModal() {
    const evModal = document.getElementById('viewEvidenceModal');
    evModal.classList.add('hidden');
    evModal.classList.remove('flex');
    currentViewingExp = null;
}

function downloadCurrentExpEvidence() {
    if (!currentViewingExp || !currentViewingExp.evidenceFile) return;
    const link = document.createElement('a');
    link.href = currentViewingExp.evidenceFile.dataUrl;
    link.download = currentViewingExp.evidenceFile.name || 'evidencia_experiencia';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function deleteExperiencia(id) {
    if (isGuest()) return;
    const filtradas = getExperiencias().filter(e => e.id !== id);
    saveExperiencias(filtradas);
    renderExperiencias();
}

function openModal() {
    if (isGuest()) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => inputTitle.focus(), 100);
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    form.reset();
    clearExpEvidence();
}

modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
});

form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (isGuest()) return;

    const title = inputTitle.value.trim();
    const company = document.getElementById('companyName').value.trim();
    const type = document.querySelector('input[name="expType"]:checked').value;

    const startDate = document.getElementById('startDate').value.trim();
    let endDate = document.getElementById('endDate').value.trim();
    if (!endDate) endDate = 'Presente';
    const periodo = `${startDate} - ${endDate}`;

    const evidenceNote = document.getElementById('expEvidenceNote')
        ? document.getElementById('expEvidenceNote').value.trim()
        : '';

    if (title && company && startDate) {
        const experiencias = getExperiencias();
        experiencias.unshift({
            id: Date.now(),
            title,
            company,
            type,
            periodo,
            evidenceFile: pendingEvidenceFile,
            evidenceNote
        });
        saveExperiencias(experiencias);
        renderExperiencias();
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (isGuest()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
    renderExperiencias();
});