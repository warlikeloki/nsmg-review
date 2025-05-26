console.log()
document.addEventListener('DOMContentLoaded', function() {
// PayPal buttons (same as before)
paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: '20.00'
                }
            }]
        });
    },
    onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
            alert('Transaction completed by ' + details.payer.name.given_name);
        });
    }
}).render('#paypal-button-container-tshirt');

paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: '15.00'
                }
            }]
        });
    },
    onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
            alert('Transaction completed by ' + details.payer.name.given_name);
        });
    }
}).render('#paypal-button-container-mug');

// Subtotal calculation
const tshirtS = document.getElementById('tshirt-size-s');
const tshirtM = document.getElementById('tshirt-size-m');
const tshirtL = document.getElementById('tshirt-size-l');
const tshirtXL = document.getElementById('tshirt-size-xl');
const tshirtXXL = document.getElementById('tshirt-size-xxl');
const tshirtXXXL = document.getElementById('tshirt-size-xxxl');
const mugQuantity = document.getElementById('mug-quantity');
const subtotalDisplay = document.getElementById('subtotal');

function calculateSubtotal() {
    const tshirtPrice = 20;
    const mugPrice = 15;

    // Parse input values as integers, handling potential NaN values
    const s = parseInt(tshirtS.value) || 0;
    const m = parseInt(tshirtM.value) || 0;
    const l = parseInt(tshirtL.value) || 0;
    const xl = parseInt(tshirtXL.value) || 0;
    const xxl = parseInt(tshirtXXL.value) || 0;
    const xxxl = parseInt(tshirtXXXL.value) || 0;
    const mug = parseInt(mugQuantity.value) || 0;

    const tshirtSubtotal = (s + m + l + xl + xxl + xxxl) * tshirtPrice;
    const mugSubtotal = mug * mugPrice;
    const total = tshirtSubtotal + mugSubtotal;

    subtotalDisplay.textContent = `Subtotal: $${total.toFixed(2)}`;
}

// Event listeners for all size inputs
tshirtS.addEventListener('change', calculateSubtotal);
tshirtM.addEventListener('change', calculateSubtotal);
tshirtL.addEventListener('change', calculateSubtotal);
tshirtXL.addEventListener('change', calculateSubtotal);
tshirtXXL.addEventListener('change', calculateSubtotal);
tshirtXXXL.addEventListener('change', calculateSubtotal);
mugQuantity.addEventListener('change', calculateSubtotal);

// Initial subtotal calculation
calculateSubtotal();
});