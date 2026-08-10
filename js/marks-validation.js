(() => {
    const STYLE = `
        #marksValidationPopup{position:fixed;top:22px;right:22px;z-index:99999;max-width:360px;padding:14px 16px;border-radius:14px;background:#fff4f2;border:1px solid #f3b7b0;box-shadow:0 14px 35px rgba(16,32,68,.18);font-family:Inter,Segoe UI,Arial,sans-serif;color:#8b1e16;display:none}
        #marksValidationPopup.show{display:block;animation:marksPopIn .2s ease-out}
        #marksValidationPopup strong{display:block;font-size:14px;margin-bottom:4px}
        #marksValidationPopup span{font-size:12px;line-height:1.45}
        .marks-input.marks-invalid{border:2px solid #d92d20!important;background:#fff4f2!important;outline:none!important}
        @keyframes marksPopIn{from{opacity:0;transform:translateY(-8px) scale(.98)}to{opacity:1;transform:none}}
    `;
    const style = document.createElement('style');
    style.textContent = STYLE;
    document.head.appendChild(style);

    const popup = document.createElement('div');
    popup.id = 'marksValidationPopup';
    popup.innerHTML = '<strong>⚠ Invalid Marks</strong><span id="marksValidationText"></span>';
    document.body.appendChild(popup);

    let hideTimer = null;
    function showPopup(message, input) {
        const text = document.getElementById('marksValidationText');
        if (text) text.textContent = message;
        popup.classList.add('show');
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => popup.classList.remove('show'), 3500);
        if (input) {
            input.classList.add('marks-invalid');
            input.focus();
        }
    }

    function validateInput(input) {
        const max = Number(input.getAttribute('max'));
        const value = Number(input.value);
        if (!Number.isFinite(value)) return true;
        if (value < 0 || (Number.isFinite(max) && value > max)) {
            showPopup(`Marks obtained cannot be more than ${max} or less than 0.`, input);
            return false;
        }
        input.classList.remove('marks-invalid');
        return true;
    }

    document.addEventListener('input', event => {
        if (event.target.classList && event.target.classList.contains('marks-input')) {
            validateInput(event.target);
        }
    });

    document.addEventListener('click', event => {
        const button = event.target.closest('#publishBtn');
        if (!button) return;

        const inputs = [...document.querySelectorAll('.marks-input')];
        const invalid = inputs.find(input => !validateInput(input));
        if (invalid) {
            event.preventDefault();
            event.stopImmediatePropagation();
            showPopup(`Please correct the marks. Maximum allowed is ${invalid.getAttribute('max')}.`, invalid);
        }
    }, true);
})();
