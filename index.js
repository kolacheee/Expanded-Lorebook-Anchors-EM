import { getContext, onUiLoaded } from "../../../extensions.js";

function initializeExtension() {
    const context = getContext();

    const observer = new MutationObserver((mutationsList, observer) => {
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                const lorebookPositionDropdown = document.querySelector('#lorebook_position');
                if (lorebookPositionDropdown) {
                    const optionAfterEM = lorebookPositionDropdown.querySelector('option[value="after_examples"]');
                    if (optionAfterEM && optionAfterEM.textContent !== 'Example Messages (after)') {
                        optionAfterEM.textContent = 'Example Messages (after)';
                        const optionBeforeEM = document.createElement('option');
                        optionBeforeEM.value = 'before_examples';
                        optionBeforeEM.textContent = 'Example Messages (before)';
                        lorebookPositionDropdown.insertBefore(optionBeforeEM, optionAfterEM);
                        observer.disconnect();
                    }
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    if (context.buildFinalPrompt) {
        const originalBuildFinalPrompt = context.buildFinalPrompt;
        context.buildFinalPrompt = async function(...args) {
            let result = await originalBuildFinalPrompt.apply(this, args);
            const lorebookBeforeEntries = [];
            for (const entry of context.lorebook.entries) {
                if (entry.enabled && entry.position === 'before_examples') {
                    lorebookBeforeEntries.push(entry.content);
                }
            }

            if (lorebookBeforeEntries.length > 0) {
                const entriesText = lorebookBeforeEntries.join('\n');
                const exampleMessagesMarker = '{{example_messages}}';
                if (result.includes(exampleMessagesMarker)) {
                    result = result.replace(exampleMessagesMarker, `${entriesText}\n${exampleMessagesMarker}`);
                } else {
                    console.warn("Expanded Lorebook Anchors: Could not find example_messages marker to inject 'before' entries.");
                }
            }

            return result;
        };
    } else {
        console.error("Expanded Lorebook Anchors: Could not find context.buildFinalPrompt. The extension may be incompatible with this version of SillyTavern.");
    }
}

onUiLoaded(initializeExtension);
