// Cart Module - Robust Implementation
class CartManager {
  constructor() {
    // Initialize cart from localStorage
    this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    this.DELIVERY_FEE = 150;

    // Make cart manager globally available
    window.cartManager = this;

    // Initialize UI
    this.updateCartCount();
    this.setupEventListeners();
    this.displayCartItems();
  }

  // ======================
  // CORE CART OPERATIONS
  // ======================

  addItem(item) {
    // Ensure uniqueId is set (for products with variants)
    const uniqueId =
      item.uniqueId ||
      [
        item.id,
        item.color || '',
        item.storage || '',
        item.isIphone ? 'iphone' : ''
      ].join('-');

    // Check if item already exists in cart by uniqueId
    const existingItemIndex = this.cart.findIndex(
      (cartItem) => cartItem.uniqueId === uniqueId
    );

    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      this.cart[existingItemIndex].quantity =
        (this.cart[existingItemIndex].quantity || 1) + (item.quantity || 1);
    } else {
      // Add new item with minimum required fields
      const newItem = {
        uniqueId: uniqueId,
        id: item.id || Date.now().toString(),
        name: item.name,
        price: item.price,
        image: item.image || 'default-product.jpg',
        quantity: item.quantity || 1,
        ...(item.color && { color: item.color }),
        ...(item.storage && { storage: item.storage }),
        ...(item.isIphone && { isIphone: true })
      };
      this.cart.push(newItem);
    }

