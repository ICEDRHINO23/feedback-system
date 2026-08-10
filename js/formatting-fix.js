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
        return text.replace(/^\s*[A-Da-d]\s*[.)]\s*/, "");
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

        // IMPORTANT: Do not rewrite the complete review option element.
        // It contains child spans for A/B/C/D labels and status markers.
        // Format only the option content span so those elements remain intact.
        const isReviewOptionContent = element.matches(
            "#reviewContainer .option-content"
        );

        const isExamOption = element.matches(
            "#options .option-btn"
        );

        const isQuestionText = element.matches(
            "#questionText, #reviewContainer .question-text"
        );

        const isExplanation = element.matches(
            "#reviewContainer .explanation"
        );

        if (
            !isReviewOptionContent &&
            !isExamOption &&
            !isQuestionText &&
            !isExplanation
        ) {
            return;
        }

        let text = element.textContent || "";

        if (isReviewOptionContent || isExamOption) {
            text = cleanOptionLabel(text);
        }

        if (!needsFormatting(text)) {
            // Still remove a stored a)/b)/c)/d) prefix if present.
            const original = element.textContent || "";
            if (text === original) {
                return;
            }
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
                "#reviewContainer .option-content, " +
                "#reviewContainer .explanation"
            ).forEach(formatElement);
        }
    }

    function start() {

        scan(document);

        const observer = new MutationObserver(function (mutations) {

            mutations.forEach(function (mutation) {

                mutation.addedNodes.forEach(function (node) {

                    if (node.nodeType === 1) {
                        scan(node);
                    }

                    if (node.nodeType === 3) {
                        const parent = node.parentElement;
                        if (parent) {
                            formatElement(parent);
                        }
                    }

                });

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
