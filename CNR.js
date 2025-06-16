// script.js - Product Page Functionality

// Initialize cart from localStorage
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);

// Price dictionary for iPhones
const prices = {
  'iPhone-7-Plus': { '32GB': 3200, '128GB': 3500 },
  'iPhone-8-Plus': { '64GB': 3700 },
  'iPhone-X': { '64GB': 4000 },
  'iPhone-XR': { '64GB': 4500, '128GB': 4900 },
  'iPhone-Xs': { '64GB': 4900, '256GB': 5400 },
  'iPhone-11': { '64GB': 5500, '128GB': 5900 },
  'iPhone-11-Pro': { '64GB': 6700, '256GB': 7000 },
  'iPhone-12': { '64GB': 6700, '128GB': 6900 },
  'iPhone-12-Pro': { '128GB': 9500, '256GB': 10000 },
  'iPhone-13': { '128GB': 8800, '256GB': 9000 },
  'iPhone-13-Pro-Max': { '128GB': 11500, '256GB': 14000 },
  'iPhone-14': { '128GB': 10000 },
  'iPhone-14-Pro': { '128GB': 13500 },
  'iPhone-14-Pro-Max': { '128GB': 15900 },
  'iPhone-15': { '128GB': 13000 },
  'iPhone-15-Pro': { '128GB': 16000 },
  'iPhone-15-Pro-Max': { '256GB': 18000 },
};

// Update Cart Count in Header
function updateCartCount() {
  cartCount = cart.reduce((total, item) => total + (item.quantity || 1), 0);
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = cartCount;
  }
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Add to Cart Functionality
function addToCart(
  productId,
  price,
  imageSrc,
  productName,
  color,
  description = '',
  isIphone = false
) {
  // For iPhones, get storage selection
  let storage = '';
  if (isIphone) {
    const storageSelect = document.getElementById(`${productId}-storage`);
    if (storageSelect) {
      storage = storageSelect.value.split(' - ')[0];
      price = prices[productId]?.[storage] || price;
    }
  }

  // Create unique ID
  const uniqueId = isIphone
    ? `${productId}-${color}-${storage}`
    : `${productId}-${color}`;

  // Check if item exists
  const existingItemIndex = cart.findIndex(
    (item) => item.uniqueId === uniqueId
  );

  if (existingItemIndex !== -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({
      uniqueId: uniqueId,
      id: productId,
      name: productName,
      price: price,
      image: 'Images/' + imageSrc,
      color: color,
      description: description,
      quantity: 1,
      isIphone: isIphone,
      storage: isIphone ? storage : undefined,
    });
  }

  cartCount++;
  updateCartCount();
  showAddToCartConfirmation(productName, price);
}

// Show add to cart confirmation
function showAddToCartConfirmation(name, price) {
  const confirmation = document.createElement('div');
  confirmation.className = 'add-to-cart-confirmation';
  confirmation.innerHTML = `<span>${name} added to cart - R${price}</span>`;
  document.body.appendChild(confirmation);

  setTimeout(() => confirmation.classList.add('show'), 10);
  setTimeout(() => {
    confirmation.classList.remove('show');
    setTimeout(() => document.body.removeChild(confirmation), 300);
  }, 3000);
}

// Color selection functionality
function selectColor(productId, colorName) {
  const productElement = document.getElementById(productId);
  const colorOptions = productElement.querySelectorAll('.color-option');

  colorOptions.forEach((option) => option.classList.remove('selected'));
  event.target.classList.add('selected');
}

// Show More Info Functionality
function showMoreInfo(productId) {
  const infoElement = document.getElementById(`${productId}-info`);
  infoElement.style.display =
    infoElement.style.display === 'block' ? 'none' : 'block';
}

// Update price when storage changes
function updatePrice(productId) {
  const storageSelect = document.getElementById(`${productId}-storage`);
  if (!storageSelect) return;

  const selectedOption = storageSelect.options[storageSelect.selectedIndex];
  const priceText = selectedOption.textContent.split(' - ')[1];
  const priceElement = document.querySelector(`#${productId} .price`);

  if (priceElement) {
    priceElement.textContent =
      priceText ||
      `R${prices[productId]?.[storageSelect.value.split(' - ')[0]] || 0}`;
  }
}

// Initialize iPhone "Add to Cart" buttons
function initIphoneAddToCartButtons() {
  const iphoneProducts = [
    'iPhone-7-Plus',
    'iPhone-8-Plus',
    'iPhone-X',
    'iPhone-XR',
    'iPhone-11',
    'iPhone-11-Pro',
    'iPhone-12',
    'iPhone-12-Pro',
    'iPhone-13',
    'iPhone-13-Pro-Max',
    'iPhone-14',
    'iPhone-14-Pro',
    'iPhone-14-Pro-Max',
    'iPhone-15',
    'iPhone-15-Pro',
    'iPhone-15-Pro-Max'
  ];

  iphoneProducts.forEach((productId) => {
    const button = document.querySelector(
      `#${productId} button:not(.more-info)`
    );
    if (button) {
      button.onclick = function () {
        const productElement = document.getElementById(productId);
        const selectedColor = productElement.querySelector(
          '.color-option.selected'
        );
        const color = selectedColor ? selectedColor.style.backgroundColor : '';
        const productName = productElement.querySelector('h2').textContent;
        const imageSrc = productElement
          .querySelector('.product-image')
          .getAttribute('src')
          .replace('Images/', '');

        let price = 0;
        const storageSelect = document.getElementById(`${productId}-storage`);
        if (storageSelect) {
          const storage = storageSelect.value.split(' - ')[0];
          price = prices[productId]?.[storage] || 0;
        } else {
          const priceText = productElement.querySelector('.price').textContent;
          price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        }

        addToCart(productId, price, imageSrc, productName, color, '', true);
      };
    }
  });
}

// Gallery functionality
function nextImage(container) {
  const gallery = container.querySelector('.gallery-container');
  const images = gallery.querySelectorAll('.gallery-image');
  let currentIndex = 0;

  images.forEach((img, index) => {
    if (img.classList.contains('active')) {
      currentIndex = index;
      img.classList.remove('active');
    }
  });

  images[(currentIndex + 1) % images.length].classList.add('active');
}

function prevImage(container) {
  const gallery = container.querySelector('.gallery-container');
  const images = gallery.querySelectorAll('.gallery-image');
  let currentIndex = 0;

  images.forEach((img, index) => {
    if (img.classList.contains('active')) {
      currentIndex = index;
      img.classList.remove('active');
    }
  });

  images[(currentIndex - 1 + images.length) % images.length].classList.add(
    'active'
  );
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
  // Highlight current page in navigation
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.header-nav a').forEach((link) => {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  // Initialize product buttons
  initIphoneAddToCartButtons();
  updateCartCount();

  // Auto-play videos if any
  document.querySelectorAll('video').forEach((video) => {
    video.muted = true;
    video.playsInline = true;
    video.play().catch((e) => console.log('Video autoplay prevented:', e));
  });

  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const mobileNav = document.querySelector('.mobile-nav');

  hamburgerBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    mobileNav.classList.toggle('active');
    hamburgerBtn.classList.toggle('active');
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', function (event) {
    if (
      !event.target.closest('.hamburger-menu') &&
      !event.target.closest('.mobile-nav')
    ) {
      mobileNav.classList.remove('active');
      hamburgerBtn.classList.remove('active');
    }
  });
});

// Global functions
window.selectColor = selectColor;
window.showMoreInfo = showMoreInfo;
window.updatePrice = updatePrice;
window.nextImage = nextImage;
window.prevImage = prevImage;
