// Progress bar helpers extracted from LLWebServerExtended.js
(function () {
    function init() {
        const elements = document.getElementsByClassName("progress-input");
        for (let i = 0; i < elements.length; i++) {
            setInterval(() => updateValues(elements[i].id), 1000);
        }
    }

    function updateProgressBar(value, min, max, progressBarMinId, progressBarValueId) {
        if (Number.isNaN(value) || Number.isNaN(min) || Number.isNaN(max) || max === min) {
            return;
        }

        const percentage = ((value - min) / (max - min)) * 100;
        const progressBarMin = document.getElementById(progressBarMinId);
        const progressBarValue = document.getElementById(progressBarValueId);

        if (!progressBarMin || !progressBarValue) {
            return;
        }

        progressBarMin.style.height = "0%";
        progressBarValue.style.height = percentage + "%";
        if (percentage === 100) {
            progressBarMin.style.backgroundColor = "#4caf50";
            progressBarValue.style.backgroundColor = "#4caf50";
        } else {
            progressBarMin.style.backgroundColor = "#ccc";
            progressBarValue.style.backgroundColor = "#4caf50";
        }
    }

    function updateValues(inputId) {
        const input = document.getElementById(inputId);
        if (!input) {
            return;
        }

        const progressBarMinId = "progressBarMin_" + inputId;
        const progressBarValueId = "progressBarValue_" + inputId;

        const value = parseInt(input.value, 10);
        const min = parseInt(input.min, 10);
        const max = parseInt(input.max, 10);

        updateProgressBar(value, min, max, progressBarMinId, progressBarValueId);
    }

    // Keep legacy global names so existing HTML integrations continue to work.
    window.init = init;
    window.updateProgressBar = updateProgressBar;
    window.updateValues = updateValues;

    document.addEventListener("DOMContentLoaded", init);
})();
