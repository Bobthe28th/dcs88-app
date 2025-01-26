page = {
    start() {
        const inputs = document.querySelectorAll('.digit-input');
        
        inputs.forEach((input, index) => {
            input.addEventListener('focus', (event) => {
                setTimeout(() => {
                    event.target.selectionStart = event.target.selectionEnd = event.target.value.length;
                }, 0);
            });

            input.addEventListener('input', (event) => {
                event.target.value = event.target.value.match(/(\d)(?!.*\d)/g)?.pop() ?? "";
                if (event.target.value !== '' && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                    this.hideError();
                }
            });
        
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Backspace' && event.target.value === '') {
                    if (index > 0) {
                        inputs[index - 1].focus();
                    } else {
                        inputs[inputs.length - 1].focus();
                    }
                    this.hideError();
                }
            });
        });
    },
    showError(message) {
        let error = document.getElementsByClassName("login-error")[0];
        error.innerHTML = message;
        error.classList.add("show");
    },
    hideError() {
        let error = document.getElementsByClassName("login-error")[0];
        error.classList.remove("show");
    },
    async login() {
        let pass = '';
        const inputs = document.querySelectorAll('.digit-input');
        inputs.forEach((input) => {
            pass += input.value;
        });
        if (pass.length == 4) {
            if (/^[0-9]+$/.test(pass)) {
                console.log(`Attempt login with ${pass}`);
                this.showError(await window.electronAPI.tryLogin(parseInt(pass)));
            } else {
                this.showError("Password must be be made up of only numbers");
            }
        } else {
            this.showError("Password must be 4 numbers long");
        }
    }
};
page.start();