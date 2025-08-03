(() => {
    'use strict';

    const extensionName = 'world-info-folders';
    
    // Wait for SillyTavern to be ready
    jQuery(async () => {
        const module = await import('../../../../../scripts/world-info.js');
        
        // Extension initialization
        function initExtension() {
            console.log('World Info Folders: Initializing extension...');
            
            // Wait for world info panel to be available
            const checkWorldInfoPanel = setInterval(() => {
                const worldInfoPanel = document.querySelector('#world_info');
                const newEntryButton = document.querySelector('#world_info_new');
                
                if (worldInfoPanel && newEntryButton) {
                    clearInterval(checkWorldInfoPanel);
                    setupFolderButton();
                    console.log('World Info Folders: Extension loaded successfully');
                }
            }, 100);
        }
        
        function setupFolderButton() {
            const newEntryButton = document.querySelector('#world_info_new');
            if (!newEntryButton) return;
            
            // Check if button already exists
            if (document.querySelector('#world_info_new_folder')) return;
            
            // Create new folder button
            const newFolderButton = document.createElement('div');
            newFolderButton.id = 'world_info_new_folder';
            newFolderButton.className = 'menu_button fa-solid fa-folder-plus';
            newFolderButton.title = 'Create New Folder';
            newFolderButton.style.marginLeft = '5px';
            
            // Insert after new entry button
            newEntryButton.parentNode.insertBefore(newFolderButton, newEntryButton.nextSibling);
            
            // Add click handler
            newFolderButton.addEventListener('click', createNewFolder);
            
            // Initialize drag and drop for existing entries
            initializeDragAndDrop();
        }
        
        function createNewFolder() {
            const entriesList = document.querySelector('#world_info_entries_list');
            if (!entriesList) return;
            
            const folderId = `folder_${Date.now()}`;
            
            // Create folder element
            const folder = document.createElement('div');
            folder.className = 'world-info-folder';
            folder.setAttribute('data-folder-id', folderId);
            
            // Create folder header
            const header = document.createElement('div');
            header.className = 'world-info-folder-header';
            
            // Create folder name span
            const nameSpan = document.createElement('span');
            nameSpan.className = 'world-info-folder-name';
            nameSpan.textContent = 'New Folder';
            nameSpan.contentEditable = true;
            nameSpan.addEventListener('blur', saveFolderName);
            nameSpan.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    nameSpan.blur();
                }
            });
            
            // Create toggle button
            const toggleBtn = document.createElement('span');
            toggleBtn.className = 'world-info-folder-toggle fa-solid fa-chevron-down';
            toggleBtn.addEventListener('click', toggleFolder);
            
            header.appendChild(nameSpan);
            header.appendChild(toggleBtn);
            
            // Create folder content
            const content = document.createElement('div');
            content.className = 'world-info-folder-content';
            
            // Assemble folder
            folder.appendChild(header);
            folder.appendChild(content);
            
            // Add to top of entries list
            entriesList.insertBefore(folder, entriesList.firstChild);
            
            // Make content sortable
            makeSortable(content);
            
            // Focus name for editing
            nameSpan.focus();
            nameSpan.select();
        }
        
        function toggleFolder(event) {
            const folder = event.target.closest('.world-info-folder');
            const content = folder.querySelector('.world-info-folder-content');
            const toggle = folder.querySelector('.world-info-folder-toggle');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                toggle.className = 'world-info-folder-toggle fa-solid fa-chevron-down';
                folder.classList.add('open');
            } else {
                content.style.display = 'none';
                toggle.className = 'world-info-folder-toggle fa-solid fa-chevron-right';
                folder.classList.remove('open');
            }
        }
        
        function saveFolderName(event) {
            const name = event.target.textContent.trim();
            if (!name) {
                event.target.textContent = 'New Folder';
            }
        }
        
        function initializeDragAndDrop() {
            const entriesList = document.querySelector('#world_info_entries_list');
            if (!entriesList || window.worldInfoFoldersSortable) return;
            
            // Make main list sortable
            window.worldInfoFoldersSortable = new Sortable(entriesList, {
                group: 'world-info',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                handle: '.world-info-folder-header, .world_info_entry',
                filter: 'input, [contenteditable]',
                preventOnFilter: false,
                onStart: function(evt) {
                    document.body.classList.add('dragging');
                },
                onEnd: function(evt) {
                    document.body.classList.remove('dragging');
                }
            });
            
            // Make existing folders sortable
            document.querySelectorAll('.world-info-folder-content').forEach(makeSortable);
        }
        
        function makeSortable(element) {
            if (element.sortableInstance) return;
            
            element.sortableInstance = new Sortable(element, {
                group: 'world-info',
                animation: 150,
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                onStart: function(evt) {
                    document.body.classList.add('dragging');
                },
                onEnd: function(evt) {
                    document.body.classList.remove('dragging');
                }
            });
        }
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initExtension);
        } else {
            initExtension();
        }
    });
})();