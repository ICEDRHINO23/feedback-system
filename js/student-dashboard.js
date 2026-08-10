import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function parseExamDate(value, endOfDay = false) {
    if (!value) return null;
    if (typeof value?.toDate === "function") return value.toDate();
    if (typeof value === "object" && typeof value.seconds === "number") return new Date(value.seconds * 1000);
    const text = String(value).trim();
    if (!text) return null;
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (dateOnly) {
        const d = new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
        if (endOfDay) d.setHours(23, 59, 59, 999);
        return d;
    }
    const d = new Date(text);
    return Number.isNaN(d.getTime()) ? null : d;
}

function formatDate(value, endOfDay = false) {
    const d = parseExamDate(value, endOfDay);
    return d ? d.toLocaleString("en-IN", { day:"2-digit", month:"short", year:"numeric", hour:"2-digit", minute:"2-digit" }) : "Not specified";
}

function getExamWindow(exam) {
    const now = new Date();
    const start = parseExamDate(exam.startDate, false);
    const end = parseExamDate(exam.endDate, true);
    if (end && now > end) return "ended";
    if (start && now < start) return "upcoming";
    return "live";
}

function loadStudentDetails() {
    const studentName = localStorage.getItem("studentName") || localStorage.getItem("name") || "Student";
    const studentRollNo = localStorage.getItem("rollNo") || localStorage.getItem("studentRollNo") || localStorage.getItem("rollNumber") || "-";
    const studentClass = localStorage.getItem("studentClass") || localStorage.getItem("class") || "-";
    const studentSection = localStorage.getItem("studentSection") || localStorage.getItem("section") || "-";
    const nameElement = document.getElementById("studentName");
    const rollNoElement = document.getElementById("studentRollNo");
    const classElement = document.getElementById("studentClass");
    const sectionElement = document.getElementById("studentSection");
    if (nameElement) nameElement.textContent = studentName;
    if (rollNoElement) rollNoElement.textContent = studentRollNo;
    if (classElement) classElement.textContent = studentClass;
    if (sectionElement) sectionElement.textContent = studentSection;
}

async function loadExams() {
    const examList = document.getElementById("examList");
    const notificationList = document.getElementById("examNotifications");
    try {
        const studentClass = localStorage.getItem("studentClass");
        if (!studentClass) {
            examList.innerHTML = `<div class="exam-card"><h3>Student Class Not Found</h3><p>Please login again.</p></div>`;
            if (notificationList) notificationList.innerHTML = `<h3><i class="fas fa-bell"></i> Exam Notifications</h3><div class="notification-empty">Student class not found.</div>`;
            return;
        }

        const snapshot = await getDocs(collection(db, "exams"));
        examList.innerHTML = "";
        const notifications = [];
        let found = false;
        const now = new Date();

        snapshot.forEach(docSnap => {
            const exam = docSnap.data();
            if (String(exam.examClass).trim() !== String(studentClass).trim() || exam.targetType !== "student" || exam.status !== "active") return;

            const windowState = getExamWindow(exam);
            const start = parseExamDate(exam.startDate, false);
            const end = parseExamDate(exam.endDate, true);
            if (windowState === "ended") return;

            found = true;
            if (windowState === "upcoming" || windowState === "live") notifications.push({ exam, state: windowState, start, end });

            const isUpcoming = windowState === "upcoming";
            const badge = isUpcoming ? "upcoming" : "live";
            const badgeText = isUpcoming ? `Starts ${formatDate(exam.startDate)}` : `Ends ${formatDate(exam.endDate, true)}`;
            const disabled = isUpcoming;
            const buttonText = isUpcoming ? "Assessment Not Started" : "Start Assessment";

            examList.innerHTML += `
                <div class="exam-card">
                    <h3>${exam.examName || "Assessment"}</h3>
                    <p>Subject: ${exam.subject || "-"}</p>
                    <p>Duration: ${exam.duration || 0} Minutes</p>
                    <p><strong>Total Marks: ${exam.totalMarks || 0}</strong></p>
                    <p>Start Date: ${formatDate(exam.startDate)}</p>
                    <p>End Date: ${formatDate(exam.endDate, true)}</p>
                    <span class="exam-window ${badge}"><i class="fas fa-clock"></i> ${badgeText}</span>
                    <button class="start-btn" ${disabled ? "disabled" : ""} onclick="startExam('${docSnap.id}')">${buttonText}</button>
                </div>`;
        });

        if (!found) {
            examList.innerHTML = `<div class="exam-card"><h3>No Assessments Available</h3><p>No active assessments are currently available for your class.</p></div>`;
        }

        if (notificationList) {
            if (!notifications.length) {
                notificationList.innerHTML = `<h3><i class="fas fa-bell"></i> Exam Notifications</h3><div class="notification-empty">No upcoming or active assessments at the moment.</div>`;
            } else {
                notifications.sort((a,b) => (a.start?.getTime() || now.getTime()) - (b.start?.getTime() || now.getTime()));
                notificationList.innerHTML = `<h3><i class="fas fa-bell"></i> Upcoming & Active Assessments</h3>` + notifications.map(({exam,state}) => `
                    <div class="notification-item">
                        <div><strong>${exam.examName || "Assessment"}</strong><div class="notification-meta">${state === "upcoming" ? `Starts: ${formatDate(exam.startDate)}` : `Ends: ${formatDate(exam.endDate, true)}`} • Subject: ${exam.subject || "-"}</div></div>
                        <div class="notification-marks">Marks: ${exam.totalMarks || 0}</div>
                    </div>`).join("");
            }
        }
    } catch (error) {
        console.error(error);
        examList.innerHTML = `<div class="exam-card"><h3>Unable To Load Assessments</h3><p>Please refresh the page.</p></div>`;
        if (notificationList) notificationList.innerHTML = `<h3><i class="fas fa-bell"></i> Exam Notifications</h3><div class="notification-empty">Unable to load assessment schedule.</div>`;
    }
}

