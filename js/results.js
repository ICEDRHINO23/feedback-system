import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allResults = [];
let examMap = {};
let displayedResults = [];

// ======================================
// LOAD EXAMS
// ======================================
async function loadExamMap() {

    examMap = {};

    const snapshot = await getDocs(
        collection(db, "exams")
    );

    snapshot.forEach(docSnap => {
        examMap[docSnap.id] = {
            id: docSnap.id,
            ...docSnap.data()
        };
    });
}

// ======================================
// LOAD RESULTS
// ======================================
async function loadResults() {

    const tbody = document.getElementById("resultTable");

    try {
        await loadExamMap();

        const snapshot = await getDocs(
            collection(db, "results")
        );

        allResults = [];

        snapshot.forEach(docSnap => {
            allResults.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });

        allResults.sort((a, b) =>
            new Date(b.submittedAt || 0) -
            new Date(a.submittedAt || 0)
        );

        if (allResults.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11">No Results Found</td>
                </tr>
            `;
        } else {
            renderResults(allResults);
        }

        updateDashboard(allResults);
        loadFilters();

    } catch (error) {
        console.error("RESULT LOAD ERROR:", error);

        tbody.innerHTML = `
            <tr>
                <td colspan="11">Error Loading Results</td>
            </tr>
        `;
    }
}

// ======================================
// RENDER RESULTS
// ======================================
function renderResults(results) {

    displayedResults = results;

    const tbody = document.getElementById("resultTable");

    if (!tbody) return;

    tbody.innerHTML = "";

    if (results.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11">No Results Found</td>
            </tr>
        `;
        return;
    }

    results.forEach((result, index) => {

        const exam = examMap[result.examId] || {};

        const studentName =
            result.studentName ||
            result.participantName ||
            "-";

        const examName =
            exam.examName ||
            result.examName ||
            "-";

        const subject =
            exam.subject ||
            result.subject ||
            "-";

        const className =
            exam.examClass ||
            result.examClass ||
            result.studentClass ||
            "-";

        const section =
            result.section ||
            result.studentSection ||
            "-";

        const score = Number(result.score || 0);
        const totalMarks = Number(result.totalMarks || 0);
        const percentage = Number(result.percentage || 0).toFixed(2);

        const submittedDate = result.submittedAt
            ? new Date(result.submittedAt).toLocaleString()
            : "-";

        tbody.innerHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>${studentName}</td>
                <td>${examName}</td>
                <td>${subject}</td>
                <td>${className}</td>
                <td>${section}</td>
                <td>${score}</td>
                <td>${totalMarks}</td>
                <td>${percentage}%</td>
                <td>${submittedDate}</td>
                <td>
                    <button
                        class="action-btn preview-btn"
                        onclick="window.open('student-.html?id=${result.id}','_blank')">
                        
                    </button>

                    <button
                        class="delete-btn"
                        onclick="deleteResult('${result.id}')">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

// ======================================
// DASHBOARD
// ======================================
function updateDashboard(results) {

    const totalAttempts = results.length;
    const students = new Set();

    let totalPercentage = 0;
    let highestPercentage = 0;
    let passed = 0;

    results.forEach(result => {

        students.add(
            result.studentName ||
            result.participantName ||
            "Unknown"
        );

        const percentage = Number(result.percentage || 0);

        totalPercentage += percentage;

        if (percentage > highestPercentage) {
            highestPercentage = percentage;
        }

        if (percentage >= 35) {
            passed++;
        }
    });

    const average = totalAttempts
        ? (totalPercentage / totalAttempts).toFixed(2)
        : "0.00";

    const passPercentage = totalAttempts
        ? ((passed / totalAttempts) * 100).toFixed(2)
        : "0.00";

    document.getElementById("totalStudents").textContent = students.size;
    document.getElementById("totalAttempts").textContent = totalAttempts;
    document.getElementById("averagePercentage").textContent = average + "%";
    document.getElementById("highestPercentage").textContent = highestPercentage + "%";
    document.getElementById("passPercentage").textContent = passPercentage + "%";
    document.getElementById("failedStudents").textContent = totalAttempts - passed;
}

// ======================================
// FILTERS
// ======================================
function loadFilters() {

    const classFilter = document.getElementById("classFilter");
    const examFilter = document.getElementById("examFilter");
    const subjectFilter = document.getElementById("subjectFilter");

    if (!classFilter || !examFilter || !subjectFilter) return;

    classFilter.innerHTML = `<option value="">All Classes</option>`;
    examFilter.innerHTML = `<option value="">All Assessments</option>`;
    subjectFilter.innerHTML = `<option value="">All Subjects</option>`;

    const classSet = new Set();
    const examSet = new Set();
    const subjectSet = new Set();

    allResults.forEach(result => {

        const exam = examMap[result.examId] || {};

        const className =
            exam.examClass ||
            result.examClass ||
            result.studentClass;

        const examName =
            exam.examName ||
            result.examName;

        const subjectName =
            exam.subject ||
            result.subject;

        if (className) classSet.add(className);
        if (examName) examSet.add(examName);
        if (subjectName) subjectSet.add(subjectName);
    });

    [...classSet].sort().forEach(value => {
        classFilter.innerHTML += `<option value="${value}">${value}</option>`;
    });

    [...examSet].sort().forEach(value => {
        examFilter.innerHTML += `<option value="${value}">${value}</option>`;
    });

    [...subjectSet].sort().forEach(value => {
        subjectFilter.innerHTML += `<option value="${value}">${value}</option>`;
    });
}

function filterResults() {

    const search =
        document.getElementById("searchBox")?.value.toLowerCase() || "";

    const selectedClass =
        document.getElementById("classFilter")?.value || "";

    const selectedExam =
        document.getElementById("examFilter")?.value || "";

    const selectedSubject =
        document.getElementById("subjectFilter")?.value || "";

    const filtered = allResults.filter(result => {

        const exam = examMap[result.examId] || {};

        const studentName =
            result.studentName || result.participantName || "";

        const examName =
            exam.examName || result.examName || "";

        const subject =
            exam.subject || result.subject || "";

        const className =
            exam.examClass ||
            result.examClass ||
            result.studentClass ||
            "";

        const searchMatch =
            `${studentName} ${examName} ${subject}`
            .toLowerCase()
            .includes(search);

        return (
            searchMatch &&
            (selectedClass === "" || className === selectedClass) &&
            (selectedExam === "" || examName === selectedExam) &&
            (selectedSubject === "" || subject === selectedSubject)
        );
    });

    renderResults(filtered);
    updateDashboard(filtered);
}

// ======================================
// DELETE RESULT
// ======================================
window.deleteResult = async function (id) {

    if (!confirm("Delete this result?")) return;

    try {
        await deleteDoc(doc(db, "results", id));
        await loadResults();
    } catch (error) {
        console.error("DELETE ERROR:", error);
        alert("Unable To Delete Result");
    }
};

// ======================================
// EXCEL EXPORT
// ======================================
window.exportExcel = function () {

    if (!displayedResults.length) {
        alert("No results available to export.");
        return;
    }

    let table = `
        <table border="1">
            <tr>
                <th>Sr No</th>
                <th>Student</th>
                <th>Assessment</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Section</th>
                <th>Score</th>
                <th>Total Marks</th>
                <th>Percentage</th>
                <th>Date</th>
            </tr>
    `;

    displayedResults.forEach((result, index) => {

        const exam = examMap[result.examId] || {};

        table += `
            <tr>
                <td>${index + 1}</td>
                <td>${result.studentName || result.participantName || "-"}</td>
                <td>${exam.examName || result.examName || "-"}</td>
                <td>${exam.subject || result.subject || "-"}</td>
                <td>${exam.examClass || result.examClass || result.studentClass || "-"}</td>
                <td>${result.section || result.studentSection || "-"}</td>
                <td>${Number(result.score || 0)}</td>
                <td>${Number(result.totalMarks || 0)}</td>
                <td>${Number(result.percentage || 0).toFixed(2)}%</td>
                <td>${result.submittedAt ? new Date(result.submittedAt).toLocaleString() : "-"}</td>
            </tr>
        `;
    });

    table += `</table>`;

    const html = `
        <html>
        <head>
            <meta charset="UTF-8">
        </head>
        <body>
            <h2>Academic Heights Public School</h2>
            <h3>AHPS Assessment Results</h3>
            ${table}
        </body>
        </html>
    `;

    const blob = new Blob(
        [html],
        { type: "application/vnd.ms-excel;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
        `AHPS_Assessment_Results_${new Date().toISOString().slice(0, 10)}.xls`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ======================================
// PRINT
// ======================================
function printResults() {

    if (!displayedResults.length) {
        alert("No results available to print.");
        return;
    }

    window.print();
}

// ======================================
// PDF EXPORT
// ======================================
async function exportPDF() {

    try {

        if (!displayedResults.length) {
            alert("No results available to export.");
            return;
        }

        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert("PDF library is not loaded. Please refresh the page.");
            return;
        }

        const { jsPDF } = window.jspdf;

        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4"
        });

        if (typeof pdf.autoTable !== "function") {
            alert("PDF table library is not loaded. Please refresh the page.");
            return;
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Header
        pdf.setFillColor(0, 31, 91);
        pdf.rect(0, 0, pageWidth, 30, "F");

        pdf.setTextColor(255, 255, 255);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(17);
        pdf.text(
            "ACADEMIC HEIGHTS PUBLIC SCHOOL",
            pageWidth / 2,
            11,
            { align: "center" }
        );

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.text("CBSE Affiliated", pageWidth / 2, 17, { align: "center" });

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text(
            "ASSESSMENT PERFORMANCE ",
            pageWidth / 2,
            24,
            { align: "center" }
        );

        // Optional logos. If they are not uploaded yet, PDF still works.
        async function addLogo(src, type, x, y, w, h) {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => {
                    try {
                        pdf.addImage(img, type, x, y, w, h);
                    } catch (e) {
                        console.warn("Logo could not be added:", e);
                    }
                    resolve();
                };
                img.onerror = () => resolve();
                img.src = src;
            });
        }

        await addLogo("../assets/ahps-logo.png", "PNG", 8, 3, 24, 24);
        await addLogo("../assets/ras-logo.jpeg", "JPEG", pageWidth - 32, 3, 24, 24);

        // Filter information
        const assessment = document.getElementById("examFilter")?.value || "All Assessments";
        const subject = document.getElementById("subjectFilter")?.value || "All Subjects";
        const className = document.getElementById("classFilter")?.value || "All Classes";

        pdf.setTextColor(0, 0, 0);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);

        pdf.text(`Assessment: ${assessment}`, 10, 38);
        pdf.text(`Subject: ${subject}`, 95, 38);
        pdf.text(`Class: ${className}`, 170, 38);
        pdf.text(`Generated: ${new Date().toLocaleString()}`, 225, 38);

        // Table data comes directly from the currently displayed/filtered results.
        const headers = [[
            "Sr No",
            "Student",
            "Assessment",
            "Subject",
            "Class",
            "Section",
            "Score",
            "Total",
            "%",
            "Date"
        ]];

        const rows = displayedResults.map((result, index) => {

            const exam = examMap[result.examId] || {};

            return [
                index + 1,
                result.studentName || result.participantName || "-",
                exam.examName || result.examName || "-",
                exam.subject || result.subject || "-",
                exam.examClass || result.examClass || result.studentClass || "-",
                result.section || result.studentSection || "-",
                Number(result.score || 0),
                Number(result.totalMarks || 0),
                Number(result.percentage || 0).toFixed(2) + "%",
                result.submittedAt
                    ? new Date(result.submittedAt).toLocaleString()
                    : "-"
            ];
        });

        pdf.autoTable({
            head: headers,
            body: rows,
            startY: 44,
            theme: "grid",
            margin: { left: 8, right: 8, bottom: 16 },
            styles: {
                fontSize: 7,
                cellPadding: 2,
                valign: "middle"
            },
            headStyles: {
                fillColor: [0, 31, 91],
                textColor: [255, 255, 255],
                fontStyle: "bold",
                halign: "center"
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            didDrawPage: function () {
                const pageNumber = pdf.internal.getNumberOfPages();

                pdf.setDrawColor(0, 31, 91);
                pdf.line(8, pageHeight - 11, pageWidth - 8, pageHeight - 11);

                pdf.setFontSize(7);
                pdf.setTextColor(80, 80, 80);
                pdf.text("AHPS Online Examination System", 8, pageHeight - 5);
                pdf.text("Powered by RAS SYSTEMS", pageWidth / 2, pageHeight - 5, { align: "center" });
                pdf.text(`Page ${pageNumber}`, pageWidth - 8, pageHeight - 5, { align: "right" });
            }
        });

        let finalY = pdf.lastAutoTable.finalY + 7;

        if (finalY > pageHeight - 35) {
            pdf.addPage();
            finalY = 15;
        }

        pdf.setTextColor(0, 31, 91);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(10);
        pdf.text("Performance Summary", 8, finalY);

        pdf.autoTable({
            body: [[
                `Students: ${document.getElementById("totalStudents")?.innerText || 0}`,
                `Attempts: ${document.getElementById("totalAttempts")?.innerText || 0}`,
                `Average: ${document.getElementById("averagePercentage")?.innerText || "0%"}`,
                `Highest: ${document.getElementById("highestPercentage")?.innerText || "0%"}`,
                `Pass: ${document.getElementById("passPercentage")?.innerText || "0%"}`,
                `Failed: ${document.getElementById("failedStudents")?.innerText || 0}`
            ]],
            startY: finalY + 3,
            theme: "grid",
            styles: {
                fontSize: 8,
                halign: "center",
                cellPadding: 3,
                fontStyle: "bold"
            }
        });

        pdf.save(
            `AHPS_Assessment__${new Date().toISOString().slice(0, 10)}.pdf`
        );

    } catch (error) {
        console.error("PDF EXPORT ERROR:", error);
        alert("Unable To Generate PDF\n\n" + error.message);
    }
}

// ======================================
// BUTTON EVENTS
// ======================================
function setupExportButtons() {

    const printBtn = document.getElementById("printBtn");
    const excelBtn = document.getElementById("excelBtn");
    const pdfBtn = document.getElementById("pdfBtn");

    if (printBtn) {
        printBtn.addEventListener("click", printResults);
    }

    if (excelBtn) {
        excelBtn.addEventListener("click", window.exportExcel);
    }

    if (pdfBtn) {
        pdfBtn.addEventListener("click", exportPDF);
    }
}

// ======================================
// FILTER EVENTS
// ======================================
function setupFilterEvents() {

    document.getElementById("searchBox")?.addEventListener("input", filterResults);
    document.getElementById("classFilter")?.addEventListener("change", filterResults);
    document.getElementById("examFilter")?.addEventListener("change", filterResults);
    document.getElementById("subjectFilter")?.addEventListener("change", filterResults);
}

setupExportButtons();
setupFilterEvents();
loadResults();
