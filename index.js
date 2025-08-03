(() => {

    'use strict';
    /* global extension_settings, eventSource, event_types, toastr, saveSettingsDebounced */

    function WorldInfoFoldersExtension() {
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

            // ALSO load from localStorage immediately on init
            setTimeout(() => {
                loadFromWorldInfo();
                renderFolders();
            }, 200); // Small delay to let ST finish initial setup

            // Listen for World Info events if eventSource is available
            if (typeof eventSource !== 'undefined' && typeof event_types !== 'undefined') {
                if (event_types.WORLDINFO_ENTRIES_LOADED) {
                    eventSource.on(event_types.WORLDINFO_ENTRIES_LOADED, onWorldInfoLoaded);
                }
                // Also listen for individual entry changes
                if (event_types.WORLDINFO_ENTRY_ADDED) {
                    eventSource.on(event_types.WORLDINFO_ENTRY_ADDED, onWorldInfoLoaded);
                }
                if (event_types.WORLDINFO_ENTRY_DELETED) {
                    eventSource.on(event_types.WORLDINFO_ENTRY_DELETED, onWorldInfoLoaded);
                }

                // Listen for world changes
                const worldSelect = document.querySelector('#world_editor_select');
                if (worldSelect) {
                    worldSelect.addEventListener('change', () => {
                        console.log('[World Info Folders] World changed, reloading folder data');
                        setTimeout(() => {
                            loadFromWorldInfo();
                            renderFolders();
                        }, 100);
                    });
                }

                console.log('[World Info Folders] Event listeners registered');
            }

            // Also use MutationObserver as backup
            observeWorldInfoChanges();

            // Try to add folder button with multiple attempts
            addFolderButtonWithRetry();

            console.log('[World Info Folders] Extension initialized successfully');
        } catch (error) {
            console.error('[World Info Folders] Error during initialization:', error);
        }
    }

    function saveToWorldInfo() {
        try {
            const currentWorld = getCurrentWorldName();
            if (!currentWorld) return;

            const folderData = {
                folders: settings.folders[currentWorld] || {},
                entryFolders: settings.entryFolders[currentWorld] || {},
                version: '1.0.0'
            };

            // Find or create metadata entry
            let metadataEntry = findMetadataEntry();

            if (!metadataEntry) {
                // Create new metadata entry by programmatically adding it
                createMetadataEntry(JSON.stringify(folderData));
            } else {
                // Update existing metadata entry
                updateMetadataEntryContent(metadataEntry, JSON.stringify(folderData));
            }

            console.log('[World Info Folders] Saved folder data to metadata entry');
        } catch (error) {
            console.error('[World Info Folders] Error saving to world info:', error);
        }
    }

    function findMetadataEntry() {
        const entriesContainer = document.querySelector('#world_popup_entries_list');
        if (!entriesContainer) return null;

        return Array.from(entriesContainer.querySelectorAll('.world_entry')).find(entry => {
            const keyInput = entry.querySelector('input[placeholder="Key"]');
            return keyInput && keyInput.value === '__FOLDER_METADATA__';
        });
    }

    function createMetadataEntry(folderDataJson) {
        // We need to trigger ST's "add entry" and then populate it
        const newEntryButton = document.querySelector('#world_popup_new');
        if (newEntryButton) {
            newEntryButton.click();

            // Wait for entry to be created, then populate it
            setTimeout(() => {
                populateNewestEntry(folderDataJson);
            }, 200);
        }
    }

    function populateNewestEntry(folderDataJson) {
        const entriesContainer = document.querySelector('#world_popup_entries_list');
        const entries = Array.from(entriesContainer.querySelectorAll('.world_entry'));
        const newestEntry = entries[entries.length - 1];

        if (newestEntry) {
            updateMetadataEntryContent(newestEntry, folderDataJson);

            // Set the key to identify it as metadata
            const keyInput = newestEntry.querySelector('input[placeholder="Key"]');
            if (keyInput) {
                keyInput.value = '__FOLDER_METADATA__';
                keyInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Set comment to explain what this is
            const commentInput = newestEntry.querySelector('input[placeholder="Comment"]');
            if (commentInput) {
                commentInput.value = 'Folder Extension Data - Do Not Delete';
                commentInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Disable the entry so it doesn't affect generation
            const disableCheckbox = newestEntry.querySelector('input[type="checkbox"]');
            if (disableCheckbox && !disableCheckbox.checked) {
                disableCheckbox.click(); // Toggle to disable
            }
        }
    }

    function updateMetadataEntryContent(entryElement, folderDataJson) {
        const contentTextarea = entryElement.querySelector('textarea[placeholder="Content"]');
        if (contentTextarea) {
            contentTextarea.value = folderDataJson;
            contentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
    }

    function onWorldInfoLoaded() {
        try {
            console.log('[World Info Folders] World Info loaded, loading folder data');

            // Load folder data from the world info file first
            loadFromWorldInfo();

            // Then re-render folders
            renderFolders();

            // Ensure folder button is present
            addFolderButtonWithRetry();
        } catch (error) {
            console.error('[World Info Folders] Error in onWorldInfoLoaded:', error);
        }
    }

    function observeWorldInfoChanges() {
        const entriesContainer = document.querySelector('#world_popup_entries_list');
        if (!entriesContainer) return;

        const observer = new MutationObserver((mutations) => {
            let shouldRerender = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if new entries were added or removed
                    const addedEntries = Array.from(mutation.addedNodes).filter(node =>
                        node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('world_entry')
                    );
                    const removedEntries = Array.from(mutation.removedNodes).filter(node =>
                        node.nodeType === Node.ELEMENT_NODE && node.classList?.contains('world_entry')
                    );

                    if (addedEntries.length > 0 || removedEntries.length > 0) {
                        shouldRerender = true;
                    }
                }
            });

            if (shouldRerender) {
                console.log('[World Info Folders] World Info DOM changed, re-rendering folders');
                setTimeout(() => renderFolders(), 100); // Small delay to let ST finish its work
            }
        });

        observer.observe(entriesContainer, {
            childList: true,
            subtree: true
        });
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

            // Make sure all entries are draggable
            existingEntries.forEach(entry => {
                entry.draggable = true;
            });

            // Create folder containers
            const folders = settings.folders[currentWorld];
            Object.values(folders).forEach(folder => {
                createFolderElement(folder, entriesContainer);
            });

            // Move entries to their assigned folders
            existingEntries.forEach(entry => {
                const entryId = getEntryId(entry);
                console.log('[World Info Folders] Entry ID:', entryId, 'for element:', entry);
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

        // Instead of creating our own drag system, intercept ST's existing one
        interceptSillyTavernDragSystem();

        // Keep visual feedback for folders
        setupFolderVisualFeedback();

    } catch (error) {
        console.error('[World Info Folders] Error in setupDragAndDrop:', error);
    }
}

    function interceptSillyTavernDragSystem() {
        const entriesContainer = document.querySelector('#world_popup_entries_list');

        // Use a more comprehensive approach to detect ST's drag operations
        let draggedEntry = null;

        // Detect when ST starts dragging an entry
        entriesContainer.addEventListener('dragstart', (e) => {
            if (e.target.closest('.world_entry')) {
                draggedEntry = e.target.closest('.world_entry');
            }
        }, true);

        // Detect drops on folders with higher priority than ST's handlers
        entriesContainer.addEventListener('dragover', (e) => {
            const folder = e.target.closest('.wi-folder');
            if (folder && draggedEntry) {
                e.preventDefault();
                e.stopPropagation();
            }
        }, true);

        entriesContainer.addEventListener('drop', (e) => {
            const folder = e.target.closest('.wi-folder');

            if (folder && draggedEntry) {
                e.preventDefault();
                e.stopImmediatePropagation();

                console.log('[World Info Folders] Intercepted ST drag to folder');
                handleSTEntryDrop(draggedEntry, folder);
                draggedEntry = null;
                return false;
            }

            draggedEntry = null;
        }, true);

        // Clean up on drag end
        entriesContainer.addEventListener('dragend', () => {
            draggedEntry = null;
        }, true);
    }

    function handleSTEntryDrop(entryElement, folderElement) {
        try {
            const entryId = getEntryId(entryElement);
            const folderId = folderElement.getAttribute('data-folder-id');
            const currentWorld = getCurrentWorldName();

            if (!currentWorld || !entryId || !folderId) return;

            // Move the entry to the folder
            const folderEntriesContainer = folderElement.querySelector('.folder-entries');
            if (folderEntriesContainer) {
                folderEntriesContainer.appendChild(entryElement);
            }

            // Update settings
            if (!settings.entryFolders[currentWorld]) {
                settings.entryFolders[currentWorld] = {};
            }
            settings.entryFolders[currentWorld][entryId] = folderId;

            saveSettings();
            console.log('[World Info Folders] Entry moved to folder via ST drag handle');

            // Reset any ST drag styling
            entryElement.style.opacity = '';
            entryElement.classList.remove('dragging');

        } catch (error) {
            console.error('[World Info Folders] Error in handleSTEntryDrop:', error);
        }
    }

    function setupFolderVisualFeedback() {
        const entriesContainer = document.querySelector('#world_popup_entries_list');

        entriesContainer.addEventListener('dragenter', (e) => {
            const folder = e.target.closest('.wi-folder');
            if (folder) {
                folder.classList.add('drag-over');
            }
        });

        entriesContainer.addEventListener('dragleave', (e) => {
            const folder = e.target.closest('.wi-folder');
            if (folder && !folder.contains(e.relatedTarget)) {
                folder.classList.remove('drag-over');
            }
        });

        entriesContainer.addEventListener('dragend', () => {
            // Clean up all drag feedback
            document.querySelectorAll('.wi-folder.drag-over').forEach(folder => {
                folder.classList.remove('drag-over');
            });
        });
    }

    function getEntryId(entryElement) {
        try {
            // SillyTavern typically uses data-uid or has a hidden input with the UID
            const uidInput = entryElement.querySelector('input[name="uid"]');
            if (uidInput && uidInput.value) {
                return uidInput.value;
            }

            // Try other common patterns
            const dataUid = entryElement.getAttribute('data-uid') ||
                        entryElement.querySelector('[data-uid]')?.getAttribute('data-uid');
            if (dataUid) {
                return dataUid;
            }

            // Fallback - use element index as stable ID
            const container = document.querySelector('#world_popup_entries_list');
            const allEntries = Array.from(container.querySelectorAll('.world_entry'));
            const index = allEntries.indexOf(entryElement);
            return `entry_${index}`;
        } catch (error) {
            console.error('[World Info Folders] Error in getEntryId:', error);
            return `fallback_${Math.random().toString(36).substr(2, 9)}`;
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
            // Save to extension settings as backup
            if (typeof extension_settings !== 'undefined') {
                extension_settings[MODULE_NAME] = settings;
            }
            if (typeof saveSettingsDebounced === 'function') {
                saveSettingsDebounced();
            }

            // ALSO save directly to world info for persistence
            saveToWorldInfo();
        } catch (error) {
            console.error('[World Info Folders] Error in saveSettings:', error);
        }
    }

    // DELETING THIS BREAKS THE EXTENSION
    init();
}

    // Register the extension
    jQuery(() => {
        if (window.SillyTavern) {
            WorldInfoFoldersExtension();
        }
    });
})();
