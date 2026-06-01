function getJsonCookie(cookieName) {
    const allCookies = document.cookie.split('; ');

    const targetCookie = allCookies.find(row => row.startsWith(cookieName + '='));

    if (targetCookie) {
        try {
            const encodedData = targetCookie.split('=')[1];
            return JSON.parse(decodeURIComponent(encodedData));
        } catch (e) {
            console.warn('Failed to parse cookie', cookieName, e);
            return null;
        }
    }
    return null;
}

// 2. Універсальна функція для збереження будь-яких даних (масивів/об'єктів) у Cookie
function saveJsonCookie(cookieName, data, seconds) {
    const jsonString = JSON.stringify(data);
    const safeString = encodeURIComponent(jsonString);
    document.cookie = `${cookieName}=${safeString}; max-age=${seconds}; path=/`;
}

// ========== Глобальні змінні ==========
let products = []; // Масив всіх товарів
let cart = []; // Масив товарів у кошику
let currentCategory = 'all'; // Поточна категорія фільтра

const cartBtn = document.querySelector('#cartBtn');
const cartCountEl = document.querySelector('#cartCount');

// ========== DOM елементи ==========
const productsGrid = document.querySelector('#productsGrid');
const searchInput = document.querySelector('#searchInput');
const searchBtn = document.querySelector('#searchBtn');
const cartContainer = document.querySelector('#cartItems');
const checkoutForm = document.querySelector('#checkoutForm');


function setupGsapAnimations() {
    if (typeof gsap === 'undefined') return;

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
    }

    const heroTitle = document.querySelector('#heroTitle');
    const heroText = document.querySelector('#heroText');
    const heroButton = document.querySelector('.hero-section .btn');

    if (heroTitle && heroText && heroButton) {
        gsap.from([heroTitle, heroText, heroButton], {
            y: 36,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            stagger: 0.14
        });
    }

    if (typeof ScrollTrigger !== 'undefined') {
        gsap.utils.toArray('.section-title, #categoryFilters, #cartItems, #checkoutCard, footer .col-md-4, footer .col-md-6').forEach((el) => {
            gsap.from(el, {
                scrollTrigger: {
                    trigger: el,
                    start: 'top 88%'
                },
                y: 28,
                opacity: 0,
                duration: 0.7,
                ease: 'power2.out'
            });
        });
    }
}

function updateCartCount() {
    if (!cartCountEl) return;
    const totalCount = cart.reduce((sum, it) => sum + (it.quantity || 0), 0);
    cartCountEl.textContent = totalCount;
    // небольшой эффект пульсации
    if (typeof gsap !== 'undefined') {
        gsap.fromTo(cartCountEl, { scale: 0.8 }, { scale: 1.15, duration: 0.25, yoyo: true, repeat: 1, ease: 'power1.out' });
    } else {
        cartCountEl.classList.add('pulse');
        setTimeout(() => cartCountEl.classList.remove('pulse'), 300);
    }
}

// ====== Theme (dark / light) handling ======
function updateThemeToggleIcon() {
    const btn = document.querySelector('#themeToggle');
    if (!btn) return;
    const cur = document.documentElement.getAttribute('data-theme');
    btn.innerHTML = cur === 'dark' ? '<i class="bi bi-sun-fill"></i>' : '<i class="bi bi-moon-fill"></i>';
}

function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { }
    updateThemeToggleIcon();
}

function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) { }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggleIcon();
}

function animateProductCardsOnRender() {
    if (typeof gsap === 'undefined') return;

    const cards = gsap.utils.toArray('#productsGrid .card');
    if (!cards.length) return;

    if (typeof ScrollTrigger !== 'undefined') {
        cards.forEach((card, index) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 92%'
                },
                y: 24,
                opacity: 0,
                duration: 0.45,
                ease: 'power2.out',
                delay: index * 0.03
            });
        });
        return;
    }

    gsap.fromTo(cards, { y: 24, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.45,
        ease: 'power2.out',
        stagger: 0.07,
        overwrite: true
    });
}

// ========== Ініціалізація при завантаженні сторінки ==========
document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    setupGsapAnimations();
    loadCart(); // Завантажуємо кошик з LocalStorage
    fetchProducts(); // Отримуємо товари з JSON

    searchInput?.addEventListener('input', function () {
        const text = searchInput.value.toLowerCase(); // Що ввів юзер

        // Фільтруємо
        const filtered = products.filter(product => product.title.toLowerCase().includes(text));

        // Перемальовуємо сторінку новими даними!
        displayProducts(filtered);
    });

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Дякуємо за замовлення! Ми зв\'яжемося з вами найближчим часом для підтвердження деталей замовлення.');
            location.assign('index.html'); // Повертаємо користувача на головну сторінку після оформлення замовлення
            cart = []; // Очищаємо кошик після оформлення замовлення
            saveJsonCookie('cart', cart, 3600 * 24 * 7); // Оновлюємо Cookie після очищення кошика
            displayCart(); // Оновлюємо відображення кошика
            checkoutForm.reset();
        })
    }

    // Theme toggle button handler
    const themeBtn = document.querySelector('#themeToggle');
    themeBtn?.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
    });
});

// ========== Отримання товарів з JSON ==========
async function fetchProducts() {
    const response = await fetch('store_db.json');
    const data = await response.json();
    products = data; // Оновлюємо глобальний масив для роботи addToCart
    if (productsGrid) {
        displayProducts(data);
    }
}

