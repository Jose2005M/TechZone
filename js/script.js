
// === DATA ===
let products = [
  { id:1, name:'iPhone 15 Pro', cat:'Smartphones', price:4200000, stock:12, emoji:'📱' },
  { id:2, name:'Samsung S24 Ultra', cat:'Smartphones', price:3800000, stock:8, emoji:'📱' },
  { id:3, name:'MacBook Air M3', cat:'Laptops', price:6500000, stock:5, emoji:'💻' },
  { id:4, name:'Dell XPS 15', cat:'Laptops', price:5200000, stock:7, emoji:'💻' },
  { id:5, name:'iPad Pro 12.9"', cat:'Tablets', price:3100000, stock:10, emoji:'📟' },
  { id:6, name:'AirPods Pro 2', cat:'Audio', price:890000, stock:20, emoji:'🎧' },
  { id:7, name:'Sony WH-1000XM5', cat:'Audio', price:1100000, stock:15, emoji:'🎧' },
  { id:8, name:'RTX 4080 Super', cat:'Componentes', price:3400000, stock:3, emoji:'🖥️' },
  { id:9, name:'Samsung 4K 27"', cat:'Monitores', price:1800000, stock:6, emoji:'🖥️' },
  { id:10, name:'Logitech MX Keys', cat:'Periféricos', price:450000, stock:25, emoji:'⌨️' },
];

let cart = [];
let orders = JSON.parse(localStorage.getItem('tz-orders') || '[]');
let currentFilter = 'Todos';

const fmt = n => '$' + n.toLocaleString('es-CO');

// === NAV ===
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.querySelectorAll('.tab').forEach(t => {
    if (t.textContent.toLowerCase().includes(id.slice(0,3))) t.classList.add('active');
  });
  if (id === 'catalog') renderCatalog();
  if (id === 'cart') renderCart();
  if (id === 'orders') renderOrders();
  if (id === 'admin') renderAdmin();
}

// === CATALOG ===
function renderCatalog() {
  const cats = ['Todos', ...new Set(products.map(p => p.cat))];
  const fEl = document.getElementById('filters');
  fEl.innerHTML = cats.map(c =>
    `<button class="filter-btn ${c === currentFilter ? 'active' : ''}" onclick="setFilter('${c}')">${c}</button>`
  ).join('');

  const filtered = currentFilter === 'Todos' ? products : products.filter(p => p.cat === currentFilter);
  document.getElementById('product-grid').innerHTML = filtered.map(p => cardHTML(p, false)).join('');

  // Recomendaciones: top 3 más vistos (simulado: stock bajo = popular)
  const recs = [...products].sort((a,b) => a.stock - b.stock).slice(0,3);
  document.getElementById('rec-grid').innerHTML = recs.map(p => cardHTML(p, true)).join('');
}

function cardHTML(p, rec) {
  const lowStock = p.stock <= 5;
  return `<div class="card">
    ${rec ? '<span class="rec-badge">★ RECOMENDADO</span>' : ''}
    <div class="card-emoji">${p.emoji}</div>
    <div class="card-name">${p.name}</div>
    <div class="card-cat">${p.cat}</div>
    <div class="card-price">${fmt(p.price)}</div>
    <div class="card-stock ${lowStock ? 'low' : ''}">${lowStock ? '⚠ Solo ' : ''}${p.stock} en stock</div>
    <button class="add-btn" onclick="addToCart(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
      ${p.stock === 0 ? 'Sin stock' : '+ Agregar'}
    </button>
  </div>`;
}

function setFilter(cat) {
  currentFilter = cat;
  renderCatalog();
}

function addToCart(id) {
  const p = products.find(x => x.id === id);
  const existing = cart.find(x => x.id === id);
  if (existing) {
    if (existing.qty >= p.stock) { toast('Stock insuficiente'); return; }
    existing.qty++;
  } else {
    cart.push({ ...p, qty: 1 });
  }
  updateCartCount();
  toast(`${p.name} agregado ✓`);
}

function updateCartCount() {
  const total = cart.reduce((s, x) => s + x.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

// === CART ===
function renderCart() {
  const el = document.getElementById('cart-items');
  const sm = document.getElementById('cart-summary');
  if (!cart.length) {
    el.innerHTML = '<div class="empty"><span>🛒</span>Tu carrito está vacío</div>';
    sm.innerHTML = '';
    return;
  }
  el.innerHTML = cart.map(item => `
    <div class="cart-item">
      <span style="font-size:1.8rem">${item.emoji}</span>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">${fmt(item.price)}</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
        <span style="font-family:'Space Mono',monospace;font-size:.9rem">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
      </div>
      <button class="rm-btn" onclick="removeFromCart(${item.id})">✕</button>
    </div>
  `).join('');

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);
  sm.innerHTML = `
    <div class="cart-summary">
      <div class="cart-total">Total: ${fmt(total)}</div>
      <button class="btn-primary" onclick="showPage('payment')">Proceder al pago →</button>
    </div>
  `;
}

function changeQty(id, delta) {
  const item = cart.find(x => x.id === id);
  const p = products.find(x => x.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty > p.stock) { item.qty = p.stock; toast('Límite de stock'); }
  if (item.qty < 1) cart = cart.filter(x => x.id !== id);
  updateCartCount();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(x => x.id !== id);
  updateCartCount();
  renderCart();
}

// === PAYMENT ===
document.getElementById('pay-card').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g,'').slice(0,16);
  e.target.value = v.match(/.{1,4}/g)?.join(' ') || v;
});
document.getElementById('pay-exp').addEventListener('input', e => {
  let v = e.target.value.replace(/\D/g,'');
  if (v.length > 2) v = v.slice(0,2) + '/' + v.slice(2,4);
  e.target.value = v;
});

