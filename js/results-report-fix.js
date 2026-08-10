// AHPS Results - Individual Report Fix
(function () {
    function closeReport() {
        const modal = document.getElementById("reportModal");
        if (modal) modal.style.display = "none";
    }
    window.closeReport = closeReport;

    function printCurrentReport() {
        const content = document.getElementById("reportContent");
        if (!content) return;
        const win = window.open("", "_blank", "width=900,height=700");
        win.document.write(`<!doctype html><html><head><title>Student Report</title><style>body{font-family:Arial;padding:35px;color:#111}h2{text-align:center;color:#06245f}table{width:100%;border-collapse:collapse;margin-top:20px}td{border:1px solid #ddd;padding:12px}td:first-child{width:35%;font-weight:bold;background:#f4f6f9}@media print{button{display:none}}</style></head><body>${content.innerHTML}</body></html>`);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 300);
    }

    function openReportFromRow(button) {
        const row = button.closest("tr");
        if (!row) return;
        const cells = row.querySelectorAll("td");
        if (cells.length < 10) return;

        const values = [
            cells[1].textContent.trim(),
            cells[2].textContent.trim(),
            cells[3].textContent.trim(),
            cells[4].textContent.trim(),
            cells[5].textContent.trim(),
            cells[6].textContent.trim(),
            cells[7].textContent.trim(),
            cells[8].textContent.trim()
        ];

        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value || "-";
        };

        set("rStudent", values[0]);
        set("rExam", values[1]);
        set("rSubject", values[2]);
        set("rClass", values[3]);
        set("rSection", values[4]);
        set("rScore", values[5]);
        set("rTotal", values[6]);
        set("rPercentage", values[7]);

        // Rank is calculated from the visible result list when available.
        const percentages = [...document.querySelectorAll("#resultTable tr")]
            .map(r => Number(r.querySelectorAll("td")[8]?.textContent.replace("%", "")))
            .filter(Number.isFinite)
            .sort((a, b) => b - a);
        const current = Number(values[7].replace("%", ""));
        const rank = current ? percentages.indexOf(current) + 1 : "-";
        set("rRank", rank > 0 ? rank : "-");
        set("rResult", current >= 35 ? "PASS" : "FAIL");

        const modal = document.getElementById("reportModal");
        if (modal) modal.style.display = "block";
    }

    function repairReportButtons() {
        document.querySelectorAll("#resultTable .preview-btn").forEach(button => {
            if (button.dataset.reportFixed === "1") return;
            button.dataset.reportFixed = "1";
            button.className = "btn print-btn preview-btn";
            button.type = "button";
            button.innerHTML = '<i class="fas fa-file-lines"></i> Report';
            button.removeAttribute("onclick");
            button.addEventListener("click", () => openReportFromRow(button));
        });

        const print = document.getElementById("printReportBtn");
        if (print && print.dataset.reportFixed !== "1") {
            print.dataset.reportFixed = "1";
            print.addEventListener("click", printCurrentReport);
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        repairReportButtons();
        const table = document.getElementById("resultTable");
        if (table) {
            new MutationObserver(repairReportButtons).observe(table, { childList: true, subtree: true });
        }
        window.addEventListener("click", event => {
            const modal = document.getElementById("reportModal");
            if (modal && event.target === modal) closeReport();
        });
    });
})();