    this.updateCart();
    this.showNotification(`${item.name} added to cart`);
  }

  updateQuantity(index, change) {
    if (index < 0 || index >= this.cart.length) return;

    const item = this.cart[index];
    item.quantity = (item.quantity || 1) + change;

    // Remove if quantity <= 0
    if (item.quantity <= 0) {
      this.removeItem(index);
      return;
    }

    this.updateCart();
  }

  removeItem(index) {
    if (index < 0 || index >= this.cart.length) return;

    const removedItem = this.cart.splice(index, 1)[0];
    this.updateCart();
    this.showNotification(`${removedItem.name} removed from cart`, 'info');
  }

  clearCart() {
    this.cart = [];
    this.updateCart();
    this.showNotification('Cart cleared', 'info');
  }

  // ======================
  // HELPER METHODS
  // ======================

  findItemIndex(item) {
    const uniqueId =
      item.uniqueId ||
      [
        item.id,
        item.color || '',
        item.storage || '',
        item.isIphone ? 'iphone' : ''
      ].join('-');
    return this.cart.findIndex((cartItem) => cartItem.uniqueId === uniqueId);
  }

  getCartCount() {
    return this.cart.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  calculateTotals() {
    const subtotal = this.cart.reduce(
      (sum, item) => sum + item.price * (item.quantity || 1),
      0
    );
    const total = subtotal + this.DELIVERY_FEE;

    return { subtotal, total };
  }

  getColorName(colorValue) {
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

  // ======================
  // ORDER SUBMISSION
  // ======================

  async submitOrder(formData) {
    try {
      // Generate a unique order ID
      const orderId = 'ORD-' + Date.now().toString(36).toUpperCase();
      
      // Calculate totals with proper checks
      const subtotal = this.cart.reduce((sum, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 1;
        return sum + (price * quantity);
      }, 0);

      const deliveryFee = 150; // Fixed delivery fee
      const total = subtotal + deliveryFee;
      
      // Prepare order details
      const orderDetails = {
        orderId: orderId,
        date: new Date().toISOString(),
        customer: {
          name: formData.name || '',
          email: formData.email || '',
          phone: formData.phone || '',
          address: formData.address || ''
        },
        items: this.cart.map(item => ({
          name: item.name || 'Unknown Product',
          color: item.color ? this.getColorName(item.color) : 'N/A',
          storage: item.storage || 'N/A',
          quantity: item.quantity || 1,
          price: parseFloat(item.price) || 0,
          total: ((parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)
        })),
        totals: {
          subtotal: subtotal.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          total: total.toFixed(2)
        },
        paymentMethod: formData.paymentMethod || 'Manual Payment (EFT)',
        bankDetails: {
          bank: 'FNB',
          accountName: 'Phiwokuhle Cele',
          accountNumber: '63121475180',
          branchCode: '250655',
          reference: formData.email || orderId
        }
      };

      // Send order to backend
      const response = await fetch('/.netlify/functions/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderDetails)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Order processing failed. Please try again.');
      }

      if (!data.success) {
        throw new Error('Order verification failed. Please try again.');
      }

      // Store order details in localStorage
      localStorage.setItem('lastOrder', JSON.stringify({
        orderId: orderId,
        amount: total,
        date: new Date().toISOString(),
        paymentMethod: formData.paymentMethod || 'manual'
      }));

      // Clear cart
      this.clearCart();

      // Return the full backend response so paymentLink is available!
      return data;
    } catch (error) {
      console.error('Order submission error:', error);
      throw error;
    }
  }

  // ======================
  // UI UPDATES
  // ======================

  updateCart() {
    this.saveToLocalStorage();
    this.updateCartCount();
    this.displayCartItems();
  }

  updateCartCount() {
    const count = this.getCartCount();
    const cartCountElements = document.querySelectorAll('.cart-count');

    cartCountElements.forEach(element => {
      element.textContent = count;
    });

    // Update checkout button state
    const checkoutBtn = document.querySelector('.checkout-button');
    if (checkoutBtn) {
      checkoutBtn.disabled = count === 0;
    }
  }

  displayCartItems() {
    const cartList = document.getElementById('cart-list');
    if (!cartList) return;

    if (this.cart.length === 0) {
      cartList.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
      return;
    }

    const { subtotal, total } = this.calculateTotals();

    cartList.innerHTML = `
    ${this.cart
      .map(
        (item) => `
      <div class="cart-item" data-uniqueid="${item.uniqueId}">
        <img src="${item.image}" alt="${item.name}" 
             onerror="this.src='default-product.jpg'">
        <div class="cart-item-details">
          <h3>${item.name}</h3>
          ${item.color ? `<p><strong>Color:</strong> ${this.getColorName(item.color)}</p>` : ''}
          ${item.storage ? `<p><strong>Storage:</strong> ${item.storage}</p>` : ''}
          <p>R${item.price.toFixed(2)} each</p>
          <p class="item-total">R${(item.price * (item.quantity || 1)).toFixed(2)}</p>
        </div>
        <div class="quantity-controls">
          <button class="qty-minus" data-uniqueid="${item.uniqueId}">
            <i class="fas fa-minus"></i>
          </button>
          <span class="qty-display">${item.quantity || 1}</span>
          <button class="qty-plus" data-uniqueid="${item.uniqueId}">
            <i class="fas fa-plus"></i>
          </button>
          <button class="remove-btn" data-uniqueid="${item.uniqueId}">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `
      )
      .join('')}
        
        <div class="cart-summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>R${subtotal.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Delivery Fee:</span>
            <span>R${this.DELIVERY_FEE.toFixed(2)}</span>
          </div>
          <div class="summary-row grand-total">
            <span>Total:</span>
            <span>R${total.toFixed(2)}</span>
          </div>
        </div>
      `;

    // Add event listeners for the newly created buttons
    this.setupCartItemEventListeners();
  }

  setupCartItemEventListeners() {
    const cartList = document.getElementById('cart-list');
    if (!cartList) return;

    // Remove any previous event listener by replacing the node
    const newCartList = cartList.cloneNode(true);
    cartList.parentNode.replaceChild(newCartList, cartList);

    newCartList.addEventListener('click', (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const uniqueId = target.dataset.uniqueid;
      if (!uniqueId) return;

      const itemIndex = this.cart.findIndex(item => item.uniqueId === uniqueId);
      if (itemIndex === -1) return;

      if (target.classList.contains('qty-minus')) {
        this.updateQuantity(itemIndex, -1);
      } else if (target.classList.contains('qty-plus')) {
        this.updateQuantity(itemIndex, 1);
      } else if (target.classList.contains('remove-btn')) {
        this.removeItem(itemIndex);
      }
    });
  }

  showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.toast-notification');
    existingNotifications.forEach((notification) => notification.remove());

    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;

    // Add icon based on type
    const icon =
      type === 'success'
        ? '✓'
        : type === 'error'
          ? '✕'
          : type === 'info'
            ? 'ℹ'
            : '✓';

    notification.innerHTML = `
        <div class="toast-content">
          <span class="toast-icon">${icon}</span>
          <span class="toast-message">${message}</span>
        </div>
      `;

    // Add to document
    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ======================
  // PERSISTENCE
  // ======================

  saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }

  getCart() {
    return this.cart;
  }

  // ======================
  // EVENT LISTENERS
  // ======================

  setupEventListeners() {
    // Add event listeners for cart buttons
    document.addEventListener('click', (e) => {
      const addToCartBtn = e.target.closest('.add-to-cart');
      if (addToCartBtn) {
        const item = {
          id: addToCartBtn.dataset.id,
          name: addToCartBtn.dataset.name,
          price: parseFloat(addToCartBtn.dataset.price),
          image: addToCartBtn.dataset.image,
          color: addToCartBtn.dataset.color,
          storage: addToCartBtn.dataset.storage,
          isIphone: addToCartBtn.dataset.isIphone === 'true'
        };
        this.addItem(item);
      }
    });

    // Setup cart item event listeners
    this.setupCartItemEventListeners();
  }
}

// Initialize cart manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.cartManager = new CartManager();
});

// Order submission handler (backend integration)
// ======================

