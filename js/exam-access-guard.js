import { db } from "./firebase-config.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function parseExamDate(value, endOfDay = false) {
    if (!value) return null;
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value === "object" && typeof value.seconds === "number") {
        return new Date(value.seconds * 1000);
    }

    const text = String(value).trim();
    if (!text) return null;

    // Date-only values are treated as local dates. End dates remain valid through 23:59:59.
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (dateOnly) {
        const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        if (endOfDay) d.setHours(23, 59, 59, 999);
        return d;
    }

    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function dashboardPath() {
    return localStorage.getItem("participantRole") === "teacher" || localStorage.getItem("role") === "teacher"
        ? "teacher-dashboard.html"
        : "dashboard.html";
}

async function enforceExamWindow() {
    const examId = localStorage.getItem("currentExamId");
    if (!examId) return;

    try {
        const snap = await getDoc(doc(db, "exams", examId));
        if (!snap.exists()) {
            localStorage.removeItem("currentExamId");
            window.location.href = dashboardPath();
            return;
        }

        const exam = snap.data();
        const now = new Date();
        const start = parseExamDate(exam.startDate, false);
        const end = parseExamDate(exam.endDate, true);

        const notStarted = start && now < start;
        const expired = end && now > end;
        const inactive = exam.status && exam.status !== "active";

        if (notStarted || expired || inactive) {
            localStorage.removeItem("currentExamId");
            alert(
                expired
                    ? "This assessment has ended and is no longer available."
                    : notStarted
                        ? "This assessment has not started yet."
                        : "This assessment is no longer active."
            );
            window.location.href = dashboardPath();
            return;
        }
    } catch (error) {
        console.error("Exam access check failed:", error);
    }
}

await enforceExamWindow();

// Keep an assessment open only while its configured window is valid.
setInterval(enforceExamWindow, 30000);
