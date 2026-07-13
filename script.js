// ==================== GLOBAL STATE ====================
let cart = [];
let cartCount = 0;

// ==================== NAVBAR SCROLL EFFECT ====================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// ==================== CART FUNCTIONALITY ====================
const cartModal = document.getElementById('cartModal');
const cartBtn = document.getElementById('cartBtn');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCountElement = document.querySelector('.cart-count');

// Open cart
cartBtn.addEventListener('click', () => {
    cartModal.classList.add('active');
    document.body.style.overflow = 'hidden';
});

// Close cart
closeCart.addEventListener('click', () => {
    cartModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close cart when clicking outside
cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) {
        cartModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
});

// Add to cart function
function addToCart(name, price) {
    // Check if item already exists
    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            name: name,
            price: price,
            quantity: 1
        });
    }

    updateCart();
    showNotification(`${name} added to cart!`);
}

// Update cart display
function updateCart() {
    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountElement.textContent = cartCount;

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <p>Your cart is empty</p>
            </div>
        `;
    } else {
        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="racket.png" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <div class="cart-item-price">$${item.price}</div>
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="decreaseQuantity('${item.name}')">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="increaseQuantity('${item.name}')">+</button>
                        <button class="remove-item" onclick="removeFromCart('${item.name}')">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateTotal();
}

// Increase quantity
function increaseQuantity(name) {
    const item = cart.find(item => item.name === name);
    if (item) {
        item.quantity++;
        updateCart();
    }
}

// Decrease quantity
function decreaseQuantity(name) {
    const item = cart.find(item => item.name === name);
    if (item && item.quantity > 1) {
        item.quantity--;
        updateCart();
    }
}

// Remove from cart
function removeFromCart(name) {
    cart = cart.filter(item => item.name !== name);
    updateCart();
    showNotification('Item removed from cart');
}

// Update total
function updateTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.querySelector('.total-amount').textContent = `$${total}`;
}

// ==================== NOTIFICATION SYSTEM ====================
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// ==================== NEWSLETTER FORM ====================
const newsletterForm = document.querySelector('.newsletter-form');
newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = e.target.querySelector('input').value;
    showNotification('Thank you for subscribing!');
    e.target.reset();
});

// ==================== SMOOTH SCROLL FOR LINKS ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== INTERSECTION OBSERVER FOR ANIMATIONS ====================
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections and cards
document.querySelectorAll('.product-card, .feature-card, .about-content').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ==================== 3D TILT EFFECT FOR PRODUCT CARDS ====================
document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
});

// ==================== PARALLAX EFFECT ====================
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.racket-showcase, .gradient-orb');

    parallaxElements.forEach((el, index) => {
        const speed = 0.1 + (index * 0.05);
        el.style.transform = `translateY(${scrolled * speed}px)`;
    });
});

// ==================== QUICK VIEW FUNCTIONALITY ====================
document.querySelectorAll('.quick-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const productCard = btn.closest('.product-card');
        const productName = productCard.querySelector('h3').textContent;
        showNotification(`Viewing ${productName}`);
    });
});

// ==================== PAYMENT MODAL FUNCTIONALITY ====================
const paymentModal = document.getElementById('paymentModal');
const closePayment = document.getElementById('closePayment');
const successModal = document.getElementById('successModal');
const paymentForm = document.getElementById('paymentForm');

// Open payment modal
document.querySelector('.checkout-btn').addEventListener('click', () => {
    if (cart.length === 0) {
        showNotification('Your cart is empty!');
        return;
    }

    openPaymentModal();
});

function openPaymentModal() {
    // Populate order summary
    updateOrderSummary();

    // Show payment modal
    paymentModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Close cart modal
    cartModal.classList.remove('active');
}

// Close payment modal
closePayment.addEventListener('click', () => {
    paymentModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Close on overlay click
document.querySelector('.payment-overlay').addEventListener('click', () => {
    paymentModal.classList.remove('active');
    document.body.style.overflow = 'auto';
});

// Update order summary
function updateOrderSummary() {
    const summaryItems = document.getElementById('summaryItems');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    // Update items
    summaryItems.innerHTML = cart.map(item => `
        <div class="summary-item">
            <div>
                <div class="summary-item-name">${item.name}</div>
                <div class="summary-item-qty">Qty: ${item.quantity}</div>
            </div>
            <div>$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    // Update totals
    document.getElementById('summarySubtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('summaryTax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('summaryTotal').textContent = `$${total.toFixed(2)}`;
}

// ==================== CARD VALIDATION ====================
const cardNumber = document.getElementById('cardNumber');
const cardName = document.getElementById('cardName');
const cardExpiry = document.getElementById('cardExpiry');
const cardCvv = document.getElementById('cardCvv');
const cardBrand = document.getElementById('cardBrand');

// Card number formatting and validation
cardNumber.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;

    // Detect card brand
    detectCardBrand(value);

    // Validate
    if (value.length > 0) {
        if (validateCardNumber(value)) {
            cardNumber.classList.remove('error');
            document.getElementById('cardNumberError').classList.remove('show');
        } else {
            cardNumber.classList.add('error');
            document.getElementById('cardNumberError').textContent = 'Invalid card number';
            document.getElementById('cardNumberError').classList.add('show');
        }
    }
});

