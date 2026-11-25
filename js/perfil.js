const STORAGE_KEY_PERFIL = 'portal_perfil_info';
const STORAGE_KEY_REQ_DOCS = 'portal_perfil_required_docs';
const STORAGE_KEY_DOCS = 'portal_perfil_docs';

const REQUIRED_DOCS_CONFIG = [
    {
        key: 'acta',
        title: 'Acta de nacimiento',
        desc: 'Documento oficial certificado que acredita el nacimiento de la persona.',
        icon: 'file-text'
    },
    {
        key: 'ine',
        title: 'Identificación oficial (INE)',
        desc: 'Credencial para votar expedida por el INE con fotografía y vigencia.',
        icon: 'id-card'
    },
    {
        key: 'curp',
        title: 'CURP',
        desc: 'Clave Única de Registro de Población con formato oficial actualizado.',
        icon: 'shield-check'
    }
];

let pendingRequiredKey = null;
let currentViewingDoc = null;

function isGuest() {
    return localStorage.getItem('rolUsuario') === 'invitado';
}

document.addEventListener('DOMContentLoaded', () => {
    if (isGuest()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.style.display = 'none';
        });

        const avatarTrigger = document.getElementById('avatarUploadTrigger');
        if (avatarTrigger) {
            avatarTrigger.removeAttribute('onclick');
            avatarTrigger.removeAttribute('title');
            avatarTrigger.classList.remove('cursor-pointer', 'group');
        }

        const docsSubtitle = document.getElementById('docsSubtitle');
        if (docsSubtitle) {
            docsSubtitle.textContent = 'Consulta los documentos personales adjuntos';
        }
    }

    loadProfileData();
    renderAllDocuments();
    setupAvatarListener();
    setupFileListeners();
    lucide.createIcons();
});

function getSavedProfile() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_PERFIL)) || {};
    } catch {
        return {};
    }
}

function saveProfileStorage(data) {
    if (isGuest()) return false;
    try {
        localStorage.setItem(STORAGE_KEY_PERFIL, JSON.stringify(data));
        return true;
    } catch {
        showToast('Memoria llena: intenta con una imagen más ligera');
        return false;
    }
}

function getRequiredDocsMap() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_REQ_DOCS)) || {};
    } catch {
        return {};
    }
}

function saveRequiredDocsMap(map) {
    if (isGuest()) return false;
    try {
        localStorage.setItem(STORAGE_KEY_REQ_DOCS, JSON.stringify(map));
        return true;
    } catch {
        showToast('Memoria llena: intenta con un archivo más ligero');
        return false;
    }
}

function getSavedDocs() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_DOCS)) || [];
    } catch {
        return [];
    }
}

function saveCustomDocsList(docs) {
    if (isGuest()) return false;
    try {
        localStorage.setItem(STORAGE_KEY_DOCS, JSON.stringify(docs));
        return true;
    } catch {
        showToast('Memoria llena: intenta con un archivo más ligero');
        return false;
    }
}

function applyAvatarUI(avatarDataUrl, userName) {
    const initial = (userName || document.getElementById('userNameDisplay').textContent || 'S').trim().charAt(0).toUpperCase();

    const mainImg = document.getElementById('userAvatarImg');
    const mainText = document.getElementById('userAvatarText');
    const modalImg = document.getElementById('modalAvatarPreviewImg');
    const modalText = document.getElementById('modalAvatarPreviewText');
    const removeBtn = document.getElementById('removeAvatarBtn');

    mainText.textContent = initial;
    modalText.textContent = initial;

    if (avatarDataUrl) {
        mainImg.src = avatarDataUrl;
        mainImg.classList.remove('hidden');
        mainText.classList.add('hidden');

        modalImg.src = avatarDataUrl;
        modalImg.classList.remove('hidden');
        modalText.classList.add('hidden');
        removeBtn.classList.remove('hidden');
    } else {
        mainImg.src = '';
        mainImg.classList.add('hidden');
        mainText.classList.remove('hidden');

        modalImg.src = '';
        modalImg.classList.add('hidden');
        modalText.classList.remove('hidden');
        removeBtn.classList.add('hidden');
    }
}

