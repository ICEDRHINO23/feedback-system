import { db } from "./supabase-config.js";
import { collection, getDocs, query, where } from "./supabase-firestore.js";

function parseDate(value, endOfDay = false) {
    if (!value) return null;
    const text = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const d = new Date(`${text}T00:00:00`);
        if (endOfDay) d.setHours(23, 59, 59, 999);
        return d;
    }
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
}

function windowState(exam) {
    const now = new Date();
    const start = parseDate(exam.startDate);
    const end = parseDate(exam.endDate, true);
    if (end && now > end) return "ended";
    if (start && now < start) return "upcoming";
    return "live";
}

function formatDate(value, endOfDay = false) {
    const d = parseDate(value, endOfDay);
    return d ? d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Not specified";
}

async function repairAssessmentVisibility() {
    const examList = document.getElementById("examList");
    const notifications = document.getElementById("examNotifications");
    if (!examList) return;

    const studentClass = String(localStorage.getItem("studentClass") || localStorage.getItem("class") || "").trim();
    if (!studentClass) return;

    try {
        // Fetch both class-targeted assessments and assessments created for Students & Teachers.
        // The latter are stored with an empty examClass by the admin form.
        const [classSnapshot, allSnapshot] = await Promise.all([
            getDocs(query(collection(db, "exams"), where("examClass", "==", studentClass))),
            getDocs(query(collection(db, "exams"), where("examClass", "==", "")))
        ]);

        const rows = new Map();
        [...classSnapshot.docs, ...allSnapshot.docs].forEach(docSnap => {
            rows.set(docSnap.id, docSnap);
        });

        const available = [];
        rows.forEach(docSnap => {
            const exam = docSnap.data();
            if (!(exam.targetType === "student" || exam.targetType === "all")) return;
            if (exam.status !== "active") return;
            const state = windowState(exam);
            if (state === "ended") return;
            available.push({ id: docSnap.id, exam, state });
        });

        // The normal dashboard already handles class-specific student assessments.
        // Only take over when this repair finds an assessment that the normal query cannot see.
        const currentText = examList.textContent || "";
        const hasVisibleAssessment = [...examList.querySelectorAll(".exam-card h3")].some(h => h.textContent && h.textContent !== "No Assessments Available" && h.textContent !== "Loading Exams...");
        if (hasVisibleAssessment || !available.length) return;

        examList.innerHTML = available.map(({ id, exam, state }) => {
            const upcoming = state === "upcoming";
            return `<div class="exam-card">
                <h3>${exam.examName || "Assessment"}</h3>
                <p>Subject: ${exam.subject || "-"}</p>
                <p>Duration: ${exam.duration || 0} Minutes</p>
                <p><strong>Total Marks: ${exam.totalMarks || 0}</strong></p>
                <p>Start Date: ${formatDate(exam.startDate)}</p>
                <p>End Date: ${formatDate(exam.endDate, true)}</p>
                <span class="exam-window ${upcoming ? "upcoming" : "live"}"><i class="fas fa-clock"></i> ${upcoming ? `Starts ${formatDate(exam.startDate)}` : `Ends ${formatDate(exam.endDate, true)}`}</span>
                <button class="start-btn" ${upcoming ? "disabled" : ""} onclick="startExam('${id}')">${upcoming ? "Assessment Not Started" : "Start Assessment"}</button>
            </div>`;
        }).join("");

        if (notifications) {
            notifications.innerHTML = `<h3><i class="fas fa-bell"></i> Upcoming & Active Assessments</h3>${available.map(({ exam, state }) => `<div class="notification-item"><div><strong>${exam.examName || "Assessment"}</strong><div class="notification-meta">${state === "upcoming" ? `Starts: ${formatDate(exam.startDate)}` : `Ends: ${formatDate(exam.endDate, true)}`} • Subject: ${exam.subject || "-"}</div></div><div class="notification-marks">Marks: ${exam.totalMarks || 0}</div></div>`).join("")}`;
        }

        console.log("Assessment visibility repair: found assessments hidden by the normal class-only query.");
    } catch (error) {
        console.error("Assessment Visibility Repair Error:", error);
    }
}

window.addEventListener("load", () => {
    // Let the normal dashboard finish first; this is a narrowly scoped fallback.
    setTimeout(repairAssessmentVisibility, 500);
});
