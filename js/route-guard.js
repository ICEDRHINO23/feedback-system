// ================================
// Student Route Guard
// ================================

const role = localStorage.getItem("role");

if (!role) {
    window.location.replace("login.html");
}

if (role !== "student") {
    window.location.replace("login.html");
}
