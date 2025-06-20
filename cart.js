// Cart Manager - Improved for Robustness

class CartManager {
  constructor() {
    this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    this.DELIVERY_FEE = 150;
    window.cartManager = this;
    this.updateCartCount();
    this.displayCartItems();
    this.setupCartItemEventListeners();
  }

  // Add item to cart, update if exists
  addItem(item) {
    // Validate item
    if (!item.id || !item.name || isNaN(item.price) || item.price <= 0) {
      this.showNotification('Invalid product data', 'error');
      return;
    }

    // Clean uniqueId, now includes condition
    const uniqueId = [item.id, item.color, item.storage, item.condition]
      .filter(Boolean)
      .join('-');

    const existingItemIndex = this.cart.findIndex(
      (cartItem) => cartItem.uniqueId === uniqueId
    );

    if (existingItemIndex >= 0) {
      this.cart[existingItemIndex].quantity += item.quantity || 1;
    } else {
      this.cart.push({
        uniqueId,
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        image: item.image || 'default-product.jpg',
        quantity: item.quantity || 1,
        color: item.color,
        storage: item.storage,
        condition: item.condition // Save condition
      });
    }
    this.updateCart();
    this.showNotification(`${item.name} added to cart`);
  }

  updateQuantity(index, change) {
    if (index < 0 || index >= this.cart.length) return;
    this.cart[index].quantity += change;
    if (this.cart[index].quantity <= 0) {
      this.removeItem(index);
      return;
    }
    this.updateCart();
  }

  removeItem(index) {
    if (index < 0 || index >= this.cart.length) return;
    const removed = this.cart.splice(index, 1)[0];
    this.updateCart();
    this.showNotification(`${removed.name} removed from cart`, 'info');
  }

  clearCart() {
    this.cart = [];
    this.updateCart();
    this.showNotification('Cart cleared', 'info');
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

  updateCart() {
    this.saveToLocalStorage();
    this.updateCartCount();
    this.displayCartItems();
  }

  updateCartCount() {
    const count = this.getCartCount();
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
    });
    const checkoutBtn = document.querySelector('.checkout-button');
    if (checkoutBtn) checkoutBtn.disabled = count === 0;
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
      ${this.cart.map((item, idx) => `
        <div class="cart-item" data-uniqueid="${item.uniqueId}">
          <img 
            src="${item.image || 'default-product.jpg'}" 
            alt="${item.name}" 
            onerror="this.onerror=null;this.src='default-product.jpg';"
          >
          <div class="cart-item-details">
            <h3>${item.name}</h3>
            ${item.color ? `<p><strong>Color:</strong> ${item.color}</p>` : ''}
            ${item.storage ? `<p><strong>Storage:</strong> ${item.storage}</p>` : ''}
            ${item.condition ? `<p><strong>Condition:</strong> ${item.condition}</p>` : ''}
            <p>R${item.price.toFixed(2)} each</p>
            <p class="item-total">R${(item.price * (item.quantity || 1)).toFixed(2)}</p>
          </div>
          <div class="quantity-controls">
            <button class="qty-minus" data-index="${idx}"><i class="fas fa-minus"></i></button>
            <span class="qty-display">${item.quantity || 1}</span>
            <button class="qty-plus" data-index="${idx}"><i class="fas fa-plus"></i></button>
            <button class="remove-btn" data-index="${idx}"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      `).join('')}
      <div class="cart-summary">
        <div class="summary-row"><span>Subtotal:</span><span>R${subtotal.toFixed(2)}</span></div>
        <div class="summary-row"><span>Delivery Fee:</span><span>R${this.DELIVERY_FEE.toFixed(2)}</span></div>
        <div class="summary-row grand-total"><span>Total:</span><span>R${total.toFixed(2)}</span></div>
      </div>
    `;
    this.setupCartItemEventListeners();
  }

  setupCartItemEventListeners() {
    const cartList = document.getElementById('cart-list');
    if (!cartList) return;
    cartList.onclick = (e) => {
      const minus = e.target.closest('.qty-minus');
      const plus = e.target.closest('.qty-plus');
      const remove = e.target.closest('.remove-btn');
      if (minus) this.updateQuantity(Number(minus.dataset.index), -1);
      if (plus) this.updateQuantity(Number(plus.dataset.index), 1);
      if (remove) this.removeItem(Number(remove.dataset.index));
    };
  }

  showNotification(message, type = 'success') {
    document.querySelectorAll('.toast-notification').forEach(n => n.remove());
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✓' : type === 'info' ? 'ℹ' : '✕'}</span>
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

  saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
  }
}

// Listen for add-to-cart events on all pages
document.addEventListener('DOMContentLoaded', () => {
  window.cartManager = new CartManager();

  // Listen for add-to-cart buttons (must have .add-to-cart class and data attributes)
  document.body.addEventListener('click', function (e) {
    const btn = e.target.closest('.add-to-cart');
    if (!btn) return;
    const price = parseFloat(btn.dataset.price);
    if (isNaN(price) || price <= 0) {
      window.cartManager.showNotification('Invalid price for product', 'error');
      return;
    }
    const item = {
      id: btn.dataset.id,
      name: btn.dataset.name,
      price: price,
      image: btn.dataset.image || 'default-product.jpg',
      color: btn.dataset.color,
      storage: btn.dataset.storage,
      condition: btn.dataset.condition, // <-- Add this line
      quantity: 1
    };
    window.cartManager.addItem(item);
  });

  window.cartManager.updateCartCount();
});

