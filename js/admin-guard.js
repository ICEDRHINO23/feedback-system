const role = localStorage.getItem("role");

if (!role || role !== "admin") {
    window.location.replace("../login.html");
}
