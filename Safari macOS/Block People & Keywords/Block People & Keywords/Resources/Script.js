function show(enabled, useSettingsInsteadOfPreferences) {
    if (useSettingsInsteadOfPreferences) {
        document.getElementsByClassName("state-on")[0].innerText = "The Block People & Keywords Safari extension is on. You can turn it off in the Extensions section of Safari Settings.";
        document.getElementsByClassName("state-off")[0].innerText = "The Block People & Keywords Safari extension is off. You can turn it on in the Extensions section of Safari Settings.";
        document.getElementsByClassName("state-unknown")[0].innerText = "Turn on the Block People & Keywords Safari extension in the Extensions section of Safari Settings.";
        document.getElementsByClassName("open-preferences")[0].innerText = "Quit and Open Safari Settings...";
    }

    if (typeof enabled === "boolean") {
        document.body.classList.toggle("state-on", enabled);
        document.body.classList.toggle("state-off", !enabled);
    } else {
        document.body.classList.remove("state-on");
        document.body.classList.remove("state-off");
    }
}

function postAction(action) {
    if (!window.webkit || !window.webkit.messageHandlers || !window.webkit.messageHandlers.controller) {
        return;
    }

    webkit.messageHandlers.controller.postMessage(action);
}

function openPreferences() {
    postAction("open-preferences");
}

document.querySelector("button.open-preferences").addEventListener("click", openPreferences);

document.querySelectorAll("[data-action]").forEach(function (button) {
    button.addEventListener("click", function () {
        postAction(button.getAttribute("data-action"));
    });
});
