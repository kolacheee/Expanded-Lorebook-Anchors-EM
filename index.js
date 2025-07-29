/*
    Dual Example Messages Extension
    by pancakecat & Alyssa
*/
(function () {
    const extensionName = "dual-example-messages";
    const separator = "<||>"; // A unique separator not likely to be in actual examples

    // This function will run when the extension is loaded
    function onExtensionLoaded() {
        // Find the container for the original example messages
        const originalExampleContainer = document.getElementById('chareditor-example-dialogue-block');
        if (!originalExampleContainer) {
            console.warn(`${extensionName}: Could not find original example dialogue container.`);
            return;
        }

        const originalTextarea = document.getElementById('chareditor-example-dialogue');
        const originalLabel = document.querySelector('label[for="chareditor-example-dialogue"]');

        if (!originalTextarea || !originalLabel) {
            console.warn(`${extensionName}: Could not find original example dialogue textarea or label.`);
            return;
        }

        // 1. CREATE THE 'BEFORE' TEXTAREA AND LABEL
        const beforeContainer = document.createElement('div');
        beforeContainer.id = 'dual-example-before-container';
        beforeContainer.classList.add('chareditor_input_block');

        const beforeLabel = document.createElement('label');
        beforeLabel.htmlFor = 'chareditor-example-dialogue-before';
        beforeLabel.textContent = 'Example Messages (before)';
        beforeLabel.title = "Example messages to be placed BEFORE the main prompt. Corresponds to the ↑EM Lorebook position.";

        const beforeTextarea = document.createElement('textarea');
        beforeTextarea.id = 'chareditor-example-dialogue-before';
        beforeTextarea.classList.add('text_pole');
        beforeTextarea.rows = 8;
        beforeTextarea.placeholder = 'Example dialogue placed with ↑EM in the Lorebook.';

        beforeContainer.appendChild(beforeLabel);
        beforeContainer.appendChild(beforeTextarea);

        // 2. MODIFY THE ORIGINAL 'AFTER' TEXTAREA AND LABEL
        originalLabel.textContent = 'Example Messages (after)';
        originalLabel.title = "Example messages to be placed AFTER the main prompt. Corresponds to the ↓EM Lorebook position.";
        originalTextarea.placeholder = "Example dialogue placed with ↓EM in the Lorebook.";

        // 3. INSERT THE NEW 'BEFORE' CONTAINER INTO THE DOM
        originalExampleContainer.parentNode.insertBefore(beforeContainer, originalExampleContainer);

        console.log(`${extensionName}: UI modifications complete.`);
    }

    // This function runs when a character is loaded into the editor
    function onCharacterLoad(character) {
        const fullExampleText = character.data_mes_example || '';
        const beforeTextarea = document.getElementById('chareditor-example-dialogue-before');
        const afterTextarea = document.getElementById('chareditor-example-dialogue');

        if (!beforeTextarea || !afterTextarea) return;

        if (fullExampleText.includes(separator)) {
            // If our separator exists, split the content into the two textareas
            const parts = fullExampleText.split(separator);
            beforeTextarea.value = parts[0] || '';
            afterTextarea.value = parts[1] || '';
        } else {
            // For backwards compatibility, put everything in the 'after' box
            beforeTextarea.value = '';
            afterTextarea.value = fullExampleText;
        }
    }

    // This function runs right before a character is saved
    function onBeforeCharacterSave() {
        const beforeTextarea = document.getElementById('chareditor-example-dialogue-before');
        const afterTextarea = document.getElementById('chareditor-example-dialogue');

        if (!beforeTextarea || !afterTextarea || !window.character) return;

        const beforeValue = beforeTextarea.value.trim();
        const afterValue = afterTextarea.value.trim();

        // Combine the two fields with our separator and save to the character object
        // This makes the change "stick" to the character's data
        window.character.data_mes_example = `${beforeValue}${separator}${afterValue}`;
    }

    // Register the functions with SillyTavern's event system
    $(document).ready(function() {
        onExtensionLoaded();

        // Listen for the event that fires when a character is loaded in the editor
        jQuery(document).on('charactercharacterload', function () {
            if (window.character) {
                onCharacterLoad(window.character);
            }
        });

        // Add a listener to save our data before the character is saved
        document.getElementById('chareditor-form').addEventListener('submit', onBeforeCharacterSave);
    });
})();
