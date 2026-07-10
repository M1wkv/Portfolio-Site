(() => {
  const locale = window.PortfolioLocale;
  if (!locale) return;

  locale.add({
    "Profile / Главный блок": "Профиль / Главный блок",
    "CV / Резюме": "Резюме",
    "Portfolio / Кейсы": "Портфолио / Кейсы",
    "Services / Услуги": "Услуги",
    "Contacts / Связь": "Контакты",
    "Settings / SEO": "Настройки / SEO",
    "Not saved": "Не сохранено",
    "SAVE": "СОХРАНИТЬ",
    "SAVED": "СОХРАНЕНО",
    "RESET": "СБРОСИТЬ",
    "RESET DONE": "СБРОШЕНО",
    "REMOVE": "УДАЛИТЬ",
    "Active": "Активна",
    "Untitled": "Без названия",
    "No cover": "Нет обложки",
    "Published": "Опубликован",
    "Hidden": "Скрыт",
    "No cover selected": "Обложка не выбрана",
    "No gallery images selected": "Изображения не выбраны",
    "No file selected": "Файл не выбран",
    "Image selected": "Изображение выбрано",
    "Timeline": "Срок",
    "Scope": "Задачи",
    "Result": "Результат",
    "Saving...": "Сохранение...",
    "Saved to Supabase": "Сохранено в Supabase",
    "Saved locally": "Сохранено локально",
    "Ready": "Готово",
    "Ready locally": "Локальный режим готов",
    "Logged out": "Вы вышли из аккаунта",
    "Logging in...": "Вход...",
    "SUPABASE LOGIN": "ВХОД В SUPABASE",
    "LOGIN": "ВОЙТИ",
    "LOGOUT": "ВЫЙТИ",
    "Signed in": "Выполнен вход",
    "Email": "Эл. почта",
    "Password": "Пароль",
    "Supabase config missing": "Не найдена конфигурация Supabase",
    "Reset local data done": "Локальные данные сброшены",
    "Войди пользователем, которого создал в Supabase Authentication.": "Войдите под пользователем, созданным в Supabase Authentication."
  });
  locale.addPattern(/^Project\s+(\d+)$/i, (_, number) => `Проект ${number}`);
  locale.addPattern(/^(\d+) gallery images$/i, (_, count) => `Изображений в галерее: ${count}`);
  locale.addPattern(/^(\d+) images selected$/i, (_, count) => `Выбрано изображений: ${count}`);
  locale.addPattern(/^Save failed:\s*(.+)$/i, (_, message) => `Ошибка сохранения: ${message}`);
  locale.addPattern(/^Login failed:\s*(.+)$/i, (_, message) => `Ошибка входа: ${message}`);
  locale.addPattern(/^Supabase load skipped:\s*(.+)$/i, (_, message) => `Не удалось загрузить данные Supabase: ${message}`);

  const valueTranslations = new Map([
    ["Alexander", "Александр"],
    ["CV / ART DIRECTION / AI DESIGN", "РЕЗЮМЕ / АРТ-ДИРЕКШН / ИИ-ДИЗАЙН"],
    ["Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.", "Креативный дизайнер. Создаю визуальные системы, проекты с использованием ИИ и интерактивные портфолио."],
    ["Portfolio systems, AI campaigns, social content packs, landing visuals and case studies.", "Системы портфолио, ИИ-кампании, контент для социальных сетей, визуалы для лендингов и дизайн-кейсы."],
    ["Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea and web layout basics.", "Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea и основы веб-вёрстки."],
    ["Visual identity, key visuals, guidelines.", "Айдентика, ключевые визуалы и гайдлайны."],
    ["Social media layouts, campaign packs, content systems.", "Макеты для социальных сетей, кампании и контент-системы."],
    ["Pitch decks, portfolio decks, case packaging.", "Питч-деки, портфолио и оформление кейсов."],
    ["Landing pages, portfolio sites, interface concepts.", "Лендинги, сайты-портфолио и концепции интерфейсов."],
    ["Posters, packaging layouts, printed brand materials.", "Постеры, упаковка и печатные материалы бренда."],
    ["Portfolio Sphere", "Сфера портфолио"],
    ["Creative portfolio with interactive sphere gallery and design cases.", "Креативное портфолио с интерактивной сферой и дизайн-кейсами."],
    ["New case", "Новый кейс"],
    ["Design", "Дизайн"]
  ]);

  function translateValues(root) {
    const fields = [];
    if (root?.matches?.("input, textarea")) fields.push(root);
    root?.querySelectorAll?.("input, textarea").forEach((field) => fields.push(field));
    fields.forEach((field) => {
      const translated = valueTranslations.get(field.value);
      if (!translated || translated === field.value) return;
      field.value = translated;
      field.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  const valueObserver = new MutationObserver((records) => {
    records.forEach((record) => record.addedNodes.forEach(translateValues));
  });
  valueObserver.observe(document.documentElement, { childList: true, subtree: true });

  let syncAttempts = 0;
  const syncTimer = window.setInterval(() => {
    translateValues(document);
    syncAttempts += 1;
    if (syncAttempts >= 20) window.clearInterval(syncTimer);
  }, 250);
})();

