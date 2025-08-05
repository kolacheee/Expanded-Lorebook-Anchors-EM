/* global jQuery, world_info, reloadWorldInfo */
(function () {
    'use strict';

    jQuery(async () => {
        // Function to create a new folder
        function createFolder() {
            const folderName = prompt("Enter folder name:");
            if (folderName) {
                const newFolder = {
                    name: folderName,
                    entries: [],
                    isFolder: true,
                    collapsed: false,
                    // Add metadata to differentiate from regular entries
                    metadata: {
                        isFolder: true,
                    },
                };
                // Add the folder to the world info
                world_info.entries.push(newFolder);
                // Refresh the UI
                reloadWorldInfo();
            }
        }

        // Function to render the folders
        function renderFolders() {
            const lorebookEntries = document.querySelectorAll('.lorebook-entry');
            lorebookEntries.forEach(entry => {
                if (entry instanceof HTMLElement) {
                    const entryData = world_info.entries.find(e => e.name === entry.dataset.name);
                    if (entryData && entryData.isFolder) {
                        entry.classList.add('is-folder');
                        if (entryData.collapsed) {
                            entry.classList.add('collapsed');
                        }
                    }
                }
            });
        }

        // Function to handle drag and drop
        function handleDragAndDrop() {
            const lorebookEntries = document.querySelectorAll('.lorebook-entry');
            lorebookEntries.forEach(entry => {
                if (entry instanceof HTMLElement) {
                    entry.setAttribute('draggable', 'true');
                    entry.addEventListener('dragstart', (event) => {
                        if (event.target instanceof HTMLElement) {
                            event.dataTransfer.setData('text/plain', event.target.dataset.name);
                        }
                    });
                }
            });

            const folders = document.querySelectorAll('.is-folder');
            folders.forEach(folder => {
                if (folder instanceof HTMLElement) {
                    folder.addEventListener('dragover', (event) => {
                        event.preventDefault();
                    });

                    folder.addEventListener('drop', (event) => {
                        event.preventDefault();
                        if (event.target instanceof HTMLElement) {
                            const entryName = event.dataTransfer.getData('text/plain');
                            const folderElement = event.target.closest('.is-folder');

                            if (folderElement instanceof HTMLElement) {
                                const folderName = folderElement.dataset.name;
                                const entryData = world_info.entries.find(e => e.name === entryName);
                                const folderData = world_info.entries.find(e => e.name === folderName);

                                if (entryData && folderData) {
                                    if (!Array.isArray(folderData.entries)) {
                                        folderData.entries = [];
                                    }
                                    // Add the entry to the folder's entries
                                    folderData.entries.push(entryData);
                                    // Remove the entry from the root of the world info
                                    world_info.entries = world_info.entries.filter(e => e.name !== entryName);
                                    // Refresh the UI
                                    reloadWorldInfo();
                                }
                            }
                        }
                    });
                }
            });
        }

        // Function to handle collapsing folders
        function handleCollapse() {
            document.querySelectorAll('.is-folder .entry-header').forEach(header => {
                header.addEventListener('click', () => {
                    if (header instanceof HTMLElement) {
                        const folderElement = header.closest('.lorebook-entry');
                        if (folderElement instanceof HTMLElement) {
                            const folderName = folderElement.dataset.name;
                            const folderData = world_info.entries.find(e => e.name === folderName);
                            if (folderData) {
                                folderData.collapsed = !folderData.collapsed;
                                folderElement.classList.toggle('collapsed');
                            }
                        }
                    }
                });
            });
        }

        // Function to add the "New Folder" button
        function addNewFolderButton() {
            const worldInfoMenu = document.querySelector('#world_info_menu');
            if (worldInfoMenu) {
                const newFolderButton = document.createElement('div');
                newFolderButton.classList.add('menu_button');
                newFolderButton.innerHTML = '<i class="fa-solid fa-folder-plus"></i> New Folder';
                newFolderButton.addEventListener('click', createFolder);

                // The prompt says to place it between "New Entry" and "Fill empty Memo/Titles with Keywords"
                const referenceNode = worldInfoMenu.querySelector('#new_entry_button');
                if (referenceNode) {
                    referenceNode.insertAdjacentElement('afterend', newFolderButton);
                }
            }
        }

        // Initial setup when the extension is loaded
        function onWorldInfoLoaded() {
            addNewFolderButton();
            renderFolders();
            handleCollapse();
            handleDragAndDrop();
        }

        // Make sure to run the setup after the world info is loaded
        $(document).on('worldInfoLoaded', onWorldInfoLoaded);
        if (typeof world_info !== 'undefined' && world_info) {
            onWorldInfoLoaded();
        }
    });
})();
