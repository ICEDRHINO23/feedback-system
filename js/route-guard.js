// ======================================
// AHPS ONLINE EXAMINATION SYSTEM
// CENTRAL ROUTE GUARD
// ======================================

(() => {
    const role = localStorage.getItem("role");
    const path = window.location.pathname.toLowerCase();
    const file = path.split("/").pop();

    // Public authentication / landing pages
    const publicPage =
        file === "login.html" ||
        file === "teacher-login.html" ||
        file === "register.html" ||
        file === "index.html" ||
        file === "";

    if (publicPage) return;

    // Every protected page requires a logged-in role.
    if (!role) {
        alert("Please login first.");
        window.location.replace(
            path.includes("/admin/") ? "../login.html" : "login.html"
        );
        return;
    }

    // --------------------------------------
    // ADMIN ROUTES
    // --------------------------------------
    if (path.includes("/admin/")) {
        if (role !== "admin") {
            alert("Administrator Login Required");
            window.location.replace("../login.html");
        }
        return;
    }

    // --------------------------------------
    // TEACHER ROUTES
    // --------------------------------------
    const teacherPage =
        file === "teacher-dashboard.html" ||
        file === "teacher-results.html";

    if (teacherPage) {
        if (role !== "teacher") {
            alert("Teacher Login Required");
            window.location.replace("teacher-login.html");
        }
        return;
    }

    // --------------------------------------
    // SHARED EXAM ROUTE
    // --------------------------------------
    if (file === "exam.html") {
        if (role !== "student" && role !== "teacher") {
            alert("Student or Teacher Login Required");
            window.location.replace("login.html");
        }
        return;
    }

    // --------------------------------------
    // STUDENT ROUTES
    // --------------------------------------
    const studentPage =
        file === "dashboard.html" ||
        file === "student-exam.html" ||
        file === "result.html" ||
        file === "profile.html";

    if (studentPage && role !== "student") {
        alert("Student Login Required");
        window.location.replace("login.html");
        return;
    }
})();