function processPayment() {
  const fields = ['pay-name','pay-email','pay-card','pay-exp','pay-cvv','pay-addr'];
  for (const f of fields) {
    if (!document.getElementById(f).value.trim()) { toast('Completa todos los campos'); return; }
  }
  if (!cart.length) { toast('El carrito está vacío'); return; }

  // Descontar stock
  cart.forEach(item => {
    const p = products.find(x => x.id === item.id);
    if (p) p.stock -= item.qty;
  });

  const order = {
    id: 'TZ-' + Date.now().toString().slice(-6),
    date: new Date().toLocaleDateString('es-CO'),
    items: [...cart],
    total: cart.reduce((s,x) => s + x.price*x.qty, 0),
    status: 'pendiente',
    customer: document.getElementById('pay-name').value,
  };
  orders.unshift(order);
  localStorage.setItem('tz-orders', JSON.stringify(orders));
  cart = [];
  updateCartCount();
  fields.forEach(f => document.getElementById(f).value = '');
  toast('✓ Pedido confirmado!');
  showPage('orders');
}

// === ORDERS ===
const statusSteps = ['Confirmado','Preparando','Enviado','Entregado'];
const statusMap = { pendiente:1, enviado:2, entregado:3 };

function renderOrders() {
  const el = document.getElementById('orders-list');
  if (!orders.length) {
    el.innerHTML = '<div class="empty"><span>📦</span>No tienes pedidos aún</div>';
    return;
  }
  el.innerHTML = orders.map(o => {
    const step = statusMap[o.status] || 1;
    const steps = statusSteps.map((s,i) =>
      `<div class="tl-step ${i < step ? 'done' : ''}">${s}</div>`
    ).join('');
    return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="order-id">${o.id}</div>
            <div style="font-size:.8rem;color:var(--muted);margin-top:.2rem">${o.date} · ${o.items.length} producto(s)</div>
          </div>
          <div>
            <span class="status-badge status-${o.status}">${o.status.toUpperCase()}</span>
            <div style="text-align:right;margin-top:.4rem;font-size:.9rem;font-weight:800;color:var(--accent)">${fmt(o.total)}</div>
          </div>
        </div>
        <div style="font-size:.8rem;color:var(--muted);margin-bottom:.8rem">
          ${o.items.map(i => `${i.emoji} ${i.name} ×${i.qty}`).join(' · ')}
        </div>
        <div class="timeline">${steps}</div>
      </div>
    `;
  }).join('');
}

// === ADMIN ===
function renderAdmin() {
  const totalRevenue = orders.reduce((s,o) => s + o.total, 0);
  const lowStock = products.filter(p => p.stock <= 5).length;

  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">PEDIDOS TOTALES</div><div class="stat-val">${orders.length}</div></div>
    <div class="stat-card"><div class="stat-label">INGRESOS</div><div class="stat-val" style="font-size:1.3rem">${fmt(totalRevenue)}</div></div>
    <div class="stat-card"><div class="stat-label">PRODUCTOS</div><div class="stat-val">${products.length}</div></div>
    <div class="stat-card"><div class="stat-label">STOCK BAJO</div><div class="stat-val" style="color:var(--danger)">${lowStock}</div></div>
  `;

  document.getElementById('inventory-table').innerHTML = products.map(p => `
    <tr>
      <td>${p.emoji} ${p.name}</td>
      <td style="color:var(--muted);font-size:.8rem">${p.cat}</td>
      <td style="font-family:'Space Mono',monospace;color:var(--accent);font-size:.85rem">${fmt(p.price)}</td>
      <td style="color:${p.stock<=5?'var(--danger)':'var(--text)'}">${p.stock}</td>
      <td>
        <input class="stock-input" type="number" id="stock-${p.id}" value="${p.stock}" min="0">
        <button class="save-stock" onclick="updateStock(${p.id})">Guardar</button>
      </td>
    </tr>
  `).join('');

  // Actualizar status de pedidos en admin
  if (orders.length) {
    const ordEl = document.createElement('div');
    ordEl.style.marginTop = '2rem';
    ordEl.innerHTML = `<h3 style="margin-bottom:1rem;font-size:1rem;color:var(--muted);font-family:'Space Mono',monospace;text-transform:uppercase">Gestionar Pedidos</h3>`;
    orders.forEach((o, i) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:1rem;padding:.6rem;background:var(--surface);border:1px solid var(--border);border-radius:6px;margin-bottom:.4rem;font-size:.85rem;';
      row.innerHTML = `
        <span style="font-family:'Space Mono',monospace;color:var(--accent2)">${o.id}</span>
        <span style="flex:1;color:var(--muted)">${o.customer || 'Cliente'}</span>
        <select style="width:auto;padding:.2rem .4rem;font-size:.8rem" onchange="updateOrderStatus(${i}, this.value)">
          <option value="pendiente" ${o.status==='pendiente'?'selected':''}>Pendiente</option>
          <option value="enviado" ${o.status==='enviado'?'selected':''}>Enviado</option>
          <option value="entregado" ${o.status==='entregado'?'selected':''}>Entregado</option>
        </select>
      `;
      ordEl.appendChild(row);
    });
    document.getElementById('page-admin').appendChild(ordEl);
  }
}

function updateStock(id) {
  const p = products.find(x => x.id === id);
  const val = parseInt(document.getElementById('stock-' + id).value);
  if (isNaN(val) || val < 0) { toast('Valor inválido'); return; }
  p.stock = val;
  toast('Stock actualizado ✓');
  renderAdmin();
}

function updateOrderStatus(idx, status) {
  orders[idx].status = status;
  localStorage.setItem('tz-orders', JSON.stringify(orders));
  toast('Estado actualizado ✓');
}

// === TOAST ===
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// Init
renderCatalog();
