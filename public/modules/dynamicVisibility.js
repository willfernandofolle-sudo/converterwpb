document.addEventListener('DOMContentLoaded', function () {
    const inputFields = document.querySelectorAll('.visibility-controller');

    inputFields.forEach(inputField => {
        const targetValue = inputField.dataset.target;
        const container = document.querySelector(`.visibility-container[data-item="${targetValue}"]`);
        
        // Legge gli attributi dei dati per la logica di visualizzazione/nascondimento
        const showValue = inputField.dataset.showIf;
        const hideValue = inputField.dataset.hideIf;

        function updateVisibility() {
            const value = inputField.value.trim();
            let isVisible = false;

            if (showValue !== undefined) {
                // Controlla se il valore dell'input corrisponde al valore visualizzato
                isVisible = (value.toLowerCase() === showValue.toLowerCase());
            } else if (hideValue !== undefined) {
                // Controlla se il valore dell'input NON corrisponde al valore di occultamento
                isVisible = (value.toLowerCase() !== hideValue.toLowerCase());
            } else {
                // Logica predefinita se nessun attributo è definito (mostra se il valore è 1 o ‘true’)
                isVisible = (parseFloat(value) === 1 || value.toLowerCase() === 'true');
            }

            if (isVisible) {
                container.style.visibility = 'visible';
                container.style.display = 'flex';
            } else {
                container.style.visibility = 'hidden';
                container.style.display = 'none';
            }
        }
    
      
        inputField.addEventListener('input', updateVisibility);
        inputField.addEventListener('focus', updateVisibility);
        inputField.addEventListener('blur', updateVisibility);

        let previousValue = inputField.value;
        setInterval(function () {
            if (inputField.value !== previousValue) {
                previousValue = inputField.value;
                updateVisibility();
            }
        }, 1000);

        function addListenerAfterLoad() {
            if (window.UpdateControlsWithValues) {
                const originalUpdateControls = window.UpdateControlsWithValues;
                window.UpdateControlsWithValues = function () {
                    originalUpdateControls.apply(this, arguments);
                    setTimeout(updateVisibility, 10);
                };
            }
        }

        addListenerAfterLoad();
        window.addEventListener('load', addListenerAfterLoad);
        updateVisibility();
    });
});