/* ================== PRODUKTY ================== */

const products = [
  { id: "p1", name: "Brelok NFC", price: 29.99, image: "brelok.png" },
  { id: "p2", name: "Naklejka Logo", price: 14.99, image: "img/naklejka.png" },
  { id: "p3", name: "Plakietka QR", price: 39.99, image: "img/qr.png" }
];

/* ================== ELEMENTY DOM ================== */

const container = document.getElementById("products");
const cartItemsDiv = document.getElementById("cart-items");
const cartTotalSpan = document.getElementById("cart-total");
const searchInput = document.getElementById("search");

/* ================== KOSZYK ================== */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1
    });
  }

  saveCart();
  renderCart();
}

function changeQty(id, delta) {
  const item = cart.find(p => p.id === id);
  if (!item) return;

  item.quantity += delta;

  if (item.quantity <= 0) {
    cart = cart.filter(p => p.id !== id);
  }

  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

/* ================== RENDER KOSZYKA ================== */

function renderCart() {
  if (!cartItemsDiv || !cartTotalSpan) return;

  cartItemsDiv.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.name}</span>

      <div class="qty">
        <button onclick="changeQty('${item.id}', -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQty('${item.id}', 1)">+</button>
      </div>

      <span>${itemTotal.toFixed(2)} zł</span>
    `;

    cartItemsDiv.appendChild(div);
  });

  cartTotalSpan.textContent = total.toFixed(2);
}

/* ================== RENDER PRODUKTÓW ================== */

function renderProducts(list) {
  if (!container) return;

  container.innerHTML = "";

  list.forEach(p => {
    const div = document.createElement("div");
    div.className = "product";
    div.innerHTML = `
      <h3>${p.name}</h3>
      <img src="${p.image}" alt="${p.name}">
      <p>${p.price.toFixed(2)} zł</p>
      <button onclick="addToCart('${p.id}')">
        Dodaj do koszyka
      </button>
    `;
    container.appendChild(div);
  });
}

/* ================== WYSZUKIWARKA ================== */

if (searchInput) {
  searchInput.addEventListener("input", e => {
    const value = e.target.value.toLowerCase();
    const filtered = products.filter(p =>
      p.name.toLowerCase().includes(value)
    );
    renderProducts(filtered);
  });
}

/* ================== CHECKOUT ================== */

function checkout() {
  if (cart.length === 0) {
    alert("Koszyk jest pusty");
    return;
  }

  // Przejście do formularza danych
  window.location.href = "/dane-platnosc.html";
}

/* ================== START ================== */

renderProducts(products);
renderCart();