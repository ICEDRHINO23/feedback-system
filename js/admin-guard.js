const adminRole = localStorage.getItem("role");

if (adminRole !== "admin") {
    alert("Administrator Login Required");
    window.location.href = "../login.html";
}

// Dashboard RAS logo visibility fix.
// The source asset is JPEG, so keep it visible while blending its white
// outer area into the navy dashboard background.
if (window.location.pathname.toLowerCase().endsWith("/admin/dashboard.html")) {
    const style = document.createElement("style");
    style.textContent = `
        .ras-logo {
            width: 105px !important;
            height: 105px !important;
            object-fit: contain !important;
            background: #06245f !important;
            border-radius: 50% !important;
            mix-blend-mode: multiply !important;
            filter: brightness(1.55) saturate(1.35) contrast(1.08) !important;
        }
        @media(max-width:760px){
            .ras-logo{width:62px !important;height:62px !important;}
        }
    `;
    document.head.appendChild(style);
}
