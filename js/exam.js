import { db } from "./supabase-config.js";

import {
    collection,
    getDocs,
    addDoc
} from "./supabase-firestore.js";

const examId = localStorage.getItem("currentExamId");
let questions = [];
let totalDuration = 30;
let currentExam = null;

// ==========================
// LOAD QUESTIONS
// ==========================
async function loadQuestions() {
    try {
        const container = document.getElementById("questionContainer");
        container.innerHTML = "";

        const examSnapshot = await getDocs(collection(db, "exams"));

        examSnapshot.forEach(docSnap => {
            if (docSnap.id === examId) {
                currentExam = docSnap.data();
                totalDuration = Number(currentExam.duration || 30);
            }
        });

        const questionSnapshot = await getDocs(collection(db, "questions"));
        let count = 1;

        questionSnapshot.forEach(docSnap => {
            const q = docSnap.data();

            if (q.examId !== examId) return;

            questions.push({ id: docSnap.id, ...q });

            if (!q.questionType || q.questionType === "mcq") {
                container.innerHTML += `
                    <div class="question-box">
                        <h3>Q${count}. ${q.question}</h3>
                        <label><input type="radio" name="${docSnap.id}" value="A"> ${q.optionA}</label>
                        <label><input type="radio" name="${docSnap.id}" value="B"> ${q.optionB}</label>
                        <label><input type="radio" name="${docSnap.id}" value="C"> ${q.optionC}</label>
                        <label><input type="radio" name="${docSnap.id}" value="D"> ${q.optionD}</label>
                    </div>`;
            }

            if (q.questionType === "multiple") {
                container.innerHTML += `
                    <div class="question-box">
                        <h3>Q${count}. ${q.question}</h3>
                        <label><input type="checkbox" name="${docSnap.id}" value="A"> ${q.optionA}</label>
                        <label><input type="checkbox" name="${docSnap.id}" value="B"> ${q.optionB}</label>
                        <label><input type="checkbox" name="${docSnap.id}" value="C"> ${q.optionC}</label>
                        <label><input type="checkbox" name="${docSnap.id}" value="D"> ${q.optionD}</label>
                    </div>`;
            }

            if (q.questionType === "sentence") {
                container.innerHTML += `
                    <div class="question-box">
                        <h3>Q${count}. ${q.question}</h3>
                        <textarea id="answer_${docSnap.id}" rows="5" placeholder="Write your answer here"></textarea>
                    </div>`;
            }

            count++;
        });

        if (questions.length === 0) {
            container.innerHTML = "<h3>No Questions Found</h3>";
        }

        startTimer();
    } catch (error) {
        console.error("Question Load Error:", error);
        document.getElementById("questionContainer").innerHTML =
            "<h3>Error Loading Questions</h3>";
    }
}

// ==========================
// TIMER
// ==========================
function startTimer() {
    let timeLeft = totalDuration * 60;
    const timer = document.getElementById("timer");

    const interval = setInterval(() => {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;

        if (timer) {
            timer.innerHTML = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
        }

        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(interval);
            alert("Time Up! Assessment Submitted.");
            submitExam();
        }
    }, 1000);
}

