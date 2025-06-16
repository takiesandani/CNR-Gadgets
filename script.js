// Mobile nav toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

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