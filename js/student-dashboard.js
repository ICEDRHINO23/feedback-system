import { db } from "./firebase-config.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

async function loadExams(){

    const examList =
        document.getElementById("examList");

    try{

        const studentClass =
            localStorage.getItem(
                "studentClass"
            );

        const snapshot =
            await getDocs(
                collection(db,"exams")
            );

        examList.innerHTML = "";

        let found = false;

        snapshot.forEach(doc=>{

            const exam =
                doc.data();

            if(
                exam.class ===
                studentClass
            ){

                found = true;

                examList.innerHTML += `
                <div class="exam-card">

                    <h3>
                        ${exam.examName}
                    </h3>

                    <p>
                        Subject:
                        ${exam.subject}
                    </p>

                    <p>
                        Duration:
                        ${exam.duration}
                        Minutes
                    </p>

                    <button
                    onclick="startExam()">
                    Start Exam
                    </button>

                </div>
                `;
            }
        });

        if(!found){

            examList.innerHTML =
            "No Exams Available";
        }

    }catch(error){

        console.error(error);

        examList.innerHTML =
        "Unable to Load Exams";
    }
}

window.startExam = function(){

    window.location.href =
        "exam.html";
};

loadExams();
