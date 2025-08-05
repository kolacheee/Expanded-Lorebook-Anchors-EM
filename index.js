(function () {
    // Extension state
    let foldersEnabled = false;
    let folderData = {};

    // Constants
    // const FOLDER_ENTRY_TYPE = 'folder'; // This is not used, so commenting out.
    const FOLDER_PREFIX = 'wif_folder_';

    /**
     * Initialize the World Info Folders extension
     */
    function initializeWorldInfoFolders() {
        console.log('World Info Folders: Initializing extension');

        // Listen for world info events
        window.eventSource.on(window.event_types.WORLDINFO_LOADED, onWorldInfoLoaded);
        window.eventSource.on(window.event_types.WORLDINFO_UPDATED, onWorldInfoUpdated);
        window.eventSource.on(window.event_types.WORLDINFO_ENTRIES_LOADED, onWorldInfoEntriesLoaded);

        // Add folder management UI
        addFolderUI();

        foldersEnabled = true;
        console.log('World Info Folders: Extension initialized');
    }

    /**
     * Handle world info loaded event
     */
    function onWorldInfoLoaded() {
        console.log('World Info Folders: World info loaded, refreshing folder data');
        loadFolderData();
        updateFolderDisplay();
    }

    /**
     * Handle world info updated event
     */
    function onWorldInfoUpdated() {
        console.log('World Info Folders: World info updated, refreshing display');
        updateFolderDisplay();
    }

    /**
     * Handle world info entries loaded event
     */
    function onWorldInfoEntriesLoaded() {
        console.log('World Info Folders: World info entries loaded, updating folder display');
        setTimeout(() => {
            updateFolderDisplay();
            makeFoldersCollapsible();
            enableFolderDragDrop();
        }, 100);
    }

    /**
     * Load folder data from world info entries
     */
    function loadFolderData() {
        folderData = {};

        if (!window.world_info || !window.world_info.entries) {
            return;
        }

        // Find all folder entries
        Object.values(window.world_info.entries).forEach(entry => {
            if (entry.folder === true) {
                folderData[entry.uid] = {
                    uid: entry.uid,
                    name: entry.folderName || 'Untitled Folder',
                    expanded: entry.folderExpanded !== false,
                    icon: entry.folderIcon || 'fa-folder',
                    entries: [],
                };
            }
        });

        // Assign regular entries to folders
        Object.values(window.world_info.entries).forEach(entry => {
            if (entry.folder !== true && entry.assignedFolder) {
                if (folderData[entry.assignedFolder]) {
                    folderData[entry.assignedFolder].entries.push(entry);
                }
            }
        });

        // Sort entries within folders by folderOrder
        Object.values(folderData).forEach(folder => {
            folder.entries.sort((a, b) => (a.folderOrder || 0) - (b.folderOrder || 0));
        });
    }

    /**
     * Add folder management UI to the world info panel
     */
    function addFolderUI() {
        const controlsContainer = $('#world_info_controls');
        console.log('World Info Folders: Checking for #world_info_controls. Found elements:', controlsContainer.length);

        if (controlsContainer.length && !$('#wif_new_folder_btn').length) {
            console.log('World Info Folders: Adding "New Folder" button.');
            const newFolderButton = $(`
                <div id="wif_new_folder_btn" class="menu_button" title="New Folder">
                    <i class="fa-solid fa-folder-plus"></i>
                    <span>New Folder</span>
                </div>
            `);

            newFolderButton.on('click', createNewFolder);
            controlsContainer.append(newFolderButton);
        } else {
            console.log('World Info Folders: "New Folder" button not added. Either #world_info_controls not found or button already exists.');
        }
    }

    /**
     * Update the folder display in the world info entries list
     */
    function updateFolderDisplay() {
        if (!foldersEnabled) return;

        loadFolderData();

        // Find all world info entry elements
        const entryElements = $('.world_entry');

        entryElements.each(function() {
            const entryElement = $(this);
            const entryUid = entryElement.data('uid') || entryElement.attr('data-uid');

            if (!entryUid) return;

            const entry = window.world_info.entries?.[entryUid];
            if (!entry) return;

            // Handle folder entries
            if (entry.folder === true) {
                transformToFolderElement(entryElement, entry);
            }
            // Handle regular entries assigned to folders
            else if (entry.assignedFolder && folderData[entry.assignedFolder]) {
                assignEntryToFolder(entryElement, entry);
            }
        });

        // Group entries under their folders
        organizeFolderStructure();
    }

    /**
     * Transform a regular entry element into a folder element
     */
    function transformToFolderElement(entryElement, folderEntry) {
        entryElement.addClass('wif-folder-entry');

        // Update the folder header
        const folderName = folderEntry.folderName || 'Untitled Folder';
        const folderIcon = folderEntry.folderIcon || 'fa-folder';
        const isExpanded = folderEntry.folderExpanded !== false;

        // Find or create folder header
        let folderHeader = entryElement.find('.wif-folder-header');
        if (!folderHeader.length) {
            folderHeader = $(`
                <div class="wif-folder-header">
                    <div class="wif-folder-toggle">
                        <i class="fa-solid ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
                    </div>
                    <div class="wif-folder-icon">
                        <i class="fa-solid ${folderIcon}"></i>
                    </div>
                    <div class="wif-folder-name">${folderName}</div>
                    <div class="wif-folder-controls">
                        <i class="fa-solid fa-edit wif-rename-folder" title="Rename Folder"></i>
                        <i class="fa-solid fa-trash wif-delete-folder" title="Delete Folder"></i>
                    </div>
                </div>
            `);

            entryElement.prepend(folderHeader);
        }

        // Create folder content container
        let folderContent = entryElement.find('.wif-folder-content');
        if (!folderContent.length) {
            folderContent = $('<div class="wif-folder-content"></div>');
            entryElement.append(folderContent);
        }

        // Set initial expanded state
        if (isExpanded) {
            folderContent.show();
            folderHeader.find('.wif-folder-toggle i').removeClass('fa-chevron-right').addClass('fa-chevron-down');
        } else {
            folderContent.hide();
            folderHeader.find('.wif-folder-toggle i').removeClass('fa-chevron-down').addClass('fa-chevron-right');
        }

        // Bind folder controls
        bindFolderControls(entryElement, folderEntry);
    }

    /**
     * Assign an entry to its folder visually
     */
    function assignEntryToFolder(entryElement, entry) {
        entryElement.addClass('wif-folder-child');
        entryElement.attr('data-folder-id', entry.assignedFolder);
    }

    /**
     * Organize the folder structure in the DOM
     */
    function organizeFolderStructure() {
        // Move folder children into their parent folders
        $('.wif-folder-child').each(function() {
            const childElement = $(this);
            const folderId = childElement.attr('data-folder-id');
            const folderElement = $(`.world_entry[data-uid="${folderId}"]`);

            if (folderElement.length) {
                const folderContent = folderElement.find('.wif-folder-content');
                if (folderContent.length) {
                    childElement.appendTo(folderContent);
                }
            }
        });
    }

    /**
     * Make folders collapsible
     */
    function makeFoldersCollapsible() {
        $('.wif-folder-toggle').off('click.wif').on('click.wif', function(e) {
            e.stopPropagation();

            const folderElement = $(this).closest('.wif-folder-entry');
            const folderContent = folderElement.find('.wif-folder-content');
            const toggleIcon = $(this).find('i');
            const entryUid = folderElement.data('uid') || folderElement.attr('data-uid');

            if (folderContent.is(':visible')) {
                folderContent.slideUp(200);
                toggleIcon.removeClass('fa-chevron-down').addClass('fa-chevron-right');
                updateFolderExpandedState(entryUid, false);
            } else {
                folderContent.slideDown(200);
                toggleIcon.removeClass('fa-chevron-right').addClass('fa-chevron-down');
                updateFolderExpandedState(entryUid, true);
            }
        });
    }

    /**
     * Enable drag and drop for folder organization
     */
    function enableFolderDragDrop() {
        // Make entries draggable
        $('.world_entry:not(.wif-folder-entry)').draggable({
            helper: 'clone',
            opacity: 0.7,
            revert: 'invalid',
            start: function(event, ui) {
                $(this).addClass('wif-dragging');
            },
            stop: function(event, ui) {
                $(this).removeClass('wif-dragging');
            },
        });

        // Make folders droppable
        $('.wif-folder-entry').droppable({
            accept: '.world_entry:not(.wif-folder-entry)',
            hoverClass: 'wif-folder-hover',
            drop: function(event, ui) {
                const draggedEntry = ui.draggable;
                const targetFolder = $(this);
                const draggedUid = draggedEntry.data('uid') || draggedEntry.attr('data-uid');
                const folderUid = targetFolder.data('uid') || targetFolder.attr('data-uid');

                assignEntryToFolderData(draggedUid, folderUid);
            },
        });
    }

    /**
     * Bind folder control events
     */
    function bindFolderControls(folderElement, folderEntry) {
        const folderHeader = folderElement.find('.wif-folder-header');

        // Rename folder
        folderHeader.find('.wif-rename-folder').off('click.wif').on('click.wif', function(e) {
            e.stopPropagation();
            renameFolderPrompt(folderEntry.uid);
        });

        // Delete folder
        folderHeader.find('.wif-delete-folder').off('click.wif').on('click.wif', function(e) {
            e.stopPropagation();
            deleteFolderPrompt(folderEntry.uid);
        });
    }

    /**
     * Create a new folder
     */
    function createNewFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        const newFolderUid = `${FOLDER_PREFIX}${Date.now()}`;
        const newFolderEntry = {
            uid: newFolderUid,
            key: [],
            keysecondary: [],
            comment: `Folder: ${folderName}`,
            content: '',
            constant: false,
            selective: true,
            order: Object.keys(window.world_info.entries).length,
            position: 0,
            disable: false,
            addMemo: false,
            excludeRecursion: false,
            delayUntilRecursion: false,
            displayIndex: Object.keys(window.world_info.entries).length,
            probability: 100,
            useProbability: false,
            group: '',
            groupOverride: false,
            groupWeight: 100,
            scanDepth: null,
            caseSensitive: null,
            matchWholeWords: null,
            useGroupScoring: null,
            automationId: '',
            role: 0,
            vectorized: false,
            folder: true,
            folderName: folderName,
            folderExpanded: true,
            folderIcon: 'fa-folder',
        };

        // Add to world info
        window.world_info.entries[newFolderUid] = newFolderEntry;

        // Save changes
        window.saveSettingsDebounced();

        // Trigger update
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);

        console.log('World Info Folders: Created new folder:', folderName);
    }

    /**
     * Rename folder prompt
     */
    function renameFolderPrompt(folderUid) {
        const folder = window.world_info.entries[folderUid];
        if (!folder) return;

        const newName = prompt('Enter new folder name:', folder.folderName);
        if (!newName || newName === folder.folderName) return;

        folder.folderName = newName;
        folder.comment = `Folder: ${newName}`;

        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);

        console.log('World Info Folders: Renamed folder to:', newName);
    }

    /**
     * Delete folder prompt
     */
    function deleteFolderPrompt(folderUid) {
        const folder = window.world_info.entries[folderUid];
        if (!folder) return;

        const confirmDelete = confirm(`Delete folder "${folder.folderName}"?\n\nThis will unassign all entries from the folder but won't delete the entries themselves.`);
        if (!confirmDelete) return;

        // Unassign all entries from this folder
        Object.values(window.world_info.entries).forEach(entry => {
            if (entry.assignedFolder === folderUid) {
                delete entry.assignedFolder;
                delete entry.folderOrder;
            }
        });

        // Delete the folder entry
        delete window.world_info.entries[folderUid];

        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);

        console.log('World Info Folders: Deleted folder:', folder.folderName);
    }

    /**
     * Assign an entry to a folder in the data
     */
    function assignEntryToFolderData(entryUid, folderUid) {
        const entry = window.world_info.entries[entryUid];
        const folder = window.world_info.entries[folderUid];

        if (!entry || !folder || folder.folder !== true) return;

        // Remove from previous folder if any
        if (entry.assignedFolder) {
            delete entry.assignedFolder;
            delete entry.folderOrder;
        }

        // Assign to new folder
        entry.assignedFolder = folderUid;
        entry.folderOrder = folderData[folderUid]?.entries.length || 0;

        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);

        console.log('World Info Folders: Assigned entry to folder:', entry.comment, '->', folder.folderName);
    }

    /**
     * Update folder expanded state
     */
    function updateFolderExpandedState(folderUid, expanded) {
        const folder = window.world_info.entries[folderUid];
        if (!folder) return;

        folder.folderExpanded = expanded;
        window.saveSettingsDebounced();
    }

    // Initialize when DOM is ready and jQuery is available
    function tryInitialize() {
        // Check if jQuery and required modules are available
        if (typeof $ === 'undefined' || typeof window.world_info === 'undefined' || typeof window.eventSource === 'undefined' || typeof window.event_types === 'undefined' || typeof window.saveSettingsDebounced === 'undefined') {
            console.log('World Info Folders: Dependencies not ready, retrying...');
            setTimeout(tryInitialize, 100);
            return;
        }

        console.log('World Info Folders: Dependencies ready, initializing...');
        initializeWorldInfoFolders();
    }

    // Start initialization when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInitialize);
    } else {
        tryInitialize();
    }
})();
