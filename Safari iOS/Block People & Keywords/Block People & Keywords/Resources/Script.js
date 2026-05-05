function postAction(action) {
    if (!window.webkit || !window.webkit.messageHandlers || !window.webkit.messageHandlers.controller) {
        return;
    }

    webkit.messageHandlers.controller.postMessage(action);
}

document.querySelectorAll("[data-action]").forEach(function (button) {
    button.addEventListener("click", function () {
        postAction(button.getAttribute("data-action"));
    });
});
