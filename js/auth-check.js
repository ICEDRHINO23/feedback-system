// ========================================
// AHPS Assessment System
// Authentication & Authorization
// ========================================

// =========================
// STEP 1: Check Login
// =========================

const role = localStorage.getItem("role");

if (!role) {

    alert("Please login first.");

    window.location.href = "login.html";
}

// =========================
// STEP 2: Get Current Page
// =========================

const page =
    window.location.pathname.toLowerCase();

// =========================
// STEP 3: Identify Page Type
// =========================

const isAdminPage =
    page.includes("/admin/");

const isStudentPage =
    !isAdminPage &&
    (
        page.includes("dashboard.html") ||
        page.includes("exam.html") ||
        page.includes("result.html")
    );

// =========================
// STEP 4: Protect Admin Pages
// =========================

if (isAdminPage && role !== "admin") {

    alert("Administrator Login Required");

    window.location.href =
        "../login.html";
}

// =========================
// STEP 5: Protect Student Pages
// =========================

if (isStudentPage && role !== "student") {

    alert("Unauthorized Access");

    window.location.href =
        "login.html";
}

// =========================
// END OF AUTH CHECK
// =========================
