// RAS branding intro: exactly 6 seconds, once per login session.
(function(){
    try {
        const role = localStorage.getItem("role") || localStorage.getItem("participantRole") || "user";
        const loginSession = localStorage.getItem("loginSessionId") || sessionStorage.getItem("loginSessionId") || (role + "-" + Date.now());
        sessionStorage.setItem("loginSessionId", loginSession);
        const key = "rasIntroShown_" + loginSession;
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");

        const overlay = document.createElement("div");
        overlay.className = "ras-intro-overlay";
        overlay.innerHTML = `
            <div class="ras-intro-glow"></div>
            <div class="ras-intro-content">
                <div class="ras-intro-logo-wrap">
                    <img src="assets/ras-logo.jpeg" class="ras-intro-logo" alt="RAS Systems">
                </div>
                <div class="ras-intro-line"></div>
                <div class="ras-intro-title">RAS SYSTEMS</div>
                <div class="ras-intro-subtitle">Technology • Innovation • Excellence</div>
                <div class="ras-intro-loader"><span></span></div>
                <div class="ras-intro-powered">POWERING AHPS DIGITAL ASSESSMENT</div>
            </div>`;
        document.body.appendChild(overlay);
        document.documentElement.classList.add("ras-intro-active");
        requestAnimationFrame(() => overlay.classList.add("show"));
        // Keep the splash completely visible for 6 seconds.
        setTimeout(() => overlay.classList.add("hide"), 5550);
        setTimeout(() => {
            overlay.remove();
            document.documentElement.classList.remove("ras-intro-active");
        }, 6000);
    } catch (e) {
        console.warn("RAS intro skipped:", e);
    }
})();
