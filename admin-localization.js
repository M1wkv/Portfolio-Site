
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
    "Reset local data done": "Локальные данные сброшены"
  });
  locale.addPattern(/^Project\s+(\d+)$/i, (_, number) => `Проект ${number}`);
  locale.addPattern(/^(\d+) gallery images$/i, (_, count) => `Изображений в галерее: ${count}`);
  locale.addPattern(/^(\d+) images selected$/i, (_, count) => `Выбрано изображений: ${count}`);
  locale.addPattern(/^Save failed:\s*(.+)$/i, (_, message) => `Ошибка сохранения: ${message}`);
  locale.addPattern(/^Login failed:\s*(.+)$/i, (_, message) => `Ошибка входа: ${message}`);
  locale.addPattern(/^Supabase load skipped:\s*(.+)$/i, (_, message) => `Не удалось загрузить данные Supabase: ${message}`);
})();

