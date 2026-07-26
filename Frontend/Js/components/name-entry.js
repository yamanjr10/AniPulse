// ============================================
// NAME ENTRY MODAL (First-time users)
// ============================================

(function () {
    'use strict';

    // --- Get user name ---
    function getUserName() {
        const userProfile = JSON.parse(localStorage.getItem('userProfile'));
        if (userProfile && userProfile.name) return userProfile.name;
        const userName = localStorage.getItem('userName');
        if (userName) return userName;
        return null;
    }

    // --- Set user name ---
    function setUserName(name) {
        if (!name || name.trim() === '') name = 'Otaku';
        const trimmedName = name.trim();
        localStorage.setItem('userName', trimmedName);
        let userProfile = JSON.parse(localStorage.getItem('userProfile'));
        if (!userProfile) {
            userProfile = {
                name: trimmedName,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(trimmedName)}&background=6a5acd&color=fff`
            };
        } else {
            userProfile.name = trimmedName;
        }
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        updateUserNameDisplay(trimmedName);
        updateGreetingMessage();
        if (typeof window.updateSidebarUserInfo === 'function') window.updateSidebarUserInfo();
        return trimmedName;
    }

    // --- Update display ---
    function updateUserNameDisplay(name) {
        const avatar = document.querySelector('.user-profile .user-avatar');
        if (avatar) {
            const encoded = encodeURIComponent(name);
            avatar.src = `https://ui-avatars.com/api/?name=${encoded}&background=6a5acd&color=fff`;
            avatar.alt = name;
        }
        const topName = document.querySelector('.user-profile span');
        if (topName) topName.textContent = name;
        const sidebarName = document.querySelector('.sidebar-username');
        if (sidebarName) sidebarName.textContent = name;
        const sidebarAvatar = document.querySelector('.sidebar-avatar');
        if (sidebarAvatar) {
            const encoded = encodeURIComponent(name);
            sidebarAvatar.src = `https://ui-avatars.com/api/?name=${encoded}&background=6a5acd&color=fff`;
            sidebarAvatar.alt = name;
        }
        const input = document.getElementById('usernameInput');
        if (input && input.value !== name) input.value = name;
        const previewName = document.getElementById('profilePreviewName');
        if (previewName) previewName.textContent = name;
        const previewAvatar = document.getElementById('profilePreviewAvatar');
        if (previewAvatar) {
            const encoded = encodeURIComponent(name);
            previewAvatar.src = `https://ui-avatars.com/api/?name=${encoded}&background=6a5acd&color=fff`;
        }
    }

    // --- Update greeting ---
    function updateGreetingMessage() {
        const userName = getUserName();
        const greetingLine = document.querySelector('.greeting-line');
        if (greetingLine) {
            const hour = new Date().getHours();
            let timeGreeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
            if (userName && userName !== 'AnimeFan94' && userName !== 'AnimeFan') {
                greetingLine.innerHTML = `${timeGreeting}, ${userName}! <span class="greeting-emoji">👋</span>`;
            } else {
                greetingLine.innerHTML = `${timeGreeting}, Otaku! <span class="greeting-emoji">👋</span>`;
            }
        }
    }

    // --- Show modal ---
    function showNameEntryModal() {
        const modal = document.getElementById('nameEntryModal');
        if (modal) {
            modal.style.display = 'flex';
            document.body.classList.add('modal-open');
            const input = document.getElementById('userNameInput');
            if (input) { input.value = ''; setTimeout(() => input.focus(), 100); }
        }
    }
    window.showNameEntryModal = showNameEntryModal;

    // --- Hide modal ---
    function hideNameEntryModal() {
        const modal = document.getElementById('nameEntryModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
    }
    window.hideNameEntryModal = hideNameEntryModal;

    // --- Init name entry ---
    function initNameEntry() {
        const savedName = getUserName();
        const modalShown = sessionStorage.getItem('nameModalShown');
        if (!savedName && !modalShown) {
            setTimeout(() => {
                showNameEntryModal();
                sessionStorage.setItem('nameModalShown', 'true');
            }, 500);
        } else if (savedName) {
            updateUserNameDisplay(savedName);
            updateGreetingMessage();
        } else {
            setUserName('Otaku');
            updateGreetingMessage();
        }

        // Form submit
        const form = document.getElementById('nameEntryForm');
        if (form) {
            const newForm = form.cloneNode(true);
            form.parentNode.replaceChild(newForm, form);
            newForm.addEventListener('submit', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const input = document.getElementById('userNameInput');
                const name = input ? input.value.trim() : '';
                if (name && name.length > 0) {
                    setUserName(name);
                    if (typeof showToast === 'function') showToast(`Welcome, ${name}! 🎉`, 'success');
                } else {
                    setUserName('Otaku');
                    if (typeof showToast === 'function') showToast('Welcome, Otaku! 🎉', 'success');
                }
                hideNameEntryModal();
                setTimeout(() => {
                    if (typeof window.updateAllComponents === 'function') window.updateAllComponents();
                    updateGreetingMessage();
                }, 100);
            });
            const nameInput = document.getElementById('userNameInput');
            if (nameInput) {
                nameInput.addEventListener('keypress', function (e) {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        newForm.dispatchEvent(new Event('submit'));
                    }
                });
            }
        }

        // Modal close handlers
        const modal = document.getElementById('nameEntryModal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    const input = document.getElementById('userNameInput');
                    const name = input ? input.value.trim() : '';
                    if (name) setUserName(name);
                    else setUserName('Otaku');
                    hideNameEntryModal();
                    if (typeof showToast === 'function') showToast('Welcome!', 'success');
                }
            });
            // Close button already has onclick in HTML
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
                const input = document.getElementById('userNameInput');
                const name = input ? input.value.trim() : '';
                if (name) setUserName(name);
                else setUserName('Otaku');
                hideNameEntryModal();
                if (typeof showToast === 'function') showToast('Welcome!', 'success');
            }
        });

        // Settings name sync
        const usernameInput = document.getElementById('usernameInput');
        if (usernameInput) {
            const current = getUserName();
            if (current) usernameInput.value = current;
            usernameInput.addEventListener('change', function () {
                const newName = this.value.trim();
                if (newName && newName.length > 0) {
                    setUserName(newName);
                    if (typeof showToast === 'function') showToast(`Name updated to ${newName}`, 'success');
                } else {
                    const currentName = getUserName();
                    this.value = currentName || 'Otaku';
                }
            });
        }

        console.log('✅ Name entry initialized');
    }

    window.initNameEntry = initNameEntry;
})();