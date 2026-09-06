// ============================================
// ADD/EDIT/DELETE ANIME MODAL SYSTEM
// ============================================

(function () {
    'use strict';

    let modalScrollPositions = {};

    function getDefaultDuration(type) {
        switch (type) {
            case 'Movie': return 120;
            case 'TV_SHORT': return 12;
            case 'TV':
            case 'OVA':
            case 'ONA':
            case 'Special':
            default: return 20;
        }
    }

    function isDurationEditable(type) {
        return type === 'Movie';
    }

    function setupBeforeUnloadSync() {
        window.addEventListener('beforeunload', function () {
            if (window.dualStorage && localStorage.getItem('authToken')) {
                const data = {
                    animeData: JSON.parse(localStorage.getItem('animeData') || '[]'),
                    activityLog: JSON.parse(localStorage.getItem('activityLog') || '[]'),
                    userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
                    unlockedAchievements: JSON.parse(localStorage.getItem('unlockedAchievements') || '[]'),
                    userXpHistory: JSON.parse(localStorage.getItem('userXpHistory') || '[]'),
                    animeContributions: JSON.parse(localStorage.getItem('animeContributions') || '{}'),
                    appSettings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
                    levelData: {
                        totalXP: parseInt(localStorage.getItem('userXP') || '0'),
                        level: parseInt(localStorage.getItem('userLevel') || '1'),
                        title: localStorage.getItem('userLevelTitle') || 'Newbie'
                    },
                    lastModified: new Date().toISOString()
                };
                try {
                    navigator.sendBeacon(
                        `${window.API_BASE_URL}/api/sync/sync-all`,
                        new Blob([JSON.stringify(data)], { type: 'application/json' })
                    );
                    console.log('Beforeunload beacon sent');
                } catch (e) { }
            }
        });
    }

    window.openModal = function (modalElement) {
        if (!modalElement) return;
        const scrollY = window.scrollY;
        const modalId = modalElement.id || 'modal';
        modalScrollPositions[modalId] = scrollY;

        modalElement.removeAttribute('hidden');
        modalElement.style.display = 'flex';
        modalElement.style.visibility = 'visible';
        modalElement.style.opacity = '1';
        modalElement.style.pointerEvents = 'auto';
        modalElement.style.zIndex = '99999';
        modalElement.classList.add('show', 'active');
        document.body.classList.add('modal-open');
        document.body.style.overflow = 'hidden';
        document.body.style.position = 'fixed';
        document.body.style.width = '100%';
        document.body.style.height = '100%';
        document.body.style.top = `-${scrollY}px`;
        console.log('Modal opened');
    };

    window.closeModal = function (modalElement) {
        if (!modalElement) return;
        const modalId = modalElement.id || 'modal';
        const scrollY = modalScrollPositions[modalId] || 0;

        modalElement.style.display = 'none';
        modalElement.style.visibility = 'hidden';
        modalElement.style.opacity = '0';
        modalElement.classList.remove('show', 'active');
        modalElement.setAttribute('hidden', '');
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.top = '';

        if (scrollY > 0) {
            window.scrollTo({ top: scrollY, behavior: 'auto' });
        }
        delete modalScrollPositions[modalId];
        console.log('Modal closed');
    };

    // ============================================================
    // ID REUSE: get next smallest available ID
    // ============================================================

    function getNextAvailableId() {
        const data = window.animeData || [];
        const ids = new Set(data.map(a => a.id));
        let id = 1;
        while (ids.has(id)) id++;
        return id;
    }

    // ============================================================
    // CUSTOM DAY PROMPT MODAL 
    // ============================================================

    let dayPromptResolve = null;
    let dayPromptModal = null;

    function createDayPromptModal() {
        if (dayPromptModal) return;

        dayPromptModal = document.createElement('div');
        dayPromptModal.id = 'dayPromptModal';
        dayPromptModal.className = 'modal';
        dayPromptModal.setAttribute('hidden', '');
        dayPromptModal.style.display = 'none';
        dayPromptModal.style.position = 'fixed';
        dayPromptModal.style.inset = '0';
        dayPromptModal.style.zIndex = '100000';
        dayPromptModal.style.backgroundColor = 'rgba(0,0,0,0.6)';
        dayPromptModal.style.alignItems = 'center';
        dayPromptModal.style.justifyContent = 'center';
        dayPromptModal.style.backdropFilter = 'blur(4px)';

        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.maxWidth = '400px';
        content.style.width = '90%';
        content.style.padding = '24px';
        content.style.backgroundColor = 'var(--bg-card, #1A2234)';
        content.style.borderRadius = '16px';
        content.style.border = '1px solid var(--border, #334155)';
        content.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';

        content.innerHTML = `
            <h3 style="margin: 0 0 12px 0; font-size: 1.2rem; color: var(--text-primary, #F8FAFC);">
                <i class="fas fa-calendar-day" style="margin-right: 8px; color: #3B82F6;"></i>
                Select Completion Day
            </h3>
            <p style="margin: 0 0 16px 0; color: var(--text-secondary, #94A3B8); font-size: 0.9rem;">
                Enter the day (1-31) for the completion date:
            </p>
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                <label for="dayPromptInput" style="font-weight: 600; color: var(--text-primary, #F8FAFC);">Day:</label>
                <input type="number" id="dayPromptInput" min="1" max="31" value="1"
                       style="flex: 1; padding: 8px 12px; background: var(--bg-tertiary, rgba(255,255,255,0.04));
                              border: 1px solid var(--border, #334155); border-radius: 8px; color: var(--text-primary, #F8FAFC);
                              font-size: 1rem; font-family: inherit; width: 80px;">
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="dayPromptCancel" class="btn-secondary" style="padding: 8px 20px; border: none;
                        background: var(--bg-tertiary, rgba(255,255,255,0.04)); color: var(--text-secondary, #94A3B8);
                        border-radius: 8px; font-weight: 600; cursor: pointer; font-family: inherit;">
                    Cancel
                </button>
                <button id="dayPromptConfirm" class="btn-primary" style="padding: 8px 24px; border: none;
                        background: linear-gradient(135deg, #3B82F6, #6366F1); color: white;
                        border-radius: 8px; font-weight: 600; cursor: pointer; font-family: inherit;">
                    Confirm
                </button>
            </div>
        `;

        dayPromptModal.appendChild(content);
        document.body.appendChild(dayPromptModal);

        const input = dayPromptModal.querySelector('#dayPromptInput');
        const confirmBtn = dayPromptModal.querySelector('#dayPromptConfirm');
        const cancelBtn = dayPromptModal.querySelector('#dayPromptCancel');

        const close = (value) => {
            dayPromptModal.style.display = 'none';
            dayPromptModal.setAttribute('hidden', '');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.body.style.top = '';
            if (dayPromptResolve) {
                dayPromptResolve(value);
                dayPromptResolve = null;
            }
        };

        confirmBtn.addEventListener('click', () => {
            const val = parseInt(input.value);
            if (isNaN(val) || val < 1 || val > 31) {
                alert('Please enter a number between 1 and 31.');
                return;
            }
            close(val);
        });

        cancelBtn.addEventListener('click', () => close(null));

        dayPromptModal.addEventListener('click', (e) => {
            if (e.target === dayPromptModal) close(null);
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') confirmBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        });

        const observer = new MutationObserver(() => {
            if (dayPromptModal.style.display === 'flex') {
                input.focus();
                input.select();
            }
        });
        observer.observe(dayPromptModal, { attributes: true, attributeFilter: ['style'] });
    }

    function openDayPrompt(year, month) {
        return new Promise((resolve) => {
            createDayPromptModal();
            dayPromptResolve = resolve;
            const modal = dayPromptModal;
            const input = modal.querySelector('#dayPromptInput');

            input.value = '1';

            modal.removeAttribute('hidden');
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.top = `-${window.scrollY}px`;

            setTimeout(() => input.focus(), 50);
        });
    }

    // ============================================================
    // CUSTOM CONFIRM MODAL
    // ============================================================

    let confirmResolve = null;
    let confirmModal = null;

    function createConfirmModal() {
        if (confirmModal) return;

        confirmModal = document.createElement('div');
        confirmModal.id = 'confirmModal';
        confirmModal.className = 'modal';
        confirmModal.setAttribute('hidden', '');
        confirmModal.style.display = 'none';
        confirmModal.style.position = 'fixed';
        confirmModal.style.inset = '0';
        confirmModal.style.zIndex = '100000';
        confirmModal.style.backgroundColor = 'rgba(0,0,0,0.6)';
        confirmModal.style.alignItems = 'center';
        confirmModal.style.justifyContent = 'center';
        confirmModal.style.backdropFilter = 'blur(4px)';

        const content = document.createElement('div');
        content.className = 'modal-content';
        content.style.maxWidth = '420px';
        content.style.width = '90%';
        content.style.padding = '24px';
        content.style.backgroundColor = 'var(--bg-card, #1A2234)';
        content.style.borderRadius = '16px';
        content.style.border = '1px solid var(--border, #334155)';
        content.style.boxShadow = '0 20px 60px rgba(0,0,0,0.5)';

        content.innerHTML = `
            <h3 style="margin: 0 0 12px 0; font-size: 1.2rem; color: var(--text-primary, #F8FAFC);">
                <i class="fas fa-exclamation-triangle" style="margin-right: 8px; color: #EF4444;"></i>
                Confirm Deletion
            </h3>
            <p id="confirmMessage" style="margin: 0 0 20px 0; color: var(--text-secondary, #94A3B8); font-size: 0.95rem; line-height: 1.5;">
                Are you sure you want to delete this anime?
            </p>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button id="confirmCancel" class="btn-secondary" style="padding: 8px 20px; border: none;
                        background: var(--bg-tertiary, rgba(255,255,255,0.04)); color: var(--text-secondary, #94A3B8);
                        border-radius: 8px; font-weight: 600; cursor: pointer; font-family: inherit;">
                    Cancel
                </button>
                <button id="confirmOk" class="btn-danger" style="padding: 8px 24px; border: none;
                        background: linear-gradient(135deg, #EF4444, #DC2626); color: white;
                        border-radius: 8px; font-weight: 600; cursor: pointer; font-family: inherit;">
                    Delete
                </button>
            </div>
        `;

        confirmModal.appendChild(content);
        document.body.appendChild(confirmModal);

        const cancelBtn = confirmModal.querySelector('#confirmCancel');
        const okBtn = confirmModal.querySelector('#confirmOk');

        const close = (result) => {
            confirmModal.style.display = 'none';
            confirmModal.setAttribute('hidden', '');
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.height = '';
            document.body.style.top = '';
            if (confirmResolve) {
                confirmResolve(result);
                confirmResolve = null;
            }
        };

        cancelBtn.addEventListener('click', () => close(false));
        okBtn.addEventListener('click', () => close(true));

        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) close(false);
        });

        document.addEventListener('keydown', (e) => {
            if (confirmModal && confirmModal.style.display === 'flex') {
                if (e.key === 'Enter') okBtn.click();
                if (e.key === 'Escape') cancelBtn.click();
            }
        });
    }

    function openConfirm(message) {
        return new Promise((resolve) => {
            createConfirmModal();
            confirmResolve = resolve;
            const modal = confirmModal;
            const msgEl = modal.querySelector('#confirmMessage');
            if (msgEl) msgEl.textContent = message || 'Are you sure you want to delete this anime?';

            modal.removeAttribute('hidden');
            modal.style.display = 'flex';
            modal.style.visibility = 'visible';
            modal.style.opacity = '1';
            document.body.classList.add('modal-open');
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.height = '100%';
            document.body.style.top = `-${window.scrollY}px`;
        });
    }

    // ============================================================
    // GET ACTUAL FINISH DATE (with custom day prompt)
    // ============================================================

    async function getActualFinishDate(year, month) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;

        const selectedYear = parseInt(year);
        const selectedMonth = parseInt(month);

        if (selectedYear === currentYear && selectedMonth === currentMonth) {
            const day = String(now.getDate()).padStart(2, '0');
            return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${day}`;
        }

        const day = await openDayPrompt(year, month);
        if (day === null) return null;

        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }

    // ============================================================
    // YEAR DROPDOWN POPULATOR
    // ============================================================

    function populateYearDropdown() {
        const yearSelect = document.getElementById('animeYear');
        if (!yearSelect) return;
        const currentYear = new Date().getFullYear();
        const startYear = 1990;
        const endYear = currentYear + 1;

        yearSelect.innerHTML = '';
        for (let y = startYear; y <= endYear; y++) {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = String(y);
            yearSelect.appendChild(opt);
        }
        yearSelect.value = String(currentYear);
    }

    // ============================================================
    // RESET EDITING STATE
    // ============================================================

    function resetEditingState() {
        window.isEditing = false;
        window.currentEditId = null;
        const submitBtn = document.getElementById('submitBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        const modalTitle = document.getElementById('addAnimeTitle');
        const titleInput = document.getElementById('animeTitle');

        if (submitBtn) submitBtn.textContent = 'Add Anime';
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
            deleteBtn.disabled = false;
            deleteBtn.style.pointerEvents = 'auto';
        }
        if (modalTitle) modalTitle.textContent = 'Add New Anime';
        if (titleInput) {
            titleInput.disabled = false;
            titleInput.placeholder = 'Search for an anime...';
        }

        const form = document.getElementById('addAnimeForm');
        if (form) {
            form.reset();
            const eps = document.getElementById('animeEpisodes');
            const dur = document.getElementById('animeDuration');
            const prog = document.getElementById('animeProgress');
            const status = document.getElementById('animeStatus');
            const type = document.getElementById('animeType');
            if (eps) eps.value = 1;
            if (dur) {
                dur.value = 20;
                dur.disabled = true;
            }
            if (prog) prog.value = 0;
            if (status) status.value = 'Plan to Watch';
            if (type) {
                type.value = 'TV';
                const event = new Event('change');
                type.dispatchEvent(event);
            }
        }

        populateYearDropdown();
        const yearSelect = document.getElementById('animeYear');
        const monthSelect = document.getElementById('animeMonth');
        if (yearSelect && monthSelect) {
            const now = new Date();
            yearSelect.value = String(now.getFullYear());
            monthSelect.value = String(now.getMonth() + 1).padStart(2, '0');
        }

        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }
        const coverInput = document.getElementById('animeCover');
        const genresInput = document.getElementById('animeGenres');
        if (coverInput) coverInput.disabled = true;
        if (genresInput) genresInput.disabled = true;

        const progressInput = document.getElementById('animeProgress');
        const episodesInput = document.getElementById('animeEpisodes');
        if (progressInput && episodesInput) {
            const maxEps = parseInt(episodesInput.value) || 0;
            progressInput.max = maxEps;
            if (parseInt(progressInput.value) > maxEps) {
                progressInput.value = maxEps;
            }
        }
    }

    // ============================================================
    // EDIT ANIME
    // ============================================================

    window.editAnime = function (id) {
        console.log('Editing anime with ID:', id);
        const anime = window.animeData.find(a => a.id == id);
        if (!anime) {
            if (typeof showToast === 'function') showToast('Anime not found', 'error');
            return;
        }
        console.log('Found anime:', anime.title);

        window.isEditing = true;
        window.currentEditId = id;

        const animeIdInput = document.getElementById('animeId');
        const animeTitle = document.getElementById('animeTitle');
        const animeType = document.getElementById('animeType');
        const animeEpisodes = document.getElementById('animeEpisodes');
        const animeDuration = document.getElementById('animeDuration');
        const animeStatus = document.getElementById('animeStatus');
        const animeProgress = document.getElementById('animeProgress');
        const animeScore = document.getElementById('animeScore');
        const animeCover = document.getElementById('animeCover');
        const animeGenres = document.getElementById('animeGenres');
        const animeYear = document.getElementById('animeYear');
        const animeMonth = document.getElementById('animeMonth');
        const durationInput = document.getElementById('animeDuration');
        const submitButton = document.getElementById('submitBtn');
        const deleteButton = document.getElementById('deleteBtn');
        const addModal = document.getElementById('addAnimeModal');
        const searchResultsDiv = document.getElementById('searchResults');
        const modalTitle = document.getElementById('addAnimeTitle');

        if (animeTitle) {
            animeTitle.disabled = true;
            animeTitle.placeholder = 'Title is locked (click row to edit)';
        }

        if (modalTitle) modalTitle.textContent = 'Edit Anime';

        if (animeIdInput) animeIdInput.value = anime.id;
        if (animeTitle) animeTitle.value = anime.title;
        if (animeType) animeType.value = anime.type || 'TV';
        if (animeEpisodes) animeEpisodes.value = anime.episodes || 0;
        if (animeDuration) {
            const type = anime.type || 'TV';
            animeDuration.value = anime.duration || getDefaultDuration(type);
            animeDuration.disabled = !isDurationEditable(type);
        }
        if (animeStatus) animeStatus.value = anime.userStatus || 'Plan to Watch';
        if (animeProgress) animeProgress.value = anime.progress || 0;
        if (animeScore) animeScore.value = anime.score || '';
        if (animeCover) animeCover.value = anime.cover || '';
        if (animeGenres) animeGenres.value = anime.genres ? anime.genres.join(', ') : '';

        populateYearDropdown();
        if (anime.finishDate && animeYear && animeMonth) {
            const [year, month] = anime.finishDate.split('-');
            if (year && month) {
                animeYear.value = year;
                animeMonth.value = month;
            }
        } else if (animeYear && animeMonth) {
            const now = new Date();
            animeYear.value = now.getFullYear().toString();
            animeMonth.value = String(now.getMonth() + 1).padStart(2, '0');
        }

        if (durationInput) {
            durationInput.disabled = !isDurationEditable(anime.type || 'TV');
        }

        if (submitButton) submitButton.textContent = 'Update Anime';
        if (deleteButton) {
            deleteButton.style.display = 'inline-block';
            deleteButton.disabled = false;
            deleteButton.style.pointerEvents = 'auto';
        }

        if (searchResultsDiv) {
            searchResultsDiv.style.display = 'none';
            searchResultsDiv.innerHTML = '';
        }

        syncProgressMax();

        if (addModal) {
            window.openModal(addModal);
        } else {
            console.error('Add anime modal not found');
        }
    };

    // ============================================================
    // DELETE ANIME (with custom confirm)
    // ============================================================

    window.deleteAnime = async function () {
        if (!window.currentEditId) {
            if (typeof showToast === 'function') showToast('No anime selected to delete', 'error');
            return;
        }

        const anime = window.animeData.find(a => a.id == window.currentEditId);
        const title = anime ? anime.title : 'this anime';
        const confirmed = await openConfirm(`Are you sure you want to delete "${title}"?`);
        if (!confirmed) return;

        if (anime && typeof window.logActivity === 'function') {
            window.logActivity("deleted", anime.title);
        }
        window.animeData = window.animeData.filter(a => a.id != window.currentEditId);
        if (typeof window.saveData === 'function') window.saveData();
        window.setLocalDirty();
        try { window.dispatchEvent(new Event('xpUpdated')); } catch (e) { }

        document.dispatchEvent(new CustomEvent('animeUpdate'));
        if (window.dualStorage && typeof window.dualStorage.markDirty === 'function' && typeof window.dualStorage.syncToCloud === 'function') {
            window.dualStorage.markDirty();
            window.dualStorage.syncToCloud().then(success => {
                if (success) {
                    console.log('Delete synced to cloud immediately');
                } else {
                    console.warn('Delete sync failed, will retry later');
                }
            });
        }

        window.closeModal(document.getElementById('addAnimeModal'));
        resetEditingState();
        if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
        if (typeof showToast === 'function') showToast('Anime deleted successfully!', 'success');
    };

    // ============================================================
    // HANDLE ADD/EDIT SUBMIT
    // ============================================================

    window.handleAddAnime = async function (e) {
        e.preventDefault();

        const title = document.getElementById('animeTitle')?.value.trim();
        if (!title) {
            if (typeof showToast === 'function') showToast('Please enter an anime title', 'error');
            return;
        }

        const type = document.getElementById('animeType')?.value || 'TV';
        const episodes = parseInt(document.getElementById('animeEpisodes')?.value) || 0;
        let duration = parseInt(document.getElementById('animeDuration')?.value) || 0;
        if (!duration) duration = getDefaultDuration(type);
        const status = document.getElementById('animeStatus')?.value || 'Plan to Watch';
        let progress = parseInt(document.getElementById('animeProgress')?.value) || 0;
        if (progress > episodes) progress = episodes;
        const score = parseFloat(document.getElementById('animeScore')?.value) || null;
        const cover = document.getElementById('animeCover')?.value || '';
        const genres = (document.getElementById('animeGenres')?.value || '')
            .split(',')
            .map(g => g.trim())
            .filter(Boolean);
        const year = document.getElementById('animeYear')?.value;
        const month = document.getElementById('animeMonth')?.value;

        const nowTimestamp = typeof window.getFormattedTimestamp === 'function'
            ? window.getFormattedTimestamp()
            : new Date().toISOString();

        let finishDate = null;
        let actualFinishDate = null;
        let logAction = 'added';
        let toastMessage = `"${title}" added successfully!`;

        async function setCompletionDates(year, month) {
            let y = parseInt(year);
            let m = parseInt(month);
            if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
                finishDate = `${year}-${String(m).padStart(2, '0')}`;
                const dayResult = await getActualFinishDate(year, month);
                if (dayResult === null) return false;
                actualFinishDate = dayResult;
                return true;
            } else {
                const now = new Date();
                finishDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                actualFinishDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                return true;
            }
        }

        if (window.isEditing && window.currentEditId) {
            const existing = window.animeData.find(a => a.id == window.currentEditId);
            if (!existing) {
                if (typeof showToast === 'function') showToast('Anime not found', 'error');
                return;
            }

            const wasCompleted = existing.userStatus === 'Completed';
            const isNowCompleted = status === 'Completed';

            console.log(`Before edit: progress=${existing.progress}, status=${existing.userStatus}`);

            existing.title = title;
            existing.type = type;
            existing.episodes = episodes;
            existing.duration = duration;
            existing.userStatus = status;
            existing.progress = progress;
            existing.score = score;
            existing.cover = cover;
            existing.genres = genres;
            existing.updatedAt = nowTimestamp;

            console.log(`After edit: progress=${existing.progress}, status=${existing.userStatus}`);

            if (isNowCompleted) {
                let y = parseInt(year);
                let m = parseInt(month);
                if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
                    finishDate = `${year}-${String(m).padStart(2, '0')}`;
                    if (existing.actualFinishDate) {
                        const parts = existing.actualFinishDate.split('-');
                        let day = parseInt(parts[2]) || 1;
                        const daysInMonth = new Date(y, m, 0).getDate();
                        if (day > daysInMonth) day = daysInMonth;
                        actualFinishDate = `${year}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    } else {
                        const dayResult = await getActualFinishDate(year, month);
                        if (dayResult === null) return;
                        actualFinishDate = dayResult;
                    }
                } else {
                    const now = new Date();
                    finishDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    actualFinishDate = existing.actualFinishDate ||
                        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                }
                existing.finishDate = finishDate;
                existing.actualFinishDate = actualFinishDate;
            } else {
                existing.finishDate = null;
                existing.actualFinishDate = null;
            }

            if (isNowCompleted && !wasCompleted) {
                logAction = 'completed';
                toastMessage = `"${title}" marked as completed!`;
            } else if (existing.title !== title) {
                logAction = 'edited';
                toastMessage = `"${title}" renamed successfully!`;
            } else {
                logAction = 'edited';
                toastMessage = `"${title}" updated successfully!`;
            }

            if (typeof window.saveData === 'function') window.saveData();

            const verifyData = JSON.parse(localStorage.getItem('animeData') || '[]');
            const verifyAnime = verifyData.find(a => a.id === existing.id);
            if (verifyAnime) {
                console.log(`After save (localStorage): progress=${verifyAnime.progress}, status=${verifyAnime.userStatus}`);
            }

            window.setLocalDirty();
            if (typeof window.logActivity === 'function') window.logActivity(logAction, title);

            document.dispatchEvent(new CustomEvent('animeUpdate'));
            if (window.dualStorage && typeof window.dualStorage.markDirty === 'function' && typeof window.dualStorage.syncToCloud === 'function') {
                window.dualStorage.markDirty();
                const syncResult = await window.dualStorage.syncToCloud();
                if (syncResult) {
                    console.log(`Edit synced to cloud immediately (${window.animeData.length} anime)`);
                } else {
                    console.warn('Edit sync failed, will retry later');
                }
            }

        } else {
            if (status === 'Completed') {
                logAction = 'completed';
                toastMessage = `"${title}" added and marked as completed!`;
                const success = await setCompletionDates(year, month);
                if (!success) return;
            } else if (status === 'Watching') {
                logAction = 'watching';
                toastMessage = `"${title}" added to your watching list!`;
            }

            const newAnime = {
                id: getNextAvailableId(),
                title: title,
                type: type,
                episodes: episodes,
                duration: duration,
                userStatus: status,
                progress: progress,
                score: score,
                cover: cover,
                genres: genres,
                finishDate: finishDate,
                actualFinishDate: actualFinishDate,
                createdAt: nowTimestamp,
                updatedAt: nowTimestamp
            };
            window.animeData.push(newAnime);
            if (typeof window.saveData === 'function') window.saveData();
            window.setLocalDirty();
            if (typeof window.logActivity === 'function') window.logActivity(logAction, title);

            document.dispatchEvent(new CustomEvent('animeUpdate'));
            if (window.dualStorage && typeof window.dualStorage.markDirty === 'function' && typeof window.dualStorage.syncToCloud === 'function') {
                window.dualStorage.markDirty();
                const syncResult = await window.dualStorage.syncToCloud();
                if (syncResult) {
                    console.log(`Add synced to cloud immediately (${window.animeData.length} anime)`);
                } else {
                    console.warn('Add sync failed, will retry later');
                }
            }
        }

        window.closeModal(document.getElementById('addAnimeModal'));
        resetEditingState();
        if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
        if (typeof showToast === 'function') showToast(toastMessage, 'success');
    };

    // ============================================================
    // UI HELPERS
    // ============================================================

    function syncProgressMax() {
        const episodesInput = document.getElementById('animeEpisodes');
        const progressInput = document.getElementById('animeProgress');
        if (episodesInput && progressInput) {
            const maxEps = parseInt(episodesInput.value) || 0;
            progressInput.max = maxEps;
            if (parseInt(progressInput.value) > maxEps) {
                progressInput.value = maxEps;
            }
        }
    }

    function handleTypeChange() {
        const typeSelect = document.getElementById('animeType');
        const durationInput = document.getElementById('animeDuration');
        if (!typeSelect || !durationInput) return;

        const type = typeSelect.value;
        const defaultDur = getDefaultDuration(type);
        const editable = isDurationEditable(type);

        const currentVal = parseInt(durationInput.value);
        if (isNaN(currentVal) || currentVal === 0) {
            durationInput.value = defaultDur;
        } else {
            if (!editable) {
                durationInput.value = defaultDur;
            }
        }
        durationInput.disabled = !editable;
    }

    function attachTableClickHandler() {
        const tableBody = document.getElementById('anime-table-body');
        if (!tableBody) {
            setTimeout(attachTableClickHandler, 500);
            return;
        }
        if (tableBody._clickHandler) {
            tableBody.removeEventListener('click', tableBody._clickHandler);
        }
        const clickHandler = function (e) {
            const row = e.target.closest('tr[data-id]');
            if (!row) return;
            if (e.target.closest('.progress-wrapper') ||
                e.target.closest('.badge') ||
                e.target.closest('a') ||
                e.target.closest('button') ||
                e.target.closest('.anime-cover')) {
                return;
            }
            const animeId = row.getAttribute('data-id');
            if (animeId && typeof window.editAnime === 'function') {
                console.log('Row clicked, ID:', animeId);
                window.editAnime(animeId);
            }
        };
        tableBody.addEventListener('click', clickHandler);
        tableBody._clickHandler = clickHandler;
    }

    // ============================================================
    // MODAL SETUP
    // ============================================================

    function setupModalHandlers() {
        const addModal = document.getElementById('addAnimeModal');
        if (addModal) {
            addModal.setAttribute('hidden', '');
            addModal.style.display = 'none';
            addModal.classList.remove('show', 'active');

            addModal.addEventListener('click', function (e) {
                if (e.target === this) {
                    window.closeModal(this);
                    resetEditingState();
                }
            });

            const closeButtons = addModal.querySelectorAll('.close-modal, .btn-secondary.close-modal');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.closeModal(addModal);
                    resetEditingState();
                });
            });

            const deleteBtn = document.getElementById('deleteBtn');
            if (deleteBtn) {
                const newDeleteBtn = deleteBtn.cloneNode(true);
                deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
                newDeleteBtn.addEventListener('click', window.deleteAnime);
            }

            const episodesInput = document.getElementById('animeEpisodes');
            if (episodesInput) {
                episodesInput.addEventListener('input', syncProgressMax);
                episodesInput.addEventListener('change', syncProgressMax);
            }

            const typeSelect = document.getElementById('animeType');
            if (typeSelect) {
                typeSelect.addEventListener('change', handleTypeChange);
                setTimeout(handleTypeChange, 100);
            }
        }

        const importModal = document.getElementById('importModal');
        if (importModal) {
            importModal.setAttribute('hidden', '');
            importModal.style.display = 'none';
            importModal.classList.remove('show', 'active');

            importModal.addEventListener('click', function (e) {
                if (e.target === this) {
                    window.closeModal(this);
                }
            });

            const closeButtons = importModal.querySelectorAll('.close-modal, .btn-secondary.close-modal');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.closeModal(importModal);
                });
            });
        }
    }

    // ============================================================
    // FLOATING ACTION BUTTON (FAB) – Fixed
    // ============================================================

    function initFabMenu() {
        const mainBtn = document.getElementById('fab-main');
        const menu = document.getElementById('fab-menu');
        const backdrop = document.getElementById('fab-backdrop');

        if (!mainBtn || !menu || !backdrop) {
            console.warn('FAB elements missing – skipping initialization.');
            return;
        }

        let isOpen = false;
        let isAnimating = false;
        let originalOverflow = '';

        function openMenu() {
            if (isAnimating) return;
            isAnimating = true;
            isOpen = true;
            mainBtn.classList.add('open');
            // Change icon to cross
            const icon = mainBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-times';
            menu.classList.remove('hidden');
            // Force reflow for animation
            void menu.offsetWidth;
            menu.classList.add('open');
            backdrop.classList.add('active');
            mainBtn.setAttribute('aria-expanded', 'true');
            // Prevent scroll
            originalOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            setTimeout(() => {
                isAnimating = false;
            }, 400);
        }

        function closeMenu() {
            if (isAnimating) return;
            isAnimating = true;
            isOpen = false;
            mainBtn.classList.remove('open');
            // Restore icon to bars
            const icon = mainBtn.querySelector('i');
            if (icon) icon.className = 'fas fa-bars';
            menu.classList.remove('open');
            backdrop.classList.remove('active');
            mainBtn.setAttribute('aria-expanded', 'false');
            // Restore scroll
            document.body.style.overflow = originalOverflow || '';
            setTimeout(() => {
                if (!isOpen) menu.classList.add('hidden');
                isAnimating = false;
            }, 350);
        }

        function toggleMenu() {
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        }

        // ─── Main button click ──────────────────────
        mainBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleMenu();
        });

        // ─── Menu item click ────────────────────────
        menu.addEventListener('click', function (e) {
            const item = e.target.closest('.fab-item');
            if (!item) return;
            const action = item.dataset.action;

            // Close menu immediately
            closeMenu();

            // Dispatch action after a tiny delay
            setTimeout(() => {
                switch (action) {
                    case 'add-anime':
                        if (typeof window.openAddAnimeModal === 'function') {
                            window.openAddAnimeModal();
                        } else if (typeof showToast === 'function') {
                            showToast('Add Anime feature not available', 'error');
                        } else {
                            alert('Add Anime');
                        }
                        break;

                    case 'chat-bot':
                        if (typeof window.openChatBot === 'function') {
                            window.openChatBot();
                        } else {
                            if (typeof showToast === 'function') {
                                showToast('Chat Bot is loading...', 'info');
                            }
                        }
                        break;
                        
                    case 'search':
                        const searchToggle = document.getElementById('searchToggle');
                        if (searchToggle) {
                            searchToggle.click();
                        } else {
                            window.location.href = '/dashboard.html?view=search';
                        }
                        break;

                    case 'settings':
                        const settingsMenuItem = document.querySelector('.menu-item[data-page="settings"]');
                        if (settingsMenuItem) {
                            settingsMenuItem.click();
                        } else {
                            window.location.href = '/dashboard.html?page=settings';
                        }
                        break;

                    default:
                        console.warn('Unknown FAB action:', action);
                }
            }, 150);
        });

        // ─── Backdrop click ──────────────────────────
        backdrop.addEventListener('click', closeMenu);

        // ─── Escape key ──────────────────────────────
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen) {
                closeMenu();
                mainBtn.focus();
            }
        });

        // ─── Outside click ───────────────────────────
        document.addEventListener('click', function (e) {
            const container = document.getElementById('fab-container');
            if (container && !container.contains(e.target) && !backdrop.contains(e.target) && isOpen) {
                closeMenu();
            }
        });

        // ─── Initial state ───────────────────────────
        menu.classList.add('hidden');
        mainBtn.setAttribute('aria-expanded', 'false');
        const icon = mainBtn.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';

        console.log('FAB Premium Menu initialized');
    }

    // ============================================================
    // SETUP ADD ANIME BUTTON (regular)
    // ============================================================

    function setupAddAnimeButton() {
        const btn = document.getElementById('addAnimeBtn');
        if (!btn) return;
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            resetEditingState();
            window.openModal(document.getElementById('addAnimeModal'));
        });
    }

    // ============================================================
    // OPEN ADD ANIME MODAL (public)
    // ============================================================

    window.openAddAnimeModal = function () {
        const addModal = document.getElementById('addAnimeModal');
        if (!addModal) {
            if (typeof showToast === 'function') showToast('Add Anime feature unavailable', 'error');
            return;
        }
        resetEditingState();
        window.openModal(addModal);
        if (window.navigator && window.navigator.vibrate) {
            window.navigator.vibrate(50);
        }
    };

    // ============================================================
    // FORM SUBMIT
    // ============================================================

    function setupFormSubmit() {
        const form = document.getElementById('addAnimeForm');
        if (!form) return;
        form.addEventListener('submit', window.handleAddAnime);
    }

    // ============================================================
    // KEYBOARD ESCAPE
    // ============================================================

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('addAnimeModal');
            if (modal && (modal.style.display === 'flex' || modal.classList.contains('show'))) {
                window.closeModal(modal);
                resetEditingState();
            }
        }
    });

    // ============================================================
    // INIT
    // ============================================================

    function initModalSystem() {
        console.log('Initializing modal system...');
        setupModalHandlers();
        setupAddAnimeButton();
        initFabMenu();
        setupFormSubmit();
        setupBeforeUnloadSync();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(attachTableClickHandler, 300);
            });
        } else {
            setTimeout(attachTableClickHandler, 300);
        }
        console.log('Modal system initialized');
    }

    window.initModalSystem = initModalSystem;

    // ============================================================
    // SELECT ANIME FROM SEARCH
    // ============================================================

    window.selectAnimeFromSearch = function (anime) {
        console.log('Selecting anime:', anime.title);
        const titleInput = document.getElementById('animeTitle');
        const typeSelect = document.getElementById('animeType');
        const episodesInput = document.getElementById('animeEpisodes');
        const durationInput = document.getElementById('animeDuration');
        const coverInput = document.getElementById('animeCover');
        const genresInput = document.getElementById('animeGenres');
        const scoreInput = document.getElementById('animeScore');
        const searchResults = document.getElementById('searchResults');

        if (titleInput) {
            titleInput.value = anime.title || '';
            titleInput.style.border = '2px solid #10B981';
            setTimeout(() => { titleInput.style.border = ''; }, 1000);
        }
        if (typeSelect) {
            typeSelect.value = anime.type || 'TV';
            const changeEvent = new Event('change');
            typeSelect.dispatchEvent(changeEvent);
        }
        if (episodesInput) {
            episodesInput.value = anime.episodes || 1;
            syncProgressMax();
        }
        if (durationInput) {
            if (anime.type === 'Movie') {
                durationInput.value = anime.duration ? Math.round(parseInt(anime.duration) || 120) : '120';
                durationInput.disabled = false;
            } else {
                durationInput.value = anime.duration || '20';
                durationInput.disabled = true;
            }
        }
        if (coverInput && anime.images) {
            const coverUrl = anime.images?.jpg?.image_url ||
                anime.images?.large ||
                anime.coverImage?.large ||
                anime.coverImage?.medium ||
                '';
            if (coverUrl) coverInput.value = coverUrl;
        }
        if (genresInput && anime.genres) {
            let genreString = '';
            if (Array.isArray(anime.genres)) {
                if (anime.genres.length > 0 && typeof anime.genres[0] === 'object') {
                    genreString = anime.genres.filter(g => g.name !== 'Award Winning').map(g => g.name).join(', ');
                } else {
                    genreString = anime.genres.join(', ');
                }
            } else if (typeof anime.genres === 'string') {
                genreString = anime.genres;
            }
            genresInput.value = genreString;
        }
        if (scoreInput && anime.score) {
            const score = typeof anime.score === 'number' ? anime.score : parseFloat(anime.score);
            if (!isNaN(score)) scoreInput.value = score;
        }
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }
        if (typeof showToast === 'function') {
            const genreCount = Array.isArray(anime.genres) ? anime.genres.length : 0;
            showToast(`Selected: ${anime.title} (${genreCount} genres)`, 'success');
        }
        console.log('Anime selected successfully');
    };

})();