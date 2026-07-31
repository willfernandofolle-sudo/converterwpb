document.addEventListener('DOMContentLoaded', function () {
    const inputControllers = document.querySelectorAll('.color-controller');

    inputControllers.forEach(inputController => {
        let identifier = null;

        // Searches for a class that starts with 'id-'
        for (let i = 0; i < inputController.classList.length; i++) {
            const currentClass = inputController.classList[i];
            if (currentClass.startsWith('id-')) {
                identifier = currentClass;
                break;
            }
        }
        
        // Selects the color elements that have the same identifier class
        const elementsToChangeColor = document.querySelectorAll(`.color-box.${identifier}`);
        
        let previousValue = inputController.value;

        function updateColor() {
            const value = inputController.value.trim();
            let newColor;

            //If you need to change the color or add more variants just add more cases
            switch (value) {
                case '0':
                    newColor = '#25E65A';
                    break;
                case '1':
                    newColor = '#E64643'
                    break;
                case '2':
                    newColor = '#E6A244';
                    break;
                case '3':
                    newColor = '#4249E5';
                    break;
                default:
                    newColor = '#ccc';
            }

            elementsToChangeColor.forEach(element => {
                element.style.backgroundColor = newColor;
            });
        }

        updateColor();

        inputController.addEventListener('input', updateColor);
        inputController.addEventListener('change', updateColor);

        setInterval(() => {
            if (inputController.value !== previousValue) {
                updateColor();
                previousValue = inputController.value;
            }
        }, 500);
    });
});