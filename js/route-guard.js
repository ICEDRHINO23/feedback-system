// ======================================
// STUDENT ROUTE GUARD
// ======================================

(() => {

    const userRole =
        localStorage.getItem("role");

    console.log(
        "Route Guard Role:",
        userRole
    );

    if (!userRole) {

        alert(
            "Please login first."
        );

        window.location.replace(
            "login.html"
        );

        return;

    }

    if (userRole !== "student") {

        alert(
            "Access Denied!"
        );

        window.location.replace(
            "login.html"
        );

        return;

    }

    console.log(
        "Student Route Guard Passed"
    );

})();
