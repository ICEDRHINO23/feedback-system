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

window.submitExam =
    submitExam;


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

    if (
        questions.length === 0
    ) {

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
    // OPTIONS
    // ==================================

    const optionsDiv =
        document.getElementById(
            "options"
        );


    if (!optionsDiv) {

        return;

    }


    optionsDiv.innerHTML = "";


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


    if (
        questions.length === 0
    ) {

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
    // SCORE VARIABLES
    // ==================================

    let score = 0;

    let totalMarks = 0;

    let correctAnswers = 0;

    let review = [];


    // ==================================
    // PROCESS QUESTIONS
    // ==================================

    questions.forEach(
        (q, index) => {

            const studentAnswer =
                answers[index] ||
                "";


            const correctAnswer =
                q.answer || "";


            const marks =
                Number(
                    q.marks || 1
                );


            totalMarks +=
                marks;


            const isCorrect =
                studentAnswer ===
                correctAnswer;


            if (isCorrect) {

                score +=
                    marks;

                correctAnswers++;

            }


            // ==================================
            // REVIEW DATA
            // ==================================

            review.push({

                questionId:
                    q.id || "",

                question:
                    q.question || "",

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
                    isCorrect

            });

        }
    );


    // ==================================
    // PERCENTAGE
    // ==================================

    const percentage =
        totalMarks > 0
            ? (
                score /
                totalMarks
            ) * 100
            : 0;


    console.log(
        "Score:",
        score
    );

    console.log(
        "Total Marks:",
        totalMarks
    );

    console.log(
        "Percentage:",
        percentage
    );

    console.log(
        "Review:",
        review
    );


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
                    // STUDENT DETAILS
                    // ==========================

                    studentName:
                        localStorage.getItem(
                            "studentName"
                        ) || "",

                    studentClass:
                        localStorage.getItem(
                            "studentClass"
                        ) || "",

                    studentSection:
                        localStorage.getItem(
                            "studentSection"
                        ) || "",


                    // ==========================
                    // EXAM DETAILS
                    // ==========================

                    examId:
                        examId,

                    examName:
                        exam.examName ||
                        "",

                    subject:
                        exam.subject ||
                        "",


                    // ==========================
                    // RESULT
                    // ==========================

                    score:
                        score,

                    totalMarks:
                        totalMarks,

                    correctAnswers:
                        correctAnswers,

                    totalQuestions:
                        questions.length,

                    percentage:
                        percentage.toFixed(
                            2
                        ),


                    // ==========================
                    // REVIEW
                    // ==========================

                    review:
                        review,


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
        // SAVE LATEST RESULT LOCALLY
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
        // SUCCESS
        // ==================================

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


        window.location.href =
            "result.html?id=" +
            resultRef.id;

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
// START
// ======================================

initializeExam();
