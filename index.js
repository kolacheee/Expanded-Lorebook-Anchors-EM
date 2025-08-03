(() => {

    'use strict';
    /* global extension_settings, eventSource, event_types, toastr, saveSettingsDebounced */

    function WorldInfoFoldersExtension() {
        // World Info Folders Extension for SillyTavern
        // This extension adds folder organization functionality to World Info entries

        const MODULE_NAME = 'world-info-folders';

    function createFolderEntry(folderName) {
        try {
            // Trigger ST's new entry creation
            const newEntryButton = document.querySelector('#world_popup_new');
            if (!newEntryButton) return;

            newEntryButton.click();

            // Wait for new entry to be created, then convert it to folder
            setTimeout(() => {
                const entriesContainer = document.querySelector('#world_popup_entries_list');
                const entries = Array.from(entriesContainer.querySelectorAll('.world_entry'));
                const newestEntry = entries[entries.length - 1];

                if (newestEntry) {
                    convertEntryToFolder(newestEntry, folderName);
                }
            }, 100);
        } catch (error) {
            console.error('[World Info Folders] Error creating folder entry:', error);
        }
    }

    function convertEntryToFolder(entryElement, folderName) {
        try {
            // Set the key to identify this as a folder
            const keyInput = entryElement.querySelector('input[placeholder="Key"]');
            if (keyInput) {
                keyInput.value = `FOLDER:${folderName}`;
                keyInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Set comment to explain what this is
            const commentInput = entryElement.querySelector('input[placeholder="Comment"]');
            if (commentInput) {
                commentInput.value = `Folder: ${folderName} (Extension)`;
                commentInput.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Set content to store folder metadata
            const contentTextarea = entryElement.querySelector('textarea[placeholder="Content"]');
            if (contentTextarea) {
                const folderData = {
                    type: 'folder',
                    name: folderName,
                    collapsed: false,
                    entries: [] // Store child entry IDs
                };
                contentTextarea.value = JSON.stringify(folderData);
                contentTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Disable the entry so it doesn't affect generation
            const disableCheckbox = entryElement.querySelector('input[type="checkbox"]');
            if (disableCheckbox && !disableCheckbox.checked) {
                disableCheckbox.click();
            }

            // Apply folder styling immediately
            styleFolderEntry(entryElement);

            console.log('[World Info Folders] Entry converted to folder');
        } catch (error) {
            console.error('[World Info Folders] Error converting entry to folder:', error);
        }
    }

    function styleFolderEntry(entryElement) {
        try {
            // Add folder class for CSS targeting
            entryElement.classList.add('wi-folder-entry');

            // Hide/modify entry fields to look like a folder
            const keyInput = entryElement.querySelector('input[placeholder="Key"]');
            const commentInput = entryElement.querySelector('input[placeholder="Comment"]');
            const contentTextarea = entryElement.querySelector('textarea[placeholder="Content"]');

            if (keyInput) {
                keyInput.style.display = 'none'; // Hide the key input
            }

            if (commentInput) {
                commentInput.style.display = 'none'; // Hide comment
            }

            if (contentTextarea) {
                contentTextarea.style.display = 'none'; // Hide content
            }

            // Create folder-like UI elements
            const folderHeader = document.createElement('div');
            folderHeader.className = 'folder-display-header';

            // Extract folder name from key
            const folderName = keyInput ? keyInput.value.replace('FOLDER:', '') : 'Unnamed Folder';

            // Collapse/expand icon
            const collapseIcon = document.createElement('i');
            collapseIcon.className = 'fa-solid fa-chevron-down folder-collapse-icon';
            collapseIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFolderEntry(entryElement);
            });

            // Folder icon
            const folderIcon = document.createElement('i');
            folderIcon.className = 'fa-solid fa-folder folder-icon';

            // Folder name display
            const nameDisplay = document.createElement('span');
            nameDisplay.className = 'folder-name-display';
            nameDisplay.textContent = folderName;

            // Make name editable on double-click
            nameDisplay.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                editFolderName(entryElement, nameDisplay);
            });

            folderHeader.appendChild(collapseIcon);
            folderHeader.appendChild(folderIcon);
            folderHeader.appendChild(nameDisplay);

            // Insert folder header at the top of the entry
            entryElement.insertBefore(folderHeader, entryElement.firstChild);

            // Create drop zone for child entries
            const dropZone = document.createElement('div');
            dropZone.className = 'folder-drop-zone';
            dropZone.textContent = 'Drop entries here';
            entryElement.appendChild(dropZone);

            // Set up drop handling on the entire folder entry
            setupFolderDropHandling(entryElement);

        } catch (error) {
            console.error('[World Info Folders] Error styling folder entry:', error);
        }
    }

    function setupFolderDropHandling(folderElement) {
        // Make folder both draggable (for reordering) and droppable (for nesting)
        folderElement.addEventListener('dragover', (e) => {
            // Only accept drops if this isn't the dragged element itself
            if (e.currentTarget !== draggedEntry) {
                e.preventDefault();
                e.stopPropagation();
                folderElement.classList.add('folder-drag-over');
            }
        });

        folderElement.addEventListener('dragleave', (e) => {
            if (!folderElement.contains(e.relatedTarget)) {
                folderElement.classList.remove('folder-drag-over');
            }
        });

        folderElement.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            folderElement.classList.remove('folder-drag-over');

            if (draggedEntry && draggedEntry !== folderElement) {
                handleDropOnFolder(draggedEntry, folderElement);
            }
        });
    }

    let draggedEntry = null; // Track currently dragged entry

    function handleDropOnFolder(droppedEntry, folderEntry) {
        try {
            // Get folder data
            const folderContentTextarea = folderEntry.querySelector('textarea[placeholder="Content"]');
            if (!folderContentTextarea) return;

            const folderData = JSON.parse(folderContentTextarea.value || '{}');

            // Get dropped entry ID
            const droppedEntryId = getEntryId(droppedEntry);

            // Add to folder's child entries
            if (!folderData.entries) {
                folderData.entries = [];
            }

            if (!folderData.entries.includes(droppedEntryId)) {
                folderData.entries.push(droppedEntryId);
            }

            // Update folder data
            folderContentTextarea.value = JSON.stringify(folderData);
            folderContentTextarea.dispatchEvent(new Event('input', { bubbles: true }));

            // Visually nest the entry under the folder
            folderEntry.parentNode.insertBefore(droppedEntry, folderEntry.nextSibling);

            // Add visual indentation to show nesting
            droppedEntry.style.marginLeft = '20px';
            droppedEntry.classList.add('folder-child-entry');

            console.log('[World Info Folders] Entry nested under folder');
        } catch (error) {
            console.error('[World Info Folders] Error handling drop on folder:', error);
        }
    }
}

});
