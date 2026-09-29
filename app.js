const products = [
  ['Avant', 'Creed - Aventus', 'Masculina'], ['Glacier Gold', 'Le Male Elixir - JPG', 'Masculina'],
  ['Jean Lowe', 'L’Immensité - Louis Vuitton', 'Masculina'], ['Jorge Di Profumo', 'Acqua di Giò Profumo - Giorgio Armani', 'Masculina'],
  ['Jorge Di Profumo Deep Blue', 'Acqua di Giò Profondo - Giorgio Armani', 'Masculina'], ['Jubilant Oro', 'Eros - Versace', 'Masculina'],
  ['Luminous Vivid', 'Perseus - Parfums de Marly', 'Masculina'], ['Man Black Edition', 'Legend - Montblanc', 'Masculina'],
  ['Panther', 'Phantom - Paco Rabanne', 'Masculina'], ['Perseus Exclusif', 'Pegasus Exclusif - Parfums de Marly', 'Masculina'],
  ['Chic - Velvet Pink Secret', 'Love - Victoria’s Secret', 'Femenina'], ['Delilah', 'Delina - Parfums de Marly', 'Femenina'],
  ['Florenza', 'Flora - Gucci', 'Femenina'], ['Jardin de Rêve', 'J’adore - Christian Dior', 'Femenina'],
  ['Jubilant Rose', 'Bright Crystal - Versace', 'Femenina'], ['Kismet', 'Good Girl Gone Bad - Kilian', 'Femenina'],
  ['L’Intrude', 'L’Interdit - Givenchy', 'Femenina'], ['La Rouge Baroque Extreme', 'Baccarat Rouge 540 - MFK', 'Femenina'],
  ['La Vivacité', 'La Vie Est Belle - Lancôme', 'Femenina'], ['La Vivacité Intensa', 'La Vie Est Belle Intensément - Lancôme', 'Femenina'],
  ['Olivia', 'Olympea - Paco Rabanne', 'Femenina'], ['Opera Noir', 'Black Opium - YSL', 'Femenina'],
  ['Pink Shimmer Secret', 'Bombshell - Victoria’s Secret', 'Femenina'], ['Reyna', 'Oriana - Parfums de Marly', 'Femenina'],
  ['So Candid', 'Scandal - JPG', 'Femenina'], ['Summer Forever', 'Muse - Xerjoff', 'Femenina'],
  ['Eternal Touch', 'Tobacco Vanille - Tom Ford', 'Unisex'], ['Forbidden Love', 'Lost Cherry - Tom Ford', 'Unisex'],
  ['Glacier Pour Homme', 'Le Male - JPG', 'Masculina'], ['Opulence Leather', 'Ombré Leather - Tom Ford', 'Unisex'],
  ['Pacific Blue', 'Neroli Portofino - Tom Ford', 'Unisex'], ['Philos Rosso', 'Baccarat Rouge 540 - Maison Francis Kurkdjian', 'Unisex']
].map((product, index) => ({ id: index, name: product[0], inspired: product[1], category: product[2], image: `assets/products/product-${String(index).padStart(2, '0')}.jpg` }));

const CART_KEY = 'ayk-cart';
const PAGE_SIZE = 12;
const currency = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
const el = {
  grid: document.querySelector('#productGrid'), results: document.querySelector('#resultsText'), search: document.querySelector('#search'),
  empty: document.querySelector('#emptyState'), loadMore: document.querySelector('#loadMore'), cart: document.querySelector('#cart'),
  overlay: document.querySelector('#overlay'), cartCount: document.querySelector('#cartCount'), progress: document.querySelector('#cartProgress'),
  items: document.querySelector('#cartItems'), total: document.querySelector('#cartTotal'), openCart: document.querySelector('#openCart'),
  closeCart: document.querySelector('#closeCart'), checkout: document.querySelector('#checkout'), toast: document.querySelector('#toast'),
  menuButton: document.querySelector('#menuButton'), nav: document.querySelector('#mainNav')
};

