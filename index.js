import { eventSource, event_types } from '../../../script.js';

let folderStates = {}; // Track which folders are collapsed/expanded

// Hook into lorebook UI rendering
jQuery(document).ready(function() {
    eventSource.on(event_types.WORLDINFO_LOADED, initializeFolders);

    // Monitor for lorebook UI changes
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.classList && mutation.target.classList.contains('worldInfoEntries')) {
                transformLorebook();
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
});

function initializeFolders() {
    // Add "Create Folder" button to lorebook UI
    const buttonsContainer = document.querySelector('#world_info .world_buttons');
    if (buttonsContainer && !document.querySelector('#create-folder-btn')) {
        const createFolderBtn = document.createElement('div');
        createFolderBtn.id = 'create-folder-btn';
        createFolderBtn.className = 'menu_button';
        createFolderBtn.innerHTML = '<i class="fa-solid fa-folder-plus"></i> Create Folder';
        createFolderBtn.onclick = createFolder;
        buttonsContainer.appendChild(createFolderBtn);
    }

    transformLorebook();
}

function createFolder() {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    // Create a new entry that acts as a folder
    const newEntry = {
        comment: `FOLDER:${folderName}`,
        content: '',
        disable: true,
        group: '',
        // ... other default properties
    };

    // Add to worldinfo (this hooks into ST's existing system)
    window.world_info_data.entries.push(newEntry);
    saveWorldInfo();
    transformLorebook();
}

function transformLorebook() {
    const entriesContainer = document.querySelector('.worldInfoEntries');
    if (!entriesContainer) return;

    const entries = Array.from(entriesContainer.children);
    const folderStructure = buildFolderHierarchy(entries);

    // Rebuild the UI with folder structure
    entriesContainer.innerHTML = '';
    renderFolderStructure(entriesContainer, folderStructure);
}

function buildFolderHierarchy(entries) {
    const folders = {};
    const rootItems = [];

    entries.forEach(entry => {
        const entryData = getEntryData(entry);

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
            if (!folderStates[item.data.uid] || folderStates[item.data.uid] === 'expanded') {
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
    const folderElement = folderData.element.cloneNode(true);
    folderElement.classList.add('lorebook-folder');

    const folderName = folderData.data.comment.replace('FOLDER:', '');
    const isExpanded = !folderStates[folderData.data.uid] || folderStates[folderData.data.uid] === 'expanded';

    // Replace content with folder UI
    folderElement.innerHTML = `
        <div class="folder-header" onclick="toggleFolder(${folderData.data.uid})">
            <i class="fa-solid ${isExpanded ? 'fa-folder-open' : 'fa-folder'}"></i>
            <span class="folder-toggle">${isExpanded ? '▼' : '▶'}</span>
            <span class="folder-name">${folderName}</span>
            <span class="folder-count">(${folderData.children.length})</span>
        </div>
    `;

    return folderElement;
}

function toggleFolder(folderId) {
    folderStates[folderId] = folderStates[folderId] === 'collapsed' ? 'expanded' : 'collapsed';
    transformLorebook();
}
