import { event_types, eventSource } from '../../events.js';
import { saveSettingsDebounced } from '../../script.js';
import { extension_settings } from '../../extensions.js';

const MODULE_NAME = 'world-info-folders';

// Default settings
const defaultSettings = {
    folders: {},
    entryFolders: {},
    folderStates: {}
};

let settings = defaultSettings;

// Folder data structure
class WorldInfoFolder {
    constructor(id, name, collapsed = false) {
        this.id = id;
        this.name = name;
        this.collapsed = collapsed;
        this.entries = [];
    }
}

// Initialize extension
function init() {
    // Load settings
    settings = extension_settings[MODULE_NAME] || defaultSettings;
    extension_settings[MODULE_NAME] = settings;

    // Wait for World Info UI to be ready
    eventSource.on(event_types.WORLDINFO_ENTRIES_LOADED, onWorldInfoLoaded);

    // Add folder button to World Info UI
    addFolderButton();

    console.log('[World Info Folders] Extension initialized');
}

function onWorldInfoLoaded() {
    // Re-render folders when World Info is reloaded
    renderFolders();
}

function addFolderButton() {
    // Add the folder button between "New Entry" and "Fill empty Memo/Titles" buttons
    const targetContainer = document.querySelector('#world_popup_new_entry')?.parentElement;
    if (!targetContainer) {
        // Try again after a delay if the UI isn't ready yet
        setTimeout(addFolderButton, 100);
        return;
    }

    // Check if button already exists
    if (document.querySelector('#world_create_folder_button')) {
        return;
    }

    // Create the folder button
    const folderButton = document.createElement('div');
    folderButton.id = 'world_create_folder_button';
    folderButton.className = 'menu_button fa-solid fa-folder-plus';
    folderButton.title = 'Create New Folder';
    folderButton.setAttribute('data-i18n', '[title]Create New Folder');

    // Add click handler
    folderButton.addEventListener('click', showCreateFolderDialog);

    // Insert after the new entry button
    const newEntryButton = document.querySelector('#world_popup_new_entry');
    if (newEntryButton && newEntryButton.parentElement) {
        newEntryButton.parentElement.insertBefore(folderButton, newEntryButton.nextSibling);
    }
}

function showCreateFolderDialog() {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
        createFolder(folderName.trim());
    }
}

function createFolder(name) {
    const currentWorld = getCurrentWorldName();
    if (!currentWorld) {
        toastr.error('No world selected');
        return;
    }

    // Initialize world folders if not exists
    if (!settings.folders[currentWorld]) {
        settings.folders[currentWorld] = {};
    }

    // Generate unique folder ID
    const folderId = generateFolderId();

    // Create folder
    const folder = new WorldInfoFolder(folderId, name, false);
    settings.folders[currentWorld][folderId] = folder;

    // Save settings
    saveSettings();

    // Re-render folders
    renderFolders();

    toastr.success(`Folder "${name}" created`);
}

function generateFolderId() {
    return 'folder_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function getCurrentWorldName() {
    const worldSelect = document.querySelector('#world_editor_select');
    if (!worldSelect || worldSelect.selectedIndex <= 0) {
        return null;
    }
    return worldSelect.options[worldSelect.selectedIndex].text;
}

function renderFolders() {
    const currentWorld = getCurrentWorldName();
    if (!currentWorld || !settings.folders[currentWorld]) {
        return;
    }

    const entriesContainer = document.querySelector('#world_popup_entries_list');
    if (!entriesContainer) {
        return;
    }

    // Get all existing entry elements
    const existingEntries = Array.from(entriesContainer.querySelectorAll('.world_entry'));

    // Create folder containers
    const folders = settings.folders[currentWorld];
    Object.values(folders).forEach(folder => {
        createFolderElement(folder, entriesContainer);
    });

    // Move entries to their assigned folders
    existingEntries.forEach(entry => {
        const entryId = getEntryId(entry);
        const folderId = getFolderForEntry(currentWorld, entryId);

        if (folderId && folders[folderId]) {
            const folderElement = document.querySelector(`[data-folder-id="${folderId}"] .folder-entries`);
            if (folderElement) {
                folderElement.appendChild(entry);
            }
        }
    });

    // Setup drag and drop
    setupDragAndDrop();
}

