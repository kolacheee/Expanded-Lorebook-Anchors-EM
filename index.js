(function () {
    /* global extension_settings, eventSource, event_types, toastr, saveSettingsDebounced */
    // World Info Folders Extension for SillyTavern
    // This extension adds folder organization functionality to World Info entries

    const MODULE_NAME = 'world-info-folders';

    // Default settings
    const defaultSettings = {
        folders: {},
        entryFolders: {},
        folderStates: {}
    };

    let settings = defaultSettings;

    // Folder data structure
    class WorldInfoFolder {
        constructor(id, name, collapsed = false) {
            this.id = id;
            this.name = name;
            this.collapsed = collapsed;
            this.entries = [];
        }
    }

    // Initialize extension
    function init() {
        try {
            console.log('[World Info Folders] Starting initialization...');

            // Load settings - wait for extension_settings to be available
            if (typeof extension_settings !== 'undefined') {
                settings = extension_settings[MODULE_NAME] || defaultSettings;
                extension_settings[MODULE_NAME] = settings;
                console.log('[World Info Folders] Settings loaded');
            } else {
                console.warn('[World Info Folders] extension_settings not available, using defaults');
            }

            // Listen for World Info events if eventSource is available
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined' && event_types.WORLDINFO_ENTRIES_LOADED) {
                eventSource.on(event_types.WORLDINFO_ENTRIES_LOADED, onWorldInfoLoaded);
                console.log('[World Info Folders] Event listener registered');
            } else {
                console.warn('[World Info Folders] Event system not available');
            }

            // Try to add folder button with multiple attempts
            addFolderButtonWithRetry();

            console.log('[World Info Folders] Extension initialized successfully');
        } catch (error) {
            console.error('[World Info Folders] Error during initialization:', error);
        }
    }

    function onWorldInfoLoaded() {
        try {
            console.log('[World Info Folders] World Info loaded, re-rendering folders');
            // Re-render folders when World Info is reloaded
            renderFolders();
            // Ensure folder button is present after WI reload
            addFolderButtonWithRetry();
        } catch (error) {
            console.error('[World Info Folders] Error in onWorldInfoLoaded:', error);
        }
    }

    function addFolderButtonWithRetry(attempts = 0) {
        const maxAttempts = 50; // Try for 5 seconds
        if (attempts >= maxAttempts) {
            console.warn('[World Info Folders] Could not find World Info UI buttons after', maxAttempts, 'attempts');
            return;
        }

        if (addFolderButton()) {
            console.log('[World Info Folders] Folder button added successfully');
            return;
        }

        // Try again after 100ms
        setTimeout(() => addFolderButtonWithRetry(attempts + 1), 100);
    }

    function addFolderButton() {
        try {
            // Add the folder button between "New Entry" and "Fill empty Memo/Titles" buttons
            const newEntryButton = document.querySelector('#world_popup_new');
            const fillMemosButton = document.querySelector('#world_backfill_memos');

            if (!newEntryButton || !fillMemosButton) {
                return false; // UI not ready yet
            }

            // Check if button already exists
            if (document.querySelector('#world_create_folder_button')) {
                return true; // Already exists
            }

            // Create the folder button
            const folderButton = document.createElement('div');
            folderButton.id = 'world_create_folder_button';
            folderButton.className = 'menu_button fa-solid fa-folder-plus';
            folderButton.title = 'Create New Folder';
            folderButton.setAttribute('data-i18n', '[title]Create New Folder');

            // Add click handler
            folderButton.addEventListener('click', showCreateFolderDialog);

            // Insert between the new entry button and fill memos button
            const parentContainer = newEntryButton.parentElement;
            if (parentContainer) {
                parentContainer.insertBefore(folderButton, fillMemosButton);
                return true; // Successfully added
            }

            return false; // Failed to add
        } catch (error) {
            console.error('[World Info Folders] Error in addFolderButton:', error);
            return false;
        }
    }

    function showCreateFolderDialog() {
        try {
            const folderName = prompt('Enter folder name:');
            if (folderName && folderName.trim()) {
                createFolder(folderName.trim());
            }
        } catch (error) {
            console.error('[World Info Folders] Error in showCreateFolderDialog:', error);
        }
    }

    function createFolder(name) {
        try {
            const currentWorld = getCurrentWorldName();
            if (!currentWorld) {
                if (typeof toastr !== 'undefined' && toastr.error) {
                    toastr.error('No world selected');
                }
                return;
            }

            // Initialize world folders if not exists
            if (!settings.folders[currentWorld]) {
                settings.folders[currentWorld] = {};
            }

            // Generate unique folder ID
            const folderId = generateFolderId();

            // Create folder
            const folder = new WorldInfoFolder(folderId, name, false);
            settings.folders[currentWorld][folderId] = folder;

            // Save settings
            saveSettings();

            // Re-render folders
            renderFolders();

            if (typeof toastr !== 'undefined' && toastr.success) {
                toastr.success(`Folder "${name}" created`);
            }
        } catch (error) {
            console.error('[World Info Folders] Error in createFolder:', error);
        }
    }

    function generateFolderId() {
        return 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getCurrentWorldName() {
        try {
            const worldSelect = document.querySelector('#world_editor_select');
            if (!worldSelect || worldSelect.selectedIndex <= 0) {
                return null;
            }
            return worldSelect.options[worldSelect.selectedIndex].text;
        } catch (error) {
            console.error('[World Info Folders] Error in getCurrentWorldName:', error);
            return null;
        }
    }

    function renderFolders() {
        try {
            const currentWorld = getCurrentWorldName();
            if (!currentWorld || !settings.folders[currentWorld]) {
                return;
            }

            const entriesContainer = document.querySelector('#world_popup_entries_list');
            if (!entriesContainer) {
                return;
            }

            // Get all existing entry elements
            const existingEntries = Array.from(entriesContainer.querySelectorAll('.world_entry'));

            // Create folder containers
            const folders = settings.folders[currentWorld];
            Object.values(folders).forEach(folder => {
                createFolderElement(folder, entriesContainer);
            });

            // Move entries to their assigned folders
            existingEntries.forEach(entry => {
                const entryId = getEntryId(entry);
                const folderId = getFolderForEntry(currentWorld, entryId);

                if (folderId && folders[folderId]) {
                    const folderElement = document.querySelector(`[data-folder-id="${folderId}"] .folder-entries`);
                    if (folderElement) {
                        folderElement.appendChild(entry);
                    }
                }
            });

            // Setup drag and drop
            setupDragAndDrop();
        } catch (error) {
            console.error('[World Info Folders] Error in renderFolders:', error);
        }
    }

    function createFolderElement(folder, container) {
        try {
            // Check if folder element already exists
            let folderElement = document.querySelector(`[data-folder-id="${folder.id}"]`);

            if (!folderElement) {
                folderElement = document.createElement('div');
                folderElement.className = 'wi-folder';
                folderElement.setAttribute('data-folder-id', folder.id);
                folderElement.draggable = true;

                // Folder header
                const folderHeader = document.createElement('div');
                folderHeader.className = 'wi-folder-header';

                // Collapse/expand icon
                const collapseIcon = document.createElement('i');
                collapseIcon.className = folder.collapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down';
                collapseIcon.addEventListener('click', () => toggleFolder(folder.id));

                // Folder name
                const folderName = document.createElement('span');
                folderName.className = 'wi-folder-name';
                folderName.textContent = folder.name;
                folderName.addEventListener('dblclick', () => renameFolderDialog(folder.id));

                // Delete button
                const deleteButton = document.createElement('i');
                deleteButton.className = 'fa-solid fa-trash-can wi-folder-delete';
                deleteButton.title = 'Delete Folder';
                deleteButton.addEventListener('click', () => deleteFolderDialog(folder.id));

                folderHeader.appendChild(collapseIcon);
                folderHeader.appendChild(folderName);
                folderHeader.appendChild(deleteButton);

                // Folder entries container
                const folderEntries = document.createElement('div');
                folderEntries.className = 'folder-entries';
                if (folder.collapsed) {
                    folderEntries.style.display = 'none';
                }

                folderElement.appendChild(folderHeader);
                folderElement.appendChild(folderEntries);

                container.appendChild(folderElement);
            }

            return folderElement;
        } catch (error) {
            console.error('[World Info Folders] Error in createFolderElement:', error);
            return null;
        }
    }

    function toggleFolder(folderId) {
        try {
            const currentWorld = getCurrentWorldName();
            if (!currentWorld || !settings.folders[currentWorld] || !settings.folders[currentWorld][folderId]) {
                return;
            }

            const folder = settings.folders[currentWorld][folderId];
            folder.collapsed = !folder.collapsed;

            const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
            if (folderElement) {
                const collapseIcon = folderElement.querySelector('.wi-folder-header i');
                const entriesContainer = folderElement.querySelector('.folder-entries');

                if (folder.collapsed) {
                    collapseIcon.className = 'fa-solid fa-chevron-right';
                    entriesContainer.style.display = 'none';
                } else {
                    collapseIcon.className = 'fa-solid fa-chevron-down';
                    entriesContainer.style.display = 'block';
                }
            }

            saveSettings();
        } catch (error) {
            console.error('[World Info Folders] Error in toggleFolder:', error);
        }
    }

    function renameFolderDialog(folderId) {
        try {
            const currentWorld = getCurrentWorldName();
            if (!currentWorld || !settings.folders[currentWorld] || !settings.folders[currentWorld][folderId]) {
                return;
            }

            const folder = settings.folders[currentWorld][folderId];
            const newName = prompt('Enter new folder name:', folder.name);

            if (newName && newName.trim() && newName.trim() !== folder.name) {
                folder.name = newName.trim();

                const folderNameElement = document.querySelector(`[data-folder-id="${folderId}"] .wi-folder-name`);
                if (folderNameElement) {
                    folderNameElement.textContent = folder.name;
                }

                saveSettings();
                if (typeof toastr !== 'undefined' && toastr.success) {
                    toastr.success(`Folder renamed to "${folder.name}"`);
                }
            }
        } catch (error) {
            console.error('[World Info Folders] Error in renameFolderDialog:', error);
        }
    }

    function deleteFolderDialog(folderId) {
        try {
            const currentWorld = getCurrentWorldName();
            if (!currentWorld || !settings.folders[currentWorld] || !settings.folders[currentWorld][folderId]) {
                return;
            }

            const folder = settings.folders[currentWorld][folderId];

            if (confirm(`Delete folder "${folder.name}"? Entries will be moved back to the main list.`)) {
                deleteFolder(folderId);
            }
        } catch (error) {
            console.error('[World Info Folders] Error in deleteFolderDialog:', error);
        }
    }

    function deleteFolder(folderId) {
        try {
            const currentWorld = getCurrentWorldName();
            if (!currentWorld) return;

            // Move entries back to main container
            const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
            if (folderElement) {
                const entriesContainer = document.querySelector('#world_popup_entries_list');
                const folderEntries = folderElement.querySelectorAll('.world_entry');

                folderEntries.forEach(entry => {
                    entriesContainer.appendChild(entry);
                });

                folderElement.remove();
            }

            // Remove folder from settings
            if (settings.folders[currentWorld]) {
                delete settings.folders[currentWorld][folderId];
            }

            // Remove entry-folder associations
            if (settings.entryFolders[currentWorld]) {
                Object.keys(settings.entryFolders[currentWorld]).forEach(entryId => {
                    if (settings.entryFolders[currentWorld][entryId] === folderId) {
                        delete settings.entryFolders[currentWorld][entryId];
                    }
                });
            }

            saveSettings();
            if (typeof toastr !== 'undefined' && toastr.success) {
                toastr.success('Folder deleted');
            }
        } catch (error) {
            console.error('[World Info Folders] Error in deleteFolder:', error);
        }
    }

    function setupDragAndDrop() {
        try {
            const entriesContainer = document.querySelector('#world_popup_entries_list');
            if (!entriesContainer) return;

            // Handle entry drag start
            entriesContainer.addEventListener('dragstart', (e) => {
                try {
                    const target = e.target;
                    if (target && (target.classList.contains('world_entry') || target.closest('.world_entry'))) {
                        const entry = target.closest('.world_entry');
                        if (e.dataTransfer) {
                            e.dataTransfer.setData('text/plain', getEntryId(entry));
                            e.dataTransfer.effectAllowed = 'move';
                        }
                    } else if (target && (target.classList.contains('wi-folder') || target.closest('.wi-folder'))) {
                        const folder = target.closest('.wi-folder');
                        if (e.dataTransfer) {
                            e.dataTransfer.setData('application/folder', folder.getAttribute('data-folder-id'));
                            e.dataTransfer.effectAllowed = 'move';
                        }
                    }
                } catch (error) {
                    console.error('[World Info Folders] Error in dragstart handler:', error);
                }
            });

            // Handle folder drop zones
            entriesContainer.addEventListener('dragover', (e) => {
                try {
                    e.preventDefault();
                    if (e.dataTransfer) {
                        e.dataTransfer.dropEffect = 'move';
                    }
                } catch (error) {
                    console.error('[World Info Folders] Error in dragover handler:', error);
                }
            });

            entriesContainer.addEventListener('drop', (e) => {
                try {
                    e.preventDefault();

                    if (e.dataTransfer) {
                        const entryId = e.dataTransfer.getData('text/plain');
                        const folderId = e.dataTransfer.getData('application/folder');

                        if (entryId) {
                            handleEntryDrop(e, entryId);
                        } else if (folderId) {
                            handleFolderDrop(e, folderId);
                        }
                    }
                } catch (error) {
                    console.error('[World Info Folders] Error in drop handler:', error);
                }
            });
        } catch (error) {
            console.error('[World Info Folders] Error in setupDragAndDrop:', error);
        }
    }

    function handleEntryDrop(e, entryId) {
        try {
            const dropTarget = e.target.closest('.wi-folder, .folder-entries, #world_popup_entries_list');
            if (!dropTarget) return;

            const currentWorld = getCurrentWorldName();
            if (!currentWorld) return;

            let targetFolderId = null;

            if (dropTarget.classList.contains('wi-folder') || dropTarget.closest('.wi-folder')) {
                const folderElement = dropTarget.closest('.wi-folder');
                targetFolderId = folderElement.getAttribute('data-folder-id');
            }

            // Update entry-folder association
            if (!settings.entryFolders[currentWorld]) {
                settings.entryFolders[currentWorld] = {};
            }

            if (targetFolderId) {
                settings.entryFolders[currentWorld][entryId] = targetFolderId;
            } else {
                delete settings.entryFolders[currentWorld][entryId];
            }

            saveSettings();
            renderFolders();
        } catch (error) {
            console.error('[World Info Folders] Error in handleEntryDrop:', error);
        }
    }

    function handleFolderDrop(e, folderId) {
        try {
            const dropTarget = e.target.closest('#world_popup_entries_list');
            if (!dropTarget) return;

            // Simple reordering - just move folder element
            const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
            if (folderElement) {
                const rect = dropTarget.getBoundingClientRect();
                const mouseY = e.clientY - rect.top;

                // Find insertion point
                const allFolders = Array.from(dropTarget.querySelectorAll('.wi-folder'));
                let insertBefore = null;

                for (let folder of allFolders) {
                    if (folder === folderElement) continue;
                    const folderRect = folder.getBoundingClientRect();
                    const folderY = folderRect.top - rect.top;
                    if (mouseY < folderY + folderRect.height / 2) {
                        insertBefore = folder;
                        break;
                    }
                }

                if (insertBefore) {
                    dropTarget.insertBefore(folderElement, insertBefore);
                } else {
                    dropTarget.appendChild(folderElement);
                }
            }
        } catch (error) {
            console.error('[World Info Folders] Error in handleFolderDrop:', error);
        }
    }

    function getEntryId(entryElement) {
        try {
            // Try to get UID from various possible attributes or data
            return entryElement.getAttribute('data-uid') ||
                   entryElement.querySelector('[data-uid]')?.getAttribute('data-uid') ||
                   entryElement.id ||
                   entryElement.querySelector('[name="uid"]')?.value ||
                   Math.random().toString(36).substr(2, 9);
        } catch (error) {
            console.error('[World Info Folders] Error in getEntryId:', error);
            return Math.random().toString(36).substr(2, 9);
        }
    }

    function getFolderForEntry(worldName, entryId) {
        try {
            return settings.entryFolders[worldName]?.[entryId] || null;
        } catch (error) {
            console.error('[World Info Folders] Error in getFolderForEntry:', error);
            return null;
        }
    }

    function saveSettings() {
        try {
            if (typeof extension_settings !== 'undefined') {
                extension_settings[MODULE_NAME] = settings;
            }
            if (typeof saveSettingsDebounced === 'function') {
                saveSettingsDebounced();
            }
        } catch (error) {
            console.error('[World Info Folders] Error in saveSettings:', error);
        }
    }

    // Export for potential use by other extensions
    try {
        if (typeof window !== 'undefined') {
            window.WorldInfoFolders = {
                createFolder,
                deleteFolder,
                toggleFolder,
                renderFolders
            };
        }
    } catch (error) {
        console.error('[World Info Folders] Error setting up exports:', error);
    }

    // Wait for SillyTavern to be fully loaded before initializing
    function waitForSillyTavern() {
        try {
            // Check if key SillyTavern objects are available
            if (typeof extension_settings !== 'undefined') {
                console.log('[World Info Folders] SillyTavern detected, initializing...');
                init();
            } else {
                console.log('[World Info Folders] Waiting for SillyTavern...');
                setTimeout(waitForSillyTavern, 500);
            }
        } catch (error) {
            console.error('[World Info Folders] Error in waitForSillyTavern:', error);
            // Try again in case it was a temporary error
            setTimeout(waitForSillyTavern, 1000);
        }
    }

    // Start the initialization process
    console.log('[World Info Folders] Extension loading...');
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForSillyTavern);
    } else {
        waitForSillyTavern();
    }
})();
