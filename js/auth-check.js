// =========================
// LOGIN PROTECTION
// =========================

const role = localStorage.getItem("role");

if (!role) {

    alert("Please login first.");

    window.location.href = "login.html";

}

// =========================
// STUDENT PAGES
// =========================

const page =
    window.location.pathname.toLowerCase();

if (
    page.includes("dashboard.html") ||
    page.includes("exam.html") ||
    page.includes("result.html")
) {

    if (role !== "student") {

        alert("Unauthorized Access");

        window.location.href = "login.html";

    }

}

// =========================
// ADMIN PAGES
// =========================

if (
    page.includes("/admin/")
) {

    if (role !== "admin") {

        alert("Administrator Login Required");

        window.location.href = "../login.html";

    }

}