function loadProfileData() {
    const data = getSavedProfile();
    const displayName = data.name || document.getElementById('userNameDisplay').textContent;

    if (data.name) {
        document.getElementById('userNameDisplay').textContent = data.name;
    }
    if (data.role) {
        document.getElementById('userRoleDisplay').textContent = data.role;
    }
    if (data.phone) {
        document.getElementById('displayPhone').textContent = data.phone;
    }
    if (data.email) {
        document.getElementById('displayEmail').textContent = data.email;
    }

    applyAvatarUI(data.avatar || '', displayName);
}

function triggerAvatarUpload() {
    if (isGuest()) return;
    const input = document.getElementById('avatarFileInput');
    input.value = '';
    input.click();
}

function processAvatarImage(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('Selecciona una imagen válida'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const targetSize = 320;
                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;

                const canvas = document.createElement('canvas');
                canvas.width = targetSize;
                canvas.height = targetSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

                resolve(canvas.toDataURL('image/jpeg', 0.82));
            };
            img.onerror = () => reject(new Error('No se pudo procesar la foto'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Error al leer la foto'));
        reader.readAsDataURL(file);
    });
}

function setupAvatarListener() {
    const avatarInput = document.getElementById('avatarFileInput');
    avatarInput.addEventListener('change', async (e) => {
        if (isGuest()) return;
        const file = e.target.files[0];
        if (!file) return;

        try {
            const avatarDataUrl = await processAvatarImage(file);
            const current = getSavedProfile();
            const updated = { ...current, avatar: avatarDataUrl };

            if (saveProfileStorage(updated)) {
                applyAvatarUI(avatarDataUrl, updated.name);
                showToast('Foto de perfil actualizada');
            }
        } catch (err) {
            showToast(err.message || 'No se pudo actualizar la foto');
        } finally {
            avatarInput.value = '';
        }
    });
}

function removeProfileAvatar() {
    if (isGuest()) return;
    const current = getSavedProfile();
    delete current.avatar;
    saveProfileStorage(current);
    applyAvatarUI('', current.name);
    showToast('Foto de perfil eliminada');
}

function formatTodayDate() {
    return new Date().toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function processUploadedFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No se seleccionó ningún archivo'));
            return;
        }

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxDim = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxDim || height > maxDim) {
                        if (width > height) {
                            height = Math.round((height * maxDim) / width);
                            width = maxDim;
                        } else {
                            width = Math.round((width * maxDim) / height);
                            height = maxDim;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.78);
                    resolve({
                        fileName: file.name,
                        fileType: 'image/jpeg',
                        fileData: compressedDataUrl
                    });
                };
                img.onerror = () => reject(new Error('No se pudo procesar la imagen'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Error al leer la imagen'));
            reader.readAsDataURL(file);
        } else {
            const maxBytes = 2 * 1024 * 1024;
            if (file.size > maxBytes) {
                reject(new Error('El archivo PDF supera el límite de 2 MB'));
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                resolve({
                    fileName: file.name,
                    fileType: file.type || 'application/pdf',
                    fileData: e.target.result
                });
            };
            reader.onerror = () => reject(new Error('Error al leer el archivo'));
            reader.readAsDataURL(file);
        }
    });
}

function triggerRequiredDocUpload(key) {
    if (isGuest()) return;
    pendingRequiredKey = key;
    const input = document.getElementById('requiredDocFileInput');
    input.value = '';
    input.click();
}

function clearNewDocFile() {
    if (isGuest()) return;
    const newDocInput = document.getElementById('newDocFile');
    const label = document.getElementById('newDocFileName');
    const zone = document.getElementById('dropZoneNewDoc');
    const clearBtn = document.getElementById('clearNewDocFileBtn');

    if (newDocInput) newDocInput.value = '';
    if (label) {
        label.textContent = 'Haz clic para adjuntar PDF o imagen';
        label.classList.remove('text-[#1f242d]', 'font-bold');
    }
    if (zone) {
        zone.classList.remove('border-[#2f3842]', 'bg-[#f4f1ea]');
    }
    if (clearBtn) {
        clearBtn.classList.add('hidden');
    }
}

