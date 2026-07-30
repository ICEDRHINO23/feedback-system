const score = localStorage.getItem("latestScore") || 0;
const total = localStorage.getItem("latestTotal") || 0;

document.getElementById("scoreText").innerHTML =
    `Your Score : ${score}/${total}`;

function goDashboard() {
    window.location.href = "dashboard.html";
}

window.goDashboard = goDashboard;
