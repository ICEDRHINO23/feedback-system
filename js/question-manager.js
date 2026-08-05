import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allQuestions = [];

// =============================
// LOAD QUESTIONS
// =============================

async function loadQuestions() {

    const table =
        document.getElementById("questionTable");

    try {

        const snapshot =
            await getDocs(
                collection(db, "questions")
            );

        allQuestions = [];

        snapshot.forEach((docSnap) => {

            allQuestions.push({

                id: docSnap.id,

                ...docSnap.data()

            });

        });

        renderQuestions(allQuestions);

        loadFilters();

    }
    catch(error){

        console.error(error);

        table.innerHTML = `
        <tr>
            <td colspan="6">
                Error Loading Questions
            </td>
        </tr>
        `;

    }

}

// =============================
// RENDER TABLE
// =============================

function renderQuestions(list){

    const table =
        document.getElementById("questionTable");

    table.innerHTML = "";

    if(list.length===0){

        table.innerHTML=`
        <tr>
            <td colspan="6">
                No Questions Found
            </td>
        </tr>
        `;

        return;

    }

    list.forEach((q)=>{

        table.innerHTML += `

        <tr>

            <td>

                ${q.question || "-"}

            </td>

            <td>

                ${q.subject || "-"}

            </td>

            <td>

                ${q.class || "-"}

            </td>

            <td>

                ${q.questionType || "MCQ"}

            </td>

            <td>

                ${q.marks || 1}

            </td>

            <td>

                <button
                class="action-btn edit-btn"
                onclick="editQuestion('${q.id}')">

                <i class="fas fa-edit"></i>

                </button>

                <button
                class="action-btn preview-btn"
                onclick="previewQuestion('${q.id}')">

                <i class="fas fa-eye"></i>

                </button>

                <button
                class="action-btn delete-btn"
                onclick="deleteQuestion('${q.id}')">

                <i class="fas fa-trash"></i>

                </button>

            </td>

        </tr>

        `;

    });

}

// =============================
// LOAD FILTERS
// =============================

function loadFilters(){

    const classFilter =
        document.getElementById("classFilter");

    const subjectFilter =
        document.getElementById("subjectFilter");

    classFilter.innerHTML =
    `<option value="">All Classes</option>`;

    subjectFilter.innerHTML =
    `<option value="">All Subjects</option>`;

    const classes =
        [...new Set(
            allQuestions.map(
                q=>q.class
            )
        )];

    const subjects =
        [...new Set(
            allQuestions.map(
                q=>q.subject
            )
        )];

    classes.forEach(cls=>{

        if(!cls) return;

        classFilter.innerHTML +=

        `<option value="${cls}">
            ${cls}
        </option>`;

    });

    subjects.forEach(sub=>{

        if(!sub) return;

        subjectFilter.innerHTML +=

        `<option value="${sub}">
            ${sub}
        </option>`;

    });

}

// =============================
// FILTER
// =============================

function filterQuestions(){

    const search =

        document
        .getElementById("searchBox")
        .value
        .toLowerCase();

    const classValue =

        document
        .getElementById("classFilter")
        .value;

    const subjectValue =

        document
        .getElementById("subjectFilter")
        .value;

    const typeValue =

        document
        .getElementById("typeFilter")
        .value;

    const filtered =

        allQuestions.filter(q=>{

            const searchMatch =

                (q.question||"")
                .toLowerCase()
                .includes(search);

            const classMatch =

                classValue==="" ||

                String(q.class)===classValue;

            const subjectMatch =

                subjectValue==="" ||

                q.subject===subjectValue;

            const typeMatch =

                typeValue==="" ||

                q.questionType===typeValue ||

                (
                    typeValue==="mcq" &&
                    !q.questionType
                );

            return(

                searchMatch &&

                classMatch &&

                subjectMatch &&

                typeMatch

            );

        });

    renderQuestions(filtered);

}

// =============================
// DELETE
// =============================

window.deleteQuestion =
async function(id){

    if(
        !confirm(
            "Delete this question?"
        )
    ) return;

    try{

        await deleteDoc(

            doc(
                db,
                "questions",
                id
            )

        );

        loadQuestions();

    }
    catch(error){

        console.error(error);

        alert(
            "Unable To Delete"
        );

    }

};

// =============================
// PLACEHOLDERS
// =============================

window.editQuestion=function(id){

    alert(
        "Edit Module Coming Next\n\nQuestion ID:\n"+id
    );

};

window.previewQuestion=function(id){

    alert(
        "Preview Module Coming Next\n\nQuestion ID:\n"+id
    );

};

// =============================
// EVENTS
// =============================

document
.getElementById("searchBox")
.addEventListener(
    "input",
    filterQuestions
);

document
.getElementById("classFilter")
.addEventListener(
    "change",
    filterQuestions
);

document
.getElementById("subjectFilter")
.addEventListener(
    "change",
    filterQuestions
);

document
.getElementById("typeFilter")
.addEventListener(
    "change",
    filterQuestions
);

// =============================
// START
// =============================

loadQuestions();
