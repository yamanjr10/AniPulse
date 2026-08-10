// ============================================
// ADD/EDIT/DELETE ANIME MODAL SYSTEM
// ============================================

(function () {
    'use strict';

    let modalScrollPositions = {};

    function getDefaultDuration(type) {
        switch (type) {
            case 'Movie': return 120;
            case 'TV': return 24;
            case 'OVA': return 24;
            case 'ONA': return 20;
            case 'Special': return 15;
            default: return 20;
        }
    }

    function isDurationEditable(type) {
        return type === 'Movie';
    }

    function triggerImmediateSync() {
        if (window.dualStorage && navigator.onLine && localStorage.getItem('authToken')) {
            console.log('🔄 Forcing immediate sync after data change...');
            setTimeout(() => {
                window.dualStorage.syncToCloud();
            }, 200);
        }
    }

    function setupBeforeUnloadSync() {
        window.addEventListener('beforeunload', function () {
            if (window.dualStorage && localStorage.getItem('authToken')) {
                const token = localStorage.getItem('authToken');
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
                    console.log('📤 Beforeunload beacon sent');
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
        console.log('✅ Modal opened');
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
        console.log('✅ Modal closed');
    };

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
        const yearSelect = document.getElementById('animeYear');
        const monthSelect = document.getElementById('animeMonth');
        if (yearSelect && monthSelect) {
            const now = new Date();
            yearSelect.value = now.getFullYear().toString();
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

        if (anime.finishDate && animeYear && animeMonth) {
            const [year, month] = anime.finishDate.split('-');
            animeYear.value = year;
            animeMonth.value = month;
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
            console.error('❌ Add anime modal not found!');
        }
    };

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
        window.setLocalDirty(); // <-- mark dirty
        try { window.dispatchEvent(new Event('xpUpdated')); } catch (e) { }

        triggerImmediateSync();

        window.closeModal(document.getElementById('addAnimeModal'));
        resetEditingState();
        if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
        if (typeof showToast === 'function') showToast('Anime deleted successfully!', 'success');
    };

    window.handleAddAnime = function (e) {
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

        if (window.isEditing && window.currentEditId) {
            const existing = window.animeData.find(a => a.id == window.currentEditId);
            if (!existing) {
                if (typeof showToast === 'function') showToast('Anime not found', 'error');
                return;
            }

            const wasCompleted = existing.userStatus === 'Completed';
            const isNowCompleted = status === 'Completed';

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

            if (isNowCompleted && !wasCompleted) {
                if (year && month) {
                    const y = parseInt(year);
                    const m = parseInt(month);
                    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
                        existing.finishDate = `${year}-${String(m).padStart(2, '0')}`;
                    } else {
                        const now = new Date();
                        existing.finishDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    }
                } else {
                    const now = new Date();
                    existing.finishDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                }
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
                const currentDay = String(now.getDate()).padStart(2, '0');
                existing.actualFinishDate = `${currentYear}-${currentMonth}-${currentDay}`;
            }

            if (typeof window.saveData === 'function') window.saveData();
            window.setLocalDirty(); // <-- mark dirty
            if (typeof window.logActivity === 'function') window.logActivity(logAction, title);
            triggerImmediateSync();

        } else {
            if (status === 'Completed') {
                logAction = 'completed';
                toastMessage = `"${title}" added and marked as completed! 🎉`;
                if (year && month) {
                    const y = parseInt(year);
                    const m = parseInt(month);
                    if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
                        finishDate = `${year}-${String(m).padStart(2, '0')}`;
                    } else {
                        const now = new Date();
                        finishDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                    }
                } else {
                    const now = new Date();
                    finishDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                }
                const now = new Date();
                const currentYear = now.getFullYear();
                const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
                const currentDay = String(now.getDate()).padStart(2, '0');
                actualFinishDate = `${currentYear}-${currentMonth}-${currentDay}`;
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
            window.setLocalDirty(); // <-- mark dirty
            if (typeof window.logActivity === 'function') window.logActivity(logAction, title);
            triggerImmediateSync();
        }

        window.closeModal(document.getElementById('addAnimeModal'));
        resetEditingState();
        if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
        if (typeof showToast === 'function') showToast(toastMessage, 'success');
    };

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
                console.log('🖱️ Row clicked, ID:', animeId);
                window.editAnime(animeId);
            }
        };
        tableBody.addEventListener('click', clickHandler);
        tableBody._clickHandler = clickHandler;
    }

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

    function setupFormSubmit() {
        const form = document.getElementById('addAnimeForm');
        if (!form) return;
        form.addEventListener('submit', window.handleAddAnime);
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('addAnimeModal');
            if (modal && (modal.style.display === 'flex' || modal.classList.contains('show'))) {
                window.closeModal(modal);
                resetEditingState();
            }
        }
    });

    function initModalSystem() {
        console.log('🚀 Initializing modal system...');
        setupModalHandlers();
        setupAddAnimeButton();
        setupFloatingButton();
        setupFormSubmit();
        setupBeforeUnloadSync();
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                setTimeout(attachTableClickHandler, 300);
            });
        } else {
            setTimeout(attachTableClickHandler, 300);
        }
        console.log('✅ Modal system initialized');
    }

    window.initModalSystem = initModalSystem;

    window.selectAnimeFromSearch = function (anime) {
        console.log('🎯 Selecting anime:', anime.title);
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
            showToast(`✓ Selected: ${anime.title} (${genreCount} genres)`, 'success');
        }
        console.log('✅ Anime selected successfully');
    };
})();