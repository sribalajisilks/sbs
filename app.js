/* ============================================================
   Sri Balaji Silks — App Logic (app.js)
   All data stored in localStorage. No backend needed.
   ============================================================ */

'use strict';

// ============================================================
//  CONSTANTS & CONFIG
// ============================================================
const ADMIN_PASSWORD = '9966728685sbs';
const PHONE          = '9966728685';
const WA_NUMBER      = '919966728685'; // with country code

const LS = {
  PRODUCTS  : 'sbs_products',
  SHOP_INFO : 'sbs_shop_info',
};

// Default shop info
const DEFAULT_SHOP_INFO = {
  address  : 'Ground floor, Municipal Complex, SPT Market Rd, Municipal Quarters Area, Nalgonda (508001), Telangana',
  hours    : '9:30 AM – 10:00 PM (All Days)',
  phone    : '9966728685',
  about    : 'Welcome to Sri Balaji Silks — your trusted destination for premium quality sarees and fine fabrics in Nalgonda. We offer a wide range of traditional and contemporary sarees, including Banarasi, Kanjivaram, Pochampally, and much more. We also stock a beautiful range of furniture fabrics to brighten your home. Visit us in-store to explore our collection and discover the elegance of fine Indian textiles.',
};

// Default sample products
const DEFAULT_PRODUCTS = [
  {
    id       : 'p1',
    name     : 'Kanjivaram Silk Saree',
    category : 'Silk Sarees',
    desc     : 'Pure Kanjivaram silk saree with traditional zari border and rich pallu. Available in vibrant colours.',
    price    : '',
    img      : '',
  },
  {
    id       : 'p2',
    name     : 'Pochampally Ikat Saree',
    category : 'Cotton Sarees',
    desc     : 'Handwoven Pochampally ikat saree with geometric patterns — a Telangana heritage weave.',
    price    : '',
    img      : '',
  },
  {
    id       : 'p3',
    name     : 'Banarasi Saree',
    category : 'Silk Sarees',
    desc     : 'Elegant Banarasi silk with intricate gold zari work — perfect for weddings and festivities.',
    price    : '',
    img      : '',
  },
  {
    id       : 'p4',
    name     : 'Sofa & Curtain Fabric',
    category : 'Furniture Fabrics',
    desc     : 'Premium quality upholstery and curtain fabrics in a wide variety of textures and colours.',
    price    : '',
    img      : '',
  },
  {
    id       : 'p5',
    name     : 'Designer Cotton Saree',
    category : 'Cotton Sarees',
    desc     : 'Lightweight designer cotton sarees with block-print motifs — ideal for daily wear.',
    price    : '',
    img      : '',
  },
  {
    id       : 'p6',
    name     : 'Organza Party Saree',
    category : 'Party Wear',
    desc     : 'Sheer organza saree with embellished border — perfect for parties and modern celebrations.',
    price    : '',
    img      : '',
  },
];

const CATEGORIES = ['All', 'Silk Sarees', 'Cotton Sarees', 'Party Wear', 'Bridal Sarees', 'Furniture Fabrics', 'Other'];

// Saree placeholder images (public domain patterns via picsum + category colour)
const PLACEHOLDER_COLORS = {
  'Silk Sarees'      : 'c0392b',
  'Cotton Sarees'    : '2e7d32',
  'Party Wear'       : '6a1b9a',
  'Bridal Sarees'    : 'b71c1c',
  'Furniture Fabrics': '4e342e',
  'Other'            : 'c8a951',
};

// ============================================================
//  STATE
// ============================================================
let products   = [];
let shopInfo   = {};
let isAdmin    = false;
let activeFilter = 'All';
let editingProductId = null;
let confirmCallback = null;

// ============================================================
//  STORAGE HELPERS
// ============================================================
function loadData() {
  const raw = localStorage.getItem(LS.PRODUCTS);
  products = raw ? JSON.parse(raw) : [...DEFAULT_PRODUCTS];

  const rawInfo = localStorage.getItem(LS.SHOP_INFO);
  shopInfo = rawInfo ? JSON.parse(rawInfo) : { ...DEFAULT_SHOP_INFO };
}

