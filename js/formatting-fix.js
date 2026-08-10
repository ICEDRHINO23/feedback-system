/*
 * AHPS Rich Text / Mathematical Notation Fix
 * Supports HTML superscript/subscript and caret notation.
 */
(function () {

    function formatText(value) {

        let text = String(value ?? "");

        // Normalize line breaks.
        text = text.replace(/\r\n|\r|\n/g, "<br>");

        // Convert ^{...} and ^2 / ^n notation to superscript.
        text = text.replace(/\^\{([^}]+)\}/g, "<sup>$1</sup>");
        text = text.replace(/\^([0-9]+|[A-Za-z]+)/g, "<sup>$1</sup>");

        // Convert _{...} and _2 / _n notation to subscript.
        text = text.replace(/_\{([^}]+)\}/g, "<sub>$1</sub>");
        text = text.replace(/_([0-9]+|[A-Za-z]+)/g, "<sub>$1</sub>");

        return text;
    }


    function cleanOptionLabel(value) {

        let text = String(value ?? "").trim();

        // Remove an option label already stored in the database:
        // A. / A) / a. / a)
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

        const isOption =
            element.matches(
                "#options .option-btn, #reviewContainer .option"
            );

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

        let text = element.textContent || "";

        // The live exam/review already adds A./B./C./D. labels.
        // Remove a duplicate label from database content.
        if (isOption) {
            text = cleanOptionLabel(text);
        }

        if (!needsFormatting(text) && !isOption) {
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