window.startExam = function(examId) {
    localStorage.setItem("currentExamId", examId);
    localStorage.setItem("participantRole", "student");
    window.location.href = "student-exam.html";
};

async function loadPerformanceSummary() {
    try {
        const studentName = localStorage.getItem("studentName");
        if (!studentName) return;
        const snapshot = await getDocs(collection(db, "results"));
        const results = [];
        snapshot.forEach(docSnap => {
            const result = docSnap.data();
            if ((result.studentName || result.participantName) === studentName) results.push(result);
        });
        if (!results.length) {
            document.getElementById("completedCount").innerText = "0";
            document.getElementById("averagePercentage").innerText = "0%";
            document.getElementById("bestPercentage").innerText = "0%";
            document.getElementById("passedCount").innerText = "0";
            document.getElementById("failedCount").innerText = "0";
            return;
        }
        let totalPercentage = 0, bestPercentage = 0, passed = 0, failed = 0;
        results.forEach(result => {
            const percentage = Number(result.percentage || 0);
            totalPercentage += percentage;
            bestPercentage = Math.max(bestPercentage, percentage);
            if (percentage >= 35) passed++; else failed++;
        });
        document.getElementById("completedCount").innerText = results.length;
        document.getElementById("averagePercentage").innerText = (totalPercentage / results.length).toFixed(2) + "%";
        document.getElementById("bestPercentage").innerText = bestPercentage.toFixed(2) + "%";
        document.getElementById("passedCount").innerText = passed;
        document.getElementById("failedCount").innerText = failed;
    } catch (error) { console.error("Performance Error:", error); }
}

async function loadCompletedExams() {
    const completedDiv = document.getElementById("completedExamList");
    if (!completedDiv) return;
    try {
        const studentName = localStorage.getItem("studentName");
        if (!studentName) {
            completedDiv.innerHTML = `<div class="exam-card"><h3>Student Not Found</h3><p>Please login again.</p></div>`;
            return;
        }
        const snapshot = await getDocs(collection(db, "results"));
        let html = "", found = false;
        snapshot.forEach(docSnap => {
            const result = docSnap.data();
            const resultStudentName = result.studentName || result.participantName || "";
            if (String(resultStudentName).trim() !== String(studentName).trim()) return;
            found = true;
            const percentage = Number(result.percentage || 0);
            const score = result.score || 0;
            const totalMarks = result.totalMarks || 0;
            const correctAnswers = result.correctAnswers || 0;
            const status = percentage >= 35 ? "PASS" : "FAIL";
            const badgeClass = percentage >= 35 ? "pass-badge" : "fail-badge";
            const statusClass = percentage >= 35 ? "pass-text" : "fail-text";
            html += `<div class="completed-card"><div class="completed-header"><div><h3>${result.examName || "-"}</h3><p class="completed-subject">Subject: <strong>${result.subject || "-"}</strong></p></div><div class="percentage-badge ${badgeClass}">${percentage.toFixed(2)}%</div></div><div class="completed-info"><div class="info-item"><span class="info-label">Score</span><span class="info-value">${score}/${totalMarks}</span></div><div class="info-item"><span class="info-label">Correct</span><span class="info-value">${correctAnswers}</span></div><div class="info-item"><span class="info-label">Status</span><span class="info-value ${statusClass}">${status}</span></div></div><div class="completed-actions"><button type="button" class="result-btn" onclick="viewResult('${docSnap.id}')">📄 View Result</button><button type="button" class="review-btn" onclick="reviewAssessment('${docSnap.id}')">🔍 Review</button></div></div>`;
        });
        if (!found) html = `<div class="exam-card"><h3>No Completed Assessments</h3><p>Your completed assessments will appear here.</p></div>`;
        completedDiv.innerHTML = html;
    } catch (error) {
        console.error("Completed Exams Error:", error);
        completedDiv.innerHTML = `<div class="exam-card"><h3>Unable To Load Results</h3><p>Please refresh the page.</p></div>`;
    }
}

window.viewResult = function(resultId) { window.location.href = "result.html?id=" + resultId; };
window.reviewAssessment = function(resultId) { window.location.href = "review/review.html?id=" + resultId; };
window.logout = function() { localStorage.clear(); window.location.href = "login.html"; };

loadStudentDetails();
loadExams();
loadCompletedExams();
loadPerformanceSummary();
