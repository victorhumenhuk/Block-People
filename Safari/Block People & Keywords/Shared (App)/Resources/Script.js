function show(platform, enabled, useSettingsInsteadOfPreferences) {
    var msg = document.getElementById("message");
    var btn = document.getElementById("openBtn");

    if (platform === "ios") {
        msg.textContent = "Turn on the Block People & Keywords Safari extension in Settings.";
        return;
    }

    if (typeof enabled === "boolean") {
        if (enabled) {
            msg.textContent = useSettingsInsteadOfPreferences
                ? "The Block People & Keywords Safari extension is on. You can turn it off in the Extensions section of Safari Settings."
                : "The Block People & Keywords Safari extension is on. You can turn it off in Safari Extensions preferences.";
        } else {
            msg.textContent = useSettingsInsteadOfPreferences
                ? "The Block People & Keywords Safari extension is off. You can turn it on in the Extensions section of Safari Settings."
                : "The Block People & Keywords Safari extension is off. You can turn it on in Safari Extensions preferences.";
        }
    } else {
        msg.textContent = useSettingsInsteadOfPreferences
            ? "Turn on the Block People & Keywords Safari extension in the Extensions section of Safari Settings."
            : "Turn on the Block People & Keywords Safari extension in Safari Extensions preferences.";
    }

    if (btn) {
        btn.hidden = false;
        btn.textContent = useSettingsInsteadOfPreferences
            ? "Quit and Open Safari Settings\u2026"
            : "Quit and Open Safari Extensions Preferences\u2026";
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

var btn = document.getElementById("openBtn");
if (btn) btn.addEventListener("click", openPreferences);
