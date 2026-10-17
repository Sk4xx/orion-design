(() => {
  const PRODUCTS_KEY = 'orion-design-products-v1';
  const CART_KEY = 'orion-design-cart-v1';
  const WA_NUMBER = '584225690008';
  const getProducts = () => { try { return JSON.parse(localStorage.getItem(PRODUCTS_KEY) || '[]'); } catch { return []; } };
  const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
  let cart = []; try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { cart = []; }
  let selectedProduct = null; let modalQty = 1; let selectedSize = ''; let selectedColor = '';
  const $ = (id) => document.getElementById(id);
  const formatPrice = (value) => `$${new Intl.NumberFormat('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
  const safe = (str) => String(str ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const toast = (message) => { const el = $('toast'); if (!el) return; el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2400); };
  const whatsappTo = (number, message) => window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  const whatsapp = (message) => whatsappTo(WA_NUMBER, message);

  function fillCollections() {
    const select = $('collectionFilter'); if (!select) return;
    const chosen = select.value; const collections = [...new Set(getProducts().filter(p => p.available !== false && p.collection).map(p => p.collection))].sort();
    select.innerHTML = '<option value="">Todas las colecciones</option>' + collections.map(c => `<option>${safe(c)}</option>`).join('');
    if (collections.includes(chosen)) select.value = chosen;
  }
  function renderProducts() {
    const grid = $('productGrid'); if (!grid) return;
    fillCollections();
    const query = $('searchInput').value.trim().toLowerCase(); const cat = $('categoryFilter').value; const collection = $('collectionFilter').value; const sort = $('sortFilter').value;
    let items = getProducts().filter(p => p.available !== false && Number(p.stock) !== 0 && p.retailPrice !== '' && Number(p.retailPrice) >= 0 && Boolean(p.photo));
    items = items.filter(p => (!cat || p.category === cat) && (!collection || p.collection === collection) && (!query || `${p.name} ${p.category} ${p.collection} ${p.description}`.toLowerCase().includes(query)));
    if (sort === 'price-up') items.sort((a,b) => Number(a.retailPrice)-Number(b.retailPrice));
    if (sort === 'price-down') items.sort((a,b) => Number(b.retailPrice)-Number(a.retailPrice));
    if (sort === 'name') items.sort((a,b) => a.name.localeCompare(b.name, 'es'));
    if (sort === 'featured') items.sort((a,b) => Number(b.featured)-Number(a.featured));
    grid.innerHTML = items.map(p => `<article class="product-card"><div class="product-photo" data-detail="${safe(p.id)}">${p.photo ? `<img src="${p.photo}" alt="${safe(p.name)}" loading="lazy">` : '<div class="image-fallback">✳</div>'}${p.featured ? '<span class="product-badge">Destacado</span>' : ''}<button class="quick-add" data-detail="${safe(p.id)}">Ver prenda y opciones&nbsp; ↗</button></div><div class="product-info"><div class="product-meta"><span>${safe(p.category)}</span><span>${p.collection ? safe(p.collection) : ''}</span></div><h3>${safe(p.name)}</h3><div class="price">${formatPrice(p.retailPrice)}</div>${(p.colors||[]).length ? `<div class="product-colors">${p.colors.slice(0,5).map(c=>`<i class="swatch" title="${safe(c.name)}" style="background:${safe(c.hex||'#ddd')}"></i>`).join('')}</div>` : ''}</div></article>`).join('');
    const empty = $('emptyCatalog'); empty.classList.toggle('visible', items.length === 0);
    if (items.length === 0) {
      const title = $('emptyCatalog').querySelector('h3'); const body = $('emptyCatalog').querySelector('p');
      if (getProducts().some(p => p.available !== false) && (query || cat || collection)) { title.innerHTML = 'No encontramos<br>esa prenda.'; body.textContent = 'Prueba con otra búsqueda o cambia los filtros para ver más opciones.'; }
      else { title.innerHTML = 'Estamos preparando<br>el catálogo.'; body.textContent = 'Muy pronto podrás explorar las piezas disponibles. Escríbenos para conocer las novedades.'; }
    }
    $('catalogCount').textContent = items.length ? `${items.length} ${items.length === 1 ? 'prenda disponible' : 'prendas disponibles'}` : '';
  }
  function cartKey(item) { return [item.id,item.size||'',item.color||''].join('::'); }
  function addToCart(product, size, color, quantity=1) {
    const existing = cart.find(x => cartKey(x) === cartKey({id:product.id,size,color}));
    const max = Number(product.stock) || 9999; const next = (existing?.quantity || 0) + quantity;
    if (next > max) { toast(`Disponibilidad máxima: ${max} unidad${max === 1 ? '' : 'es'}.`); return; }
    if (existing) existing.quantity = next; else cart.push({id:product.id,name:product.name,photo:product.photo||'',retailPrice:Number(product.retailPrice),size,color,quantity});
    saveCart(); renderCart(); toast('Prenda agregada a tu bolsa.');
  }
  function renderCart() {
    const count = cart.reduce((sum, x) => sum + x.quantity, 0); const subtotal = cart.reduce((sum,x) => sum + x.retailPrice*x.quantity,0);
    $('cartCount').textContent = count; $('drawerCount').textContent = `(${count})`; $('cartTotal').textContent = formatPrice(subtotal);
    $('cartLines').innerHTML = cart.map((x,i) => `<div class="cart-item">${x.photo ? `<img src="${x.photo}" alt="">` : '<div class="cart-image-empty"></div>'}<div><h3>${safe(x.name)}</h3><small>${[x.size && `Talla ${safe(x.size)}`,x.color && safe(x.color)].filter(Boolean).join(' · ') || 'Talla y color por confirmar'}</small><strong>${formatPrice(x.retailPrice)}</strong><div class="qty-control"><button data-qty="${i}" data-delta="-1" aria-label="Restar">−</button><span>${x.quantity}</span><button data-qty="${i}" data-delta="1" aria-label="Sumar">+</button></div></div><button class="remove-item" data-remove="${i}" aria-label="Quitar">×</button></div>`).join('');
    $('cartEmpty').classList.toggle('visible', cart.length === 0); $('cartFooter').classList.toggle('hidden', cart.length === 0);
  }
  function openCart(){ $('cartDrawer').classList.add('open'); $('cartBackdrop').classList.add('open'); $('cartDrawer').setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
  function closeCart(){ $('cartDrawer').classList.remove('open'); $('cartBackdrop').classList.remove('open'); $('cartDrawer').setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function quoteMessage(extra='') {
    const lines = cart.length ? cart.map(x=>`• ${x.name} — cantidad: ${x.quantity}${x.size ? `, talla ${x.size}`:''}${x.color ? `, color ${x.color}`:''}`).join('\n') : extra;
    return `Hola, ORIÓN DESIGN. Me interesa solicitar una cotización mayorista.\n\nProductos y cantidades:\n${lines || 'Quisiera conocer las prendas disponibles y las condiciones para compra mayorista.'}\n\n¿Podrían compartir disponibilidad y cotización?`;
  }
  function openProduct(id) {
    const product = getProducts().find(p=>p.id===id); if (!product) return;
    selectedProduct=product; modalQty=1; selectedSize=''; selectedColor='';
    const sizes=product.sizes||[]; const colors=product.colors||[];
    $('modalContent').innerHTML=`<div class="modal-product"><div class="modal-photo">${product.photo?`<img src="${product.photo}" alt="${safe(product.name)}">`:'<div class="image-fallback">✳</div>'}</div><div class="modal-product-copy"><div class="eyebrow"><span></span> ${safe(product.category)}${product.collection?` · ${safe(product.collection)}`:''}</div><h2 id="modalTitle">${safe(product.name)}</h2><div class="modal-price">${formatPrice(product.retailPrice)}</div><p class="modal-desc">${safe(product.description||'Diseño original ORIÓN DESIGN. Consulta disponibilidad por WhatsApp.')}</p>${sizes.length?`<span class="option-label">Selecciona talla</span><div class="option-row">${sizes.map(s=>`<button class="option-pill" data-size="${safe(s)}">${safe(s)}</button>`).join('')}</div>`:''}${colors.length?`<span class="option-label">Selecciona color</span><div class="option-row">${colors.map(c=>`<button class="option-color" data-color="${safe(c.name)}"><i style="background:${safe(c.hex||'#ddd')}"></i>${safe(c.name)}</button>`).join('')}</div>`:''}<span class="option-label">Cantidad</span><div class="modal-qty"><button id="qtyMinus" aria-label="Restar">−</button><span id="modalQty">1</span><button id="qtyPlus" aria-label="Sumar">+</button></div><button class="button button-dark full-button" id="addSelected">Agregar a mi bolsa <span>↗</span></button>${product.wholesale!==false?`<button class="wholesale-link" id="wholesaleProduct">Solicitar cotización mayorista</button>`:''}</div></div>`;
    $('modalBackdrop').classList.add('open'); document.body.style.overflow='hidden';
  }
  function closeModal(id){ $(id).classList.remove('open'); if (!$('cartDrawer').classList.contains('open')) document.body.style.overflow=''; }

  $('yearNow').textContent=new Date().getFullYear();
  ['searchInput','categoryFilter','collectionFilter','sortFilter'].forEach(id=>$(id).addEventListener(id==='searchInput'?'input':'change',renderProducts));
  renderProducts(); renderCart();
  $('cartOpen').addEventListener('click',openCart); $('cartClose').addEventListener('click',closeCart); $('cartBackdrop').addEventListener('click',closeCart); $('continueShopping').addEventListener('click',closeCart);
  $('menuToggle').addEventListener('click',()=>{const open=$('mainNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));});
  $('mainNav').addEventListener('click',e=>{if(e.target.closest('a')){$('mainNav').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}});
  document.addEventListener('click',e=>{
    const detail=e.target.closest('[data-detail]'); if(detail){openProduct(detail.dataset.detail);return;}
    const cat=e.target.closest('[data-category]'); if(cat){$('categoryFilter').value=cat.dataset.category;renderProducts();$('catalogo').scrollIntoView({behavior:'smooth'});return;}
    const qty=e.target.closest('[data-qty]'); if(qty){const index=Number(qty.dataset.qty),delta=Number(qty.dataset.delta),item=cart[index];if(!item)return;const stock=getProducts().find(p=>p.id===item.id)?.stock||9999;item.quantity=Math.max(0,Math.min(Number(stock)||9999,item.quantity+delta));if(!item.quantity)cart.splice(index,1);saveCart();renderCart();return;}
    const remove=e.target.closest('[data-remove]');if(remove){cart.splice(Number(remove.dataset.remove),1);saveCart();renderCart();}
  });
  $('modalClose').addEventListener('click',()=>closeModal('modalBackdrop')); $('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal('modalBackdrop');});
  $('modalContent').addEventListener('click',e=>{
    const size=e.target.closest('[data-size]');if(size){selectedSize=size.dataset.size;$('modalContent').querySelectorAll('[data-size]').forEach(b=>b.classList.toggle('selected',b===size));}
    const color=e.target.closest('[data-color]');if(color){selectedColor=color.dataset.color;$('modalContent').querySelectorAll('[data-color]').forEach(b=>b.classList.toggle('selected',b===color));}
    if(e.target.closest('#qtyMinus')){modalQty=Math.max(1,modalQty-1);$('modalQty').textContent=modalQty;}
    if(e.target.closest('#qtyPlus')){modalQty=Math.min(Number(selectedProduct.stock)||9999,modalQty+1);$('modalQty').textContent=modalQty;}
    if(e.target.closest('#addSelected')){if((selectedProduct.sizes||[]).length&&!selectedSize){toast('Selecciona una talla.');return;}if((selectedProduct.colors||[]).length&&!selectedColor){toast('Selecciona un color.');return;}addToCart(selectedProduct,selectedSize,selectedColor,modalQty);closeModal('modalBackdrop');}
    if(e.target.closest('#wholesaleProduct')){whatsapp(quoteMessage(`• ${selectedProduct.name} — cantidad: por confirmar`));}
  });
  $('wholesaleTop').addEventListener('click',()=>whatsapp(quoteMessage())); $('wholesaleBanner').addEventListener('click',()=>whatsapp(quoteMessage())); $('wholesaleCart').addEventListener('click',()=>whatsapp(quoteMessage())); wholesaleGrand.addEventListener('click',()=>whatsappTo('584146529219',quoteMessage()));
  $('checkoutOpen').addEventListener('click',()=>{closeCart();$('checkoutBackdrop').classList.add('open');document.body.style.overflow='hidden';});
  $('checkoutClose').addEventListener('click',()=>closeModal('checkoutBackdrop')); $('checkoutBackdrop').addEventListener('click',e=>{if(e.target===$('checkoutBackdrop'))closeModal('checkoutBackdrop');});
  $('checkoutForm').addEventListener('submit',e=>{e.preventDefault();const form=new FormData(e.currentTarget);const subtotal=cart.reduce((sum,x)=>sum+x.retailPrice*x.quantity,0);const lines=cart.map(x=>`• ${x.name} — ${x.quantity} x ${formatPrice(x.retailPrice)}${x.size?`, talla ${x.size}`:''}${x.color?`, color ${x.color}`:''} = ${formatPrice(x.quantity*x.retailPrice)}`).join('\n');const message=`Hola, ORIÓN DESIGN. Quiero solicitar este pedido:\n\n${lines}\n\nSubtotal referencial: ${formatPrice(subtotal)}\n\nDatos del cliente:\nNombre: ${form.get('name')}\nTeléfono: ${form.get('phone')}\nCiudad / estado: ${form.get('city')}${form.get('note')?`\nNota: ${form.get('note')}`:''}\n\nPor favor, confirmen disponibilidad y costo de envío. Gracias.`;whatsapp(message);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeCart();closeModal('modalBackdrop');closeModal('checkoutBackdrop');}});
  window.addEventListener('storage',e=>{if(e.key===PRODUCTS_KEY){renderProducts();}});
})();
