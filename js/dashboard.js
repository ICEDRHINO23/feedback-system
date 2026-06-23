import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadDashboardStats() {

    try {

        // Total Students

        const studentsSnap =
            await getDocs(
                collection(db, "students")
            );

        document.getElementById(
            "studentCount"
        ).innerText =
            studentsSnap.size;

        // Total Exams

        let examCount = 0;

        try {

            const examsSnap =
                await getDocs(
                    collection(db, "exams")
                );

            examCount =
                examsSnap.size;

        } catch (e) {

            examCount = 0;

        }

        document.getElementById(
            "examCount"
        ).innerText =
            examCount;

        // Total Results

        let resultCount = 0;

        try {

            const resultsSnap =
                await getDocs(
                    collection(db, "results")
                );

            resultCount =
                resultsSnap.size;

        } catch (e) {

            resultCount = 0;

        }

        document.getElementById(
            "resultCount"
        ).innerText =
            resultCount;

    }
    catch(error){

        console.error(
            "Dashboard Error:",
            error
        );
    }
}

loadDashboardStats();
