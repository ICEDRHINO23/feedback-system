const adminRole = localStorage.getItem("role");

if (adminRole !== "admin") {

    alert("Administrator Login Required");

    window.location.href = "../login.html";

}