function createFolderElement(folder, container) {
    // Check if folder element already exists
    let folderElement = document.querySelector(`[data-folder-id="${folder.id}"]`);

    if (!folderElement) {
        folderElement = document.createElement('div');
        folderElement.className = 'wi-folder';
        folderElement.setAttribute('data-folder-id', folder.id);
        folderElement.draggable = true;

        // Folder header
        const folderHeader = document.createElement('div');
        folderHeader.className = 'wi-folder-header';

        // Collapse/expand icon
        const collapseIcon = document.createElement('i');
        collapseIcon.className = folder.collapsed ? 'fa-solid fa-chevron-right' : 'fa-solid fa-chevron-down';
        collapseIcon.addEventListener('click', () => toggleFolder(folder.id));

        // Folder name
        const folderName = document.createElement('span');
        folderName.className = 'wi-folder-name';
        folderName.textContent = folder.name;
        folderName.addEventListener('dblclick', () => renameFolderDialog(folder.id));

        // Delete button
        const deleteButton = document.createElement('i');
        deleteButton.className = 'fa-solid fa-trash-can wi-folder-delete';
        deleteButton.title = 'Delete Folder';
        deleteButton.addEventListener('click', () => deleteFolderDialog(folder.id));

        folderHeader.appendChild(collapseIcon);
        folderHeader.appendChild(folderName);
        folderHeader.appendChild(deleteButton);

        // Folder entries container
        const folderEntries = document.createElement('div');
        folderEntries.className = 'folder-entries';
        if (folder.collapsed) {
            folderEntries.style.display = 'none';
        }

        folderElement.appendChild(folderHeader);
        folderElement.appendChild(folderEntries);

        container.appendChild(folderElement);
    }

    return folderElement;
}

function toggleFolder(folderId) {
    const currentWorld = getCurrentWorldName();
    if (!currentWorld || !settings.folders[currentWorld] || !settings.folders[currentWorld][folderId]) {
        return;
    }

    const folder = settings.folders[currentWorld][folderId];
    folder.collapsed = !folder.collapsed;

    const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (folderElement) {
        const collapseIcon = folderElement.querySelector('.wi-folder-header i');
        const entriesContainer = folderElement.querySelector('.folder-entries');

        if (folder.collapsed) {
            collapseIcon.className = 'fa-solid fa-chevron-right';
            entriesContainer.style.display = 'none';
        } else {
            collapseIcon.className = 'fa-solid fa-chevron-down';
            entriesContainer.style.display = 'block';
        }
    }

    saveSettings();
}

function renameFolderDialog(folderId) {
    const currentWorld = getCurrentWorldName();
    if (!currentWorld || !settings.folders[currentWorld] || !settings.folders[currentWorld][folderId]) {
        return;
    }

    const folder = settings.folders[currentWorld][folderId];
    const newName = prompt('Enter new folder name:', folder.name);

    if (newName && newName.trim() && newName.trim() !== folder.name) {
        folder.name = newName.trim();

        const folderNameElement = document.querySelector(`[data-folder-id="${folderId}"] .wi-folder-name`);
        if (folderNameElement) {
            folderNameElement.textContent = folder.name;
        }

        saveSettings();
        toastr.success(`Folder renamed to "${folder.name}"`);
    }
}

function deleteFolderDialog(folderId) {
    const currentWorld = getCurrentWorldName();
    if (!currentWorld || !settings.folders[currentWorld] || !settings.folders[currentWorld][folderId]) {
        return;
    }

    const folder = settings.folders[currentWorld][folderId];

    if (confirm(`Delete folder "${folder.name}"? Entries will be moved back to the main list.`)) {
        deleteFolder(folderId);
    }
}