// ========== Відображення товарів ==========
function displayProducts(products) {
    productsGrid.innerHTML = ''; // Очищаємо блок товарів

    products?.forEach(product => {
        const card = createProductCard(product);
        productsGrid.innerHTML += card;
    });

    animateProductCardsOnRender();
}

function getProductImagePath(product) {
    const imagePath = product.image || '';
    const cleanPath = imagePath.replace(/^img\//i, '');
    return cleanPath ? `img/${cleanPath}` : 'img/images.jpg';
}

// ========== Створення картки товару ==========
function createProductCard(product) {
        const hasDiscount = product.discount && Number(product.discount) > 0;
        const originalPrice = Number(product.price) || 0;
        const discountedPrice = hasDiscount ? Math.round(originalPrice * (1 - Number(product.discount) / 100)) : originalPrice;
        const shortInfo = product.shortDescription || product.description || '';

        const bestsellerBadge = product.bestSeller ? `<div class="badge-bestseller">Лідер продажів</div>` : '';
        const discountBadge = hasDiscount ? `<div class="badge-discount">-${product.discount}%</div>` : '';

        return `
        <div class="col-sm-6 col-md-4 col-lg-3">
            <div class="card h-100 product-card position-relative overflow-hidden">
                ${bestsellerBadge}
                ${discountBadge}
                <img src="${getProductImagePath(product)}" class="card-img-top" alt="${product.title}" onerror="this.onerror=null; this.src='img/images.jpg';">
                <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${product.title}</h5>
                        <p class="card-text text-primary fw-bold mb-1">${discountedPrice} грн</p>
                        ${shortInfo ? `<p class="product-info small text-muted mb-2">${shortInfo}</p>` : ''}
                        <div class="mt-auto">
                            <button onclick="addToCart(${product.id})"  class="btn btn-warning add-to-cart-btn w-100"> <i class="bi bi-cart-plus"></i> В кошик</button>
                        </div>
                </div>
            </div>
        </div>`;
}

// ========== Робота з кошиком ==========

// Додавання товару до кошика
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        cartItem.quantity += 1; // Якщо товар вже в кошику, збільшуємо кількість
    } else {
        cart.push({ ...product, quantity: 1 }); // Додаємо новий товар до кошика
    }
    saveJsonCookie('cart', cart, 3600 * 24 * 7); // Зберігаємо кошик у Cookie на 1 тижден
    localStorage.setItem('cart', JSON.stringify(cart)); // Дублюємо у localStorage для сторінки кошика
    updateCartCount();
    // Анімація польоту картинки до кошика
    try {
        const img = document.querySelector(`#productsGrid img[alt="${product.title}"]`);
        if (img) animateAddToCart(img);
    } catch (e) {
        // ignore
    }
}

function animateAddToCart(imgEl) {
    if (!imgEl || !cartBtn) return;
    if (typeof gsap === 'undefined') {
        // простой эффект: пульс кнопки
        cartBtn.classList.add('pulse');
        setTimeout(() => cartBtn.classList.remove('pulse'), 400);
        return;
    }

    const clone = imgEl.cloneNode(true);
    const rect = imgEl.getBoundingClientRect();
    clone.style.position = 'fixed';
    clone.style.left = rect.left + 'px';
    clone.style.top = rect.top + 'px';
    clone.style.width = rect.width + 'px';
    clone.style.height = rect.height + 'px';
    clone.style.zIndex = 9999;
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);

    const cartRect = cartBtn.getBoundingClientRect();
    gsap.to(clone, { duration: 0.8, x: cartRect.left - rect.left, y: cartRect.top - rect.top, scale: 0.2, opacity: 0.6, ease: 'power2.inOut', onComplete() { clone.remove(); gsap.fromTo(cartBtn, { scale: 0.9 }, { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1 }); } });
}


// Завантаження кошика з Cookie
function loadCart() {
    const savedCart = getJsonCookie('cart');
    if (savedCart !== null) {
        cart = savedCart;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart(); // Відображаємо кошик після завантаження
    }
}


function displayCart() {
    if (!cartContainer) return; // Якщо елемент для відображення кошика не знайдено, зупиняємо функцію

    // Очищаємо контейнер перед виведенням
    cartContainer.innerHTML = '';
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="m-3">Ваш кошик порожній 🛒</p>';
        return; // Зупиняємо функцію, далі йти не треба
    }
    let total = 0;
    cart.forEach((product) => {
        total += product.price * product.quantity; // Підрахунок загальної суми

        cartContainer.innerHTML += `
      <div class="card border-0 border-bottom rounded-0">
        <div class="card-body d-flex align-items-center gap-3 p-3">
          <img src="${getProductImagePath(product)}" height="80" onerror="this.onerror=null; this.src='img/images.jpg';">
          <div class="flex-grow-1">
              <h5 class="card-title mb-1">${product.title}</h5>
              <p class="card-text text-muted mb-1">Кількість: ${product.quantity}</p>
              <p class="card-text text-primary fw-bold mb-0">Ціна: ${product.price} грн</p>
          </div>
        </div>
      </div>
    `;
    });
    document.querySelector('#totalPrice').textContent = `${total} грн`; // Виводимо загальну суму

}





