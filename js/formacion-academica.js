const STORAGE_KEY_ACADEMICA = 'portal_formacion_academica';

const isGuest = () => localStorage.getItem('rolUsuario') === 'invitado';

let pendingAcadFile = null;
let currentViewingEstudio = null;

function clearAcadEvidence() {
    pendingAcadFile = null;
    const input = document.getElementById('acadEvidenceFile');
    const nameSpan = document.getElementById('acadEvidenceFileName');
    const clearBtn = document.getElementById('clearAcadEvidenceBtn');
    if (input) input.value = '';
    if (nameSpan) nameSpan.textContent = 'Adjuntar PDF o imagen (opcional)';
    if (clearBtn) clearBtn.classList.add('hidden');
}

function closeAcadViewModal() {
    const modal = document.getElementById('viewAcadModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    currentViewingEstudio = null;
}

function downloadCurrentAcadEvidence() {
    if (!currentViewingEstudio || !currentViewingEstudio.evidenceFile) return;
    const link = document.createElement('a');
    link.href = currentViewingEstudio.evidenceFile.dataUrl;
    link.download = currentViewingEstudio.evidenceFile.name || 'evidencia_academica';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('add-modal');
    const btnOpen = document.getElementById('btn-open-modal');
    const btnClose = document.getElementById('btn-close-modal');
    const btnCancel = document.getElementById('btn-cancel-modal');
    const form = document.getElementById('form-formacion');
    const timelineItemsContainer = document.getElementById('timeline-items');
    const emptyState = document.getElementById('emptyState');

    const acadFileInput = document.getElementById('acadEvidenceFile');
    const acadFileNameSpan = document.getElementById('acadEvidenceFileName');
    const clearAcadBtn = document.getElementById('clearAcadEvidenceBtn');

    if (isGuest()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });
    }

    if (acadFileInput) {
        acadFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (file.size > 2 * 1024 * 1024) {
                alert('El archivo supera los 2 MB permitidos. Selecciona un archivo más ligero.');
                acadFileInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function (evt) {
                pendingAcadFile = {
                    name: file.name,
                    type: file.type,
                    dataUrl: evt.target.result
                };
                if (acadFileNameSpan) acadFileNameSpan.textContent = file.name;
                if (clearAcadBtn) clearAcadBtn.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        });
    }

    const getEstudios = () => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_ACADEMICA)) || [];
        } catch {
            return [];
        }
    };

    const saveEstudios = (lista) => {
        if (isGuest()) return;
        try {
            localStorage.setItem(STORAGE_KEY_ACADEMICA, JSON.stringify(lista));
        } catch {
            alert('El archivo es demasiado pesado para el navegador. Intenta con uno menor a 1.5 MB.');
        }
    };

    window.openAcadViewModal = (id) => {
        const item = getEstudios().find(e => e.id === id);
        if (!item) return;

        currentViewingEstudio = item;
        const vModal = document.getElementById('viewAcadModal');
        document.getElementById('viewAcadNivel').textContent = item.nivel || 'Formación Académica';
        document.getElementById('viewAcadTitle').textContent = item.titulo;
        document.getElementById('viewAcadInst').textContent = `${item.institucion} • ${item.periodo}`;

        const previewEl = document.getElementById('viewAcadPreview');
        const downloadBtn = document.getElementById('downloadAcadEvBtn');
        previewEl.innerHTML = '';
        previewEl.classList.add('hidden');
        downloadBtn.classList.add('hidden');

        if (item.evidenceFile) {
            downloadBtn.classList.remove('hidden');
            previewEl.classList.remove('hidden');

            if (item.evidenceFile.type && item.evidenceFile.type.startsWith('image/')) {
                previewEl.innerHTML = `<img src="${item.evidenceFile.dataUrl}" alt="Evidencia académica" class="w-full h-auto object-contain max-h-52">`;
            } else {
                previewEl.innerHTML = `
                    <div class="p-4 flex items-center gap-3 w-full">
                        <div class="w-10 h-10 rounded-xl bg-[#EDF9F4] text-[#389E82] flex items-center justify-center shrink-0">
                            <i data-lucide="file-check" class="w-5 h-5"></i>
                        </div>
                        <div class="min-w-0">
                            <span class="text-xs font-bold text-[#1E1B24] block truncate">${item.evidenceFile.name}</span>
                            <span class="text-[10px] text-[#726A80]">Documento probatorio adjunto</span>
                        </div>
                    </div>
                `;
            }
        }

        vModal.classList.remove('hidden');
        vModal.classList.add('flex');
        if (typeof lucide !== 'undefined') lucide.createIcons();
    };

    window.toggleIncludeInCV = (id) => {
        if (isGuest()) return;
        const lista = getEstudios().map(item => {
            if (item.id === id) {
                const current = item.incluirEnCV !== false;
                return { ...item, incluirEnCV: !current };
            }
            return item;
        });
        saveEstudios(lista);
        renderEstudios();
    };

    const renderEstudios = () => {
        const estudios = getEstudios();
        const guest = isGuest();
        timelineItemsContainer.querySelectorAll('[data-estudio-item]').forEach(el => el.remove());

        const countBadge = document.getElementById('estudiosCountBadge');
        if (countBadge) countBadge.textContent = estudios.length;

        if (estudios.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'flex';
                const emptyText = document.getElementById('emptyStateText');
                if (emptyText && guest) {
                    emptyText.textContent = 'Aún no hay estudios registrados.';
                }
            }
            return;
        }

        if (emptyState) emptyState.style.display = 'none';

        estudios.forEach(item => {
            const enCV = item.incluirEnCV !== false;
            const hasEvidence = Boolean(item.evidenceFile);
            const nivelLabel = item.nivel || 'Formación Académica';

            const itemHTML = `
                <div data-estudio-item="${item.id}" class="study-row-card flex flex-col gap-2.5">
                    <div class="flex items-start justify-between gap-3">
                        <div class="flex items-start gap-3 min-w-0 flex-1 ${hasEvidence ? 'cursor-pointer' : ''}" ${hasEvidence ? `onclick="openAcadViewModal(${item.id})"` : ''}>
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F6F1FC] to-[#EDF9F4] text-[#493653] flex items-center justify-center shrink-0 mt-0.5">
                                <i data-lucide="graduation-cap" class="w-5 h-5"></i>
                            </div>
                            <div class="min-w-0 flex-1">
                                <span class="inline-block text-[10px] font-bold text-[#493653] bg-[#F6F1FC] px-2 py-0.5 rounded-full mb-1">
                                    ${nivelLabel}
                                </span>
                                <h3 class="text-sm font-bold text-[#1E1B24] leading-snug">${item.titulo}</h3>
                                <p class="text-xs text-[#726A80] font-medium mt-0.5">${item.institucion}</p>
                            </div>
                        </div>

                        ${!guest ? `
                        <button type="button" data-delete-id="${item.id}" class="text-[#9A92A6] hover:text-red-500 transition-colors p-1.5 shrink-0" title="Eliminar registro">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                    </div>

                    <!-- Metadatos inferiores: Periodo, Semestre/Promedio, Evidencia y Estado en CV -->
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EFEBF4]">
                        <div class="flex flex-wrap items-center gap-1.5">
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-[#FAF9FC] rounded-lg text-[10px] font-semibold text-[#726A80]">
                                <i data-lucide="calendar" class="w-3 h-3"></i> ${item.periodo}
                            </span>

                            ${item.semestre ? `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-[#EDF9F4] rounded-lg text-[10px] font-bold text-[#389E82]">
                                ${item.semestre}
                            </span>
                            ` : ''}

                            ${item.promedio ? `
                            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F6F1FC] rounded-lg text-[10px] font-bold text-[#493653]">
                                Prom: ${item.promedio}
                            </span>
                            ` : ''}

                            ${hasEvidence ? `
                            <button type="button" onclick="openAcadViewModal(${item.id})" class="inline-flex items-center gap-1 px-2 py-0.5 bg-[#493653] text-white rounded-lg text-[10px] font-bold cursor-pointer">
                                <i data-lucide="paperclip" class="w-2.5 h-2.5"></i> Evidencia
                            </button>
                            ` : ''}
                        </div>

                        ${!guest ? `
                        <button type="button" onclick="toggleIncludeInCV(${item.id})" class="text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${enCV ? 'bg-[#EDF9F4] text-[#389E82]' : 'bg-gray-100 text-[#8E859C]'}" title="Toca para activar o desactivar en tu CV">
                            ${enCV ? '✓ En CV' : 'Oculto en CV'}
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
            timelineItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        if (!guest) {
            timelineItemsContainer.querySelectorAll('[data-delete-id]').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (isGuest()) return;
                    const id = Number(btn.getAttribute('data-delete-id'));
                    const filtrados = getEstudios().filter(e => e.id !== id);
                    saveEstudios(filtrados);
                    renderEstudios();
                });
            });
        }

        lucide.createIcons();
    };

    const openModal = () => {
        if (isGuest()) return;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => document.getElementById('titulo').focus(), 100);
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        form.reset();
        clearAcadEvidence();
    };

    if (btnOpen) btnOpen.addEventListener('click', openModal);
    if (btnClose) btnClose.addEventListener('click', closeModal);
    if (btnCancel) btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (isGuest()) return;

        const nivel = document.getElementById('nivel_educativo')?.value || 'Universidad / Licenciatura';
        const titulo = document.getElementById('titulo').value.trim();
        const institucion = document.getElementById('institucion').value.trim();
        const semestre = document.getElementById('semestre_estatus')?.value.trim() || '';
        const promedio = document.getElementById('promedio')?.value.trim() || '';
        const fechaInicio = document.getElementById('fecha_inicio').value.trim();
        const fechaFin = document.getElementById('fecha_fin').value.trim();
        const incluirEnCV = document.getElementById('incluir_cv')?.checked !== false;

        let periodo = 'Presente';
        if (fechaInicio && fechaFin) periodo = `${fechaInicio} - ${fechaFin}`;
        else if (fechaInicio) periodo = `Desde ${fechaInicio}`;
        else if (fechaFin) periodo = `Hasta ${fechaFin}`;
        else periodo = 'Fecha no especificada';

        const estudios = getEstudios();
        estudios.unshift({
            id: Date.now(),
            nivel,
            titulo,
            institucion,
            semestre,
            promedio,
            periodo,
            incluirEnCV,
            evidenceFile: pendingAcadFile
        });

        saveEstudios(estudios);
        renderEstudios();
        closeModal();
    });

    renderEstudios();
});