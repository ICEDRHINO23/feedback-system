import { db } from "./firebase-config.js";

import {
    collection,
    getDocs,
    addDoc,
    doc,
    getDoc,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ======================================
// GLOBAL VARIABLES
// ======================================

let questions = [];

let currentQuestion = 0;

let answers = {};

let exam = {};

let examId =
    localStorage.getItem("currentExamId");

let timerInterval = null;

let remainingSeconds = 0;

let submitting = false;


// ======================================
// CHECK EXAM ID
// ======================================

if (!examId) {

    alert("Assessment not selected.");

    window.location.href = "dashboard.html";

}


// ======================================
// BUTTON FUNCTIONS
// ======================================

window.previousQuestion =
    previousQuestion;

window.nextQuestion =
    nextQuestion;

// ======================================
// LOAD EXAM
// ======================================

async function loadExam() {

    try {

        console.log(
            "Current Exam ID:",
            examId
        );

        const examRef =
            doc(
                db,
                "exams",
                examId
            );

        const examSnap =
            await getDoc(examRef);

        if (!examSnap.exists()) {

            alert(
                "Assessment not found."
            );

            window.location.href =
                "dashboard.html";

            return false;
        }

        exam =
            examSnap.data();

        console.log(
            "Exam Data:",
            exam
        );


        // ==================================
        // EXAM TITLE
        // ==================================

        const titleElement =
            document.getElementById(
                "examTitle"
            );

        if (titleElement) {

            titleElement.innerText =
                exam.examName ||
                "Online Examination";

        }


        // ==================================
        // LOADING TITLE FALLBACK
        // ==================================

        const loadingElement =
            document.getElementById(
                "loadingTitle"
            );

        if (loadingElement) {

            loadingElement.innerText =
                exam.examName ||
                "Online Examination";

        }


        // ==================================
        // TIMER
        // ==================================

        const duration =
            Number(
                exam.duration || 0
            );

        if (duration > 0) {

            remainingSeconds =
                duration * 60;

            startTimer();

        }
        else {

            console.warn(
                "Exam duration not found."
            );

            updateTimerDisplay();

        }

        return true;

    }
    catch (error) {

        console.error(
            "Exam Loading Error:",
            error
        );

        alert(
            "Unable to load assessment."
        );

        return false;

    }

}


// ======================================
// LOAD QUESTIONS
// ======================================

async function loadQuestions() {

    try {

        console.log(
            "Loading questions for:",
            examId
        );


        const questionsQuery =
            query(
                collection(
                    db,
                    "questions"
                ),
                where(
                    "examId",
                    "==",
                    examId
                )
            );


        const snapshot =
            await getDocs(
                questionsQuery
            );


        questions = [];


        snapshot.forEach(
            (docSnap) => {

                questions.push({

                    id:
                        docSnap.id,

                    ...docSnap.data()

                });

            }
        );


        console.log(
            "Questions Loaded:",
            questions.length
        );


        if (
            questions.length === 0
        ) {

            const questionText =
                document.getElementById(
                    "questionText"
                );

            if (questionText) {

                questionText.innerText =
                    "No Questions Found";

            }

            return;

        }


        showQuestion();

    }
    catch (error) {

        console.error(
            "Question Loading Error:",
            error
        );

        const questionText =
            document.getElementById(
                "questionText"
            );

        if (questionText) {

            questionText.innerText =
                "Unable to load questions.";

        }

    }

}


// ======================================
// SHOW QUESTION
// ======================================

function showQuestion() {

    if (questions.length === 0) {
        return;
    }


    const q =
        questions[currentQuestion];


    // ==================================
    // QUESTION NUMBER + TEXT
    // ==================================

    const questionText =
        document.getElementById(
            "questionText"
        );


    if (questionText) {

        questionText.innerText =
            (
                currentQuestion + 1
            ) +
            ". " +
            (
                q.question || ""
            );

    }


    // ==================================
    // OPTIONS / ANSWER AREA
    // ==================================

    const optionsDiv =
        document.getElementById(
            "options"
        );


    if (!optionsDiv) {
        return;
    }


    // Clear previous question

    optionsDiv.innerHTML = "";


    // ==================================
    // DESCRIPTIVE QUESTION
    // ==================================

    if (
        q.questionType === "sentence"
    ) {

        const label =
            document.createElement(
                "div"
            );


        label.innerText =
            "Your Answer:";


        label.style.fontWeight =
            "bold";

        label.style.marginBottom =
            "10px";


        optionsDiv.appendChild(
            label
        );


        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.id =
            "descriptiveAnswer";


        textarea.placeholder =
            "Write your answer here...";


        textarea.rows = 8;


        textarea.style.width =
            "100%";


        textarea.style.padding =
            "12px";


        textarea.style.boxSizing =
            "border-box";


        textarea.style.borderRadius =
            "8px";


        textarea.style.border =
            "1px solid #ccc";


        textarea.style.resize =
            "vertical";


        // ==================================
        // RESTORE PREVIOUS ANSWER
        // ==================================

        textarea.value =
            answers[currentQuestion] ||
            "";


        // ==================================
        // SAVE ANSWER WHILE TYPING
        // ==================================

        textarea.addEventListener(
            "input",
            function () {

                answers[currentQuestion] =
                    textarea.value;

            }
        );


        optionsDiv.appendChild(
            textarea
        );


        updateNavigation();

        return;

    }


    // ==================================
    // AUTOMATIC QUESTION
    // ==================================

    const options = [

        {
            key: "A",
            text: q.optionA || ""
        },

        {
            key: "B",
            text: q.optionB || ""
        },

        {
            key: "C",
            text: q.optionC || ""
        },

        {
            key: "D",
            text: q.optionD || ""
        }

    ];


    options.forEach(
        (option) => {

            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.className =
                "option-btn";


            button.innerText =
                option.key +
                ". " +
                option.text;


            // ==================================
            // RESTORE SELECTED ANSWER
            // ==================================

            if (
                answers[currentQuestion] ===
                option.key
            ) {

                button.classList.add(
                    "selected"
                );

            }


            // ==================================
            // SAVE ANSWER
            // ==================================

            button.onclick =
                function () {

                    saveAnswer(
                        option.key
                    );

                };


            optionsDiv.appendChild(
                button
            );

        }
    );


    updateNavigation();

}

  

// ======================================
// SAVE ANSWER
// ======================================

function saveAnswer(answer) {

    answers[currentQuestion] =
        answer;


    console.log(
        "Question:",
        currentQuestion + 1,
        "Answer:",
        answer
    );


    showQuestion();

}


// ======================================
// NEXT QUESTION
// ======================================

function nextQuestion() {

    if (
        currentQuestion <
        questions.length - 1
    ) {

        currentQuestion++;

        showQuestion();

    }

}


// ======================================
// PREVIOUS QUESTION
// ======================================

function previousQuestion() {

    if (
        currentQuestion > 0
    ) {

        currentQuestion--;

        showQuestion();

    }

}


// ======================================
// NAVIGATION BUTTONS
// ======================================

function updateNavigation() {

    const previousBtn =
        document.querySelector(
            ".previous-btn"
        );


    const nextBtn =
        document.querySelector(
            ".next-btn"
        );


    if (previousBtn) {

        previousBtn.disabled =
            currentQuestion === 0;

    }


    if (nextBtn) {

        nextBtn.disabled =
            currentQuestion ===
            questions.length - 1;

    }

}


// ======================================
// TIMER
// ======================================

function startTimer() {

    clearInterval(
        timerInterval
    );


    updateTimerDisplay();


    timerInterval =
        setInterval(
            () => {

                remainingSeconds--;


                updateTimerDisplay();


                if (
                    remainingSeconds <= 0
                ) {

                    clearInterval(
                        timerInterval
                    );


                    alert(
                        "Time is over. Your assessment will be submitted automatically."
                    );


                    submitExam(
                        true
                    );

                }

            },
            1000
        );

}


// ======================================
// UPDATE TIMER
// ======================================

function updateTimerDisplay() {

    const timer =
        document.getElementById(
            "timer"
        );


    if (!timer) {

        return;

    }


    const minutes =
        Math.floor(
            remainingSeconds / 60
        );


    const seconds =
        remainingSeconds % 60;


    timer.innerText =
        String(minutes)
            .padStart(2, "0") +
        ":" +
        String(seconds)
            .padStart(2, "0");


    if (
        remainingSeconds <= 60
    ) {

        timer.style.color =
            "red";

    }

}

// ======================================
// SUBMIT EXAM
// ======================================

async function submitExam(
    autoSubmit = false
) {

    if (submitting) {
        return;
    }

    if (questions.length === 0) {

        alert(
            "No questions available."
        );

        return;
    }


    // ==================================
    // CONFIRM SUBMISSION
    // ==================================

    if (!autoSubmit) {

        const confirmed =
            confirm(
                "Are you sure you want to submit the assessment?"
            );

        if (!confirmed) {
            return;
        }

    }


    submitting = true;


    if (timerInterval) {

        clearInterval(
            timerInterval
        );

    }


    // ==================================
    // MARKING VARIABLES
    // ==================================

    let automaticMarks = 0;

    let totalMarks = 0;

    let correctAnswers = 0;

    let hasDescriptiveQuestions =
        false;

    let subjectiveAnswers = [];

    let review = [];


    // ==================================
    // PROCESS QUESTIONS
    // ==================================

    questions.forEach(
        (q, index) => {

            const marks =
                Number(
                    q.marks || 1
                );

            totalMarks += marks;


            const studentAnswer =
                answers[index] || "";


            // ==================================
            // DESCRIPTIVE QUESTION
            // ==================================

            if (
                q.questionType === "sentence"
            ) {

                hasDescriptiveQuestions =
                    true;


                subjectiveAnswers.push({

                    questionId:
                        q.id || "",

                    question:
                        q.question || "",

                    studentAnswer:
                        studentAnswer,

                    maxMarks:
                        marks,

                    teacherMarks:
                        null,

                    teacherRemark:
                        "",

                    evaluationStatus:
                        "pending"

                });


                // Descriptive questions
                // are NOT automatically marked

                review.push({

                    questionId:
                        q.id || "",

                    question:
                        q.question || "",

                    questionType:
                        "sentence",

                    selectedAnswer:
                        studentAnswer,

                    correctAnswer:
                        "",

                    marks:
                        0,

                    totalMarks:
                        marks,

                    isCorrect:
                        null,

                    evaluationStatus:
                        "pending"

                });


                return;

            }


            // ==================================
            // AUTOMATIC QUESTION
            // ==================================

            const correctAnswer =
                q.answer || "";


            const isCorrect =
                studentAnswer ===
                correctAnswer;


            if (isCorrect) {

                automaticMarks +=
                    marks;

                correctAnswers++;

            }


            review.push({

                questionId:
                    q.id || "",

                question:
                    q.question || "",

                questionType:
                    q.questionType ||
                    "mcq",

                optionA:
                    q.optionA || "",

                optionB:
                    q.optionB || "",

                optionC:
                    q.optionC || "",

                optionD:
                    q.optionD || "",

                selectedAnswer:
                    studentAnswer,

                correctAnswer:
                    correctAnswer,

                explanation:
                    q.explanation ||
                    "Not Available",

                marks:
                    isCorrect
                        ? marks
                        : 0,

                totalMarks:
                    marks,

                isCorrect:
                    isCorrect,

                evaluationStatus:
                    "automatic"

            });

        }
    );


    // ==================================
    // RESULT STATUS
    // ==================================

    let score =
        automaticMarks;

    let percentage = 0;

    let reviewStatus =
        "not_required";

    let resultPublished =
        true;


    // ==================================
    // DESCRIPTIVE QUESTIONS EXIST
    // ==================================

    if (
        hasDescriptiveQuestions
    ) {

        reviewStatus =
            "pending";

        resultPublished =
            false;

        // Do not publish
        // partial percentage

        percentage = 0;

    }


    // ==================================
    // NO DESCRIPTIVE QUESTIONS
    // ==================================

    else {

        percentage =
            totalMarks > 0
                ? (
                    (
                        score /
                        totalMarks
                    ) * 100
                )
                : 0;

    }


    // ==================================
    // STUDENT DETAILS
    // ==================================

    const studentName =
        localStorage.getItem(
            "studentName"
        ) || "";


    const studentClass =
        localStorage.getItem(
            "studentClass"
        ) || "";


    const studentSection =
        localStorage.getItem(
            "studentSection"
        ) || "";


    const rollNo =
        localStorage.getItem(
            "rollNo"
        ) || "";


    // ==================================
    // SAVE RESULT
    // ==================================

    try {

        const resultRef =
            await addDoc(
                collection(
                    db,
                    "results"
                ),
                {

                    // ==========================
                    // STUDENT
                    // ==========================

                    studentName:
                        studentName,

                    studentClass:
                        studentClass,

                    studentSection:
                        studentSection,

                    rollNo:
                        rollNo,


                    // ==========================
                    // EXAM
                    // ==========================

                    examId:
                        examId,

                    examName:
                        exam.examName ||
                        "",

                    subject:
                        exam.subject ||
                        "",

                    examClass:
                        exam.examClass ||
                        "",


                    // ==========================
                    // MARKS
                    // ==========================

                    score:
                        score,

                    automaticMarks:
                        automaticMarks,

                    descriptiveMarks:
                        0,

                    totalMarks:
                        totalMarks,

                    correctAnswers:
                        correctAnswers,

                    totalQuestions:
                        questions.length,

                    percentage:
                        Number(
                            percentage.toFixed(2)
                        ),


                    // ==========================
                    // REVIEW DATA
                    // ==========================

                    review:
                        review,

                    subjectiveAnswers:
                        subjectiveAnswers,


                    // ==========================
                    // EVALUATION STATUS
                    // ==========================

                    hasDescriptiveQuestions:
                        hasDescriptiveQuestions,

                    reviewStatus:
                        reviewStatus,

                    resultPublished:
                        resultPublished,


                    // ==========================
                    // TEACHER REVIEW
                    // ==========================

                    reviewedBy:
                        "",

                    reviewedAt:
                        null,


                    // ==========================
                    // SUBMISSION
                    // ==========================

                    submittedAt:
                        new Date()
                            .toISOString()

                }
            );


        console.log(
            "Result Saved:",
            resultRef.id
        );


        // ==================================
        // SAVE LOCAL RESULT
        // ==================================

        localStorage.setItem(
            "latestResultId",
            resultRef.id
        );


        localStorage.setItem(
            "latestScore",
            score
        );


        localStorage.setItem(
            "latestTotal",
            totalMarks
        );


        localStorage.setItem(
            "latestPercentage",
            percentage.toFixed(2)
        );


        localStorage.setItem(
            "latestCorrectAnswers",
            correctAnswers
        );


        // ==================================
        // STUDENT MESSAGE
        // ==================================

        if (
            hasDescriptiveQuestions
        ) {

            alert(

                "Assessment Submitted Successfully!\n\n" +

                "Your descriptive answers are " +
                "pending teacher evaluation.\n\n" +

                "Your final marks and result will " +
                "be published after teacher evaluation."

            );

        }

        else {

            alert(

                "Exam Submitted Successfully!\n\n" +

                "Score: " +
                score +
                "/" +
                totalMarks +

                "\nPercentage: " +

                percentage.toFixed(2) +
                "%"

            );

        }


        // ==================================
        // REDIRECT
        // ==================================

        if (
            hasDescriptiveQuestions
        ) {

            window.location.href =
                "dashboard.html";

        }

        else {

            window.location.href =
                "result.html?id=" +
                resultRef.id;

        }

    }
    catch (error) {

        submitting = false;

        console.error(
            "RESULT SAVE ERROR:",
            error
        );


        alert(
            "Failed to save result.\n\n" +
            error.message
        );

    }

}
// ======================================
// INITIALIZE
// ======================================

async function initializeExam() {

    const examLoaded =
        await loadExam();


    if (!examLoaded) {

        return;

    }


    await loadQuestions();

}


// ======================================
// EXPOSE BUTTON FUNCTIONS
// ======================================

window.submitExam =
    submitExam;


// ======================================
// START
// ======================================

initializeExam();
