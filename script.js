// Simple static e-commerce with localStorage state

// Local storage keys
const STORAGE_KEYS = {
  products: "shop_products",
  cart: "shop_cart",
  orders: "shop_orders",
};

// Default seed products
const defaultProducts = [
  {
    id: crypto.randomUUID(),
    name: "T-Shirt",
    category: "Clothes",
    price: 19.99,
    stock: 20,
    image:
      "https://images.pexels.com/photos/2868242/pexels-photo-2868242.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: crypto.randomUUID(),
    name: "Dress",
    category: "Clothes",
    price: 39.99,
    stock: 15,
    image:
      "https://images.pexels.com/photos/6899889/pexels-photo-6899889.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: crypto.randomUUID(),
    name: "Pant",
    category: "Clothes",
    price: 29.99,
    stock: 18,
    image:
      "https://images.pexels.com/photos/1855900/pexels-photo-1855900.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: crypto.randomUUID(),
    name: "Clothes Set",
    category: "Clothes",
    price: 49.99,
    stock: 12,
    image:
      "https://images.pexels.com/photos/7931048/pexels-photo-7931048.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

// State containers
let products = [];
let cart = [];
let orders = [];
let upiQrSrc =
  "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=demo@upi&pn=SimpleShop&am=0.00&cu=INR";

// Helpers
const formatMoney = (num) => `$${num.toFixed(2)}`;

const saveState = () => {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
  localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
  localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
};

const loadState = () => {
  const storedProducts = localStorage.getItem(STORAGE_KEYS.products);
  const storedCart = localStorage.getItem(STORAGE_KEYS.cart);
  const storedOrders = localStorage.getItem(STORAGE_KEYS.orders);

  products = storedProducts ? JSON.parse(storedProducts) : defaultProducts;
  cart = storedCart ? JSON.parse(storedCart) : [];
  orders = storedOrders ? JSON.parse(storedOrders) : [];
};

// DOM references
const els = {};
const cacheDom = () => {
  els.productsGrid = document.getElementById("productsGrid");
  els.productForm = document.getElementById("productForm");
  els.productId = document.getElementById("productId");
  els.productName = document.getElementById("productName");
  els.productCategory = document.getElementById("productCategory");
  els.productPrice = document.getElementById("productPrice");
  els.productStock = document.getElementById("productStock");
  els.productImage = document.getElementById("productImage");
  els.productList = document.getElementById("productList");
  els.formStatus = document.getElementById("formStatus");
  els.deleteProductBtn = document.getElementById("deleteProductBtn");
  els.cartTableBody = document.querySelector("#cartTable tbody");
  els.subtotalValue = document.getElementById("subtotalValue");
  els.grandTotalValue = document.getElementById("grandTotalValue");
  els.payNowBtn = document.getElementById("payNowBtn");
  els.clearCartBtn = document.getElementById("clearCartBtn");
  els.printBillBtn = document.getElementById("printBillBtn");
  els.billContent = document.getElementById("billContent");
  els.upiQr = document.getElementById("upiQr");
  els.reportMonth = document.getElementById("reportMonth");
  els.reportSummary = document.getElementById("reportSummary");
};

// Rendering
const renderProducts = () => {
  els.productsGrid.innerHTML = "";
  if (!products.length) {
    els.productsGrid.innerHTML = '<p class="muted">No products yet.</p>';
    return;
  }
  products.forEach((p) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${
        p.image || "https://via.placeholder.com/300x200?text=No+Image"
      }" alt="${p.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image';">
      <div class="title">${p.name}</div>
      <div class="tag">${p.category}</div>
      <div class="price">${formatMoney(p.price)}</div>
      <div class="muted">Stock: <span class="${p.stock < 5 ? "stock-low" : ""}">${p.stock}</span></div>
      <div class="btn-row">
        <button class="primary full" data-action="add" data-id="${p.id}" ${p.stock <= 0 ? "disabled" : ""}>Add to Cart</button>
      </div>
    `;
    card.querySelector("[data-action='add']").addEventListener("click", () =>
      addToCart(p.id)
    );
    els.productsGrid.appendChild(card);
  });
};

const renderProductList = () => {
  els.productList.innerHTML = "";
  if (!products.length) {
    els.productList.innerHTML = '<p class="muted">No products to manage.</p>';
    return;
  }
  products.forEach((p) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `
      <div>
        <strong>${p.name}</strong> — ${p.category} — ${formatMoney(p.price)} — Stock ${p.stock}
      </div>
      <button class="secondary" data-id="${p.id}">Edit</button>
    `;
    row.querySelector("button").addEventListener("click", () => fillForm(p.id));
    els.productList.appendChild(row);
  });
};

const renderCart = () => {
  els.cartTableBody.innerHTML = "";
  if (!cart.length) {
    els.cartTableBody.innerHTML = `<tr><td colspan="5" class="muted">Cart is empty.</td></tr>`;
  }

  cart.forEach((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${product.name}</td>
      <td>
        <div class="btn-row">
          <button class="secondary" data-action="dec">-</button>
          <span>${item.qty}</span>
          <button class="secondary" data-action="inc">+</button>
        </div>
      </td>
      <td>${formatMoney(product.price)}</td>
      <td>${formatMoney(product.price * item.qty)}</td>
      <td><button class="danger" data-action="remove">Remove</button></td>
    `;
    tr.querySelector("[data-action='dec']").addEventListener("click", () =>
      updateCartQty(item.productId, item.qty - 1)
    );
    tr.querySelector("[data-action='inc']").addEventListener("click", () =>
      updateCartQty(item.productId, item.qty + 1)
    );
    tr.querySelector("[data-action='remove']").addEventListener("click", () =>
      removeFromCart(item.productId)
    );
    els.cartTableBody.appendChild(tr);
  });

  const totals = computeTotals();
  els.subtotalValue.textContent = formatMoney(totals.subtotal);
  els.grandTotalValue.textContent = formatMoney(totals.total);
};

const renderBill = (order) => {
  if (!order) {
    els.billContent.innerHTML = '<p class="muted">Complete a payment to see bill.</p>';
    return;
  }
  const itemsHtml = order.items
    .map(
      (item) =>
        `<li>${item.name} x ${item.qty} — ${formatMoney(item.price * item.qty)}</li>`
    )
    .join("");
  els.billContent.innerHTML = `
    <p><strong>Order ID:</strong> ${order.id}</p>
    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleString()}</p>
    <ul>${itemsHtml}</ul>
    <p>Subtotal: ${formatMoney(order.subtotal)}</p>
    <p><strong>Total: ${formatMoney(order.total)}</strong></p>
  `;
};

const renderReport = () => {
  const monthValue = els.reportMonth.value || new Date().toISOString().slice(0, 7);
  els.reportMonth.value = monthValue;
  const [year, month] = monthValue.split("-").map(Number);
  const filtered = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  const totalSales = filtered.reduce((sum, o) => sum + o.total, 0);
  const itemCounts = {};
  filtered.forEach((o) => {
    o.items.forEach((it) => {
      itemCounts[it.name] = (itemCounts[it.name] || 0) + it.qty;
    });
  });

  const itemsHtml = Object.entries(itemCounts)
    .map(([name, qty]) => `<li>${name} — ${qty} sold</li>`)
    .join("");

  els.reportSummary.innerHTML = `
    <p><strong>Orders:</strong> ${filtered.length}</p>
    <p><strong>Total Sales:</strong> ${formatMoney(totalSales)}</p>
    <ul class="report-list">${itemsHtml || "<li class='muted'>No sales</li>"}</ul>
  `;
};

// Cart logic
const computeTotals = () => {
  const subtotal = cart.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId);
    return product ? sum + product.price * item.qty : sum;
  }, 0);
  const tax = 0;
  const total = subtotal;
  return { subtotal, tax, total };
};

