(function () {
    const extensionName = "World Info Folders";
    let newFolderButton;

    function initializeExtension() {
        const newEntryButton = document.getElementById('world_info_new');
        const entryList = document.getElementById('world_info_entries_list');

        if (!newEntryButton || !entryList) {
            console.log(`${extensionName}: Could not find required elements.`);
            return;
        }

        // Prevent adding the button multiple times
        if (document.getElementById('world_info_new_folder')) {
            return;
        }

        // Create the "New Folder" button
        newFolderButton = document.createElement('div');
        newFolderButton.id = 'world_info_new_folder';
        newFolderButton.title = 'New Folder';

        // Insert the new button after the "New Entry" button
        newEntryButton.parentNode.insertBefore(newFolderButton, newEntryButton.nextSibling);

        // Initialize Sortable for the main entry list
        new Sortable(entryList, {
            group: 'worldinfo',
            animation: 150,
            handle: '.world-info-folder-header, .world_info_entry',
            filter: 'input, span[contenteditable="true"]',
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
    }

    // Use a MutationObserver to wait for the UI to be ready
    const observer = new MutationObserver((mutations, obs) => {
        const newEntryButton = document.getElementById('world_info_new');
        if (newEntryButton) {
            initializeExtension();
            obs.disconnect(); // Stop observing once the element is found
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();