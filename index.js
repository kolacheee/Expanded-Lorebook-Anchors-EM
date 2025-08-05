(function () {
    const FOLDER_PREFIX = 'wif_folder_';

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
            // Custom folder properties
            isFolder: true,
            folderName: folderName,
            folderExpanded: true,
            folderIcon: 'fa-folder',
            children: [],
        };

        window.world_info.entries[newFolderUid] = newFolderEntry;
        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);
        console.log('World Info Folders: Created new folder:', folderName);
    }

    function addFolderUI() {
        const newFolderButton = document.createElement('div');
        newFolderButton.id = 'wif_new_folder_btn';
        newFolderButton.className = 'menu_button';
        newFolderButton.title = 'New Folder';
        newFolderButton.innerHTML = `<i class="fa-solid fa-folder-plus"></i>`;

        newFolderButton.addEventListener('click', createNewFolder);

        const newEntryButton = document.getElementById('world_info_new_entry');
        if (newEntryButton && newEntryButton.parentNode) {
            newEntryButton.parentNode.insertBefore(newFolderButton, newEntryButton.nextSibling);
        }
    }

    function toggleFolder(folderUid) {
        const folderEntry = window.world_info.entries[folderUid];
        if (folderEntry && folderEntry.isFolder) {
            folderEntry.folderExpanded = !folderEntry.folderExpanded;
            window.saveSettingsDebounced();
            window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);
        }
    }

    function moveEntryToFolder(entryUid, targetFolderUid) {
        const entry = window.world_info.entries[entryUid];
        const targetFolder = window.world_info.entries[targetFolderUid];

        if (!entry || !targetFolder || !targetFolder.isFolder) {
            return;
        }

        // Remove from previous folder
        Object.values(window.world_info.entries).forEach(folder => {
            if (folder.isFolder && folder.children.includes(entryUid)) {
                folder.children = folder.children.filter(childUid => childUid !== entryUid);
            }
        });

        // Add to new folder
        targetFolder.children.push(entryUid);

        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);
    }

    function makeEntriesDraggable() {
        $('.world_entry').draggable({
            revert: 'invalid',
            helper: 'clone',
            appendTo: 'body',
            cursor: 'move',
        });
    }

    function makeFoldersDroppable() {
        $('.wif-folder-entry').droppable({
            accept: '.world_entry',
            hoverClass: 'wif-folder-hover',
            drop: function (event, ui) {
                const droppedEntryUid = ui.draggable.data('uid');
                const targetFolderUid = $(this).data('uid');
                moveEntryToFolder(droppedEntryUid, targetFolderUid);
            },
        });
    }

    function renderFolders() {
        Object.values(window.world_info.entries).forEach(entry => {
            if (entry.isFolder) {
                const folderElement = $(`[data-uid="${entry.uid}"]`);
                folderElement.addClass('wif-folder-entry');

                const folderHeader = `
                    <div class="wif-folder-header">
                        <div class="wif-folder-toggle">
                            <i class="fa-solid ${entry.folderExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
                        </div>
                        <div class="wif-folder-icon">
                            <i class="fa-solid ${entry.folderIcon}"></i>
                        </div>
                        <div class="wif-folder-name">${entry.folderName}</div>
                    </div>
                `;
                folderElement.find('.entry_name').html(folderHeader);

                const folderContent = folderElement.find('.entry_content');
                folderContent.addClass('wif-folder-content');

                if (entry.folderExpanded) {
                    folderContent.show();
                } else {
                    folderContent.hide();
                }

                entry.children.forEach(childUid => {
                    const childElement = $(`[data-uid="${childUid}"]`);
                    folderContent.append(childElement);
                });

                folderElement.find('.wif-folder-header').on('click', () => toggleFolder(entry.uid));
            }
        });

        makeEntriesDraggable();
        makeFoldersDroppable();
    }

    function waitForDependencies() {
        const interval = setInterval(() => {
            if (
                typeof $ !== 'undefined' &&
                typeof window.world_info !== 'undefined' &&
                typeof window.eventSource !== 'undefined' &&
                typeof window.event_types !== 'undefined' &&
                typeof window.saveSettingsDebounced !== 'undefined' &&
                document.getElementById('world_info_new_entry')
            ) {
                clearInterval(interval);
                addFolderUI();
                renderFolders();
                window.eventSource.on(window.event_types.WORLDINFO_UPDATED, renderFolders);
            }
        }, 250);
    }

    waitForDependencies();
})();