// Detect card brand
function detectCardBrand(number) {
    const brands = {
        visa: /^4/,
        mastercard: /^5[1-5]/,
        amex: /^3[47]/,
        discover: /^6(?:011|5)/
    };

    for (const [brand, pattern] of Object.entries(brands)) {
        if (pattern.test(number)) {
            const icons = {
                visa: '💳',
                mastercard: '💳',
                amex: '💳',
                discover: '💳'
            };
            cardBrand.textContent = icons[brand];
            return;
        }
    }
    cardBrand.textContent = '';
}

// Luhn algorithm for card validation
function validateCardNumber(number) {
    if (number.length < 13 || number.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
        let digit = parseInt(number[i]);

        if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
}

// Cardholder name validation
cardName.addEventListener('blur', () => {
    if (cardName.value.length < 3) {
        cardName.classList.add('error');
        document.getElementById('cardNameError').textContent = 'Please enter a valid name';
        document.getElementById('cardNameError').classList.add('show');
    } else {
        cardName.classList.remove('error');
        document.getElementById('cardNameError').classList.remove('show');
    }
});

// Expiry date formatting and validation
cardExpiry.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }

    e.target.value = value;

    if (value.length === 5) {
        if (validateExpiry(value)) {
            cardExpiry.classList.remove('error');
            document.getElementById('cardExpiryError').classList.remove('show');
        } else {
            cardExpiry.classList.add('error');
            document.getElementById('cardExpiryError').textContent = 'Invalid or expired date';
            document.getElementById('cardExpiryError').classList.add('show');
        }
    }
});

function validateExpiry(expiry) {
    const [month, year] = expiry.split('/');
    const now = new Date();
    const currentYear = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;

    const expMonth = parseInt(month);
    const expYear = parseInt(year);

    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear) return false;
    if (expYear === currentYear && expMonth < currentMonth) return false;

    return true;
}

// CVV validation
cardCvv.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '');

    if (e.target.value.length >= 3) {
        cardCvv.classList.remove('error');
        document.getElementById('cardCvvError').classList.remove('show');
    }
});

cardCvv.addEventListener('blur', () => {
    if (cardCvv.value.length < 3) {
        cardCvv.classList.add('error');
        document.getElementById('cardCvvError').textContent = 'Invalid CVV';
        document.getElementById('cardCvvError').classList.add('show');
    }
});

