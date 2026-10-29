/* CMS для сайта «Искусство Разума». Публичная часть читает только опубликованные настройки. */
(() => {
  'use strict';
  const API = (window.IR_API_BASE || 'https://REPLACE-WITH-YOUR-WORKER.workers.dev').replace(/\/$/,'');
  const pageName = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const textNodes = () => [...document.querySelectorAll('h1,h2,h3,h4,p,li')];
  const apply = state => {
    if (!state || typeof state !== 'object') return;
    const page = state.content?.[pageName];
    if (page) {
      const nodes = textNodes();
      (page.texts || []).forEach((value, i) => { if (nodes[i] && typeof value === 'string' && nodes[i].textContent !== value) nodes[i].textContent = value; });
      const images = [...document.querySelectorAll('img')];
      (page.images || []).forEach((value, i) => { if (images[i] && typeof value === 'string' && value) images[i].src = value; });
    }
    if (pageName === 'index.html' && Array.isArray(state.services) && state.services.length) {
      const grid = document.querySelector('.best-grid');
      if (grid) {
        grid.innerHTML = state.services.map((s, i) => `<article class="bestseller" data-course="${escapeAttr(s.key || ('custom-'+i))}">${s.badge ? `<div class="badge">${escapeHtml(s.badge)}</div>` : ''}<div class="course-photo">${s.image ? `<img src="${escapeAttr(s.image)}" alt="${escapeAttr(s.name)}">` : ''}</div><h3>${escapeHtml(s.name || 'Направление')}</h3><p class="course-desc">${escapeHtml(s.desc || '')}</p><p class="price">${escapeHtml(s.price || '')}</p><button type="button" class="course-btn open-course" data-course="${escapeAttr(s.key || ('custom-'+i))}">УЗНАТЬ</button></article>`).join('');
        grid.querySelectorAll('.open-course').forEach(btn => btn.addEventListener('click', () => {
          const select = document.getElementById('courseSelect'); if (select) { select.value = btn.dataset.course; }
          document.getElementById('register')?.scrollIntoView({behavior:'smooth'});
        }));
        const select = document.getElementById('courseSelect');
        if (select) {
          const previous = select.value;
          select.innerHTML = '<option value="" selected disabled>Выберите направление</option>' + state.services.map((s,i)=>`<option value="${escapeAttr(s.key || ('custom-'+i))}">${escapeHtml(s.name || 'Направление')}</option>`).join('');
          if (state.services.some((s,i)=>(s.key || ('custom-'+i))===previous)) select.value = previous;
        }
      }
    }
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escapeAttr = escapeHtml;
  document.addEventListener('DOMContentLoaded', async () => {
    // Круглый курсор — декоративный, на сенсорных экранах отключён.
    if (matchMedia('(pointer:fine)').matches) {
      const cursor = document.createElement('div'); cursor.className='custom-cursor';
      const dot = document.createElement('div'); dot.className='custom-cursor-dot';
      document.body.append(cursor,dot);
      document.addEventListener('mousemove', e => { cursor.style.transform=`translate(${e.clientX}px,${e.clientY}px)`; dot.style.transform=`translate(${e.clientX}px,${e.clientY}px)`; });
      document.querySelectorAll('a,button,input,select,textarea,label').forEach(el=>{el.addEventListener('mouseenter',()=>cursor.classList.add('is-hover'));el.addEventListener('mouseleave',()=>cursor.classList.remove('is-hover'));});
    }
    try {
      const response = await fetch(API, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({action:'public_state'})});
      if (response.ok) { const result = await response.json(); if (result.success) apply(result.state); }
    } catch (_) { /* Если API ещё не подключён, исходный сайт продолжает работать. */ }
  });
})();
