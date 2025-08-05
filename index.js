(function () {
    const FOLDER_PREFIX = 'wif_folder_';

    // Function to create a new folder entry
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
            isFolder: true,
            folderName: folderName,
            folderExpanded: true,
            children: [],
        };

        window.world_info.entries[newFolderUid] = newFolderEntry;
        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);
    }

    // Function to add the "New Folder" button to the UI
    function addFolderUI() {
        if (document.getElementById('wif_new_folder_btn')) return;

        const newFolderButton = document.createElement('div');
        newFolderButton.id = 'wif_new_folder_btn';
        newFolderButton.className = 'menu_button';
        newFolderButton.title = 'New Folder';
        newFolderButton.innerHTML = '<i class="fa-solid fa-folder-plus"></i><span>New Folder</span>';
        newFolderButton.addEventListener('click', createNewFolder);

        const backfillMemosButton = document.getElementById('world_backfill_memos');
        if (backfillMemosButton && backfillMemosButton.parentNode) {
            backfillMemosButton.parentNode.insertBefore(newFolderButton, backfillMemosButton);
        } else {
            // Fallback if the primary anchor isn't found
            const newEntryButton = document.getElementById('world_popup_new');
            if (newEntryButton && newEntryButton.parentNode) {
                newEntryButton.parentNode.insertBefore(newFolderButton, newEntryButton.nextSibling);
            }
        }
    }

    // Function to render the folder structure
    function renderFolders() {
        Object.values(window.world_info.entries).forEach(entry => {
            if (entry.isFolder) {
                const folderElement = $(`[data-uid="${entry.uid}"]`);
                if (!folderElement.length || folderElement.hasClass('wif-folder-entry')) return;

                folderElement.addClass('wif-folder-entry');
                const folderHeader = `
                    <div class="wif-folder-header">
                        <div class="wif-folder-toggle">
                            <i class="fa-solid ${entry.folderExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
                        </div>
                        <div class="wif-folder-name">${entry.folderName}</div>
                    </div>
                `;
                folderElement.find('.entry_name').html(folderHeader);

                let folderContent = folderElement.find('.wif-folder-content');
                if (!folderContent.length) {
                    folderContent = $('<div class="wif-folder-content"></div>').appendTo(folderElement);
                }

                if (entry.folderExpanded) {
                    folderContent.show();
                } else {
                    folderContent.hide();
                }

                entry.children.forEach(childUid => {
                    const childElement = $(`#world_popup_entries_list > [data-uid="${childUid}"]`);
                    folderContent.append(childElement);
                });

                folderElement.find('.wif-folder-header').on('click', () => toggleFolder(entry.uid));
            }
        });
        makeEntriesDraggable();
        makeFoldersDroppable();
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
        if (!entry || !targetFolder || !targetFolder.isFolder) return;

        Object.values(window.world_info.entries).forEach(folder => {
            if (folder.isFolder && folder.children.includes(entryUid)) {
                folder.children = folder.children.filter(childUid => childUid !== entryUid);
            }
        });

        targetFolder.children.push(entryUid);
        window.saveSettingsDebounced();
        window.eventSource.emit(window.event_types.WORLDINFO_UPDATED);
    }

    function makeEntriesDraggable() {
        $('.world_entry:not(.wif-folder-entry)').draggable({
            revert: 'invalid',
            helper: 'clone',
            appendTo: 'body',
        });
    }

    function makeFoldersDroppable() {
        $('.wif-folder-entry').droppable({
            accept: '.world_entry:not(.wif-folder-entry)',
            hoverClass: 'wif-folder-hover',
            drop: function (event, ui) {
                const droppedEntryUid = ui.draggable.data('uid');
                const targetFolderUid = $(this).data('uid');
                moveEntryToFolder(droppedEntryUid, targetFolderUid);
            },
        });
    }

    // Wait for the UI to be ready before adding elements
    function waitForUi() {
        const interval = setInterval(() => {
            if (document.getElementById('world_backfill_memos')) {
                clearInterval(interval);
                addFolderUI();
                // Use a MutationObserver to detect when entries are added to the list
                const observer = new MutationObserver(() => {
                    renderFolders();
                });
                const targetNode = document.getElementById('world_popup_entries_list');
                if (targetNode) {
                    observer.observe(targetNode, { childList: true });
                }
                // Initial render
                renderFolders();
            }
        }, 250);
    }

    // Hook into SillyTavern's events
    $(document).ready(waitForUi);
})();
