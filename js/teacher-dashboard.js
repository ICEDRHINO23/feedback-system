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

const teacherName = localStorage.getItem("teacherName");
const teacherSubject = localStorage.getItem("teacherSubject");
const welcomeText = document.getElementById("teacherName");
const subjectText = document.getElementById("teacherSubject");
if (welcomeText) welcomeText.textContent = teacherName || "Teacher";
if (subjectText) subjectText.textContent = teacherSubject || "";

async function loadAssessments() {
    try {
        const assessmentList = document.getElementById("assessmentList");
        const examCount = document.getElementById("examCount");
        const notificationList = document.getElementById("examNotifications");
        const snapshot = await getDocs(collection(db, "exams"));
        assessmentList.innerHTML = "";
        let totalAssessments = 0;
        const notifications = [];
        const now = new Date();

        snapshot.forEach(docSnap => {
            const exam = docSnap.data();
            if (exam.targetType !== "teacher" || exam.status !== "active") return;
            const windowState = getExamWindow(exam);
            if (windowState === "ended") return;
            totalAssessments++;
            const start = parseExamDate(exam.startDate, false);
            if (windowState === "upcoming" || windowState === "live") notifications.push({ exam, state: windowState, start });
            const isUpcoming = windowState === "upcoming";
            const badge = isUpcoming ? "upcoming" : "live";
            const badgeText = isUpcoming ? `Starts ${formatDate(exam.startDate)}` : `Ends ${formatDate(exam.endDate, true)}`;
            const buttonText = isUpcoming ? "Assessment Not Started" : "Start Assessment";
            assessmentList.innerHTML += `<div class="assessment-card"><h3>${exam.examName || "Assessment"}</h3><p>Subject: ${exam.subject || "-"}</p><p>Duration: ${exam.duration || 0} Minutes</p><p><strong>Total Marks: ${exam.totalMarks || 0}</strong></p><p>Start Date: ${formatDate(exam.startDate)}</p><p>End Date: ${formatDate(exam.endDate, true)}</p><span class="exam-window ${badge}"><i class="fas fa-clock"></i> ${badgeText}</span><button class="start-btn" ${isUpcoming ? "disabled" : ""} onclick="startAssessment('${docSnap.id}')">${buttonText}</button></div>`;
        });

        examCount.textContent = totalAssessments;
        if (totalAssessments === 0) assessmentList.innerHTML = `<div class="empty-state"><i class="fas fa-calendar-xmark"></i><h3>No Assessments Available</h3><p>No active assessments are currently available.</p></div>`;

        if (notificationList) {
            if (!notifications.length) {
                notificationList.innerHTML = `<h3><i class="fas fa-bell"></i> Upcoming & Active Assessments</h3><div class="notification-empty">No upcoming or active assessments at the moment.</div>`;
            } else {
                notifications.sort((a,b) => (a.start?.getTime() || now.getTime()) - (b.start?.getTime() || now.getTime()));
                notificationList.innerHTML = `<h3><i class="fas fa-bell"></i> Upcoming & Active Assessments</h3>` + notifications.map(({exam,state}) => `<div class="notification-item"><div><strong>${exam.examName || "Assessment"}</strong><div class="notification-meta">${state === "upcoming" ? `Starts: ${formatDate(exam.startDate)}` : `Ends: ${formatDate(exam.endDate, true)}`} • Subject: ${exam.subject || "-"}</div></div><div class="notification-marks">Marks: ${exam.totalMarks || 0}</div></div>`).join("");
            }
        }
    } catch (error) {
        console.error("Assessment Load Error:", error);
        document.getElementById("assessmentList").innerHTML = `<div class="empty-state"><h3>Unable To Load Assessments</h3><p>Please refresh the page.</p></div>`;
    }
}

window.startAssessment = function(examId) {
    localStorage.setItem("currentExamId", examId);
    localStorage.setItem("participantRole", "teacher");
    window.location.href = "exam.html";
};

async function loadTeacherResults() {
    try {
        const resultCount = document.getElementById("resultCount");
        const snapshot = await getDocs(collection(db, "results"));
        let completed = 0;
        snapshot.forEach(docSnap => { const result = docSnap.data(); if (result.teacherName === teacherName) completed++; });
        resultCount.textContent = completed;
    } catch(error) { console.error("Result Load Error:", error); }
}

async function loadPendingEvaluations() {
    const pendingList = document.getElementById("pendingEvaluationList");
    if (!pendingList) return;
    try {
        const currentSubject = String(teacherSubject || "").trim().toLowerCase();
        const snapshot = await getDocs(collection(db, "results"));
        let html = "", pendingCount = 0;
        snapshot.forEach(docSnap => {
            const result = docSnap.data();
            if (result.hasDescriptiveQuestions !== true || result.reviewStatus !== "pending") return;
            const resultSubject = String(result.subject || "").trim().toLowerCase();
            if (currentSubject && resultSubject !== currentSubject) return;
            pendingCount++;
            html += `<div class="pending-card"><h3>${result.examName || "Assessment"}</h3><p><strong>Student:</strong> ${result.studentName || "-"}</p><p><strong>Roll No:</strong> ${result.rollNo || "-"}</p><p><strong>Class:</strong> ${result.studentClass || "-"} - ${result.studentSection || ""}</p><p><strong>Subject:</strong> ${result.subject || "-"}</p><p><strong>Automatic Marks:</strong> ${result.automaticMarks || 0}/${result.totalMarks || 0}</p><p><strong>Status:</strong> <span style="color:#d97706;font-weight:bold">Under Teacher Evaluation</span></p><button class="start-btn pending-btn" onclick="reviewStudentAssessment('${docSnap.id}')">Review Student</button></div>`;
        });
        pendingList.innerHTML = pendingCount ? html : `<div class="empty-state"><i class="fas fa-circle-check"></i><h3>No Pending Evaluations</h3><p>There are no student assessments waiting for evaluation.</p></div>`;
    } catch (error) {
        console.error("Pending Evaluation Error:", error);
        pendingList.innerHTML = `<div class="empty-state"><h3>Failed To Load</h3><p>Unable To Load Pending Evaluations.</p></div>`;
    }
}

window.reviewStudentAssessment = function(resultId) { window.location.href = "teacher-review.html?id=" + resultId; };
window.logout = function() { localStorage.removeItem("teacherName"); localStorage.removeItem("teacherSubject"); localStorage.removeItem("teacherId"); localStorage.removeItem("participantRole"); window.location.href = "teacher-login.html"; };

loadAssessments();
loadTeacherResults();
loadPendingEvaluations();
