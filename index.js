(() => {
    'use strict';

    let folderStates = {}; // Track which folders are collapsed/expanded

    // Wait for SillyTavern to be ready
    function waitForST() {
        if (typeof window.eventSource !== 'undefined' && window.world_info_data) {
            initializeExtension();
        } else {
            setTimeout(waitForST, 100);
        }
    }

    function initializeExtension() {
        // Hook into worldinfo events
        $(document).on('click', '#world_info_button', function() {
            setTimeout(initializeFolders, 100);
        });

        // Monitor for lorebook UI changes
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes) {
                    mutation.addedNodes.forEach(node => {
                        if (node.classList && node.classList.contains('worldInfoEntries')) {
                            setTimeout(transformLorebook, 50);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function initializeFolders() {
        // Look for the New Entry button to place our folder button after it
        const newEntryBtn = document.querySelector('#world_info_button_add');
        if (newEntryBtn && !document.querySelector('#create-folder-btn')) {
            const createFolderBtn = document.createElement('div');
            createFolderBtn.id = 'create-folder-btn';
            createFolderBtn.className = 'menu_button';
            createFolderBtn.innerHTML = '<i class="fa-solid fa-folder-plus"></i> Create Folder';
            createFolderBtn.addEventListener('click', createFolder);
    
            // Insert after the New Entry button
            newEntryBtn.parentNode.insertBefore(createFolderBtn, newEntryBtn.nextSibling);
        }

        setTimeout(transformLorebook, 100);
    }

    function createFolder() {
        const folderName = prompt('Enter folder name:');
        if (!folderName) return;

        // Find the highest UID to create a new one
        const maxUid = Math.max(...Object.keys(window.world_info_data?.entries || {}).map(Number), -1);
        const newUid = maxUid + 1;

        // Create a new entry that acts as a folder
        window.world_info_data.entries[newUid] = {
            uid: newUid,
            key: [],
            keysecondary: [],
            comment: `FOLDER:${folderName}`,
            content: '',
            constant: false,
            vectorized: false,
            selective: true,
            selectiveLogic: 0,
            addMemo: true,
            order: 100,
            position: 0,
            disable: true,
            excludeRecursion: false,
            preventRecursion: false,
            delayUntilRecursion: false,
            probability: 100,
            useProbability: true,
            depth: 4,
            group: '',
            groupOverride: false,
            groupWeight: 100,
            scanDepth: null,
            caseSensitive: null,
            matchWholeWords: null,
            useGroupScoring: null,
            automationId: '',
            role: null,
            sticky: 0,
            cooldown: 0,
            delay: 0,
            displayIndex: newUid
        };

        // Save and refresh
        saveWorldInfo();
        setTimeout(() => {
            updateWorldInfoList();
            transformLorebook();
        }, 100);
    }

    function transformLorebook() {
        const entriesContainer = document.querySelector('.worldInfoEntries');
        if (!entriesContainer || !window.world_info_data?.entries) return;

        const entries = Array.from(entriesContainer.children);
        const folderStructure = buildFolderHierarchy(entries);

        // Clear and rebuild
        entriesContainer.innerHTML = '';
        renderFolderStructure(entriesContainer, folderStructure);
    }

    function buildFolderHierarchy(entries) {
        const folders = {};
        const rootItems = [];

        entries.forEach(entry => {
            const entryId = entry.getAttribute('data-uid') || entry.querySelector('[data-uid]')?.getAttribute('data-uid');
            if (!entryId) return;

            const entryData = window.world_info_data.entries[entryId];
            if (!entryData) return;

            if (isFolder(entryData)) {
                folders[entryData.uid] = {
                    element: entry,
                    data: entryData,
                    children: []
                };
            } else if (entryData.group && folders[entryData.group]) {
                folders[entryData.group].children.push(entry);
            } else {
                rootItems.push(entry);
            }
        });

        // Add folders to root items
        Object.values(folders).forEach(folder => rootItems.push(folder));

        return rootItems;
    }

    function isFolder(entryData) {
        return entryData.comment && entryData.comment.startsWith('FOLDER:');
    }

    function renderFolderStructure(container, items) {
        items.forEach(item => {
            if (item.element) {
                // It's a folder
                const folderElement = createFolderElement(item);
                container.appendChild(folderElement);

                // Add children if folder is expanded
                const isExpanded = !folderStates[item.data.uid] || folderStates[item.data.uid] === 'expanded';
                if (isExpanded) {
                    const childContainer = document.createElement('div');
                    childContainer.className = 'folder-children';
                    childContainer.style.marginLeft = '20px';

                    item.children.forEach(child => {
                        childContainer.appendChild(child);
                    });

                    container.appendChild(childContainer);
                }
            } else {
                // Regular entry
                container.appendChild(item);
            }
        });
    }

    function createFolderElement(folderData) {
        const folderElement = document.createElement('div');
        folderElement.className = 'world_entry lorebook-folder';
        folderElement.setAttribute('data-uid', folderData.data.uid);

        const folderName = folderData.data.comment.replace('FOLDER:', '');
        const isExpanded = !folderStates[folderData.data.uid] || folderStates[folderData.data.uid] === 'expanded';

        folderElement.innerHTML = `
            <div class="folder-header">
                <i class="fa-solid ${isExpanded ? 'fa-folder-open' : 'fa-folder'}"></i>
                <span class="folder-toggle">${isExpanded ? '▼' : '▶'}</span>
                <span class="folder-name">${folderName}</span>
                <span class="folder-count">(${folderData.children.length})</span>
            </div>
        `;

        folderElement.querySelector('.folder-header').addEventListener('click', () => {
            folderStates[folderData.data.uid] = folderStates[folderData.data.uid] === 'collapsed' ? 'expanded' : 'collapsed';
            transformLorebook();
        });

        return folderElement;
    }

    // Make toggle function global for onclick handlers
    window.toggleFolder = function(folderId) {
        folderStates[folderId] = folderStates[folderId] === 'collapsed' ? 'expanded' : 'collapsed';
        transformLorebook();
    };

    // Start the extension
    waitForST();

})();
