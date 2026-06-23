
import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadDashboardStats() {

    try {

        // Students

        const studentsSnap =
            await getDocs(
                collection(db, "students")
            );

        document.getElementById(
            "studentCount"
        ).innerText =
            studentsSnap.size;

        // Exams

        const examsSnap =
            await getDocs(
                collection(db, "exams")
            );

        document.getElementById(
            "examCount"
        ).innerText =
            examsSnap.size;

        // Results

        const resultsSnap =
            await getDocs(
                collection(db, "results")
            );

        document.getElementById(
            "resultCount"
        ).innerText =
            resultsSnap.size;

    }
    catch(error){

        console.error(
            "Dashboard Error:",
            error
        );
    }
}

loadDashboardStats();
