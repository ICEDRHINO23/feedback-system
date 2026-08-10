// ========================================
// AHPS Assessment System
// Authentication & Authorization
// ========================================

const role = localStorage.getItem("role");

if (!role) {
    alert("Please login first.");
    window.location.href = "login.html";
}

const page = window.location.pathname.toLowerCase();

const isAdminPage = page.includes("/admin/");

const isStudentPage =
    !isAdminPage &&
    (
        page.includes("dashboard.html") ||
        page.includes("exam.html") ||
        page.includes("result.html")
    );

if (isAdminPage && role !== "admin") {
    alert("Administrator Login Required");
    window.location.href = "../login.html";
}

if (isStudentPage && role !== "student") {
    alert("Unauthorized Access");
    window.location.href = "login.html";
}

// Results-page compatibility fix.
// It repairs the individual Report action after results.js renders the table.
if (isAdminPage && page.endsWith("/results.html")) {
    const reportFix = document.createElement("script");
    reportFix.src = "../js/results-report-fix.js?v=2";
    document.head.appendChild(reportFix);
}
