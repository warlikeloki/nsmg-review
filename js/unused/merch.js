// merch.js
document.addEventListener('DOMContentLoaded', () => {
    const TAX_RATE = 0.11;
    const quantityInputs = document.querySelectorAll('.quantity-input');
    const deliveryMethodSelect = document.getElementById('delivery-method');
    const subtotalDisplay = document.getElementById('subtotal-display');
    const shippingDisplay = document.getElementById('shipping-display');
    const totalDisplay = document.getElementById('total-display');

    function updateTotals() {
        let subtotal = 0;
        quantityInputs.forEach(input => {
            const quantity = parseInt(input.value) || 0;
            const price = parseFloat(input.dataset.price) || 0;
            if (quantity > 0 && price > 0) {
                subtotal += quantity * price;
            }
        });
        const shippingCost = parseFloat(deliveryMethodSelect.options[deliveryMethodSelect.selectedIndex].dataset.shippingCost) || 0;
        const total = subtotal + shippingCost;

        subtotalDisplay.textContent = `$${subtotal.toFixed(2)}`;
        shippingDisplay.textContent = `$${shippingCost.toFixed(2)}`;
        totalDisplay.textContent = `$${total.toFixed(2)}`;
    }

    quantityInputs.forEach(input => input.addEventListener('input', updateTotals));
    deliveryMethodSelect.addEventListener('change', updateTotals);
    updateTotals();
});