const products = [
  { id: "p1", name: "Brelok NFC", price: 29.99, image: "brelok.png" },
  { id: "p2", name: "Naklejka Logo", price: 14.99, image: "/img/naklejka.png" },
  { id: "p3", name: "Plakietka QR", price: 39.99, image: "/img/qr.png" }
];

const container = document.getElementById("products");
const cartItemsDiv = document.getElementById("cart-items");
const cartTotalSpan = document.getElementById("cart-total");
const modal = document.getElementById("productModal");

let selectedProduct = null;
let cart = JSON.parse(localStorage.getItem("cart")) || [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function openModal(id) {
  selectedProduct = products.find(p => p.id === id);
  if (!selectedProduct) return;

  document.getElementById("modalName").textContent = selectedProduct.name;
  document.getElementById("modalImage").src = selectedProduct.image;

  modal.style.display = "flex";
}

function closeModal() {
  modal.style.display = "none";
}

function addConfiguredProduct() {

  const baseColor = document.getElementById("modalColor").value;
  const size = document.getElementById("modalSize").value;
  const text = document.getElementById("modalText").value;
  const textColor = document.getElementById("modalTextColor").value;

  cart.push({
    id: selectedProduct.id,
    name: selectedProduct.name,
    price: selectedProduct.price,
    quantity: 1,
    options: { 
      baseColor,
      size,
      text,
      textColor
    }
  });

  saveCart();
  renderCart();
  closeModal();
}


function renderCart() {
  cartItemsDiv.innerHTML = "";
  let total = 0;

  cart.forEach(item => {
    total += item.price * item.quantity;

    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <strong>${item.name}<strong>${item.name}</strong><br>
  Podstawa: ${item.options?.baseColor || "-"} |
  Rozmiar: ${item.options?.size || "-"}<br>
  Napis: ${item.options?.text || "-"} 
  (${item.options?.textColor || "-"})<br>
  ${item.price.toFixed(2)} zł
    `;
    cartItemsDiv.appendChild(div);
  });

  cartTotalSpan.textContent = total.toFixed(2);
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

function checkout() {
  if (cart.length === 0) {
    alert("Koszyk jest pusty");
    return;
  }
  window.location.href = "/dane-platnosc.html";
}

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


renderProducts(products);
renderCart();
 
// Zamknięcie po kliknięciu w tło
modal.addEventListener("click", function (e) {
  if (e.target === modal) {
    closeModal();
  }
});

// Zamknięcie klawiszem ESC
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeModal();
  }
});