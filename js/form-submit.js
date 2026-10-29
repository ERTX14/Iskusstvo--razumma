(() => {
  'use strict';
  document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerForm');
    if (!form) return;
    const button = form.querySelector('[type="submit"]');
    const note = document.createElement('p');
    note.setAttribute('role', 'status');
    note.style.cssText = 'margin-top:14px;font-weight:600;';
    form.appendChild(note);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const base = (window.IR_API_BASE || '').replace(/\/$/, '');
      if (!base || base.includes('REPLACE-WITH-YOUR-WORKER')) {
        note.textContent = 'Форма пока не подключена: укажите адрес Cloudflare Worker в js/cloudflare-api.js.';
        note.style.color = '#b42318'; return;
      }
      const data = Object.fromEntries(new FormData(form).entries());
      data.action = 'submit_application';
      button.disabled = true;
      const original = button.textContent;
      button.textContent = 'Отправляем…'; note.textContent = '';
      try {
        const response = await fetch(base, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(data) });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || 'Не удалось отправить заявку');
        note.textContent = 'Спасибо! Заявка отправлена. Мы свяжемся с вами.';
        note.style.color = '#16803c'; form.reset();
      } catch (error) {
        note.textContent = error.message || 'Ошибка соединения. Попробуйте ещё раз позже.';
        note.style.color = '#b42318';
      } finally { button.disabled = false; button.textContent = original; }
    });
  });
})();
