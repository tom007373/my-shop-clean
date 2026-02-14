/* ================== PRODUKTY ================== */

const products = [
  { id:"p1", name:"Brelok NFC – Personalizowany", price:29.99, image:"brelok.png", type:"custom" },
  { id:"p2", name:"Brelok NFC – Web Logo", price:29.99, image:"brelok.png", type:"ready" },
  { id:"p3", name:"Brelok NFC – WiFi Logo", price:29.99, image:"brelok.png", type:"ready" },
  { id:"p4", name:"Karta NFC – Personalizowana", price:29.99, image:"karta_nfc.png", type:"custom" }
];

/* ================== DOM ================== */

const container = document.getElementById("products");
const popup = document.getElementById("productModal");
const closeBtn = document.getElementById("closeModal");
const addBtn = document.getElementById("addToCartBtn");

const popupTitle = document.getElementById("modalName");
const popupImage = document.getElementById("modalImage");
const popupColor = document.getElementById("modalColor");
const popupSize = document.getElementById("modalSize");
const popupText = document.getElementById("modalText");
const popupTextColor = document.getElementById("modalTextColor");
const popupLogo = document.getElementById("modalLogo");

const textSection = document.getElementById("textSection");
const logoSection = document.getElementById("logoSection");

const cartItemsDiv = document.getElementById("cart-items");
const cartTotalSpan = document.getElementById("cart-total");

let selectedProduct = null;
let cart = JSON.parse(localStorage.getItem("cart")) || [];

/* ================== POPUP ================== */

function openPopup(id){
  selectedProduct = products.find(p => p.id === id);
  if(!selectedProduct) return;

  popupTitle.textContent = selectedProduct.name;
  popupImage.src = selectedProduct.image;

  if(selectedProduct.type === "ready"){
    textSection.style.display = "none";
    logoSection.style.display = "none";
  } else {
    textSection.style.display = "block";
    logoSection.style.display = "block";
  }

  popup.style.display = "flex";
}

function closeModal(){
  popup.style.display = "none";
  popupText.value = "";
  popupLogo.value = "";
}

closeBtn.onclick = closeModal;

window.onclick = function(e){
  if(e.target === popup) closeModal();
};

document.addEventListener("keydown", e=>{
  if(e.key === "Escape") closeModal();
});

/* ================== KOSZYK ================== */

function saveCart(){
  localStorage.setItem("cart", JSON.stringify(cart));
}

function renderCart(){
  cartItemsDiv.innerHTML="";
  let total=0;

  cart.forEach((item,i)=>{
    total+=item.price*item.quantity;

    cartItemsDiv.innerHTML+=`
      <div>
        <strong>${item.name}</strong><br>
        ${item.options.baseColor} | ${item.options.size}<br>
        ${item.options.text ? "Napis: "+item.options.text+"<br>" : ""}
        Ilość: ${item.quantity}
        <button onclick="changeQty(${i},-1)">-</button>
        <button onclick="changeQty(${i},1)">+</button>
        <hr>
      </div>
    `;
  });

  cartTotalSpan.textContent=total.toFixed(2);
}

function changeQty(i,delta){
  cart[i].quantity+=delta;
  if(cart[i].quantity<=0) cart.splice(i,1);
  saveCart();
  renderCart();
}

function addToCart(){
  if(!selectedProduct) return;

  const options={
    baseColor:popupColor.value,
    size:popupSize.value,
    text:selectedProduct.type==="custom"?popupText.value:null
  };

  cart.push({
    id:selectedProduct.id,
    name:selectedProduct.name,
    price:selectedProduct.price,
    quantity:1,
    options
  });

  saveCart();
  renderCart();
  closeModal();
}

addBtn.onclick = addToCart;

document.getElementById("clearCartBtn").onclick = ()=>{
  cart=[];
  saveCart();
  renderCart();
};

document.getElementById("checkoutBtn").onclick = ()=>{
  if(cart.length===0){
    alert("Koszyk jest pusty");
    return;
  }
  window.location.href="/dane-platnosc.html";
};

/* ================== PRODUKTY ================== */

function renderProducts(){
  container.innerHTML="";
  products.forEach(p=>{
    container.innerHTML+=`
      <div class="product">
        <h3>${p.name}</h3>
        <img src="${p.image}">
        <p>${p.price.toFixed(2)} zł</p>
        <button onclick="openPopup('${p.id}')">Personalizuj</button>
      </div>
    `;
  });
}

renderProducts();
renderCart();