function deleteFolder(folderId) {
    const currentWorld = getCurrentWorldName();
    if (!currentWorld) return;

    // Move entries back to main container
    const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (folderElement) {
        const entriesContainer = document.querySelector('#world_popup_entries_list');
        const folderEntries = folderElement.querySelectorAll('.world_entry');

        folderEntries.forEach(entry => {
            entriesContainer.appendChild(entry);
        });

        folderElement.remove();
    }

    // Remove folder from settings
    if (settings.folders[currentWorld]) {
        delete settings.folders[currentWorld][folderId];
    }

    // Remove entry-folder associations
    if (settings.entryFolders[currentWorld]) {
        Object.keys(settings.entryFolders[currentWorld]).forEach(entryId => {
            if (settings.entryFolders[currentWorld][entryId] === folderId) {
                delete settings.entryFolders[currentWorld][entryId];
            }
        });
    }

    saveSettings();
    toastr.success('Folder deleted');
}

function setupDragAndDrop() {
    const entriesContainer = document.querySelector('#world_popup_entries_list');
    if (!entriesContainer) return;

    // Handle entry drag start
    entriesContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('world_entry') || e.target.closest('.world_entry')) {
            const entry = e.target.closest('.world_entry');
            e.dataTransfer.setData('text/plain', getEntryId(entry));
            e.dataTransfer.effectAllowed = 'move';
        } else if (e.target.classList.contains('wi-folder') || e.target.closest('.wi-folder')) {
            const folder = e.target.closest('.wi-folder');
            e.dataTransfer.setData('application/folder', folder.getAttribute('data-folder-id'));
            e.dataTransfer.effectAllowed = 'move';
        }
    });

    // Handle folder drop zones
    entriesContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    entriesContainer.addEventListener('drop', (e) => {
        e.preventDefault();

        const entryId = e.dataTransfer.getData('text/plain');
        const folderId = e.dataTransfer.getData('application/folder');

        if (entryId) {
            handleEntryDrop(e, entryId);
        } else if (folderId) {
            handleFolderDrop(e, folderId);
        }
    });
}

function handleEntryDrop(e, entryId) {
    const dropTarget = e.target.closest('.wi-folder, .folder-entries, #world_popup_entries_list');
    if (!dropTarget) return;

    const currentWorld = getCurrentWorldName();
    if (!currentWorld) return;

    let targetFolderId = null;

    if (dropTarget.classList.contains('wi-folder') || dropTarget.closest('.wi-folder')) {
        const folderElement = dropTarget.closest('.wi-folder');
        targetFolderId = folderElement.getAttribute('data-folder-id');
    }

    // Update entry-folder association
    if (!settings.entryFolders[currentWorld]) {
        settings.entryFolders[currentWorld] = {};
    }

    if (targetFolderId) {
        settings.entryFolders[currentWorld][entryId] = targetFolderId;
    } else {
        delete settings.entryFolders[currentWorld][entryId];
    }

    saveSettings();
    renderFolders();
}

function handleFolderDrop(e, folderId) {
    const dropTarget = e.target.closest('#world_popup_entries_list');
    if (!dropTarget) return;

    // Simple reordering - just move folder element
    const folderElement = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (folderElement) {
        const rect = dropTarget.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;

        // Find insertion point
        const allFolders = Array.from(dropTarget.querySelectorAll('.wi-folder'));
        let insertBefore = null;

        for (let folder of allFolders) {
            if (folder === folderElement) continue;
            const folderRect = folder.getBoundingClientRect();
            const folderY = folderRect.top - rect.top;
            if (mouseY < folderY + folderRect.height / 2) {
                insertBefore = folder;
                break;
            }
        }

        if (insertBefore) {
            dropTarget.insertBefore(folderElement, insertBefore);
        } else {
            dropTarget.appendChild(folderElement);
        }
    }
}

function getEntryId(entryElement) {
    // Try to get UID from various possible attributes or data
    return entryElement.getAttribute('data-uid') ||
           entryElement.querySelector('[data-uid]')?.getAttribute('data-uid') ||
           entryElement.id ||
           entryElement.querySelector('[name="uid"]')?.value ||
           Math.random().toString(36).substr(2, 9);
}

function getFolderForEntry(worldName, entryId) {
    return settings.entryFolders[worldName]?.[entryId] || null;
}

function saveSettings() {
    extension_settings[MODULE_NAME] = settings;
    saveSettingsDebounced();
}

// Export for potential use by other extensions
window.WorldInfoFolders = {
    createFolder,
    deleteFolder,
    toggleFolder,
    renderFolders
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