const addToCart = (productId) => {
  const product = products.find((p) => p.id === productId);
  if (!product || product.stock <= 0) return;
  const existing = cart.find((c) => c.productId === productId);
  if (existing) {
    if (existing.qty + 1 > product.stock) return;
    existing.qty += 1;
  } else {
    cart.push({ productId, qty: 1 });
  }
  saveState();
  renderCart();
};

const updateCartQty = (productId, qty) => {
  const product = products.find((p) => p.id === productId);
  const item = cart.find((c) => c.productId === productId);
  if (!product || !item) return;
  if (qty <= 0) {
    removeFromCart(productId);
    return;
  }
  if (qty > product.stock) {
    qty = product.stock;
  }
  item.qty = qty;
  saveState();
  renderCart();
};

const removeFromCart = (productId) => {
  cart = cart.filter((c) => c.productId !== productId);
  saveState();
  renderCart();
};

const clearCart = () => {
  cart = [];
  saveState();
  renderCart();
};

// CRUD helpers
const clearForm = () => {
  els.productId.value = "";
  els.productName.value = "";
  els.productCategory.value = "";
  els.productPrice.value = "";
  els.productStock.value = "";
  els.productImage.value = "";
  els.formStatus.textContent = "";
};

const fillForm = (productId) => {
  const product = products.find((p) => p.id === productId);
  if (!product) return;
  els.productId.value = product.id;
  els.productName.value = product.name;
  els.productCategory.value = product.category;
  els.productPrice.value = product.price;
  els.productStock.value = product.stock;
  els.productImage.value = product.image;
  els.formStatus.textContent = "Loaded product for editing.";
};

