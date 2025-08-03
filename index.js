// World Info Folders - index.js
// Main script for the extension

(function () {
    // Wait for the DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', function () {
        console.log('World Info Folders extension loaded');
        
        function onWorldInfoPanelLoad() {
            const newEntryButton = document.querySelector('#world_info_new_entry_button');
            if (newEntryButton) {
                const newFolderButton = document.createElement('div');
                newFolderButton.id = 'world-info-new-folder-button';
                newFolderButton.classList.add('world_info_button');
                newFolderButton.innerHTML = `<img src="/img/folder.svg" alt="New Folder">`;
                newFolderButton.title = "New Folder";

                newEntryButton.insertAdjacentElement('afterend', newFolderButton);

                newFolderButton.addEventListener('click', () => {
                    const folderName = prompt('Enter folder name:');
                    if (folderName) {
                        createFolder(folderName);
                    }
                });
            }
        }

        function createFolder(name) {
            const worldInfoList = document.querySelector('#world_info_list');
            if (worldInfoList) {
                const folderElement = document.createElement('div');
                folderElement.classList.add('world-info-folder');
                folderElement.innerHTML = `
                    <div class="world-info-folder-header">
                        <span class="folder-arrow">▶</span>
                        <span class="folder-name">${name}</span>
                    </div>
                    <div class="world-info-folder-content" style="display: none;"></div>
                `;

                const header = folderElement.querySelector('.world-info-folder-header');
                header.addEventListener('click', () => {
                    const content = folderElement.querySelector('.world-info-folder-content');
                    const arrow = header.querySelector('.folder-arrow');
                    if (content.style.display === 'none') {
                        content.style.display = 'block';
                        arrow.textContent = '▼';
                    } else {
                        content.style.display = 'none';
                        arrow.textContent = '▶';
                    }
                });

                worldInfoList.prepend(folderElement);

                makeFolderDroppable(folderElement);
            }
        }

        function makeFolderDroppable(folder) {
            folder.addEventListener('dragover', (event) => {
                event.preventDefault();
            });

            folder.addEventListener('drop', (event) => {
                event.preventDefault();
                const entryId = event.dataTransfer.getData('text/plain');
                const entryElement = document.querySelector(`[data-id="${entryId}"]`);
                if (entryElement) {
                    const folderContent = folder.querySelector('.world-info-folder-content');
                    folderContent.appendChild(entryElement);
                }
            });
        }

        function makeEntriesDraggable() {
            const entries = document.querySelectorAll('.world_info_entry');
            entries.forEach(entry => {
                entry.setAttribute('draggable', 'true');
                entry.addEventListener('dragstart', (event) => {
                    event.dataTransfer.setData('text/plain', entry.dataset.id);
                });
            });
        }

        const observer = new MutationObserver((mutationsList, observer) => {
            for (let mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    // First, check if the main panel has loaded
                    const worldInfoPanel = document.querySelector('#world_info_panel');
                    if (worldInfoPanel && !document.querySelector('#world-info-new-folder-button')) {
                        onWorldInfoPanelLoad();
                    }

                    // Then, check for new world info entries being added
                    if (mutation.addedNodes.length > 0) {
                        mutation.addedNodes.forEach(node => {
                            if (node.classList && node.classList.contains('world_info_entry')) {
                                makeEntriesDraggable();
                            }
                        });
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
})();