(function () {
    // Helper function to create an element with attributes
    function createEl(tag, attributes, ...children) {
        const el = document.createElement(tag);
        for (const key in attributes) {
            el.setAttribute(key, attributes[key]);
        }
        children.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else {
                el.appendChild(child);
            }
        });
        return el;
    }

    // Function to create a new folder element
    function createFolderElement(name = 'New Folder') {
        const folderId = `folder-${Date.now()}`;
        const folder = createEl('div', { class: 'world-info-folder', 'data-folder-id': folderId, draggable: 'true' });
        const header = createEl('div', { class: 'world-info-folder-header' });
        const icon = createEl('img', { class: 'world-info-folder-icon', src: '/img/folder.svg' });
        const nameInput = createEl('input', { type: 'text', class: 'world-info-folder-name', value: name });
        const content = createEl('div', { class: 'world-info-folder-content' });

        header.append(icon, nameInput);
        folder.append(header, content);

        // Toggle collapse
        header.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() !== 'input') {
                folder.classList.toggle('open');
            }
        });

        // Prevent drag from starting on input click
        nameInput.addEventListener('mousedown', (event) => event.stopPropagation());

        // Make content a drop zone for lorebook entries
        Sortable.create(content, {
            group: 'worldinfo',
            animation: 150,
            handle: '.world-info-entry',
        });

        return folder;
    }

    // Function to initialize the extension
    function init() {
        const newEntryButton = document.getElementById('world_info_new_entry');
        if (!newEntryButton) {
            console.warn('World Info Folders: Could not find new entry button.');
            return;
        }

        const newFolderButton = createEl('div', { id: 'world_info_new_folder', title: 'New Folder' });
        const newFolderIcon = createEl('img', { src: '/img/folder.svg' });
        newFolderButton.appendChild(newFolderIcon);

        newEntryButton.parentNode.insertBefore(newFolderButton, newEntryButton.nextSibling);

        const worldInfoContainer = document.getElementById('world_info_entries');

        newFolderButton.addEventListener('click', () => {
            const newFolder = createFolderElement();
            worldInfoContainer.prepend(newFolder);
        });

        // Make the main container sortable for both entries and folders
        Sortable.create(worldInfoContainer, {
            group: 'worldinfo',
            animation: 150,
            handle: '.world-info-entry, .world-info-folder-header',
            draggable: '.world-info-entry, .world-info-folder',
        });
    }

    // Wait for the world info UI to be ready
    document.addEventListener('DOMContentLoaded', () => {
        // A bit of a hacky way to wait for the UI to be built by SillyTavern
        const observer = new MutationObserver((mutations, obs) => {
            if (document.getElementById('world_info_new_entry')) {
                init();
                obs.disconnect(); // Stop observing once we've initialized
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
})();