const upsertProduct = (event) => {
  event.preventDefault();
  const id = els.productId.value || crypto.randomUUID();
  const payload = {
    id,
    name: els.productName.value.trim(),
    category: els.productCategory.value.trim() || "Clothes",
    price: parseFloat(els.productPrice.value) || 0,
    stock: parseInt(els.productStock.value, 10) || 0,
    image: els.productImage.value.trim(),
  };
  if (!payload.name || !payload.image) {
    els.formStatus.textContent = "Name and image are required.";
    return;
  }
  const existingIndex = products.findIndex((p) => p.id === id);
  if (existingIndex >= 0) {
    products[existingIndex] = payload;
    els.formStatus.textContent = "Product updated.";
  } else {
    products.push(payload);
    els.formStatus.textContent = "Product added.";
  }
  saveState();
  renderProducts();
  renderProductList();
  renderCart();
  clearForm();
};

const deleteProduct = () => {
  const id = els.productId.value;
  if (!id) {
    els.formStatus.textContent = "Select a product first.";
    return;
  }
  products = products.filter((p) => p.id !== id);
  cart = cart.filter((c) => c.productId !== id);
  saveState();
  renderProducts();
  renderProductList();
  renderCart();
  clearForm();
  els.formStatus.textContent = "Product deleted.";
};

// Billing flow
const payNow = () => {
  if (!cart.length) {
    els.billContent.innerHTML = '<p class="muted">Add items before paying.</p>';
    return;
  }
  const totals = computeTotals();
  const items = cart
    .map((c) => {
      const product = products.find((p) => p.id === c.productId);
      if (!product) return null;
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: c.qty,
      };
    })
    .filter(Boolean);

  const order = {
    id: `ORD-${Date.now()}`,
    items,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  // reduce stock
  items.forEach((it) => {
    const product = products.find((p) => p.id === it.productId);
    if (product) {
      product.stock = Math.max(0, product.stock - it.qty);
    }
  });
  clearCart();
  saveState();
  renderProducts();
  renderProductList();
  renderReport();
  renderBill(order);
};

const attachEvents = () => {
  els.productForm.addEventListener("submit", upsertProduct);
  els.productForm.addEventListener("reset", (e) => {
    e.preventDefault();
    clearForm();
  });
  els.deleteProductBtn.addEventListener("click", deleteProduct);
  els.clearCartBtn.addEventListener("click", clearCart);
  els.payNowBtn.addEventListener("click", payNow);
  els.printBillBtn.addEventListener("click", () => window.print());
  els.reportMonth.addEventListener("change", renderReport);
};

const init = () => {
  cacheDom();
  loadState();
  renderProducts();
  renderProductList();
  renderCart();
  renderBill();
  renderReport();
  attachEvents();
  els.upiQr.src = upiQrSrc;
};

document.addEventListener("DOMContentLoaded", init);


