// ==================== GLOBAL STATE ====================
let cart = [];
let cartCount = 0;

// ==================== NAVBAR SCROLL EFFECT ====================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 100);
    }
});

// ==================== CART FUNCTIONALITY (preserved for post-launch) ====================
const cartModal    = document.getElementById('cartModal');
const cartBtn      = document.getElementById('cartBtn');
const closeCartBtn = document.getElementById('closeCart');
const cartItemsEl  = document.getElementById('cartItems');
const cartCountEl  = document.querySelector('.cart-count');

if (cartBtn) {
    cartBtn.addEventListener('click', () => {
        if (cartModal) { cartModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
    });
}
if (closeCartBtn) {
    closeCartBtn.addEventListener('click', () => {
        if (cartModal) { cartModal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    });
}
if (cartModal) {
    cartModal.addEventListener('click', e => {
        if (e.target === cartModal) { cartModal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    });
}

function addToCart(name, price) {
    const existing = cart.find(i => i.name === name);
    if (existing) { existing.quantity++; } else { cart.push({ name, price, quantity: 1 }); }
    updateCart();
}

function updateCart() {
    cartCount = cart.reduce((t, i) => t + i.quantity, 0);
    if (cartCountEl) cartCountEl.textContent = cartCount;
    const totalEl = document.querySelector('.total-amount');
    if (totalEl) totalEl.textContent = '$' + cart.reduce((s, i) => s + i.price * i.quantity, 0);
}

function increaseQuantity(name) { const i = cart.find(i => i.name === name); if (i) { i.quantity++; updateCart(); } }
function decreaseQuantity(name) { const i = cart.find(i => i.name === name); if (i && i.quantity > 1) { i.quantity--; updateCart(); } }
function removeFromCart(name) { cart = cart.filter(i => i.name !== name); updateCart(); }

// ==================== PAYMENT MODAL (preserved for post-launch) ====================
const paymentModal  = document.getElementById('paymentModal');
const closePayBtn   = document.getElementById('closePayment');
const successModal  = document.getElementById('successModal');
const paymentForm   = document.getElementById('paymentForm');
const checkoutBtn   = document.querySelector('.checkout-btn');
const payOverlay    = document.querySelector('.payment-overlay');

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        if (paymentModal) { paymentModal.classList.add('active'); document.body.style.overflow = 'hidden'; }
        if (cartModal) cartModal.classList.remove('active');
    });
}
if (closePayBtn) {
    closePayBtn.addEventListener('click', () => {
        if (paymentModal) { paymentModal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    });
}
if (payOverlay) {
    payOverlay.addEventListener('click', () => {
        if (paymentModal) { paymentModal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    });
}
if (paymentForm) {
    paymentForm.addEventListener('submit', e => { e.preventDefault(); });
}

function closeSuccessModal() {
    if (successModal) { successModal.classList.remove('active'); document.body.style.overflow = 'auto'; }
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message) {
    const n = document.createElement('div');
    n.className = 'notification';
    n.textContent = message;
    n.style.cssText = 'position:fixed;top:100px;right:20px;background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:1rem 2rem;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.3);z-index:10000;font-weight:600;';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 2300);
}

// ==================== PRIVACY NOTICE BANNER ====================
(function () {
    const banner = document.getElementById('privacyNotice');
    const btn    = document.getElementById('dismissPrivacyNotice');
    if (!banner) return;
    try {
        if (localStorage.getItem('aurbon_privacy_dismissed') === '1') {
            banner.hidden = true;
        }
    } catch (_) {}
    if (btn) {
        btn.addEventListener('click', function () {
            banner.hidden = true;
            try { localStorage.setItem('aurbon_privacy_dismissed', '1'); } catch (_) {}
        });
    }
})();

// ==================== LAUNCH FORM ====================
const launchForm = document.getElementById('launchForm');
if (launchForm) {
    launchForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const consent      = document.getElementById('launchConsent');
        const consentError = document.getElementById('consentError');
        if (consent && !consent.checked) {
            if (consentError) consentError.hidden = false;
            if (consent) consent.focus();
            return;
        }
        if (consentError) consentError.hidden = true;
        launchForm.innerHTML = '<p class="launch-success">You\'re on the list. We\'ll be in touch.</p>';
    });
}

// ==================== PRODUCT TABS ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        const tab = document.getElementById('tab-' + btn.dataset.tab);
        if (tab) tab.classList.add('active');
    });
});

// ==================== PRODUCT CAROUSEL ====================
function carouselMove(id, dir) {
    const carousel = document.getElementById(id);
    if (!carousel) return;
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots   = carousel.querySelectorAll('.carousel-dot');
    let current  = [...slides].findIndex(s => s.classList.contains('active'));
    const next   = (current + dir + slides.length) % slides.length;

    slides[current].classList.add(dir > 0 ? 'slide-out-left' : 'slide-out-right');
    slides[next].classList.add(dir > 0 ? 'slide-in-right' : 'slide-in-left');
    slides[next].classList.add('active');

    setTimeout(() => {
        slides[current].classList.remove('active', 'slide-out-left', 'slide-out-right');
        slides[next].classList.remove('slide-in-right', 'slide-in-left');
        if (dots[current]) dots[current].classList.remove('active');
        if (dots[next])    dots[next].classList.add('active');
    }, 320);
}

// Touch swipe support
document.querySelectorAll('.product-carousel').forEach(carousel => {
    let startX = 0;
    carousel.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    carousel.addEventListener('touchend', e => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) carouselMove(carousel.id, diff > 0 ? 1 : -1);
    }, { passive: true });
});

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ==================== INTERSECTION OBSERVER (fade-in) ====================
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll(
    '.perf-card, .racket-showcase-row, .youre-early-inner, .testing-inner, .design-inner, .story-content, .launch-inner'
).forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
    observer.observe(el);
});

// ==================== KEYBOARD ESC ====================
document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (successModal && successModal.classList.contains('active')) closeSuccessModal();
    else if (paymentModal && paymentModal.classList.contains('active')) { paymentModal.classList.remove('active'); document.body.style.overflow = 'auto'; }
    else if (cartModal && cartModal.classList.contains('active')) { cartModal.classList.remove('active'); document.body.style.overflow = 'auto'; }
});

// ==================== PAGE LOAD FADE ====================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';
    setTimeout(() => { document.body.style.opacity = '1'; }, 80);
});
