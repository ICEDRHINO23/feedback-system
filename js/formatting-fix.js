/*
 * AHPS Rich Text / Mathematical Notation Fix
 * Supports HTML superscript/subscript and caret notation.
 */
(function () {

    function formatText(value) {

        let text = String(value ?? "");

        // Normalize line breaks.
        text = text.replace(/\r\n|\r|\n/g, "<br>");

        // Convert explicit HTML formatting stored as text.
        text = text.replace(/<\/?sup\b[^>]*>/gi, function (tag) {
            return tag;
        });

        text = text.replace(/<\/?sub\b[^>]*>/gi, function (tag) {
            return tag;
        });

        // Convert ^{...} and ^2 / ^n notation to superscript.
        text = text.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");
        text = text.replace(/\^([0-9]+|[A-Za-z]+)/g, "<sup>$1</sup>");

        // Convert _{...} and _2 / _n notation to subscript.
        text = text.replace(/_\{([^}]+)\}/g, "<sub>$1</sub>");
        text = text.replace(/_([0-9]+|[A-Za-z]+)/g, "<sub>$1</sub>");

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

        const allowed =
            element.matches(
                "#questionText, #options .option-btn, " +
                "#reviewContainer .question-text, " +
                "#reviewContainer .option, " +
                "#reviewContainer .explanation"
            );

        if (!allowed) {
            return;
        }

        const text = element.textContent || "";

        if (!needsFormatting(text)) {
            return;
        }

        element.innerHTML = formatText(text);
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
                "#reviewContainer .question-text, " +
                "#reviewContainer .option, " +
                "#reviewContainer .explanation"
            ).forEach(formatElement);

        }
    }


    function start() {

        scan(document);

        const observer =
            new MutationObserver(function (mutations) {

                mutations.forEach(function (mutation) {

                    mutation.addedNodes.forEach(function (node) {

                        if (node.nodeType === 1) {
                            scan(node);
                        }

                    });

                    if (mutation.type === "characterData") {

                        const parent =
                            mutation.target.parentElement;

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
    }
    else {
        start();
    }

})();
