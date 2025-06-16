document.addEventListener('DOMContentLoaded', function () {
  // Load cart and user data
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const user = JSON.parse(localStorage.getItem('user')) || null;

  // DOM Elements
  const orderItemsEl = document.getElementById('order-items');
  const subtotalEl = document.getElementById('subtotal');
  const grandTotalEl = document.getElementById('grand-total');
  const eftAmountEl = document.getElementById('eft-amount');
  const emailInput = document.getElementById('email');
  const fullNameInput = document.getElementById('full-name');
  const checkoutForm = document.getElementById('checkout-form');
  const eftDetails = document.getElementById('eft-details');
  const yocoPayment = document.getElementById('yoco-payment');
  const eftPayment = document.getElementById('eft-payment');
  const submitBtn = document.getElementById('submit-order');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('spinner');
  const manualReference = document.getElementById('manual-reference');
  const manualAmount = document.getElementById('manual-amount');

  // Initialize Yoco SDK with error handling
  let yoco;
  try {
    yoco = new YocoSDK({
      publicKey: 'pk_live_d76a9931enV7GL0fafb4',
    });
  } catch (error) {
    console.error('Yoco SDK failed to load:', error);
    alert('Payment system unavailable. Please try again later.');
    return;
  }

  // Populate user data if logged in
  if (user) {
    emailInput.value = user.email || '';
    fullNameInput.value = user.name || '';
    if (user.address) {
      document.getElementById('address').value = user.address;
    }
  }

  // Calculate totals
  const DELIVERY_FEE = 150.00;
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * (item.quantity || 1),
    0
  );
  const total = subtotal + DELIVERY_FEE;

  // Display order summary
  function displayOrderSummary() {
    if (cart.length === 0) {
      orderItemsEl.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      return;
    }

    orderItemsEl.innerHTML = cart
      .map(
        (item) => `
            <div class="order-item">
                <img src="${item.image || 'default-product.jpg'}" alt="${item.name}" 
                     onerror="this.src='default-product.jpg'">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    ${item.color ? `<p>Color: ${getColorName(item.color)}</p>` : ''}
                    ${item.storage ? `<p>Storage: ${item.storage}</p>` : ''}
                    <p>Qty: ${item.quantity || 1}</p>
                    <p>Price: R${item.price.toFixed(2)} each</p>
                </div>
                <div class="item-price">R${(item.price * (item.quantity || 1)).toFixed(2)}</div>
            </div>
        `
      )
      .join('');

    subtotalEl.textContent = `R${subtotal.toFixed(2)}`;
    grandTotalEl.textContent = `R${total.toFixed(2)}`;
    eftAmountEl.textContent = `R${total.toFixed(2)}`;
    manualAmount.textContent = `R${total.toFixed(2)}`;
  }

  // Helper function to get color name
  function getColorName(colorValue) {
    const colorMap = {
      white: 'White',
      black: 'Black',
      silver: 'Silver',
      gold: 'Gold',
      graphite: 'Graphite',
      spacegray: 'Space Gray',
    };
    const lowerColor = colorValue?.toLowerCase();
    return colorMap[lowerColor] || colorValue;
  }

  // Toggle EFT details based on payment method
  function togglePaymentDetails() {
    if (eftPayment.checked) {
      eftDetails.classList.remove('hidden');
      manualReference.textContent = emailInput.value || 'Use your email';
    } else {
      eftDetails.classList.add('hidden');
    }
  }

  // Update EFT reference when email changes
  emailInput.addEventListener('input', () => {
    if (eftPayment.checked) {
      manualReference.textContent = emailInput.value || 'Use your email';
    }
  });

  // Payment method change event
  yocoPayment.addEventListener('change', togglePaymentDetails);
  eftPayment.addEventListener('change', togglePaymentDetails);

  // Form submission
  checkoutForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Validate form
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Processing...';
    spinner.classList.remove('hidden');

    try {
      const formData = {
        email: emailInput.value,
        name: fullNameInput.value,
        phone: document.getElementById('phone').value,
        address: document.getElementById('address').value,
        notes: document.getElementById('notes').value,
        cart: cart,
        paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
        total: total,
        subtotal: subtotal,
        deliveryFee: DELIVERY_FEE
      };

      // Save user details
      localStorage.setItem('user', JSON.stringify({
        email: formData.email,
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      }));

      if (yocoPayment.checked) {
        await processYocoPayment(formData, total);
      } else {
        await processManualPayment(formData);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      showNotification(error.message || 'An error occurred. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      btnText.textContent = 'Complete Order';
      spinner.classList.add('hidden');
    }
  });

  // Process YOCO payment
  async function processYocoPayment(formData, amount) {
    return new Promise((resolve, reject) => {
      try {
        yoco.showPopup({
          amountInCents: Math.round(amount * 100),
          currency: 'ZAR',
          name: 'Phiwokuhle Technologies',
          description: 'Order payment',
          loadingIndicator: true,
          callback: async function (result) {
            if (result.error) {
              let errorMessage = 'Payment failed. ';
              switch (result.error.code) {
                case '3d_secure_failed':
                  errorMessage += '3D Secure authentication failed. Please try another card.';
                  break;
                case 'insufficient_funds':
                  errorMessage += 'Insufficient funds. Please try another card.';
                  break;
                case 'card_declined':
                  errorMessage += 'Card was declined. Please try another card.';
                  break;
                default:
                  errorMessage += 'Please try again or use a different payment method.';
              }
              reject(new Error(errorMessage));
              return;
            }

            try {
              const response = await fetch('/.netlify/functions/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token: result.id,
                  amount: Math.round(amount * 100),
                  cart: cart,
                  user: {
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone
                  },
                  address: formData.address,
                  paymentMethod: 'yoco'
                }),
              });

              const data = await response.json();

              if (!response.ok) {
                throw new Error(data.error || 'Payment failed. Please try again.');
              }

              if (!data.success) {
                throw new Error('Payment verification failed. Please try again.');
              }

              // Show success message
              showNotification('Payment successful! Redirecting to order confirmation...', 'success');

              // Store order details in localStorage
              localStorage.setItem('lastOrder', JSON.stringify({
                orderId: data.orderId,
                transactionId: data.transactionId,
                amount: data.amount,
                date: new Date().toISOString()
              }));

              // Clear cart and redirect
              localStorage.removeItem('cart');
              setTimeout(() => {
                window.location.href = `/order-confirmation.html?orderId=${data.orderId}`;
              }, 2000);
              
              resolve();
            } catch (error) {
              console.error('Payment processing error:', error);
              reject(error);
            }
          }
        });
      } catch (error) {
        console.error('Yoco popup error:', error);
        reject(new Error('Payment system error. Please try again.'));
      }
    });
  }

  async function processManualPayment(formData) {
    try {
        submitBtn.disabled = true;
        btnText.textContent = 'Processing Order...';
        spinner.classList.remove('hidden');

        // Include bank details in the order data
        const result = await window.cartManager.submitOrder({
            orderId: `ORDER-${Date.now()}`, // Generate an order ID
            date: new Date().toISOString(),
            customer: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: formData.address
            },
            items: formData.cart.map(item => ({
                name: item.name,
                color: item.color,
                storage: item.storage,
                quantity: item.quantity || 1,
                price: item.price,
                total: (item.price * (item.quantity || 1)).toFixed(2)
            })),
            totals: {
                subtotal: formData.subtotal.toFixed(2),
                deliveryFee: formData.deliveryFee.toFixed(2),
                total: formData.total.toFixed(2)
            },
            bankDetails: { // Add bank details for the email template
                bank: 'FNB',
                accountName: 'Phiwokuhle Cele',
                accountNumber: '63121475180',
                branchCode: '250655',
                reference: formData.email || formData.name
            },
            notes: formData.notes
        });

        if (result.success) {
            showNotification('Order placed successfully! Check your email for payment instructions.', 'success');
            setTimeout(() => {
                window.location.href = `/order-confirmation.html?orderId=${result.orderId}`;
            }, 2000);
        } else {
            throw new Error(result.message || 'Order processing failed');
        }
    } catch (error) {
        console.error('Manual payment error:', error);
        throw error;
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = 'Complete Order';
        spinner.classList.add('hidden');
    }
}

  // Show notification
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Initialize
  displayOrderSummary();
  togglePaymentDetails();
});
