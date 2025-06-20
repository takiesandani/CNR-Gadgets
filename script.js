// Mobile nav toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
  });
}

// Animate product cards on scroll
function animateCardsOnScroll() {
  const cards = document.querySelectorAll('.product-card');
  const triggerBottom = window.innerHeight * 0.92;
  cards.forEach(card => {
    const cardTop = card.getBoundingClientRect().top;
    if (cardTop < triggerBottom) {
      card.classList.add('visible');
    }
  });
}
window.addEventListener('scroll', animateCardsOnScroll);
window.addEventListener('DOMContentLoaded', animateCardsOnScroll);

function updateAddToCartButton(productId) {
  const productSection = document.getElementById(productId);
  if (!productSection) return;
  const selectedColorDiv = productSection.querySelector('.color-option.selected');
  let color = '';
  if (selectedColorDiv) {
    const onclick = selectedColorDiv.getAttribute('onclick');
    if (onclick) {
      const match = onclick.match(/'([^']+)'$/);
      if (match) color = match[1];
    }
  }
  const storageSelect = productSection.querySelector('.storage-selection select');
  let storage = '';
  let price = '';
  if (storageSelect) {
    const selectedOption = storageSelect.selectedOptions[0];
    storage = selectedOption.value;
    price = selectedOption.dataset.price || '';
  } else {
    // Try to get price from .price element as a float
    const priceText = productSection.querySelector('.price')?.textContent || '';
    // Remove currency symbols and commas, extract float
    const match = priceText.replace(/[^\d.]/g, '').match(/(\d+(\.\d+)?)/);
    price = match ? match[1] : '';
  }
  const addToCartBtn = productSection.querySelector('.add-to-cart');
  if (addToCartBtn) {
    addToCartBtn.dataset.color = color;
    addToCartBtn.dataset.storage = storage;
    addToCartBtn.dataset.price = price ? parseFloat(price) : 0;
  }
}

window.selectColor = function(productId, colorName) {
  const productSection = document.getElementById(productId);
  if (!productSection) return;
  productSection.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
  const selectedOption = Array.from(productSection.querySelectorAll('.color-option')).find(opt => opt.getAttribute('onclick')?.includes(`'${colorName}'`));
  if (selectedOption) selectedOption.classList.add('selected');
  updateAddToCartButton(productId);
};

document.querySelectorAll('.storage-selection select').forEach(select => {
  select.addEventListener('change', function() {
    const productId = this.closest('.product').id;
    updateAddToCartButton(productId);
  });
});

window.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.product').forEach(section => {
    updateAddToCartButton(section.id);
  });
  // Also update on color selection
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', function() {
      const productSection = this.closest('.product');
      if (productSection) {
        const productId = productSection.id;
        window.selectColor(productId, this.textContent.trim());
      }
    });
  });
});