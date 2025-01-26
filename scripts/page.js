let page = undefined;

document.getElementById('minimize').addEventListener('click', () => {
    window.electronAPI.minimize();
});

document.getElementById('maximize').addEventListener('click', () => {
    window.electronAPI.maximize();
    document.getElementById("maximize").classList.add("hide");
    document.getElementById("restore").classList.remove("hide");
});

document.getElementById('restore').addEventListener('click', () => {
    window.electronAPI.restore();
    document.getElementById("restore").classList.add("hide");
    document.getElementById("maximize").classList.remove("hide");
});

document.getElementById('close').addEventListener('click', () => {
    window.electronAPI.close();
});

let timeoutIntervals = {};
for (t of document.getElementsByClassName('timeout')) {
    timeoutIntervals[t] = 0;
}

function initDropdown() {
    let retry = document.getElementsByClassName("retry");
    for (let r of retry) {
        let t = r.parentNode.parentNode.id.substring(0, r.parentNode.parentNode.id.length - 7);
        if (t != "server" && t != "game") continue;
        r.onclick = async function () {
            setConnectionStatus(t, "connecting");
            const timer = r.parentNode.querySelector('.timeout');
            let timeleft = 5.0;
            clearInterval(timeoutIntervals[timer]);
            timeoutIntervals[timer] = setInterval(() => {
                timeleft -= 0.1;
                if (timeleft <= 0) {
                    clearInterval(timeoutIntervals[timer]);
                    timer.textContent = '0.0s';
                } else {
                    timer.textContent = `${timeleft.toFixed(1)}s`;
                }
            }, 100);
            window.electronAPI.tryConnect(t, 5000);
        }
        if (t == "server") {
            r.click();
        }
    }
}

function setConnectionStatus (connection, status) {
    console.log(status);
    let retry = document.getElementsByClassName("retry");
    for (let r of retry) {
        let t = r.parentNode.parentNode.id.substring(0, r.parentNode.parentNode.id.length - 7);
        if (t != "server" && t != "game") continue;
        if (t == connection) {
            r.parentNode.parentNode.classList.remove("connecting", "partconnected", "connected");
            switch (status) {
                case "none":
                    break;
                case "partconnected":
                    r.parentNode.parentNode.classList.add("partconnected");
                    break;
                case "connected":
                    r.parentNode.parentNode.classList.add("connected");
                    break;
                case "connecting":
                    r.parentNode.parentNode.classList.add("connecting");
                    break;
            }
        }
    }
}

window.electronAPI.setConnectionStatus(setConnectionStatus);

function loadPage(pageName) {
    const head = document.getElementsByTagName('head')[0];
    document.getElementById('extrajs').remove();
    const page = document.getElementById('page');
    const extraCss = document.getElementById('extracss');
    const extraJs = document.createElement('script');
    extraJs.setAttribute('id', "extrajs");
    window.electronAPI.openPage(pageName).then(({ content, updatedPageName }) => {
        page.innerHTML = content;
        let cssPath = "../css/" + updatedPageName + ".css";
        if (window.electronAPI.fileExists(cssPath)) {
            extraCss.href = cssPath;
        } else {
            extraCss.href = "";
        }
        let jsPath = "../scripts/" + updatedPageName + ".js"
        if (window.electronAPI.fileExists(jsPath)) {
            extraJs.src = jsPath;
        } else {
            extraJs.src = "";
        }
        head.appendChild(extraJs);
    });
}

function updateMoney() {
    const m = document.getElementById('moneyvalue');
    window.electronAPI.updateMoney().then((content) => {
        m.innerHTML = content.toLocaleString(undefined, {});
    });
}

initDropdown();
updateMoney();
loadPage("home");