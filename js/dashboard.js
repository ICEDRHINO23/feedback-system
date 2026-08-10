import { db } from "./firebase-config.js";
import { collection, getCountFromServer } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function getCollectionCount(name) {
    try {
        const snap = await getCountFromServer(collection(db, name));
        return snap.data().count || 0;
    } catch (error) {
        console.error(`Count error for ${name}:`, error);
        return 0;
    }
}

async function loadDashboardStats() {
    try {
        // Aggregation queries return counts without downloading every document.
        const [studentCount, teacherCount, examCount, resultCount] = await Promise.all([
            getCollectionCount("students"),
            getCollectionCount("teachers"),
            getCollectionCount("exams"),
            getCollectionCount("results")
        ]);

        document.getElementById("studentCount")?.replaceChildren(document.createTextNode(studentCount));
        document.getElementById("overviewStudents")?.replaceChildren(document.createTextNode(studentCount));
        document.getElementById("teacherCount")?.replaceChildren(document.createTextNode(teacherCount));
        document.getElementById("examCount")?.replaceChildren(document.createTextNode(examCount));
        document.getElementById("overviewExams")?.replaceChildren(document.createTextNode(examCount));
        document.getElementById("resultCount")?.replaceChildren(document.createTextNode(resultCount));
        document.getElementById("overviewResults")?.replaceChildren(document.createTextNode(resultCount));
    } catch (error) {
        console.error("Dashboard Error:", error);
    }
}

loadDashboardStats();
