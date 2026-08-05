import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    deleteDoc,
    updateDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let allQuestions = [];
let currentQuestionId = "";

// ======================================
// LOAD QUESTIONS
// ======================================

async function loadQuestions() {

    const table =
        document.getElementById("questionTable");

    try {

        table.innerHTML = `
        <tr>
            <td colspan="6">
                Loading Questions...
            </td>
        </tr>
        `;

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

        allQuestions.sort((a,b)=>

            (a.question || "")
            .localeCompare(
                b.question || ""
            )

        );

        renderQuestions(allQuestions);

        loadFilters();

    }

    catch(error){

        console.error(error);

        table.innerHTML=`

        <tr>

            <td colspan="6">

                Error Loading Questions

            </td>

        </tr>

        `;

    }

}

// ======================================
// RENDER TABLE
// ======================================

function renderQuestions(list){

    const table =
        document.getElementById(
            "questionTable"
        );

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

    list.forEach(q=>{

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

                ${q.questionType || "mcq"}

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

// ======================================
// LOAD FILTERS
// ======================================

function loadFilters(){

    const classFilter =
        document.getElementById(
            "classFilter"
        );

    const subjectFilter =
        document.getElementById(
            "subjectFilter"
        );

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

    classes
    .sort()
    .forEach(cls=>{

        if(!cls) return;

        classFilter.innerHTML += `

        <option value="${cls}">

            ${cls}

        </option>

        `;

    });

    subjects
    .sort()
    .forEach(subject=>{

        if(!subject) return;

        subjectFilter.innerHTML += `

        <option value="${subject}">

            ${subject}

        </option>

        `;

    });

}

// ======================================
// FILTER QUESTIONS
// ======================================

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

                (q.question || "")
                .toLowerCase()
                .includes(search);

            const classMatch =

                classValue === "" ||

                String(q.class) === classValue;

            const subjectMatch =

                subjectValue === "" ||

                q.subject === subjectValue;

            const typeMatch =

                typeValue === "" ||

                q.questionType === typeValue ||

                (
                    typeValue==="mcq" &&
                    !q.questionType
                );

            return (

                searchMatch &&

                classMatch &&

                subjectMatch &&

                typeMatch

            );

        });

    renderQuestions(filtered);
    // ======================================
// PREVIEW QUESTION
// ======================================

window.previewQuestion = function(id){

    const question =
        allQuestions.find(q => q.id === id);

    if(!question) return;

    document.getElementById("previewQuestion").innerHTML =
        question.question || "";

    let optionsHTML = "";

    if(question.optionA){

        optionsHTML += `
        <p>A. ${question.optionA}</p>
        `;

    }

    if(question.optionB){

        optionsHTML += `
        <p>B. ${question.optionB}</p>
        `;

    }

    if(question.optionC){

        optionsHTML += `
        <p>C. ${question.optionC}</p>
        `;

    }

    if(question.optionD){

        optionsHTML += `
        <p>D. ${question.optionD}</p>
        `;

    }

    document.getElementById("previewOptions").innerHTML =
        optionsHTML;

    document.getElementById("previewAnswer").innerHTML =
        question.answer || "-";

    document.getElementById("previewMarks").innerHTML =
        question.marks || 1;

    document.getElementById("previewModal").style.display =
        "block";

};

// ======================================
// CLOSE PREVIEW
// ======================================

window.closePreview = function(){

    document.getElementById(
        "previewModal"
    ).style.display = "none";

};

// ======================================
// EDIT QUESTION
// ======================================

window.editQuestion = function(id){

    const question =
        allQuestions.find(q => q.id === id);

    if(!question) return;

    currentQuestionId = id;

    document.getElementById("editQuestion").value =
        question.question || "";

    document.getElementById("editOptionA").value =
        question.optionA || "";

    document.getElementById("editOptionB").value =
        question.optionB || "";

    document.getElementById("editOptionC").value =
        question.optionC || "";

    document.getElementById("editOptionD").value =
        question.optionD || "";

    document.getElementById("editAnswer").value =
        question.answer || "A";

    document.getElementById("editMarks").value =
        question.marks || 1;

    document.getElementById("editModal").style.display =
        "block";

};

// ======================================
// CLOSE EDIT
// ======================================

window.closeEdit = function(){

    document.getElementById(
        "editModal"
    ).style.display = "none";

};

// ======================================
// UPDATE QUESTION
// ======================================

async function updateQuestion(){

    if(currentQuestionId===""){

        alert("No Question Selected");

        return;

    }

    try{

        await updateDoc(

            doc(
                db,
                "questions",
                currentQuestionId
            ),

            {

                question:
                    document.getElementById("editQuestion").value,

                optionA:
                    document.getElementById("editOptionA").value,

                optionB:
                    document.getElementById("editOptionB").value,

                optionC:
                    document.getElementById("editOptionC").value,

                optionD:
                    document.getElementById("editOptionD").value,

                answer:
                    document.getElementById("editAnswer").value,

                marks:Number(

                    document.getElementById("editMarks").value

                )

            }

        );

        closeEdit();

        loadQuestions();

        alert("Question Updated Successfully");

    }

    catch(error){

        console.error(error);

        alert("Unable To Update Question");

    }

}




    // ======================================
// DELETE QUESTION
// ======================================

window.deleteQuestion = async function(id){

    const question =
        allQuestions.find(q => q.id === id);

    if(!question) return;

    const confirmDelete = confirm(

        "Delete this question?\n\n" +

        question.question +

        "\n\nThis action cannot be undone."

    );

    if(!confirmDelete) return;

    try{

        await deleteDoc(

            doc(
                db,
                "questions",
                id
            )

        );

        allQuestions =
            allQuestions.filter(

                q => q.id !== id

            );

        filterQuestions();

        alert(
            "Question Deleted Successfully."
        );

    }

    catch(error){

        console.error(error);

        alert(
            "Unable To Delete Question."
        );

    }

};
    // ======================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
// ======================================

window.onclick = function(event){

    const preview =
        document.getElementById(
            "previewModal"
        );

    const edit =
        document.getElementById(
            "editModal"
        );

    if(event.target === preview){

        closePreview();

    }

    if(event.target === edit){

        closeEdit();

    }

};
    // ======================================
// ESC KEY
// ======================================

document.addEventListener(

    "keydown",

    function(event){

        if(event.key==="Escape"){

            closePreview();

            closeEdit();

        }

    }

);
    // ======================================
// EVENTS
// ======================================

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
// ======================================
// UPDATE BUTTON
// ======================================
const updateBtn =
    document.getElementById(
        "updateBtn"
    )
if(updateBtn){

    updateBtn.addEventListener(

        "click",

        updateQuestion

    );

}
    // ======================================
// START
// ======================================

loadQuestions();

}