function saveProducts()  { localStorage.setItem(LS.PRODUCTS, JSON.stringify(products)); }
function saveShopInfo()  { localStorage.setItem(LS.SHOP_INFO, JSON.stringify(shopInfo)); }

// ============================================================
//  DOM REFS
// ============================================================
const $ = id => document.getElementById(id);

// ============================================================
//  TOAST
// ============================================================
function showToast(msg, type = 'success') {
  const t = $('toast');
  t.className = `show toast-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  clearTimeout(t._to);
  t._to = setTimeout(() => { t.className = ''; }, 3000);
}

// ============================================================
//  NAVBAR
// ============================================================
function initNavbar() {
  // Hamburger
  const ham  = $('hamburger');
  const menu = $('mobile-menu');
  ham.addEventListener('click', () => {
    ham.classList.toggle('open');
    menu.classList.toggle('open');
  });

  // Close mobile menu on link click
  document.querySelectorAll('#mobile-menu a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      ham.classList.remove('open');
    });
  });

  // Active link on scroll
  const sections = ['hero', 'products', 'about', 'shop-info', 'contact'];
  window.addEventListener('scroll', () => {
    let cur = 'hero';
    sections.forEach(id => {
      const el = $(id);
      if (el && window.scrollY >= el.offsetTop - 100) cur = id;
    });
    document.querySelectorAll('.nav-links a, #mobile-menu a').forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${cur}`);
    });
  });
}

// ============================================================
//  PRODUCTS RENDER
// ============================================================
function getPlaceholder(category) {
  const col = PLACEHOLDER_COLORS[category] || 'c8a951';
  return `https://placehold.co/400x300/${col}/ffffff?text=${encodeURIComponent(category || 'Product')}`;
}