// ==========================
// SUBMIT EXAM
// ==========================
window.submitExam = async function () {
    try {
        let automaticMarks = 0;
        let totalMarks = 0;
        let correctAnswers = 0;
        const subjectiveAnswers = [];
        const review = [];

        questions.forEach(q => {
            const marks = Number(q.marks || 1);
            totalMarks += marks;

            // ==========================
            // MCQ
            // ==========================
            if (!q.questionType || q.questionType === "mcq") {
                const selected = document.querySelector(`input[name="${q.id}"]:checked`);
                const selectedAnswer = selected ? selected.value : "";
                const earned = selectedAnswer === q.answer ? marks : 0;

                automaticMarks += earned;
                if (earned > 0) correctAnswers++;

                review.push({
                    questionId: q.id,
                    question: q.question || "",
                    questionType: "mcq",
                    selectedAnswer,
                    correctAnswer: q.answer || "",
                    marks: earned,
                    totalMarks: marks
                });
            }

            // ==========================
            // MULTIPLE ANSWER
            // ==========================
            if (q.questionType === "multiple") {
                const selectedAnswers = [];

                document.querySelectorAll(`input[name="${q.id}"]:checked`).forEach(box => {
                    selectedAnswers.push(box.value);
                });

                const correctOptions = q.answers || [];
                const isCorrect =
                    selectedAnswers.length === correctOptions.length &&
                    selectedAnswers.every(answer => correctOptions.includes(answer));

                const earned = isCorrect ? marks : 0;
                automaticMarks += earned;
                if (isCorrect) correctAnswers++;

                review.push({
                    questionId: q.id,
                    question: q.question || "",
                    questionType: "multiple",
                    selectedAnswer: selectedAnswers.join(", "),
                    correctAnswer: correctOptions.join(", "),
                    marks: earned,
                    totalMarks: marks
                });
            }

            // ==========================
            // DESCRIPTIVE / SENTENCE
            // ==========================
            if (q.questionType === "sentence") {
                const answerBox = document.getElementById(`answer_${q.id}`);
                const studentAnswer = answerBox ? answerBox.value.trim() : "";

                subjectiveAnswers.push({
                    questionId: q.id,
                    question: q.question || "",
                    modelAnswer: q.modelAnswer || "",
                    studentAnswer,
                    maxMarks: marks,
                    teacherMarks: null,
                    teacherRemark: "",
                    evaluationStatus: "pending"
                });

                review.push({
                    questionId: q.id,
                    question: q.question || "",
                    questionType: "sentence",
                    selectedAnswer: studentAnswer,
                    correctAnswer: q.modelAnswer || "",
                    marks: 0,
                    totalMarks: marks
                });
            }
        });

        const role = localStorage.getItem("role") || localStorage.getItem("participantRole");
        const participantName =
            role === "teacher"
                ? localStorage.getItem("teacherName")
                : localStorage.getItem("studentName");

        const studentClass = localStorage.getItem("studentClass") || "";
        const studentSection = localStorage.getItem("studentSection") || "";
        const hasDescriptiveQuestions = subjectiveAnswers.length > 0;

        // Descriptive marks are deliberately NOT included until the teacher evaluates them.
        const initialScore = automaticMarks;
        const initialPercentage = totalMarks > 0
            ? Number(((initialScore / totalMarks) * 100).toFixed(2))
            : 0;

        await addDoc(collection(db, "results"), {
            examId,
            examName: currentExam?.examName || "",
            subject: currentExam?.subject || "",
            examClass: currentExam?.examClass || "",
            studentName: participantName || "",
            studentClass,
            studentSection,
            section: studentSection,
            rollNo: localStorage.getItem("rollNo") || "",

            // Scoring
            score: initialScore,
            automaticMarks,
            descriptiveMarks: 0,
            totalMarks,
            correctAnswers,
            totalQuestions: questions.length,
            percentage: initialPercentage,

            // Teacher evaluation pipeline
            hasDescriptiveQuestions,
            subjectiveAnswers,
            review,
            reviewStatus: hasDescriptiveQuestions ? "pending" : "completed",
            resultPublished: !hasDescriptiveQuestions,

            submittedAt: new Date().toISOString()
        });

        alert(
            hasDescriptiveQuestions
                ? "Assessment Submitted Successfully. Descriptive answers are pending teacher evaluation."
                : "Assessment Submitted Successfully"
        );

        window.location.href = "dashboard.html";
    } catch (error) {
        console.error("Submit Error:", error);
        alert("Failed To Submit Assessment\n\n" + error.message);
    }
};

// ==========================
// START
// ==========================
if (!examId) {
    alert("No Assessment Selected");
    window.location.href = "dashboard.html";
} else {
    loadQuestions();
}
