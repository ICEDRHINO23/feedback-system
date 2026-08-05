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

                <td colspan="10">

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

        loadClassFilter();

    }

    catch(error){

        console.error(error);

        tbody.innerHTML = `

        <tr>

            <td colspan="10">

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

    results.forEach(result => {

        const exam =
            examMap[result.examId] || {};

        const percentage =
            result.percentage || "0.00";

        tbody.innerHTML += `

        <tr>

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
// LOAD CLASS FILTER
// ======================================

function loadClassFilter() {

    const filter =
        document.getElementById(
            "classFilter"
        );

    if (!filter) return;

    filter.innerHTML =
        `<option value="">
            All Classes
        </option>`;

    const classes =
        [...new Set(

            allResults.map(result => {

                const exam =
                    examMap[result.examId] || {};

                return (
                    exam.examClass ||
                    result.examClass ||
                    result.studentClass
                );

            })

        )];

    classes.sort();

    classes.forEach(cls => {

        if (!cls) return;

        filter.innerHTML += `

        <option value="${cls}">

            ${cls}

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

            return (

                searchMatch &&

                classMatch

            );

        });

    renderResults(filtered);

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

// ======================================
// START
// ======================================

loadResults();