// ==================== PAYMENT FORM SUBMISSION ====================
paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate all fields
    let isValid = true;

    // Validate card number
    if (!validateCardNumber(cardNumber.value.replace(/\s/g, ''))) {
        cardNumber.classList.add('error');
        document.getElementById('cardNumberError').textContent = 'Invalid card number';
        document.getElementById('cardNumberError').classList.add('show');
        isValid = false;
    }

    // Validate card name
    if (cardName.value.length < 3) {
        cardName.classList.add('error');
        document.getElementById('cardNameError').textContent = 'Please enter a valid name';
        document.getElementById('cardNameError').classList.add('show');
        isValid = false;
    }

    // Validate expiry
    if (!validateExpiry(cardExpiry.value)) {
        cardExpiry.classList.add('error');
        document.getElementById('cardExpiryError').textContent = 'Invalid or expired date';
        document.getElementById('cardExpiryError').classList.add('show');
        isValid = false;
    }

    // Validate CVV
    if (cardCvv.value.length < 3) {
        cardCvv.classList.add('error');
        document.getElementById('cardCvvError').textContent = 'Invalid CVV';
        document.getElementById('cardCvvError').classList.add('show');
        isValid = false;
    }

    if (!isValid) {
        showNotification('Please fix the errors in the form');
        return;
    }

    // Show loading state
    const submitBtn = document.querySelector('.payment-submit-btn');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    // Simulate payment processing
    await processPayment();

    // Hide loading state
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
});

// Process payment (simulated)
function processPayment() {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Move to confirmation step
            document.querySelectorAll('.step').forEach((step, index) => {
                if (index === 1) {
                    step.classList.add('active');
                }
            });

            // Process payment
            setTimeout(() => {
                // Payment successful
                const orderNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
                showSuccessModal(orderNumber);
                resolve();
            }, 1500);
        }, 2000);
    });
}

// Show success modal
function showSuccessModal(orderNumber) {
    paymentModal.classList.remove('active');
    successModal.classList.add('active');
    document.getElementById('orderNumber').textContent = orderNumber;

    // Clear cart
    cart = [];
    updateCart();

    // Reset form
    paymentForm.reset();
    cardBrand.textContent = '';
    document.querySelectorAll('.step').forEach((step, index) => {
        if (index === 0) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Close success modal
function closeSuccessModal() {
    successModal.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ==================== ACCESSIBILITY - KEYBOARD NAVIGATION ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        // Close modals on Escape key
        if (successModal.classList.contains('active')) {
            closeSuccessModal();
        } else if (paymentModal.classList.contains('active')) {
            paymentModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        } else if (cartModal.classList.contains('active')) {
            cartModal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
});

// ==================== LOADING ANIMATION ====================
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.5s ease';

    setTimeout(() => {
        document.body.style.opacity = '1';
    }, 100);
});

// ==================== CURSOR EFFECT (OPTIONAL) ====================
const createCursorEffect = () => {
    const cursor = document.createElement('div');
    cursor.style.cssText = `
        width: 20px;
        height: 20px;
        border: 2px solid rgba(99, 102, 241, 0.5);
        border-radius: 50%;
        position: fixed;
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.2s ease;
        display: none;
    `;
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (e) => {
        cursor.style.display = 'block';
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });

    document.querySelectorAll('button, a, .product-card').forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'scale(1.5)';
            cursor.style.borderColor = 'rgba(236, 72, 153, 0.8)';
        });

        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'scale(1)';
            cursor.style.borderColor = 'rgba(99, 102, 241, 0.5)';
        });
    });
};

// Uncomment to enable cursor effect
// createCursorEffect();

// ==================== PERFORMANCE OPTIMIZATION ====================
// Debounce function for scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll-heavy operations
const debouncedScroll = debounce(() => {
    // Scroll operations here
}, 10);

window.addEventListener('scroll', debouncedScroll);


// ==================== ANIMATE ON SCROLL ====================
const animateOnScroll = () => {
    const elements = document.querySelectorAll('.stat, .floating-card');

    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, index * 100);
    });
};

// Run on page load
window.addEventListener('load', animateOnScroll);

console.log('🎾 AURBON - Premium Padel Rackets Website Loaded Successfully!');
// ==================== PRODUCT TABS ====================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
    });
});
