// ============================================
// ADD/EDIT/DELETE ANIME MODAL SYSTEM
// ============================================

(function () {
    'use strict';

    // Dependencies: window.animeData, window.saveData, window.logActivity, window.getNextId, etc.

    // --- Modal open/close ---
    window.openModal = function (modalElement) {
        if (!modalElement) return;
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
        document.body.style.top = '0';
        console.log('✅ Modal opened');
    };

    window.closeModal = function (modalElement) {
        if (!modalElement) return;
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
        console.log('✅ Modal closed');
    };

    // --- Reset editing state ---
    function resetEditingState() {
        window.isEditing = false;
        window.currentEditId = null;
        const submitBtn = document.getElementById('submitBtn');
        const deleteBtn = document.getElementById('deleteBtn');
        if (submitBtn) submitBtn.textContent = 'Add Anime';
        if (deleteBtn) deleteBtn.style.display = 'none';
        const form = document.getElementById('addAnimeForm');
        if (form) {
            form.reset();
            const eps = document.getElementById('animeEpisodes');
            const dur = document.getElementById('animeDuration');
            const prog = document.getElementById('animeProgress');
            const status = document.getElementById('animeStatus');
            if (eps) eps.value = 1;
            if (dur) dur.value = 20;
            if (prog) prog.value = 0;
            if (status) status.value = 'Plan to Watch';
        }
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
        }
    }

    // --- Edit anime ---
    window.editAnime = function (id) {
        console.log('✏️ Editing anime with ID:', id);
        const anime = window.animeData.find(a => a.id == id);
        if (!anime) {
            if (typeof showToast === 'function') showToast('Anime not found', 'error');
            return;
        }
        console.log('📝 Found anime:', anime.title);

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

        if (animeIdInput) animeIdInput.value = anime.id;
        if (animeTitle) animeTitle.value = anime.title;
        if (animeType) animeType.value = anime.type || 'TV';
        if (animeEpisodes) animeEpisodes.value = anime.episodes || 0;
        if (animeDuration) animeDuration.value = anime.duration || (anime.type === 'Movie' ? 120 : 20);
        if (animeStatus) animeStatus.value = anime.userStatus || 'Plan to Watch';
        if (animeProgress) animeProgress.value = anime.progress || 0;
        if (animeScore) animeScore.value = anime.score || '';
        if (animeCover) animeCover.value = anime.cover || '';
        if (animeGenres) animeGenres.value = anime.genres ? anime.genres.join(', ') : '';

        if (anime.finishDate && animeYear && animeMonth) {
            const [year, month] = anime.finishDate.split('-');
            animeYear.value = year;
            animeMonth.value = month;
        } else if (animeYear && animeMonth) {
            const now = new Date();
            animeYear.value = now.getFullYear().toString();
            animeMonth.value = (now.getMonth() + 1).toString().padStart(2, '0');
        }

        if (durationInput) {
            durationInput.readOnly = (anime.type !== 'Movie');
        }

        if (submitButton) submitButton.textContent = 'Update Anime';
        if (deleteButton) deleteButton.style.display = 'inline-block';

        if (searchResultsDiv) {
            searchResultsDiv.style.display = 'none';
            searchResultsDiv.innerHTML = '';
        }

        if (addModal) {
            window.openModal(addModal);
        } else {
            console.error('❌ Add anime modal not found!');
        }
    };

    // --- Delete anime ---
    window.deleteAnime = function () {
        if (!window.currentEditId) {
            if (typeof showToast === 'function') showToast('No anime selected to delete', 'error');
            return;
        }
        if (!confirm('Are you sure you want to delete this anime?')) return;

        const anime = window.animeData.find(a => a.id == window.currentEditId);
        if (anime && typeof window.logActivity === 'function') {
            window.logActivity("deleted", anime.title);
        }
        window.animeData = window.animeData.filter(a => a.id != window.currentEditId);
        if (typeof window.saveData === 'function') window.saveData();
        try { window.dispatchEvent(new Event('xpUpdated')); } catch (e) { }

        window.closeModal(document.getElementById('addAnimeModal'));
        resetEditingState();
        if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
        if (typeof showToast === 'function') showToast('Anime deleted successfully!', 'success');
    };

    // --- Handle add/update form submit ---
    window.handleAddAnime = function (e) {
        e.preventDefault();

        const title = document.getElementById('animeTitle')?.value.trim();
        if (!title) {
            if (typeof showToast === 'function') showToast('Please enter an anime title', 'error');
            return;
        }

        const type = document.getElementById('animeType')?.value || 'TV';
        const episodes = parseInt(document.getElementById('animeEpisodes')?.value) || 0;
        const duration = parseInt(document.getElementById('animeDuration')?.value) || 20;
        const status = document.getElementById('animeStatus')?.value || 'Plan to Watch';
        const progress = parseInt(document.getElementById('animeProgress')?.value) || 0;
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
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
        const currentDay = String(now.getDate()).padStart(2, '0');

        let finishDate = null;
        let actualFinishDate = null;

        if (status === 'Completed') {
            if (window.isEditing && window.currentEditId) {
                const existing = window.animeData.find(a => a.id == window.currentEditId);
                if (existing && existing.userStatus === 'Completed' && existing.finishDate) {
                    finishDate = existing.finishDate;
                    actualFinishDate = existing.actualFinishDate;
                } else if (existing && existing.actualFinishDate) {
                    actualFinishDate = existing.actualFinishDate;
                    finishDate = existing.finishDate || actualFinishDate.substring(0, 7);
                } else if (year && month) {
                    const y = parseInt(year);
                    const m = parseInt(month);
                    const lastDay = new Date(y, m, 0).getDate();
                    actualFinishDate = `${year}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
                    finishDate = `${year}-${String(m).padStart(2, '0')}`;
                } else {
                    actualFinishDate = `${currentYear}-${currentMonth}-${currentDay}`;
                    finishDate = `${currentYear}-${currentMonth}`;
                }
            } else {
                const dateInfo = typeof window.getCompletionDate === 'function'
                    ? window.getCompletionDate()
                    : { finishDate: `${currentYear}-${currentMonth}`, actualFinishDate: `${currentYear}-${currentMonth}-${currentDay}` };
                finishDate = dateInfo.finishDate;
                actualFinishDate = dateInfo.actualFinishDate;
            }
        }

        let logAction = 'added';
        let toastMessage = `"${title}" added successfully!`;

        if (window.isEditing && window.currentEditId) {
            const existing = window.animeData.find(a => a.id == window.currentEditId);
            if (!existing) {
                if (typeof showToast === 'function') showToast('Anime not found', 'error');
                return;
            }
            const wasCompleted = existing.userStatus === 'Completed';
            const isNowCompleted = status === 'Completed';

            // Determine log action
            if (isNowCompleted && !wasCompleted) {
                logAction = 'completed';
                toastMessage = `"${title}" marked as completed! 🎉`;
            } else if (existing.title !== title) {
                logAction = 'edited';
                toastMessage = `"${title}" renamed successfully!`;
            } else {
                logAction = 'edited';
                toastMessage = `"${title}" updated successfully!`;
            }

            // Update existing
            existing.title = title;
            existing.type = type;
            existing.episodes = episodes;
            existing.duration = duration;
            existing.userStatus = status;
            existing.progress = progress;
            existing.score = score;
            existing.cover = cover;
            existing.genres = genres;
            existing.finishDate = finishDate;
            existing.actualFinishDate = actualFinishDate;
            existing.updatedAt = nowTimestamp;

            if (typeof window.saveData === 'function') window.saveData();
            if (typeof window.logActivity === 'function') window.logActivity(logAction, title);

        } else {
            // Add new
            if (status === 'Completed') {
                logAction = 'completed';
                toastMessage = `"${title}" added and marked as completed! 🎉`;
            } else if (status === 'Watching') {
                logAction = 'watching';
                toastMessage = `"${title}" added to your watching list! 📺`;
            }

            const newAnime = {
                id: typeof window.getNextId === 'function' ? window.getNextId() : Date.now(),
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
            if (typeof window.logActivity === 'function') window.logActivity(logAction, title);
        }

        window.closeModal(document.getElementById('addAnimeModal'));
        resetEditingState();
        if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
        if (typeof showToast === 'function') showToast(toastMessage, 'success');
    };

    // --- Table row click handler ---
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
                console.log('🖱️ Row clicked, ID:', animeId);
                window.editAnime(animeId);
            }
        };
        tableBody.addEventListener('click', clickHandler);
        tableBody._clickHandler = clickHandler;
    }

    // --- Setup modal close handlers ---
    function setupModalHandlers() {
        const addModal = document.getElementById('addAnimeModal');
        if (!addModal) return;
        addModal.setAttribute('hidden', '');
        addModal.style.display = 'none';
        addModal.classList.remove('show', 'active');

        addModal.addEventListener('click', function (e) {
            if (e.target === this) {
                window.closeModal(this);
                resetEditingState();
            }
        });
        const closeX = addModal.querySelector('.close-modal');
        if (closeX) {
            closeX.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.closeModal(document.getElementById('addAnimeModal'));
                resetEditingState();
            });
        }
        const cancelBtn = addModal.querySelector('.btn-secondary.close-modal');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                window.closeModal(document.getElementById('addAnimeModal'));
                resetEditingState();
            });
        }
    }

    // --- Floating add button ---
    function setupFloatingButton() {
        const floatBtn = document.getElementById('floatingAddAnimeBtn');
        if (!floatBtn) return;
        const newFloatBtn = floatBtn.cloneNode(true);
        floatBtn.parentNode?.replaceChild(newFloatBtn, floatBtn);
        newFloatBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.openAddAnimeModal();
        });
    }

    // --- Main add button ---
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

    // --- Open add anime modal (for floating button) ---
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

    // --- Form submit setup ---
    function setupFormSubmit() {
        const form = document.getElementById('addAnimeForm');
        if (!form) return;
        form.addEventListener('submit', window.handleAddAnime);
    }

    // --- Escape key handler ---
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('addAnimeModal');
            if (modal && (modal.style.display === 'flex' || modal.classList.contains('show'))) {
                window.closeModal(modal);
                resetEditingState();
            }
        }
    });

    // --- Init ---
    function initModalSystem() {
        console.log('🚀 Initializing modal system...');
        setupModalHandlers();
        setupAddAnimeButton();
        setupFloatingButton();
        setupFormSubmit();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(attachTableClickHandler, 300);
            });
        } else {
            setTimeout(attachTableClickHandler, 300);
        }
        console.log('✅ Modal system initialized');
    }

    // Expose init
    window.initModalSystem = initModalSystem;

    // Auto-init if main.js doesn't call it, but main will.
})();