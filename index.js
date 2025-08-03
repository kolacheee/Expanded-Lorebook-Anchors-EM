(() => {
    'use strict';

    const extensionName = 'World Info Folders';
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    let folders = [];
    let folderCounter = 0;

    // Extension initialization
    function init() {
        console.log(`[${extensionName}] Initializing extension...`);
        
        // Wait for the World Info UI to be available
        const checkWorldInfoUI = setInterval(() => {
            const worldInfoContainer = document.querySelector('#world_info');
            if (worldInfoContainer) {
                clearInterval(checkWorldInfoUI);
                setupFolderSystem();
            }
        }, 500);
    }

    function setupFolderSystem() {
        console.log(`[${extensionName}] Setting up folder system...`);
        
        // Add folder creation button
        addFolderButton();
        
        // Setup drag and drop
        setupDragAndDrop();
        
        // Load existing folders from localStorage
        loadFolders();
    }

    function addFolderButton() {
        // Find the "New Entry" button in World Info
        const newEntryButton = document.querySelector('#world_info_new_entry_button');
        if (!newEntryButton) {
            console.log(`[${extensionName}] New Entry button not found, retrying...`);
            setTimeout(addFolderButton, 1000);
            return;
        }

        // Create folder button
        const folderButton = document.createElement('div');
        folderButton.id = 'world_info_new_folder_button';
        folderButton.className = 'menu_button folder-button';
        folderButton.title = 'Create New Folder';
        
        // Add folder icon
        const folderIcon = document.createElement('img');
        folderIcon.src = `${extensionFolderPath}/img/folder.svg`;
        folderIcon.alt = 'Folder';
        folderIcon.className = 'folder-icon';
        
        folderButton.appendChild(folderIcon);
        
        // Add text label
        const buttonText = document.createElement('span');
        buttonText.textContent = 'New Folder';
        folderButton.appendChild(buttonText);
        
        // Insert button next to New Entry button
        newEntryButton.parentNode.insertBefore(folderButton, newEntryButton.nextSibling);
        
        // Add click event
        folderButton.addEventListener('click', createNewFolder);
        
        console.log(`[${extensionName}] Folder button added successfully`);
    }

    function createNewFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName || folderName.trim() === '') {
            return;
        }

        const folder = {
            id: `folder_${++folderCounter}`,
            name: folderName.trim(),
            collapsed: false,
            entries: [],
            order: folders.length
        };

        folders.push(folder);
        renderFolder(folder);
        saveFolders();
        
        console.log(`[${extensionName}] Created folder: ${folder.name}`);
    }

    function renderFolder(folder) {
        const worldInfoList = document.querySelector('#world_info_entries_list');
        if (!worldInfoList) return;

        const folderElement = document.createElement('div');
        folderElement.className = 'world-info-folder';
        folderElement.dataset.folderId = folder.id;
        folderElement.draggable = true;

        folderElement.innerHTML = `
            <div class="folder-header">
                <div class="folder-toggle ${folder.collapsed ? 'collapsed' : ''}">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4 3L8 6L4 9V3Z" fill="currentColor"/>
                    </svg>
                </div>
                <img src="${extensionFolderPath}/img/folder.svg" class="folder-icon-small" alt="Folder">
                <span class="folder-name" contenteditable="true">${folder.name}</span>
                <div class="folder-actions">
                    <button class="folder-delete" title="Delete Folder">×</button>
                </div>
            </div>
            <div class="folder-content ${folder.collapsed ? 'collapsed' : ''}" data-folder-id="${folder.id}">
                <div class="folder-drop-zone">Drop entries here</div>
            </div>
        `;

        // Add event listeners
        const toggle = folderElement.querySelector('.folder-toggle');
        const content = folderElement.querySelector('.folder-content');
        const nameElement = folderElement.querySelector('.folder-name');
        const deleteButton = folderElement.querySelector('.folder-delete');

        toggle.addEventListener('click', () => toggleFolder(folder.id));
        
        nameElement.addEventListener('blur', () => {
            folder.name = nameElement.textContent.trim() || 'Unnamed Folder';
            saveFolders();
        });
        
        nameElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameElement.blur();
            }
        });

        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteFolder(folder.id);
        });

        // Insert at the beginning of the list
        worldInfoList.insertBefore(folderElement, worldInfoList.firstChild);
        
        setupFolderDropZone(folderElement, folder.id);
    }

    function toggleFolder(folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;

        folder.collapsed = !folder.collapsed;
        
        const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`).closest('.world-info-folder');
        const toggle = folderElement.querySelector('.folder-toggle');
        const content = folderElement.querySelector('.folder-content');
        
        toggle.classList.toggle('collapsed', folder.collapsed);
        content.classList.toggle('collapsed', folder.collapsed);
        
        saveFolders();
    }

    function deleteFolder(folderId) {
        if (!confirm('Are you sure you want to delete this folder? Entries will be moved back to the main list.')) {
            return;
        }

        const folderIndex = folders.findIndex(f => f.id === folderId);
        if (folderIndex === -1) return;

        // Move entries back to main list
        const folder = folders[folderIndex];
        const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`).closest('.world-info-folder');
        const entries = folderElement.querySelectorAll('.world_entry');
        const worldInfoList = document.querySelector('#world_info_entries_list');
        
        entries.forEach(entry => {
            worldInfoList.appendChild(entry);
        });

        // Remove folder
        folders.splice(folderIndex, 1);
        folderElement.remove();
        saveFolders();
        
        console.log(`[${extensionName}] Deleted folder: ${folder.name}`);
    }

    function setupFolderDropZone(folderElement, folderId) {
        const dropZone = folderElement.querySelector('.folder-content');
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
        
        dropZone.addEventListener('dragleave', (e) => {
            if (!dropZone.contains(e.relatedTarget)) {
                dropZone.classList.remove('drag-over');
            }
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const draggedElement = document.querySelector('.dragging');
            if (draggedElement && draggedElement.classList.contains('world_entry')) {
                // Move entry to folder
                const entryId = draggedElement.dataset.id;
                moveEntryToFolder(entryId, folderId);
                dropZone.appendChild(draggedElement);
                
                // Hide drop zone if folder has entries
                const dropZoneText = dropZone.querySelector('.folder-drop-zone');
                if (dropZone.children.length > 1) {
                    dropZoneText.style.display = 'none';
                } else {
                    dropZoneText.style.display = 'block';
                }
            }
        });
    }

    function setupDragAndDrop() {
        // Setup drag for world info entries
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Setup drag for new entries
                        const entries = node.querySelectorAll ? node.querySelectorAll('.world_entry') : 
                                       (node.classList && node.classList.contains('world_entry') ? [node] : []);
                        
                        entries.forEach(setupEntryDrag);
                        
                        // Setup drag for new folders
                        const folders = node.querySelectorAll ? node.querySelectorAll('.world-info-folder') :
                                       (node.classList && node.classList.contains('world-info-folder') ? [node] : []);
                        
                        folders.forEach(setupFolderDrag);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Setup existing entries
        document.querySelectorAll('.world_entry').forEach(setupEntryDrag);
        document.querySelectorAll('.world-info-folder').forEach(setupFolderDrag);
    }

    function setupEntryDrag(entry) {
        if (entry.draggable) return; // Already setup
        
        entry.draggable = true;
        
        entry.addEventListener('dragstart', (e) => {
            entry.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        entry.addEventListener('dragend', () => {
            entry.classList.remove('dragging');
        });
    }

    function setupFolderDrag(folder) {
        folder.addEventListener('dragstart', (e) => {
            folder.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        folder.addEventListener('dragend', () => {
            folder.classList.remove('dragging');
        });
    }

    function moveEntryToFolder(entryId, folderId) {
        const folder = folders.find(f => f.id === folderId);
        if (!folder) return;

        // Remove from other folders
        folders.forEach(f => {
            const index = f.entries.indexOf(entryId);
            if (index > -1) {
                f.entries.splice(index, 1);
            }
        });

        // Add to target folder
        if (!folder.entries.includes(entryId)) {
            folder.entries.push(entryId);
        }

        saveFolders();
    }

    function saveFolders() {
        localStorage.setItem('worldInfoFolders', JSON.stringify(folders));
    }

    function loadFolders() {
        try {
            const saved = localStorage.getItem('worldInfoFolders');
            if (saved) {
                folders = JSON.parse(saved);
                folderCounter = Math.max(...folders.map(f => parseInt(f.id.split('_')[1])), 0);
                
                // Render loaded folders
                folders.forEach(renderFolder);
                
                console.log(`[${extensionName}] Loaded ${folders.length} folders`);
            }
        } catch (error) {
            console.error(`[${extensionName}] Error loading folders:`, error);
            folders = [];
        }
    }

    // Register extension
    if (typeof window.extensionAPI !== 'undefined') {
        window.extensionAPI.registerExtension(extensionName, init);
    } else {
        // Fallback initialization
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
        } else {
            init();
        }
    }

    console.log(`[${extensionName}] Extension loaded`);
})();