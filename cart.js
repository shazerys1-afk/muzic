const cartItems = document.querySelector('#cartItems');
const totalPrice = document.querySelector('#totalPrice');
const clearCartBtn = document.querySelector('#clearCartBtn');
const payBtn = document.querySelector('#payBtn');

function loadCart() {
    try {
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (Array.isArray(localCart)) {
            return localCart;
        }
    } catch (error) {
        console.warn('localStorage корзина не прочиталась:', error);
    }

    const cookieCart = document.cookie
        .split('; ')
        .find(row => row.startsWith('cart='));

    if (cookieCart) {
        try {
            const decodedCart = decodeURIComponent(cookieCart.split('=')[1]);
            const parsedCart = JSON.parse(decodedCart);
            localStorage.setItem('cart', JSON.stringify(parsedCart));
            return parsedCart;
        } catch (error) {
            console.warn('Cookie корзина не прочиталась:', error);
        }
    }

    return [];
}

function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    const encodedCart = encodeURIComponent(JSON.stringify(cart));
    document.cookie = `cart=${encodedCart}; path=/; max-age=${3600 * 24 * 7}`;
}

function renderCart() {
    if (!cartItems || !totalPrice) return;

    const cart = loadCart();
    cartItems.innerHTML = '';

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="m-3">Ваш кошик порожній 🛒</p>';
        totalPrice.textContent = '0 грн';
        return;
    }

    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;

        cartItems.innerHTML += `
            <div class="card mb-3">
                <div class="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <div class="flex-grow-1">
                        <h5 class="mb-1">${item.title}</h5>
                        <p class="mb-0 text-muted">${item.price} грн × ${item.quantity}</p>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-outline-secondary btn-sm minus" data-id="${item.id}">−</button>
                        <span class="fw-bold">${item.quantity}</span>
                        <button class="btn btn-outline-secondary btn-sm plus" data-id="${item.id}">+</button>
                        <button class="btn btn-danger btn-sm remove" data-id="${item.id}">Видалити</button>
                    </div>
                </div>
            </div>
        `;
    });

    totalPrice.textContent = `${total} грн`;
}

function updateQuantity(id, delta) {
    const cart = loadCart();
    const item = cart.find(p => p.id == id);

    if (!item) return;

    item.quantity += delta;

    if (item.quantity <= 0) {
        const newCart = cart.filter(p => p.id != id);
        saveCart(newCart);
        renderCart();
        return;
    }

    saveCart(cart);
    renderCart();
}

function clearCart() {
    saveCart([]);
    renderCart();
}

document.addEventListener('DOMContentLoaded', renderCart);

document.addEventListener('click', (e) => {
    const plusBtn = e.target.closest('.plus');
    if (plusBtn) {
        updateQuantity(plusBtn.dataset.id, 1);
        return;
    }

    const minusBtn = e.target.closest('.minus');
    if (minusBtn) {
        updateQuantity(minusBtn.dataset.id, -1);
        return;
    }

    const removeBtn = e.target.closest('.remove');
    if (removeBtn) {
        const updatedCart = loadCart().filter(p => p.id != removeBtn.dataset.id);
        saveCart(updatedCart);
        renderCart();
        return;
    }
});

clearCartBtn?.addEventListener('click', clearCart);

payBtn?.addEventListener('click', () => {
    alert('Оплата поки що симульована. Для реальної оплати потрібен сервер або платіжний провайдер.');
    clearCart();
});