/* ================== PRODUKTY ================== */
/* type: "custom" = własny tekst + własne logo */
/* type: "ready" = gotowy model (bez własnego tekstu/logo) */

const products = [
  {
    id: "p1",
    name: "Brelok NFC – Pusty (Personalizowany)",
    price: 29.99,
    image: "brelok.png",
    type: "custom"
  },
  {
    id: "p2",
    name: "Brelok NFC – Web Logo",
    price: 29.99,
    image: "brelok.png",
    type: "ready"
  },
  {
    id: "p3",
    name: "Brelok NFC – WiFi Logo",
    price: 29.99,
    image: "brelok.png",
    type: "ready"
  }
];

/* ================== DOM ================== */

const container = document.getElementById("products");
const cartItemsDiv = document.getElementById("cart-items");
const cartTotalSpan = document.getElementById("cart-total");
const searchInput = document.getElementById("search");

const popup = document.getElementById("productModal");
const popupTitle = document.getElementById("modalName");
const popupImage = document.getElementById("modalImage");
const popupBaseColor = document.getElementById("modalColor");
const popupText = document.getElementById("modalText");
const popupTextColor = document.getElementById("modalTextColor");
const popupSize = document.getElementById("modalSize");
const popupLogo = document.getElementById("modalLogo");

let selectedProduct = null;

/* ================== KOSZYK ================== */

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

/* ================== POPUP ================== */

const textWrapper = document.getElementById("textWrapper");
const logoWrapper = document.getElementById("logoWrapper");

function openPopup(productId) {
  selectedProduct = products.find(p => p.id === productId);
  if (!selectedProduct) return;

  popupTitle.textContent = selectedProduct.name;
  popupImage.src = selectedProduct.image;

  if (selectedProduct.type === "ready") {
    textWrapper.style.display = "none";
    logoWrapper.style.display = "none";
  } else {
    textWrapper.style.display = "block";
    logoWrapper.style.display = "block";
  }

  popup.style.display = "flex";
}

/* ================== DODAWANIE DO KOSZYKA ================== */

function addConfiguredProduct() {
  if (!selectedProduct) return;

  const config = {
    baseColor: popupBaseColor.value,
    size: popupSize.value,
    text: selectedProduct.type === "custom" ? popupText.value : null,
    textColor: popupTextColor.value,
    logo: selectedProduct.type === "custom" ? popupLogo.files[0]?.name || null : null
  };

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
  closeModal();
}

/* ================== ILOŚĆ ================== */

function changeQty(index, delta) {
  cart[index].quantity += delta;

  if (cart[index].quantity <= 0) {
    cart.splice(index, 1);
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
  cartItemsDiv.innerHTML = "";
  let total = 0;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const div = document.createElement("div");
    div.className = "cart-item";

    div.innerHTML = `
      <strong>${item.name}</strong><br>
      Podstawa: ${item.options.baseColor} |
      Rozmiar: ${item.options.size}<br>
      ${item.options.text ? `Napis: ${item.options.text}<br>` : ""}
      ${item.options.logo ? `Logo: ${item.options.logo}<br>` : ""}
      Kolor loga/napisu: ${item.options.textColor}<br>

      <div>
        <button onclick="changeQty(${index}, -1)">−</button>
        ${item.quantity}
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

searchInput.addEventListener("input", e => {
  const value = e.target.value.toLowerCase();

  renderProducts(
    products.filter(p =>
      p.name.toLowerCase().includes(value)
    )
  );
});

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