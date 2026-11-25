const STORAGE_KEY_PROYECTOS = 'portal_proyectos';

const modal = document.getElementById('addProjectModal');
const form = document.getElementById('addProjectForm');
const projectsList = document.getElementById('projectsList');
const emptyState = document.getElementById('emptyState');

const projFileInput = document.getElementById('projectEvidenceFile');
const projFileNameSpan = document.getElementById('projectEvidenceFileName');
const clearProjFileBtn = document.getElementById('clearProjectEvidenceBtn');

let pendingProjectFile = null;
let currentViewingProject = null;

function isGuest() {
    return localStorage.getItem('rolUsuario') === 'invitado';
}

function getProyectos() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_PROYECTOS)) || [];
    } catch {
        return [];
    }
}

function saveProyectos(lista) {
    if (isGuest()) return;
    try {
        localStorage.setItem(STORAGE_KEY_PROYECTOS, JSON.stringify(lista));
    } catch (e) {
        alert('El archivo adjunto es demasiado pesado para el almacenamiento local. Intenta con un archivo menor a 1.5 MB.');
    }
}

if (projFileInput) {
    projFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('El archivo supera los 2 MB permitidos. Selecciona un archivo más ligero.');
            projFileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function (evt) {
            pendingProjectFile = {
                name: file.name,
                type: file.type,
                dataUrl: evt.target.result
            };
            projFileNameSpan.textContent = file.name;
            clearProjFileBtn.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    });
}

function clearProjectEvidence() {
    pendingProjectFile = null;
    if (projFileInput) projFileInput.value = '';
    if (projFileNameSpan) projFileNameSpan.textContent = 'Subir archivo, captura o PDF (opcional)';
    if (clearProjFileBtn) clearProjFileBtn.classList.add('hidden');
}

function renderProyectos() {
    const proyectos = getProyectos();
    const guest = isGuest();

    // Limpiar tarjetas previas manteniendo #emptyState
    Array.from(projectsList.children).forEach(child => {
        if (child.id !== 'emptyState') child.remove();
    });

    const badge = document.getElementById('projectsCountBadge');
    if (badge) badge.textContent = proyectos.length;

    if (proyectos.length === 0) {
        if (emptyState) emptyState.classList.remove('hidden');
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    proyectos.forEach(proj => {
        const hasAttachment = Boolean(proj.evidenceFile || (proj.link && proj.link.trim() !== ''));
        const card = document.createElement('div');
        card.className = 'project-row-card flex items-start justify-between gap-3';

        card.innerHTML = `
            <div class="flex items-start gap-3.5 min-w-0 flex-1 cursor-pointer" onclick="openViewProjectModal(${proj.id})">
                <div class="w-10 h-10 rounded-xl bg-[#F6F1FC] text-[#493653] flex items-center justify-center shrink-0 mt-0.5">
                    <i data-lucide="folder-git-2" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0 flex-1">
                    <h3 class="font-bold text-[#1E1B24] text-sm leading-tight truncate">${proj.name}</h3>
                    <p class="text-[11px] font-semibold text-[#389E82] mt-0.5 truncate">${proj.role}</p>
                    <p class="text-xs text-[#726A80] line-clamp-2 mt-1 leading-relaxed">${proj.desc}</p>
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                        <span class="text-[10px] font-bold text-[#493653] bg-[#F6F1FC] px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <i data-lucide="${hasAttachment ? 'paperclip' : 'eye'}" class="w-2.5 h-2.5"></i>
                            ${hasAttachment ? 'Ver evidencia' : 'Ver detalle'}
                        </span>
                    </div>
                </div>
            </div>
            ${!guest ? `
            <button type="button" onclick="deleteProyecto(${proj.id})" class="text-[#9A92A6] hover:text-red-500 transition-colors p-1.5 shrink-0" title="Eliminar proyecto">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
            ` : ''}
        `;

        projectsList.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function openViewProjectModal(id) {
    const proj = getProyectos().find(p => p.id === id);
    if (!proj) return;

    currentViewingProject = proj;
    const vModal = document.getElementById('viewProjectModal');
    document.getElementById('viewProjRole').textContent = proj.role;
    document.getElementById('viewProjTitle').textContent = proj.name;
    document.getElementById('viewProjDesc').textContent = proj.desc;

    const previewEl = document.getElementById('viewProjPreview');
    const linkBox = document.getElementById('viewProjLinkBox');
    const linkAnchor = document.getElementById('viewProjLinkAnchor');
    const downloadBtn = document.getElementById('downloadProjEvBtn');

    previewEl.innerHTML = '';
    previewEl.classList.add('hidden');
    downloadBtn.classList.add('hidden');

    if (proj.evidenceFile) {
        downloadBtn.classList.remove('hidden');
        previewEl.classList.remove('hidden');

        if (proj.evidenceFile.type && proj.evidenceFile.type.startsWith('image/')) {
            previewEl.innerHTML = `<img src="${proj.evidenceFile.dataUrl}" alt="Evidencia del proyecto" class="w-full h-auto object-contain max-h-52">`;
        } else {
            previewEl.innerHTML = `
                <div class="p-4 flex items-center gap-3 w-full">
                    <div class="w-10 h-10 rounded-xl bg-[#EDF9F4] text-[#389E82] flex items-center justify-center shrink-0">
                        <i data-lucide="file-archive" class="w-5 h-5"></i>
                    </div>
                    <div class="min-w-0">
                        <span class="text-xs font-bold text-[#1E1B24] block truncate">${proj.evidenceFile.name}</span>
                        <span class="text-[10px] text-[#726A80]">Archivo de evidencia adjunto</span>
                    </div>
                </div>
            `;
        }
    }

    if (proj.link && proj.link.trim() !== '') {
        linkBox.classList.remove('hidden');
        linkAnchor.href = proj.link;
        linkAnchor.textContent = proj.link;
    } else {
        linkBox.classList.add('hidden');
    }

    vModal.classList.remove('hidden');
    vModal.classList.add('flex');
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function closeViewProjectModal() {
    const vModal = document.getElementById('viewProjectModal');
    vModal.classList.add('hidden');
    vModal.classList.remove('flex');
    currentViewingProject = null;
}

function downloadCurrentProjectEvidence() {
    if (!currentViewingProject || !currentViewingProject.evidenceFile) return;
    const link = document.createElement('a');
    link.href = currentViewingProject.evidenceFile.dataUrl;
    link.download = currentViewingProject.evidenceFile.name || 'evidencia_proyecto';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function deleteProyecto(id) {
    if (isGuest()) return;
    const filtrados = getProyectos().filter(p => p.id !== id);
    saveProyectos(filtrados);
    renderProyectos();
}

function openModal() {
    if (isGuest()) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => document.getElementById('projectName').focus(), 100);
}

function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    form.reset();
    clearProjectEvidence();
}

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (isGuest()) return;

    const name = document.getElementById('projectName').value.trim();
    const role = document.getElementById('projectRole').value.trim();
    const desc = document.getElementById('projectDesc').value.trim();
    const link = document.getElementById('projectLink') ? document.getElementById('projectLink').value.trim() : '';

    if (name && role && desc) {
        const proyectos = getProyectos();
        proyectos.unshift({
            id: Date.now(),
            name,
            role,
            desc,
            evidenceFile: pendingProjectFile,
            link
        });
        saveProyectos(proyectos);
        renderProyectos();
        closeModal();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (isGuest()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }
    renderProyectos();
});