function setupFileListeners() {
    const reqInput = document.getElementById('requiredDocFileInput');
    reqInput.addEventListener('change', async (e) => {
        if (isGuest()) return;
        const file = e.target.files[0];
        if (!file || !pendingRequiredKey) return;

        try {
            const processed = await processUploadedFile(file);
            const map = getRequiredDocsMap();
            map[pendingRequiredKey] = {
                ...processed,
                date: formatTodayDate()
            };

            if (saveRequiredDocsMap(map)) {
                const config = REQUIRED_DOCS_CONFIG.find(c => c.key === pendingRequiredKey);
                renderAllDocuments();
                showToast(`${config ? config.title : 'Documento'} subido correctamente`);
            }
        } catch (err) {
            showToast(err.message || 'No se pudo subir el archivo');
        } finally {
            pendingRequiredKey = null;
            reqInput.value = '';
        }
    });

    const newDocInput = document.getElementById('newDocFile');
    newDocInput.addEventListener('change', (e) => {
        if (isGuest()) return;
        const file = e.target.files[0];
        const label = document.getElementById('newDocFileName');
        const zone = document.getElementById('dropZoneNewDoc');
        const clearBtn = document.getElementById('clearNewDocFileBtn');

        if (file) {
            const sizeKB = Math.max(1, Math.round(file.size / 1024));
            label.textContent = `${file.name} (${sizeKB} KB)`;
            label.classList.add('text-[#1f242d]', 'font-bold');
            zone.classList.add('border-[#2f3842]', 'bg-[#f4f1ea]');
            if (clearBtn) clearBtn.classList.remove('hidden');
        } else {
            clearNewDocFile();
        }
    });
}

