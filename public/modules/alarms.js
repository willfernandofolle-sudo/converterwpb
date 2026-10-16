// Alarm-related UI behaviors extracted from LLWebServerExtended.js
(function () {
    document.addEventListener("DOMContentLoaded", () => {
        const filterBtn = document.getElementById("filter-btn");
        const listItems = document.querySelectorAll("#list li");

        if (!filterBtn || listItems.length === 0) {
            return;
        }

        let isFiltered = false;

        filterBtn.addEventListener("click", () => {
            isFiltered = !isFiltered;
            listItems.forEach((item) => {
                const textInputs = item.querySelectorAll('input[type="text"]');
                const alarmStatusInput = item.querySelector('input[name="alarmStatus"]');
                let isVisible = false;

                textInputs.forEach((textInput) => {
                    if (textInput.value.trim().toLowerCase() === "true") {
                        isVisible = true;
                    }
                });

                if (alarmStatusInput && (alarmStatusInput.value === "active" || alarmStatusInput.value === "resettable")) {
                    isVisible = true;
                }

                item.style.display = isFiltered ? (isVisible ? "list-item" : "none") : "list-item";
            });
        });
    });

    document.addEventListener("DOMContentLoaded", () => {
        const input = document.getElementById("nome-filtro");
        const listItems = document.getElementsByClassName("list-item");

        if (!input || listItems.length === 0) {
            return;
        }

        input.addEventListener("input", () => {
            const inputValue = input.value.toLowerCase();

            for (let i = 0; i < listItems.length; i++) {
                const listItem = listItems[i];
                const filterElement = listItem.getElementsByClassName("filter")[0];
                if (!filterElement) {
                    continue;
                }

                const filterText = filterElement.innerText.toLowerCase();

                if (filterText.includes(inputValue)) {
                    listItem.style.display = "list-item";
                } else {
                    listItem.style.display = "none";
                }
            }
        });
    });

    document.addEventListener("DOMContentLoaded", () => {
        const list = document.getElementById("list");
        if (!list) {
            return;
        }

        const listItems = list.getElementsByTagName("li");
        for (let i = 0; i < listItems.length; i++) {
            updateAlarmStatus(listItems[i]);
        }

        const images = document.querySelectorAll("img[data-llweb-img]");
        images.forEach((img) => {
            img.onload = () => {
                const listItem = img.closest("li");
                if (listItem) {
                    updateAlarmStatus(listItem);
                }
            };
        });

        if (listItems.length > 0) {
            updateAlarmStatus(listItems[0]);
        }
    });

    function updateAlarmStatus(listItem) {
        const alarmStatusInput = listItem.querySelector('input[name="alarmStatus"]');
        const imgElement = listItem.querySelector("img[data-llweb-img]");

        if (!imgElement || !alarmStatusInput) {
            return;
        }

        const src = imgElement.src;

        if (src.includes("inactive.webp") || src.includes("inactive.png")) {
            alarmStatusInput.value = "inactive";
        } else if (src.includes("active.webp") || src.includes("active.png")) {
            alarmStatusInput.value = "active";
        } else if (src.includes("resettable.webp") || src.includes("resettable.png")) {
            alarmStatusInput.value = "resettable";
        }
    }

    window.updateAlarmStatus = updateAlarmStatus;
})();