function renderProducts() {
  const grid = $('products-grid');
  if (!grid) return;

  const filtered = activeFilter === 'All'
    ? products
    : products.filter(p => p.category === activeFilter);

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-products reveal">
        <div class="empty-icon">🛍️</div>
        <h3>No products yet</h3>
        <p>${isAdmin ? 'Click "Add New Product" to add your first product.' : 'Products will appear here soon. Please visit us in-store!'}</p>
      </div>`;
    observeReveal();
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const imgSrc = p.img || getPlaceholder(p.category);
    return `
    <div class="product-card reveal" data-id="${p.id}">
      <div class="product-img-wrap">
        <img src="${imgSrc}" alt="${escHtml(p.name)}" loading="lazy" onerror="this.src='${getPlaceholder(p.category)}'">
        <span class="product-category-badge">${escHtml(p.category)}</span>
        <div class="product-admin-actions">
          <button class="admin-action-btn edit-btn" onclick="openEditProduct('${p.id}')" title="Edit">✏️</button>
          <button class="admin-action-btn delete-btn" onclick="confirmDeleteProduct('${p.id}')" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="product-body">
        <div class="product-name">${escHtml(p.name)}</div>
        <div class="product-desc">${escHtml(p.desc)}</div>
        <div class="product-footer">
          <div class="product-price ${p.price ? '' : 'no-price'}">₹${escHtml(p.price)}</div>
          <a class="product-enquire-btn" href="${waLink(p.name)}" target="_blank" rel="noopener">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.486 2 2 6.486 2 12c0 1.773.462 3.441 1.264 4.896L2 22l5.247-1.243A9.953 9.953 0 0012 22c5.514 0 10-4.486 10-10S17.514 2 12 2zm0 18a7.953 7.953 0 01-4.072-1.118l-.292-.174-3.114.738.763-3.04-.19-.31A7.96 7.96 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/></svg>
            Enquire
          </a>
        </div>
      </div>
    </div>`;
  }).join('');

  observeReveal();
}

function waLink(productName) {
  const msg = `Hello Sri Balaji Silks! I am interested in "${productName}". Please share more details.`;
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function renderFilterBar() {
  const bar = $('filter-bar');
  if (!bar) return;
  const cats = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  bar.innerHTML = cats.map(c => `
    <button class="filter-btn ${c === activeFilter ? 'active' : ''}" onclick="setFilter('${escHtml(c)}')">${escHtml(c)}</button>
  `).join('');
}

function setFilter(cat) {
  activeFilter = cat;
  renderFilterBar();
  renderProducts();
}
window.setFilter = setFilter;

// ============================================================
//  SHOP INFO RENDER
// ============================================================
function renderShopInfo() {
  const el = $('info-address');
  if (el) el.innerHTML = escHtml(shopInfo.address).replace(/\n/g, '<br>');
  const el2 = $('info-hours');
  if (el2) el2.textContent = shopInfo.hours;
  const el3 = $('info-phone');
  if (el3) el3.innerHTML = `<a href="tel:${shopInfo.phone}">+91 ${shopInfo.phone}</a>`;
  const el4 = $('about-text');
  if (el4) el4.textContent = shopInfo.about;
}

// ============================================================
//  ADMIN
// ============================================================
function initAdmin() {
  $('admin-toggle-btn')?.addEventListener('click', openAdminLogin);
  $('footer-admin-btn')?.addEventListener('click', openAdminLogin);
  $('admin-logout-btn')?.addEventListener('click', logoutAdmin);
}

function openAdminLogin() {
  if (isAdmin) { logoutAdmin(); return; }
  openModal('modal-admin-login');
  $('admin-password-input').value = '';
  $('admin-login-error').classList.remove('show');
  setTimeout(() => $('admin-password-input').focus(), 100);
}

function doAdminLogin() {
  const pw = $('admin-password-input').value;
  if (pw === ADMIN_PASSWORD) {
    isAdmin = true;
    document.body.classList.add('admin-mode');
    closeModal('modal-admin-login');
    $('admin-toggle-btn').textContent = 'LOGOUT';
    showToast('Admin mode activated!', 'success');
    renderProducts();
  } else {
    $('admin-login-error').classList.add('show');
    $('admin-password-input').focus();
  }
}
window.doAdminLogin = doAdminLogin;

function logoutAdmin() {
  isAdmin = false;
  document.body.classList.remove('admin-mode');
  $('admin-toggle-btn').textContent = 'ADMIN';
  showToast('Logged out of admin mode', 'success');
  renderProducts();
}

// ---- Product Add / Edit ----
function openAddProduct() {
  editingProductId = null;
  $('product-modal-title').textContent = 'Add New Product';
  $('product-form').reset();
  $('product-img-preview-img').style.display = 'none';
  $('product-img-placeholder').style.display = 'flex';
  $('product-img-data').value = '';
  openModal('modal-product');
}
window.openAddProduct = openAddProduct;

function openEditProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingProductId = id;
  $('product-modal-title').textContent = 'Edit Product';
  $('pf-name').value     = p.name;
  $('pf-category').value = p.category;
  $('pf-desc').value     = p.desc;
  $('pf-price').value    = p.price;
  $('product-img-data').value = p.img || '';
  if (p.img) {
    $('product-img-preview-img').src = p.img;
    $('product-img-preview-img').style.display = 'block';
    $('product-img-placeholder').style.display = 'none';
  } else {
    $('product-img-preview-img').style.display = 'none';
    $('product-img-placeholder').style.display = 'flex';
  }
  openModal('modal-product');
}
window.openEditProduct = openEditProduct;

function saveProduct() {
  const name     = $('pf-name').value.trim();
  const category = $('pf-category').value.trim();
  const desc     = $('pf-desc').value.trim();
  const price    = $('pf-price').value.trim();
  const img      = $('product-img-data').value;

  if (!name) { showToast('Please enter a product name.', 'error'); return; }
  if (!category) { showToast('Please select a category.', 'error'); return; }

  if (editingProductId) {
    const idx = products.findIndex(p => p.id === editingProductId);
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, category, desc, price, img };
    }
    showToast('Product updated!', 'success');
  } else {
    products.push({ id: 'p' + Date.now(), name, category, desc, price, img });
    showToast('Product added!', 'success');
  }
  saveProducts();
  closeModal('modal-product');
  renderFilterBar();
  renderProducts();
}
window.saveProduct = saveProduct;

function confirmDeleteProduct(id) {
  confirmCallback = () => {
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderFilterBar();
    renderProducts();
    showToast('Product deleted.', 'success');
  };
  openModal('modal-confirm');
}
window.confirmDeleteProduct = confirmDeleteProduct;

function doConfirm() {
  if (typeof confirmCallback === 'function') confirmCallback();
  confirmCallback = null;
  closeModal('modal-confirm');
}
window.doConfirm = doConfirm;

// ---- Shop Info Edit ----
function openEditShopInfo() {
  $('si-address').value = shopInfo.address;
  $('si-hours').value   = shopInfo.hours;
  $('si-phone').value   = shopInfo.phone;
  openModal('modal-shop-info');
}
window.openEditShopInfo = openEditShopInfo;

function saveShopInfoModal() {
  shopInfo.address = $('si-address').value.trim() || shopInfo.address;
  shopInfo.hours   = $('si-hours').value.trim()   || shopInfo.hours;
  shopInfo.phone   = $('si-phone').value.trim()   || shopInfo.phone;
  saveShopInfo();
  renderShopInfo();
  closeModal('modal-shop-info');
  showToast('Shop info updated!', 'success');
}
window.saveShopInfoModal = saveShopInfoModal;

function openEditAbout() {
  $('si-about').value = shopInfo.about;
  openModal('modal-about-edit');
}
window.openEditAbout = openEditAbout;

function saveAboutModal() {
  shopInfo.about = $('si-about').value.trim() || shopInfo.about;
  saveShopInfo();
  renderShopInfo();
  closeModal('modal-about-edit');
  showToast('About section updated!', 'success');
}
window.saveAboutModal = saveAboutModal;

// ============================================================
//  IMAGE UPLOAD (Base64)
// ============================================================
function initImageUpload() {
  const input   = $('product-img-input');
  const preview = $('product-img-preview-img');
  const holder  = $('product-img-placeholder');
  const data    = $('product-img-data');

  if (!input) return;
  input.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast('Image too large. Max 3MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      data.value    = ev.target.result;
      preview.src   = ev.target.result;
      preview.style.display  = 'block';
      holder.style.display   = 'none';
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================
//  CONTACT ENQUIRY FORM
// ============================================================
function initEnquiryForm() {
  const form = $('enquiry-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = $('eq-name').value.trim();
    const phone   = $('eq-phone').value.trim();
    const product = $('eq-product').value.trim();
    const message = $('eq-message').value.trim();

    if (!name || !phone) {
      showToast('Please enter your name and phone number.', 'error');
      return;
    }

    const text = `Hello Sri Balaji Silks! 🙏\n\nMy name is *${name}*.\nPhone: *${phone}*\n${product ? `Interested in: *${product}*\n` : ''}${message ? `Message: ${message}` : ''}`;
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
    showToast('Opening WhatsApp...', 'success');
    form.reset();
  });
}

// ============================================================
//  MODAL HELPERS
// ============================================================
function openModal(id) {
  $(id)?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  $(id)?.classList.remove('open');
  document.body.style.overflow = '';
}
window.openModal  = openModal;
window.closeModal = closeModal;

function initModals() {
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target === el) closeModal(el.id);
    });
  });
  // Admin login — Enter key
  $('admin-password-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') doAdminLogin();
  });
}

// ============================================================
//  SCROLL REVEAL
// ============================================================
function observeReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el));
}

// ============================================================
//  HELPER
// ============================================================
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============================================================
//  INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initNavbar();
  initAdmin();
  initModals();
  initImageUpload();
  initEnquiryForm();
  renderShopInfo();
  renderFilterBar();
  renderProducts();
  observeReveal();

  // Smooth appear on load
  setTimeout(() => {
    document.querySelectorAll('.reveal').forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 80);
    });
  }, 200);
});