function renderAllDocuments() {
    const list = document.getElementById('documentsList');
    list.innerHTML = '';

    const guest = isGuest();
    const reqMap = getRequiredDocsMap();

    REQUIRED_DOCS_CONFIG.forEach(item => {
        const uploaded = reqMap[item.key];
        const card = document.createElement('div');

        if (uploaded && uploaded.fileData) {
            card.className = 'bg-[#fcfbf9] border border-[#e8e3d8] rounded-2xl p-4 flex items-center justify-between gap-2 cursor-pointer hover:border-[#c5b49f] hover:shadow-md transition-all group';
            card.addEventListener('click', () => {
                openDocumentModal({
                    kind: 'required',
                    key: item.key,
                    title: item.title,
                    desc: item.desc,
                    fileName: uploaded.fileName,
                    fileType: uploaded.fileType,
                    fileData: uploaded.fileData,
                    date: uploaded.date
                });
            });

            card.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                        <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-sm font-semibold text-[#1f242d] truncate">${item.title}</h4>
                        <span class="text-[11px] text-emerald-600 font-medium flex items-center gap-1 truncate">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> Subido • ${uploaded.fileName}
                        </span>
                    </div>
                </div>
                <i data-lucide="chevron-right" class="w-4 h-4 text-[#9c9384] shrink-0 group-hover:translate-x-0.5 transition-transform"></i>
            `;
        } else {
            card.className = guest
                ? 'bg-[#fcfbf9]/70 border border-[#e8e3d8] rounded-2xl p-4 flex items-center justify-between gap-2 opacity-75'
                : 'bg-[#fcfbf9] border border-[#e8e3d8] rounded-2xl p-4 flex items-center justify-between gap-2 cursor-pointer hover:border-[#c5b49f] hover:shadow-md transition-all group';

            if (!guest) {
                card.addEventListener('click', () => triggerRequiredDocUpload(item.key));
            }

            card.innerHTML = `
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-10 h-10 rounded-xl bg-[#f0ebd9] flex items-center justify-center text-[#7a6852] shrink-0">
                        <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                    </div>
                    <div class="min-w-0">
                        <h4 class="text-sm font-semibold text-[#1f242d] truncate">${item.title}</h4>
                        <span class="text-[11px] text-amber-600 font-medium flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span> ${guest ? 'Sin archivo adjunto' : 'Pendiente de subir'}
                        </span>
                    </div>
                </div>
                ${!guest ? `
                <button type="button" class="px-3 py-1.5 rounded-xl bg-[#eae5dc] hover:bg-[#ded6cb] text-[#2f3842] text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors">
                    <i data-lucide="upload" class="w-3 h-3"></i> Subir
                </button>
                ` : ''}
            `;
        }

        list.appendChild(card);
    });

    const customDocs = getSavedDocs();
    customDocs.forEach(doc => {
        const card = document.createElement('div');
        card.className = 'bg-[#fcfbf9] border border-[#e8e3d8] rounded-2xl p-4 flex items-center justify-between gap-2 cursor-pointer hover:border-[#c5b49f] hover:shadow-md transition-all group animate-fade-in';
        card.addEventListener('click', () => {
            openDocumentModal({
                kind: 'custom',
                id: doc.id,
                title: doc.title,
                desc: doc.desc,
                fileName: doc.fileName || 'Documento adjunto',
                fileType: doc.fileType || '',
                fileData: doc.fileData || '',
                date: doc.date
            });
        });

        card.innerHTML = `
            <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
                    <i data-lucide="file-check" class="w-5 h-5"></i>
                </div>
                <div class="min-w-0">
                    <h4 class="text-sm font-semibold text-[#1f242d] truncate">${doc.title}</h4>
                    <span class="text-[11px] text-emerald-600 font-medium flex items-center gap-1 truncate">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> ${doc.fileName ? `Subido • ${doc.fileName}` : 'Registrado'}
                    </span>
                </div>
            </div>
            <i data-lucide="chevron-right" class="w-4 h-4 text-[#9c9384] shrink-0 group-hover:translate-x-0.5 transition-transform"></i>
        `;

        list.appendChild(card);
    });

    lucide.createIcons();
}

function openModal(modalId) {
    const adminModals = ['editProfileModal', 'contactModal', 'addDocModal'];
    if (adminModals.includes(modalId) && isGuest()) return;

    const modal = document.getElementById(modalId);
    const content = modal.querySelector('div[id$="Content"]');
    modal.classList.remove('hidden');

    setTimeout(() => {
        modal.classList.remove('opacity-0');
        if (content) {
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }
    }, 10);

    if (modalId === 'editProfileModal') {
        const data = getSavedProfile();
        const currentName = document.getElementById('userNameDisplay').textContent;
        document.getElementById('inputUserName').value = currentName;
        document.getElementById('inputUserRole').value = document.getElementById('userRoleDisplay').textContent;
        applyAvatarUI(data.avatar || '', currentName);
    } else if (modalId === 'contactModal') {
        document.getElementById('inputPhone').value = document.getElementById('displayPhone').textContent;
        document.getElementById('inputEmail').value = document.getElementById('displayEmail').textContent;
    } else if (modalId === 'addDocModal') {
        document.getElementById('addDocForm').reset();
        clearNewDocFile();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal.querySelector('div[id$="Content"]');
    modal.classList.add('opacity-0');

    if (content) {
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
    }

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

function openDocumentModal(docObj) {
    currentViewingDoc = docObj;
    const guest = isGuest();

    document.getElementById('modalDocTitle').textContent = docObj.title;
    document.getElementById('modalDocDesc').textContent = docObj.desc;
    document.getElementById('modalDocFileName').textContent = docObj.fileName || 'Archivo adjunto';
    document.getElementById('modalDocDate').textContent = docObj.date || 'Hoy';

    const previewBox = document.getElementById('modalDocPreview');
    if (docObj.fileData && docObj.fileType && docObj.fileType.startsWith('image/')) {
        previewBox.innerHTML = `<img src="${docObj.fileData}" alt="${docObj.title}" class="w-full h-40 object-contain">`;
        previewBox.classList.remove('hidden');
    } else if (docObj.fileData) {
        previewBox.innerHTML = `
            <div class="py-5 flex flex-col items-center gap-1.5 text-[#7a6852]">
                <i data-lucide="file-text" class="w-8 h-8"></i>
                <span class="text-xs font-semibold">Documento PDF listo para descargar</span>
            </div>
        `;
        previewBox.classList.remove('hidden');
    } else {
        previewBox.classList.add('hidden');
        previewBox.innerHTML = '';
    }

    const replaceBtn = document.getElementById('modalReplaceBtn');
    const deleteBtn = document.getElementById('modalDeleteCustomBtn');

    if (guest) {
        replaceBtn.classList.add('hidden');
        deleteBtn.classList.add('hidden');
    } else if (docObj.kind === 'required') {
        replaceBtn.classList.remove('hidden');
        deleteBtn.classList.remove('hidden');
    } else {
        replaceBtn.classList.add('hidden');
        deleteBtn.classList.remove('hidden');
    }

    lucide.createIcons();
    openModal('viewDocModal');
}

function downloadCurrentDocument() {
    if (!currentViewingDoc || !currentViewingDoc.fileData) {
        showToast('No hay archivo adjunto para descargar');
        return;
    }

    const link = document.createElement('a');
    link.href = currentViewingDoc.fileData;
    link.download = currentViewingDoc.fileName || `${currentViewingDoc.title}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Descarga iniciada');
}

function replaceCurrentDocument() {
    if (isGuest() || !currentViewingDoc || currentViewingDoc.kind !== 'required') return;
    const key = currentViewingDoc.key;
    closeModal('viewDocModal');
    setTimeout(() => triggerRequiredDocUpload(key), 250);
}

function deleteCurrentCustomDocument() {
    if (isGuest() || !currentViewingDoc) return;

    if (currentViewingDoc.kind === 'required') {
        const map = getRequiredDocsMap();
        delete map[currentViewingDoc.key];
        saveRequiredDocsMap(map);
        renderAllDocuments();
        closeModal('viewDocModal');
        showToast('Archivo limpiado correctamente');
    } else if (currentViewingDoc.kind === 'custom') {
        const filtrados = getSavedDocs().filter(d => d.id !== currentViewingDoc.id);
        saveCustomDocsList(filtrados);
        renderAllDocuments();
        closeModal('viewDocModal');
        showToast('Documento eliminado');
    }
}

function showToast(message) {
    const toast = document.getElementById('toastNotification');
    document.getElementById('toastMessage').textContent = message;
    toast.classList.remove('translate-y-[-200%]');
    toast.classList.add('translate-y-0');

    setTimeout(() => {
        toast.classList.remove('translate-y-0');
        toast.classList.add('translate-y-[-200%]');
    }, 3000);
}

function saveProfile(event) {
    event.preventDefault();
    if (isGuest()) return;

    const newName = document.getElementById('inputUserName').value.trim();
    const newRole = document.getElementById('inputUserRole').value.trim();

    if (newName) {
        document.getElementById('userNameDisplay').textContent = newName;
        if (newRole) {
            document.getElementById('userRoleDisplay').textContent = newRole;
        }

        const current = getSavedProfile();
        const updated = {
            ...current,
            name: newName,
            role: newRole || document.getElementById('userRoleDisplay').textContent
        };
        saveProfileStorage(updated);
        applyAvatarUI(updated.avatar || '', newName);

        closeModal('editProfileModal');
        showToast('Perfil actualizado correctamente');
    }
}

function saveContact(event) {
    event.preventDefault();
    if (isGuest()) return;

    const phone = document.getElementById('inputPhone').value.trim();
    const email = document.getElementById('inputEmail').value.trim();

    if (phone && email) {
        document.getElementById('displayPhone').textContent = phone;
        document.getElementById('displayEmail').textContent = email;

        const current = getSavedProfile();
        saveProfileStorage({
            ...current,
            phone,
            email
        });

        closeModal('contactModal');
        showToast('Información de contacto actualizada');
    }
}

async function saveNewDocument(event) {
    event.preventDefault();
    if (isGuest()) return;

    const title = document.getElementById('newDocTitle').value.trim();
    const desc = document.getElementById('newDocDesc').value.trim() || 'Documento adjunto en el portal de evidencias.';
    const fileInput = document.getElementById('newDocFile');
    const file = fileInput.files[0];

    if (!title) return;

    if (!file) {
        showToast('Selecciona un archivo PDF o imagen primero');
        return;
    }

    try {
        const processed = await processUploadedFile(file);
        const newDoc = {
            id: Date.now(),
            title,
            desc,
            fileName: processed.fileName,
            fileType: processed.fileType,
            fileData: processed.fileData,
            date: formatTodayDate()
        };

        const docs = getSavedDocs();
        docs.push(newDoc);

        if (saveCustomDocsList(docs)) {
            renderAllDocuments();
            document.getElementById('addDocForm').reset();
            clearNewDocFile();
            closeModal('addDocModal');
            showToast('Documento guardado con éxito');
        }
    } catch (err) {
        showToast(err.message || 'No se pudo guardar el archivo');
    }
}

// =========================================================================
// EXPORTACIÓN DE CURRÍCULUM COMPLETO EN PDF (EXCLUYE ACTA, INE Y CURP)
// =========================================================================

function escapeCV(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function readStorageArray(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function exportFullCV() {
    // 1. Perfil y contacto (se omite explícitamente 'portal_perfil_required_docs': Acta, INE y CURP)
    const perfil = getSavedProfile();
    const nombre = perfil.name || document.getElementById('userNameDisplay')?.textContent || 'Usuario';
    const rol = perfil.role || document.getElementById('userRoleDisplay')?.textContent || '';
    const telefono = perfil.phone || document.getElementById('displayPhone')?.textContent || '';
    const correo = perfil.email || document.getElementById('displayEmail')?.textContent || '';
    const avatar = perfil.avatar || '';

    // 2. Secciones del portafolio
    const academica = readStorageArray('portal_formacion_academica');
    const experiencia = readStorageArray('portal_experiencia');
    const proyectos = readStorageArray('portal_proyectos');
    const extracurricular = readStorageArray('portal_extracurricular');
    const habilidades = readStorageArray('portal_habilidades');
    const docsAdicionales = getSavedDocs();

    let metasState = { interes: '', aficiones: [], metas: {} };
    try {
        metasState = JSON.parse(localStorage.getItem('portal_metas')) || metasState;
    } catch {}

    const laborales = experiencia.filter(e => e.type === 'laboral');
    const practicas = experiencia.filter(e => e.type !== 'laboral');
    const habTecnicas = habilidades.filter(h => h.type !== 'blanda');
    const habBlandas = habilidades.filter(h => h.type === 'blanda');

    const metasList = [
        ...(metasState.metas?.['3-meses'] || []).map(m => ({ plazo: '3 meses', text: m.text })),
        ...(metasState.metas?.['6-meses'] || []).map(m => ({ plazo: '6 meses', text: m.text })),
        ...(metasState.metas?.['1-ano'] || []).map(m => ({ plazo: '1 año', text: m.text }))
    ];

    const cvWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!cvWindow) {
        showToast('Habilita las ventanas emergentes para generar tu CV');
        return;
    }

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CV - ${escapeCV(nombre)}</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            color: #1f242d;
            background: #f3f4f6;
            padding: 24px;
            line-height: 1.5;
        }
        .toolbar {
            max-width: 800px;
            margin: 0 auto 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #2f3842;
            color: #fff;
            padding: 12px 20px;
            border-radius: 12px;
        }
        .toolbar button {
            background: #d6bc9f;
            color: #1f242d;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
        }
        .page {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px 48px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
        .header {
            display: flex;
            align-items: center;
            gap: 20px;
            border-bottom: 2px solid #d6bc9f;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }
        .avatar {
            width: 76px;
            height: 76px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #d6bc9f;
        }
        .header h1 { font-size: 26px; font-weight: 800; color: #1f242d; text-transform: capitalize; }
        .header .role { font-size: 14px; color: #625345; font-weight: 600; margin-top: 2px; }
        .contact { font-size: 12px; color: #4b5563; margin-top: 6px; display: flex; gap: 16px; flex-wrap: wrap; }
        section { margin-bottom: 22px; }
        h2 {
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #625345;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 4px;
            margin-bottom: 12px;
        }
        .item { margin-bottom: 12px; }
        .item-header { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
        .item-title { font-weight: 700; font-size: 14px; color: #1f242d; }
        .item-date { font-size: 11px; color: #6b7280; font-weight: 600; white-space: nowrap; }
        .item-sub { font-size: 12px; color: #4b5563; font-weight: 600; }
        .item-desc { font-size: 12px; color: #374151; margin-top: 3px; }
        .chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip {
            background: #f4f1ea;
            border: 1px solid #dcd6cb;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 600;
            color: #2f3842;
        }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media print {
            body { background: #fff; padding: 0; }
            .toolbar { display: none; }
            .page { box-shadow: none; padding: 20px; max-width: 100%; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <span style="font-size:13px;font-weight:600;">Vista previa de Currículum Vitae</span>
        <button onclick="window.print()">Guardar como PDF / Imprimir</button>
    </div>

    <div class="page">
        <div class="header">
            ${avatar ? `<img src="${avatar}" alt="Foto" class="avatar">` : ''}
            <div>
                <h1>${escapeCV(nombre)}</h1>
                <div class="role">${escapeCV(rol)}</div>
                <div class="contact">
                    ${telefono ? `<span>Tel: ${escapeCV(telefono)}</span>` : ''}
                    ${correo ? `<span>Email: ${escapeCV(correo)}</span>` : ''}
                </div>
            </div>
        </div>

        ${metasState.interes ? `
        <section>
            <h2>Perfil e Intereses Profesionales</h2>
            <p class="item-desc">${escapeCV(metasState.interes)}</p>
        </section>` : ''}

        ${laborales.length ? `
        <section>
            <h2>Experiencia Laboral</h2>
            ${laborales.map(e => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${escapeCV(e.title)}</span>
                        <span class="item-date">${escapeCV(e.periodo)}</span>
                    </div>
                    <div class="item-sub">${escapeCV(e.company)}</div>
                </div>
            `).join('')}
        </section>` : ''}

        ${practicas.length ? `
        <section>
            <h2>Prácticas y Servicio Social</h2>
            ${practicas.map(e => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${escapeCV(e.title)}</span>
                        <span class="item-date">${escapeCV(e.periodo)}</span>
                    </div>
                    <div class="item-sub">${escapeCV(e.company)}</div>
                </div>
            `).join('')}
        </section>` : ''}

        ${proyectos.length ? `
        <section>
            <h2>Proyectos Destacados</h2>
            ${proyectos.map(p => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${escapeCV(p.name || p.title)}</span>
                        <span class="item-date">${escapeCV(p.role || '')}</span>
                    </div>
                    ${p.description || p.desc ? `<p class="item-desc">${escapeCV(p.description || p.desc)}</p>` : ''}
                </div>
            `).join('')}
        </section>` : ''}

        ${academica.length ? `
        <section>
            <h2>Formación Académica</h2>
            ${academica.map(a => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${escapeCV(a.degree || a.title || a.carrera)}</span>
                        <span class="item-date">${escapeCV(a.period || a.periodo || a.year || '')}</span>
                    </div>
                    <div class="item-sub">${escapeCV(a.institution || a.school || a.escuela || '')}</div>
                    ${a.description ? `<p class="item-desc">${escapeCV(a.description)}</p>` : ''}
                </div>
            `).join('')}
        </section>` : ''}

        ${extracurricular.length ? `
        <section>
            <h2>Formación Extracurricular y Certificaciones</h2>
            ${extracurricular.map(c => `
                <div class="item">
                    <div class="item-header">
                        <span class="item-title">${escapeCV(c.title)} (${escapeCV(c.type)})</span>
                        <span class="item-date">${escapeCV(c.year)} ${c.hours ? `• ${escapeCV(c.hours)}` : ''}</span>
                    </div>
                    <div class="item-sub">${escapeCV(c.institution)}</div>
                    ${c.description ? `<p class="item-desc">${escapeCV(c.description)}</p>` : ''}
                </div>
            `).join('')}
        </section>` : ''}

        ${(habTecnicas.length || habBlandas.length) ? `
        <section class="grid-2">
            ${habTecnicas.length ? `
            <div>
                <h2>Habilidades Técnicas</h2>
                <div class="chips">
                    ${habTecnicas.map(h => `<span class="chip">${escapeCV(h.name)}</span>`).join('')}
                </div>
            </div>` : ''}
            ${habBlandas.length ? `
            <div>
                <h2>Habilidades Blandas</h2>
                <div class="chips">
                    ${habBlandas.map(h => `<span class="chip">${escapeCV(h.name)}</span>`).join('')}
                </div>
            </div>` : ''}
        </section>` : ''}

        ${(metasList.length || (metasState.aficiones && metasState.aficiones.length)) ? `
        <section class="grid-2">
            ${metasList.length ? `
            <div>
                <h2>Metas Profesionales</h2>
                ${metasList.map(m => `<p class="item-desc">• <strong>(${escapeCV(m.plazo)})</strong> ${escapeCV(m.text)}</p>`).join('')}
            </div>` : ''}
            ${(metasState.aficiones && metasState.aficiones.length) ? `
            <div>
                <h2>Aficiones</h2>
                <div class="chips">
                    ${metasState.aficiones.map(af => `<span class="chip">${escapeCV(af)}</span>`).join('')}
                </div>
            </div>` : ''}
        </section>` : ''}

        ${docsAdicionales.length ? `
        <section>
            <h2>Constancias y Documentos Complementarios</h2>
            ${docsAdicionales.map(d => `<p class="item-desc">• <strong>${escapeCV(d.title)}:</strong> ${escapeCV(d.desc)}</p>`).join('')}
        </section>` : ''}
    </div>

    <script>
        window.onload = function() {
            setTimeout(function() { window.print(); }, 350);
        };
    </script>
</body>
</html>`;

    cvWindow.document.open();
    cvWindow.document.write(html);
    cvWindow.document.close();
}