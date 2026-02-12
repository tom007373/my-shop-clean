/* ================== PRODUKTY ================== */

const products = [
  { id: "p1", name: "Brelok NFC", price: 29.99, image: "img/brelok.png" },
  { id: "p2", name: "Naklejka Logo", price: 14.99, image: "img/naklejka.png" },
  { id: "p3", name: "Plakietka QR", price: 39.99, image: "img/qr.png" }
];

/* ================== ELEMENTY DOM ================== */

const container = document.getElementById("products");
const cartItemsDiv = document.getElementById("cart-items");
const cartTotalSpan = document.getElementById("cart-total");
const searchInput = document.getElementById("search");

/* POPUP */
const popup = document.getElementById("product-popup");
const popupTitle = document.getElementById("popup-title");
const popupBaseColor = document.getElementById("popup-base-color");
const popupText = document.getElementById("popup-text");
const popupTextColor = document.getElementById("popup-text-color");
const popupSize = document.getElementById("popup-size");

let selectedProduct = null;

/* ================== KOSZYK ================== */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ================== PERSONALIZACJA ================== */

function openPopup(productId) {
  if (!popup) return;

  selectedProduct = products.find(p => p.id === productId);
  popupTitle.textContent = selectedProduct.name;

  popup.style.display = "flex";
}

function closePopup() {
  if (!popup) return;
  popup.style.display = "none";
}

/* klik poza popup */
if (popup) {
  popup.addEventListener("click", e => {
    if (e.target === popup) closePopup();
  });
}

/* ================== DODAWANIE DO KOSZYKA ================== */

function addConfiguredProduct() {
  if (!selectedProduct) return;

  const config = {
    baseColor: popupBaseColor?.value || "",
    text: popupText?.value || "",
    textColor: popupTextColor?.value || "",
    size: popupSize?.value || ""
  };

  /* sprawdz czy taka konfiguracja juz istnieje */
  const existing = cart.find(item =>
    item.id === selectedProduct.id &&
    JSON.stringify(item.options) === JSON.stringify(config)
  );

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      image: selectedProduct.image,
      quantity: 1,
      options: config
    });
  }

  saveCart();
  renderCart();
  closePopup();
}

/* ================== ZMIANA ILOŚCI ================== */

function changeQty(index, delta) {
  cart[index].quantity += delta;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
  }

  saveCart();
  renderCart();
}

/* ================== RENDER KOSZYKA ================== */

function renderCart() {
  if (!cartItemsDiv || !cartTotalSpan) return;

  cartItemsDiv.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <strong>${item.name}</strong><br>
      Podstawa: ${item.options?.baseColor || "-"} |
      Rozmiar: ${item.options?.size || "-"}<br>
      Napis: ${item.options?.text || "-"} 
      (${item.options?.textColor || "-"})<br>

      <div class="qty">
        <button onclick="changeQty(${index}, -1)">−</button>
        <span>${item.quantity}</span>
        <button onclick="changeQty(${index}, 1)">+</button>
      </div>

      <div>${itemTotal.toFixed(2)} zł</div>
      <hr>
    `;

    cartItemsDiv.appendChild(div);
  });

  cartTotalSpan.textContent = total.toFixed(2);
}

/* ================== PRODUKTY ================== */

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
      <button onclick="openPopup('${p.id}')">
        Personalizuj
      </button>
    `;

    container.appendChild(div);
  });
}

/* ================== WYSZUKIWARKA ================== */

if (searchInput) {
  searchInput.addEventListener("input", e => {
    const value = e.target.value.toLowerCase();

    renderProducts(
      products.filter(p =>
        p.name.toLowerCase().includes(value)
      )
    );
  });
}

/* ================== CHECKOUT ================== */

function checkout() {
  if (cart.length === 0) {
    alert("Koszyk jest pusty");
    return;
  }

  window.location.href = "/dane-platnosc.html";
}

/* ================== START ================== */

renderProducts(products);
renderCart();
