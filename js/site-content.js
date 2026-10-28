/* =========================================================
   РЕДАКТИРУЕМЫЙ КОНТЕНТ САЙТА
   Данные из data/site-content.json обновляются через админ-панель.
   ========================================================= */
document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/site-content.json", { cache: "no-store" });
    if (!response.ok) return;
    const data = await response.json();
    document.querySelectorAll(".course-card[data-course]").forEach(card => {
      const item = data.courses?.[card.dataset.course];
      if (!item) return;
      const title = card.querySelector("h3");
      const description = card.querySelector(".course-desc");
      const price = card.querySelector(".price");
      const image = card.querySelector(".course-photo img");
      if (title && item.title) title.textContent = item.title;
      if (description && item.description) description.textContent = item.description;
      if (price && item.price) price.textContent = item.price;
      if (image && item.image) { image.src = item.image; image.alt = item.title || image.alt; }
    });
  } catch (error) {
    console.warn("Не удалось загрузить редактируемый контент сайта.", error);
  }
});
