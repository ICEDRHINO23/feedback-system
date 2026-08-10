/*
 * AHPS Rich Text / Mathematical Notation Fix
 * Superscript, subscript and duplicate option-label cleanup.
 */
(function () {

    function formatText(value) {

        let text = String(value ?? "");

        text = text.replace(/\r\n|\r|\n/g, "<br>");

        text = text.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");
        text = text.replace(/\^([0-9]+|[A-Za-z]+)/g, "<sup>$1</sup>");

        text = text.replace(/_\{([^}]+)\}/g, "<sub>$1</sub>");
        text = text.replace(/_([0-9]+|[A-Za-z]+)/g, "<sub>$1</sub>");

        return text;
    }


    function cleanOptionLabel(value) {

        let text = String(value ?? "");

        // Remove labels stored together with the option text:
        // A. text / A) text / a. text / a) text
        text = text.replace(
            /^\s*[A-Da-d]\s*[.)]\s*/,
            ""
        );

        return text;
    }


    function needsFormatting(text) {

        return (
            /<\/?(?:sup|sub)\b/i.test(text) ||
            /\^\{[^}]+\}/.test(text) ||
            /\^[0-9A-Za-z]+/.test(text) ||
            /_\{[^}]+\}/.test(text) ||
            /_[0-9A-Za-z]+/.test(text) ||
            /\r\n|\r|\n/.test(text)
        );
    }


    function formatElement(element) {

        if (!element || element.nodeType !== 1) {
            return;
        }

        const isOption = element.matches(
            "#options .option-btn, #reviewContainer .option"
        );

        const isAllowed = element.matches(
            "#questionText, #options .option-btn, " +
            "#reviewContainer .question-text, " +
            "#reviewContainer .option, #reviewContainer .explanation"
        );

        if (!isAllowed) {
            return;
        }

        let text = element.textContent || "";
        const cleanedText = isOption
            ? cleanOptionLabel(text)
            : text;

        const changedLabel = isOption && cleanedText !== text;
        const changedFormatting = needsFormatting(cleanedText);

        // Do nothing when the element is already clean.
        if (!changedLabel && !changedFormatting) {
            return;
        }

        element.innerHTML = formatText(cleanedText);
    }


    function scan(root) {

        if (!root) {
            return;
        }

        if (root.nodeType === 1) {
            formatElement(root);
        }

        if (root.querySelectorAll) {

            root.querySelectorAll(
                "#questionText, #options .option-btn, " +
                "#reviewContainer .question-text, #reviewContainer .option, " +
                "#reviewContainer .explanation"
            ).forEach(formatElement);

        }
    }


    function start() {

        scan(document);

        const observer = new MutationObserver(function (mutations) {

            mutations.forEach(function (mutation) {

                mutation.addedNodes.forEach(function (node) {

                    // Dynamically-created elements such as option buttons.
                    if (node.nodeType === 1) {
                        scan(node);
                    }

                    // innerText/textContent updates replace the text node
                    // inside an existing element such as #questionText.
                    if (node.nodeType === 3) {
                        const parent = node.parentElement;
                        if (parent) {
                            formatElement(parent);
                        }
                    }

                });

                // Also handle direct character-data changes.
                if (mutation.type === "characterData") {
                    const parent = mutation.target.parentElement;
                    if (parent) {
                        formatElement(parent);
                    }
                }

            });

        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });

        window.AHPSFormatText = formatText;
    }


    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start);
    } else {
        start();
    }

})();
