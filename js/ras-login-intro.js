// RAS branding intro — 6 seconds, once per login/session.
(function(){
    const INTRO_VERSION = "20260811-1";
    try {
        const role = localStorage.getItem("role") || localStorage.getItem("participantRole") || "user";
        let loginSession = localStorage.getItem("loginSessionId") || sessionStorage.getItem("loginSessionId");
        if (!loginSession) {
            loginSession = role + "-" + Date.now();
            sessionStorage.setItem("loginSessionId", loginSession);
        }

        const key = "rasIntroShown_" + INTRO_VERSION + "_" + loginSession;
        if (sessionStorage.getItem(key) === "1") return;
        sessionStorage.setItem(key, "1");

        const start = () => {
            if (document.querySelector(".ras-intro-overlay")) return;
            const overlay = document.createElement("div");
            overlay.className = "ras-intro-overlay";
            overlay.setAttribute("aria-label", "RAS Systems introduction");
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
            requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add("show")));

            // Full splash duration = exactly 6 seconds from creation.
            setTimeout(() => overlay.classList.add("hide"), 5550);
            setTimeout(() => {
                overlay.remove();
                document.documentElement.classList.remove("ras-intro-active");
            }, 6000);
        };

        if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, {once:true});
        else start();
    } catch (e) {
        console.warn("RAS intro skipped:", e);
    }
})();