let cart = readCart();
let category = 'Todos';
let visibleLimit = mobileLimit();
let lastFocused = null;
let toastTimer;

function mobileLimit() { return window.matchMedia('(max-width: 700px)').matches ? PAGE_SIZE : Infinity; }
function readCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, qty]) => products[Number(id)] && Number.isInteger(qty) && qty > 0));
  } catch {
    localStorage.removeItem(CART_KEY);
    return {};
  }
}
function normalize(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
function filteredProducts() {
  const query = normalize(el.search.value);
  return products.filter(product => (category === 'Todos' || product.category === category) && normalize(`${product.name} ${product.inspired}`).includes(query));
}
function renderProducts() {
  const filtered = filteredProducts();
  const visible = filtered.slice(0, visibleLimit);
  el.results.textContent = `${filtered.length} ${filtered.length === 1 ? 'fragancia' : 'fragancias'}`;
  el.empty.hidden = filtered.length !== 0;
  el.loadMore.hidden = visible.length >= filtered.length;
  el.loadMore.textContent = `Ver más fragancias (${filtered.length - visible.length})`;
  el.grid.innerHTML = visible.map(product => `
    <article class="product">
      <div class="product-img"><img loading="lazy" decoding="async" src="${product.image}" alt="${product.name}"><span class="size-badge">30 ml</span></div>
      <div class="product-body"><span class="product-cat">${product.category}</span><h3>${product.name}</h3><p class="inspired">Inspirado en ${product.inspired}</p>
        <div class="price-row"><div class="price"><strong>$20.000</strong><small>$15.000 c/u desde 12</small></div><button class="add" type="button" data-add="${product.id}" aria-label="Agregar ${product.name} al carrito">+</button></div>
      </div>
    </article>`).join('');
}
function count() { return Object.values(cart).reduce((total, qty) => total + qty, 0); }
function unitPrice() { return count() >= 12 ? 15000 : 20000; }
function saveCart() { localStorage.setItem(CART_KEY, JSON.stringify(cart)); renderCart(); }
function addProduct(id) { cart[id] = (cart[id] || 0) + 1; saveCart(); showToast(`${products[id].name} se agregó al carrito.`); }
function changeQuantity(id, difference) {
  const next = (cart[id] || 0) + difference;
  if (next <= 0) delete cart[id]; else cart[id] = next;
  saveCart();
}
function renderCart() {
  const qty = count();
  const price = unitPrice();
  const entries = Object.entries(cart);
  el.cartCount.textContent = qty;
  el.cartCount.setAttribute('aria-label', `${qty} ${qty === 1 ? 'producto' : 'productos'}`);
  if (!qty) el.progress.textContent = 'Agregá productos para comenzar tu pedido.';
  else if (qty < 12) el.progress.textContent = `Llevás ${qty}. Agregá ${12 - qty} más para acceder al precio mayorista de $15.000 c/u.`;
  else {
    el.progress.textContent = '✓ Precio mayorista aplicado: $15.000 por unidad.';
    if (qty >= 30) el.progress.textContent += ' AYK cubre el 30% del costo del envío.';
  }
  el.items.innerHTML = entries.length ? entries.map(([id, itemQty]) => {
    const product = products[Number(id)];
    return `<div class="cart-item"><img src="${product.image}" alt="" width="58" height="70"><div class="cart-item-info"><b>${product.name}</b><small>${product.inspired}</small><div class="qty"><button type="button" data-change="-1" data-id="${id}" aria-label="Quitar una unidad de ${product.name}">−</button><span aria-label="${itemQty} unidades">${itemQty}</span><button type="button" data-change="1" data-id="${id}" aria-label="Agregar una unidad de ${product.name}">+</button><button class="remove" type="button" data-remove="${id}" aria-label="Quitar ${product.name} del carrito">Quitar</button></div></div><b>${currency.format(itemQty * price)}</b></div>`;
  }).join('') : '<div class="empty">Tu carrito está vacío.<a href="#catalogo" data-close-cart>Explorar catálogo</a></div>';
  el.total.textContent = currency.format(qty * price);
  el.checkout.disabled = qty === 0;
}
function openCart() {
  lastFocused = document.activeElement;
  clearTimeout(toastTimer);
  el.toast.classList.remove('show');
  el.cart.inert = false;
  el.cart.setAttribute('aria-hidden', 'false');
  el.overlay.setAttribute('aria-hidden', 'false');
  el.cart.classList.add('show'); el.overlay.classList.add('show'); document.body.classList.add('cart-open');
  el.closeCart.focus();
}
function closeCart() {
  el.cart.classList.remove('show'); el.overlay.classList.remove('show'); document.body.classList.remove('cart-open');
  el.cart.setAttribute('aria-hidden', 'true'); el.overlay.setAttribute('aria-hidden', 'true'); el.cart.inert = true;
  if (lastFocused instanceof HTMLElement) lastFocused.focus();
}
function trapFocus(event) {
  if (event.key !== 'Tab' || !el.cart.classList.contains('show')) return;
  const focusable = [...el.cart.querySelectorAll('button:not([disabled]), a[href]')];
  if (!focusable.length) return;
  if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
}
function showToast(message) {
  clearTimeout(toastTimer); el.toast.textContent = message; el.toast.classList.add('show');
  toastTimer = setTimeout(() => el.toast.classList.remove('show'), 2400);
}
function toggleMenu(force) {
  const open = typeof force === 'boolean' ? force : !el.nav.classList.contains('open');
  el.nav.classList.toggle('open', open); el.menuButton.classList.toggle('open', open);
  el.menuButton.setAttribute('aria-expanded', String(open)); el.menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}
function checkout() {
  const qty = count(); if (!qty) return;
  const lines = Object.entries(cart).map(([id, itemQty]) => `${itemQty} x ${products[Number(id)].name}`).join('\n');
  const message = `Hola AYK 👋 Quiero realizar este pedido:\n\n${lines}\n\nCantidad: ${qty} unidades\nTotal estimado: ${currency.format(qty * unitPrice())}\n\nQuisiera confirmar disponibilidad, medio de pago y envío.`;
  const popup = window.open(`https://wa.me/5491167463767?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  if (popup) popup.opener = null;
}

el.grid.addEventListener('click', event => { const button = event.target.closest('[data-add]'); if (button) addProduct(Number(button.dataset.add)); });
el.items.addEventListener('click', event => {
  const change = event.target.closest('[data-change]'); const remove = event.target.closest('[data-remove]');
  if (change) changeQuantity(Number(change.dataset.id), Number(change.dataset.change));
  if (remove) changeQuantity(Number(remove.dataset.remove), -(cart[remove.dataset.remove] || 0));
  if (event.target.closest('[data-close-cart]')) closeCart();
});
el.search.addEventListener('input', () => { visibleLimit = mobileLimit(); renderProducts(); });
document.querySelectorAll('.chip').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach(item => { item.classList.remove('active'); item.setAttribute('aria-pressed', 'false'); });
  button.classList.add('active'); button.setAttribute('aria-pressed', 'true'); category = button.dataset.cat; visibleLimit = mobileLimit(); renderProducts();
}));
el.loadMore.addEventListener('click', () => { visibleLimit += PAGE_SIZE; renderProducts(); });
el.openCart.addEventListener('click', openCart); el.closeCart.addEventListener('click', closeCart); el.overlay.addEventListener('click', closeCart);
el.checkout.addEventListener('click', checkout); el.menuButton.addEventListener('click', () => toggleMenu());
el.nav.addEventListener('click', event => { if (event.target.matches('a')) toggleMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') { if (el.cart.classList.contains('show')) closeCart(); else toggleMenu(false); } trapFocus(event); });
window.addEventListener('resize', () => { if (window.innerWidth > 1000) toggleMenu(false); });

renderProducts();
renderCart();
