(function () {
    // Function to create a new folder entry
    function createNewFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        // Get the currently selected world info file
        const worldName = world_names[Number($('#world_editor_select').val())];
        if (!worldName) {
            toastr.error('Please select a World Info file first.');
            return;
        }

        // Create a new entry using the official function
        const entry = createWorldInfoEntry(worldName, world_info);
        if (!entry) {
            toastr.error('Failed to create a new entry.');
            return;
        }

        // Modify the entry to be a folder
        entry.comment = folderName;
        entry.isFolder = true;
        entry.children = [];

        // Save the updated world info
        saveWorldInfo(worldName, world_info, true).then(() => {
            // Refresh the editor to show the new folder
            updateEditor(entry.uid);
        });
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
        }
    }

    // Function to render the folder structure
    function renderFolders() {
        Object.values(world_info.entries).forEach(entry => {
            if (entry.isFolder) {
                const folderElement = $(`[data-uid="${entry.uid}"]`);
                if (!folderElement.length || folderElement.hasClass('wif-folder-entry')) return;

                folderElement.addClass('wif-folder-entry');
                const folderHeader = `
                    <div class="wif-folder-header">
                        <div class="wif-folder-toggle">
                            <i class="fa-solid ${entry.folderExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}"></i>
                        </div>
                        <div class="wif-folder-name">${entry.comment}</div>
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
        const folderEntry = world_info.entries[folderUid];
        if (folderEntry && folderEntry.isFolder) {
            folderEntry.folderExpanded = !folderEntry.folderExpanded;
            const worldName = world_names[Number($('#world_editor_select').val())];
            saveWorldInfo(worldName, world_info, true).then(() => {
                updateEditor(folderUid);
            });
        }
    }

    function moveEntryToFolder(entryUid, targetFolderUid) {
        const entry = world_info.entries[entryUid];
        const targetFolder = world_info.entries[targetFolderUid];
        if (!entry || !targetFolder || !targetFolder.isFolder) return;

        Object.values(world_info.entries).forEach(folder => {
            if (folder.isFolder && folder.children.includes(entryUid)) {
                folder.children = folder.children.filter(childUid => childUid !== entryUid);
            }
        });

        targetFolder.children.push(entryUid);
        const worldName = world_names[Number($('#world_editor_select').val())];
        saveWorldInfo(worldName, world_info, true).then(() => {
            updateEditor(targetFolderUid);
        });
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
            if (typeof createWorldInfoEntry !== 'undefined' && typeof saveWorldInfo !== 'undefined' && typeof updateEditor !== 'undefined' && typeof world_names !== 'undefined') {
                clearInterval(interval);
                addFolderUI();
                const observer = new MutationObserver(() => {
                    renderFolders();
                });
                const targetNode = document.getElementById('world_popup_entries_list');
                if (targetNode) {
                    observer.observe(targetNode, { childList: true });
                }
                renderFolders();
            }
        }, 250);
    }

    $(document).ready(waitForUi);
})();
