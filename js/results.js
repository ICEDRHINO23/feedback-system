import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allResults = [];
let examMap = {};

// ======================================
// LOAD ALL EXAMS
// ======================================

async function loadExamMap() {

    examMap = {};

    const examSnapshot =
        await getDocs(
            collection(db, "exams")
        );

    examSnapshot.forEach(docSnap => {

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

    const tbody =
        document.getElementById(
            "resultTable"
        );

    try {

        // Load all exams first
        await loadExamMap();

        // Load results
        const snapshot =
            await getDocs(
                collection(db, "results")
            );

        tbody.innerHTML = "";

        allResults = [];

        if (snapshot.empty) {

            tbody.innerHTML = `

            <tr>

                <td colspan="11">

                    No Results Found

                </td>

            </tr>

            `;

            return;

        }

        snapshot.forEach(docSnap => {

            allResults.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        allResults.sort(

            (a, b) =>

                new Date(b.submittedAt) -

                new Date(a.submittedAt)

        );

        renderResults(allResults);

        updateDashboard(allResults);

        loadFilters();
    }

    catch(error){

        console.error(error);

        tbody.innerHTML = `

        <tr>

            <td colspan="11">

                Error Loading Results

            </td>

        </tr>

        `;

    }

}
// ======================================
// RENDER RESULTS
// ======================================

function renderResults(results) {

    const tbody =
        document.getElementById(
            "resultTable"
        );

    tbody.innerHTML = "";

  results.forEach((result,index) => {

        const exam =
            examMap[result.examId] || {};

        const percentage =
            result.percentage || "0.00";

        tbody.innerHTML += `

        <tr>
<td>${index + 1}</td>
            <td>

                ${
                    result.studentName ||
                    result.participantName ||
                    "-"
                }

            </td>

            <td>

                ${
                    exam.examName ||
                    result.examName ||
                    "-"
                }

            </td>

            <td>

                ${
                    exam.subject ||
                    result.subject ||
                    "-"
                }

            </td>

            <td>

                ${
                    exam.examClass ||
                    result.examClass ||
                    result.studentClass ||
                    "-"
                }

            </td>

            <td>

                ${
                    result.section ||
                    result.studentSection ||
                    "-"
                }

            </td>

            <td>

                ${result.score || 0}

            </td>

            <td>

                ${result.totalMarks || 0}

            </td>

            <td>

                ${percentage}%

            </td>

            <td>

                ${
                    result.submittedAt
                    ? new Date(
                        result.submittedAt
                      ).toLocaleString()
                    : "-"
                }

            </td>

           <td>

<button
class="action-btn preview-btn"
onclick="window.open('student-report.html?id=${result.id}','_blank')">

Report

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
// UPDATE DASHBOARD
// ======================================

function updateDashboard(results){

    const totalAttempts =
        results.length;

    const students =
        new Set();

    let totalPercentage = 0;

    let highestPercentage = 0;

    let passed = 0;

    results.forEach(result=>{

        students.add(

            result.studentName ||

            result.participantName ||

            "Unknown"

        );

        const percentage =

            Number(result.percentage || 0);

        totalPercentage += percentage;

        if(

            percentage >

            highestPercentage

        ){

            highestPercentage = percentage;

        }

        if(

            percentage >= 35

        ){

            passed++;

        }

    });

    const average =

        totalAttempts

        ?

        (

            totalPercentage /

            totalAttempts

        ).toFixed(2)

        :

        0;

    const passPercentage =

        totalAttempts

        ?

        (

            passed /

            totalAttempts *

            100

        ).toFixed(2)

        :

        0;

    document.getElementById(

        "totalStudents"

    ).textContent =

        students.size;

    document.getElementById(

        "totalAttempts"

    ).textContent =

        totalAttempts;

    document.getElementById(

        "averagePercentage"

    ).textContent =

        average + "%";

    document.getElementById(

        "highestPercentage"

    ).textContent =

        highestPercentage + "%";

    document.getElementById(

        "passPercentage"

    ).textContent =

        passPercentage + "%";

    document.getElementById(

        "failedStudents"

    ).textContent =

        totalAttempts - passed;

}
// ======================================
// LOAD FILTERS
// ======================================

function loadFilters() {

    const classFilter =
        document.getElementById("classFilter");

    const examFilter =
        document.getElementById("examFilter");

    const subjectFilter =
        document.getElementById("subjectFilter");

    if (!classFilter ||
        !examFilter ||
        !subjectFilter) return;

    classFilter.innerHTML =
        `<option value="">All Classes</option>`;

    examFilter.innerHTML =
        `<option value="">All Assessments</option>`;

    subjectFilter.innerHTML =
        `<option value="">All Subjects</option>`;

    const classSet = new Set();
    const examSet = new Set();
    const subjectSet = new Set();

    allResults.forEach(result => {

        const exam =
            examMap[result.examId] || {};

        const className =
    exam.examClass ||
    result.examClass ||
    result.studentClass;

if(className){

    classSet.add(className);

}

       const examName =
    exam.examName ||
    result.examName;

if(examName){

    examSet.add(examName);

}

       const subjectName =
    exam.subject ||
    result.subject;

if(subjectName){

    subjectSet.add(subjectName);

}

    });

    [...classSet]
        .sort()
        .forEach(cls => {

            classFilter.innerHTML += `

            <option value="${cls}">
                ${cls}
            </option>

            `;

        });

    [...examSet]
        .sort()
        .forEach(exam => {

            examFilter.innerHTML += `

            <option value="${exam}">
                ${exam}
            </option>

            `;

        });

    [...subjectSet]
        .sort()
        .forEach(subject => {

            subjectFilter.innerHTML += `

            <option value="${subject}">
                ${subject}
            </option>

            `;

        });
}
// ======================================
// DELETE RESULT
// ======================================

window.deleteResult =
async function(id){

    if(
        !confirm(
            "Delete this result?"
        )
    ) return;

    try{

        await deleteDoc(

            doc(
                db,
                "results",
                id
            )

        );

        loadResults();

    }
    catch(error){

        console.error(error);

        alert(
            "Unable To Delete Result"
        );

    }

};

// ======================================
// SEARCH & FILTER
// ======================================

function filterResults(){

    const search =
        document
        .getElementById("searchBox")
        .value
        .toLowerCase();

    const selectedClass =
        document
        .getElementById("classFilter")
        .value;

    const selectedExam =
        document
        .getElementById("examFilter")
        .value;

    const selectedSubject =
        document
        .getElementById("subjectFilter")
        .value;

    const filtered =

        allResults.filter(result=>{

            const exam =
                examMap[result.examId] || {};

            const studentName =
                result.studentName ||
                result.participantName ||
                "";

            const examName =
                exam.examName ||
                result.examName ||
                "";

            const subject =
                exam.subject ||
                result.subject ||
                "";
            const className =
                exam.examClass ||
                result.examClass ||
                result.studentClass ||
                 "";
            const searchMatch =

                (
                    studentName +
                    " " +
                    examName +
                    " " +
                    subject
                )
                .toLowerCase()
                .includes(search);

            const classMatch =
                selectedClass === "" ||
                className === selectedClass;

            const examMatch =
                selectedExam === "" ||
                examName === selectedExam;

            const subjectMatch =
                selectedSubject === "" ||
                subject === selectedSubject;

            return (

                searchMatch &&
                classMatch &&
                examMatch &&
                subjectMatch

            );

        });

    renderResults(filtered);
    updateDashboard(filtered);
}
// ======================================
// EVENTS
// ======================================

const searchBox =
    document.getElementById(
        "searchBox"
    );

if(searchBox){

    searchBox.addEventListener(

        "input",

        filterResults

    );

}

const classFilter =
    document.getElementById(
        "classFilter"
    );

if(classFilter){

    classFilter.addEventListener(

        "change",

        filterResults

    );

}
const examFilter =
    document.getElementById(
        "examFilter"
    );

if(examFilter){

    examFilter.addEventListener(
        "change",
        filterResults
    );

}

const subjectFilter =
    document.getElementById(
        "subjectFilter"
    );

if(subjectFilter){

    subjectFilter.addEventListener(
        "change",
        filterResults
    );

}
// ======================================
// START
// ======================================

loadResults();
