import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadDashboardStats() {

    try {
        // Total Students
        const studentsSnap = await getDocs(
            collection(db, "students")
        );

        const studentCount = studentsSnap.size;

        document.getElementById("studentCount").innerText = studentCount;
        document.getElementById("overviewStudents").innerText = studentCount;

        // Total Teachers
        let teacherCount = 0;

        try {
            const teachersSnap = await getDocs(
                collection(db, "teachers")
            );
            teacherCount = teachersSnap.size;
        } catch (e) {
            teacherCount = 0;
        }

        document.getElementById("teacherCount").innerText = teacherCount;

        // Total Exams / Assessments
        let examCount = 0;

        try {
            const examsSnap = await getDocs(
                collection(db, "exams")
            );
            examCount = examsSnap.size;
        } catch (e) {
            examCount = 0;
        }

        document.getElementById("examCount").innerText = examCount;
        document.getElementById("overviewExams").innerText = examCount;

        // Total Results
        let resultCount = 0;

        try {
            const resultsSnap = await getDocs(
                collection(db, "results")
            );
            resultCount = resultsSnap.size;
        } catch (e) {
            resultCount = 0;
        }

        document.getElementById("resultCount").innerText = resultCount;
        document.getElementById("overviewResults").innerText = resultCount;

    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

loadDashboardStats();
