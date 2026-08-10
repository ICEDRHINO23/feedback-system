// RAS branding intro shown once after a successful login.
(function(){
    try {
        const key = "rasIntroShown_" + (localStorage.getItem("participantRole") || "user");
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
            </div>`;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add("show"));
        setTimeout(() => overlay.classList.add("hide"), 2100);
        setTimeout(() => overlay.remove(), 2700);
    } catch (e) {
        console.warn("RAS intro skipped:", e);
    }
})();
