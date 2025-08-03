(function () {
    // Wait for the DOM to be fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        const worldInfoPanel = document.getElementById('world_info_panel');
        const newEntryButton = document.getElementById('world_info_new');
        const entryList = document.getElementById('world_info_entries_list');

        if (!worldInfoPanel || !newEntryButton || !entryList) {
            console.log('World Info Folders: Could not find required elements.');
            return;
        }

        // Create the "New Folder" button
        const newFolderButton = document.createElement('div');
        newFolderButton.id = 'world_info_new_folder';
        newFolderButton.title = 'New Folder';

        // Insert the new button after the "New Entry" button
        newEntryButton.parentNode.insertBefore(newFolderButton, newEntryButton.nextSibling);

        // Initialize Sortable for the main entry list
        new Sortable(entryList, {
            group: 'worldinfo',
            animation: 150,
            handle: '.world-info-folder-header, .world_info_entry', // Allow dragging folders and entries
            filter: 'input, span[contenteditable="true"]', // Prevent drag on editable elements
        });

        // Function to create a new folder
        const createFolder = () => {
            const folder = document.createElement('div');
            folder.className = 'world-info-folder';

            const header = document.createElement('div');
            header.className = 'world-info-folder-header';

            const folderName = document.createElement('span');
            folderName.textContent = 'New Folder';
            folderName.contentEditable = 'true';

            header.appendChild(folderName);

            const content = document.createElement('div');
            content.className = 'world-info-folder-content';

            folder.appendChild(header);
            folder.appendChild(content);

            // Add to the top of the world info list
            entryList.prepend(folder);

            // Make the folder content area a sortable target
            new Sortable(content, {
                group: 'worldinfo',
                animation: 150,
            });

            // Toggle folder content visibility
            header.addEventListener('click', (event) => {
                if (event.target === header || event.target === folderName) {
                    folder.classList.toggle('open');
                }
            });

            // Prevent header click from triggering when editing name
            folderName.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        };

        // Add click listener to the new folder button
        newFolderButton.addEventListener('click', createFolder);
    });
})();