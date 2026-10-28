/* ИСКУССТВО РАЗУМА — отправка заявок через Cloudflare Worker.
   Перед публикацией укажите URL Worker в API_BASE ниже. */
(() => {
  const API_BASE = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev";
  const form = document.getElementById("registerForm");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (API_BASE.includes("YOUR-WORKER")) {
      alert("Форма ещё не подключена. Сначала настройте Cloudflare Worker по инструкции.");
      return;
    }
    const submit = form.querySelector('[type="submit"]');
    if (submit) { submit.disabled = true; submit.dataset.oldText = submit.textContent; submit.textContent = "Отправляем…"; }
    try {
      const data = Object.fromEntries(new FormData(form).entries());
      data.personal_data_consent = form.querySelector('[name="personal_data_consent"]')?.checked ? "1" : "0";
      const response = await fetch(`${API_BASE}/api/applications`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Не удалось отправить заявку.");
      alert(result.message || "Заявка отправлена!"); form.reset();
    } catch (error) { alert(error.message || "Ошибка соединения. Попробуйте ещё раз."); }
    finally { if (submit) { submit.disabled = false; submit.textContent = submit.dataset.oldText || "Отправить"; } }
  });
})();
