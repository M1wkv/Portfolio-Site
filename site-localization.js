(() => {
  const translations = new Map([
    ["OPEN", "ОТКРЫТЬ"],
    ["CLOSE", "ЗАКРЫТЬ"],
    ["BACK", "НАЗАД"],
    ["DESIGN CASE", "ДИЗАЙН-КЕЙС"],
    ["CV", "Резюме"],
    ["Profile", "Профиль"],
    ["Experience", "Опыт"],
    ["Education", "Образование"],
    ["Skills", "Навыки"],
    ["Certificates", "Сертификаты"],
    ["Tools", "Инструменты"],
    ["Services", "Услуги"],
    ["Contact", "Контакты"],
    ["Alexander", "Александр"],
    ["CV / ART DIRECTION / AI DESIGN", "РЕЗЮМЕ / АРТ-ДИРЕКШН / ИИ-ДИЗАЙН"],
    ["Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.", "Креативный дизайнер. Создаю визуальные системы, проекты с использованием ИИ и интерактивные портфолио."],
    ["Visual direction, generative content, interface composition and cinematic digital cases.", "Визуальное направление, генеративный контент, композиция интерфейсов и выразительные цифровые кейсы."],
    ["Portfolio systems, AI campaigns, social content packs, landing visuals and case studies.", "Системы портфолио, ИИ-кампании, контент для социальных сетей, визуалы для лендингов и дизайн-кейсы."],
    ["Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea and web layout basics.", "Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea и основы веб-вёрстки."],
    ["Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea and web layout basics", "Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea и основы веб-вёрстки"],
    ["Available for visual identity, AI art direction, portfolio sites and design case packaging.", "Открыт к проектам по айдентике, ИИ-арт-дирекшну, сайтам-портфолио и оформлению дизайн-кейсов."],
    ["Branding", "Брендинг"],
    ["SMM design", "SMM-дизайн"],
    ["Presentations", "Презентации"],
    ["Print", "Печатный дизайн"],
    ["Branding, SMM design, presentations, Web / UI, print.", "Брендинг, SMM-дизайн, презентации, Web / UI и печатный дизайн."]
  ]);
  const patterns = [
    [/^DESIGN CASE\s+(\d+)$/i, (_, number) => `ДИЗАЙН-КЕЙС ${number}`]
  ];
  let translating = false;

  function text(value) {
    const source = String(value ?? "");
    if (translations.has(source)) return translations.get(source);
    for (const [pattern, replacement] of patterns) {
      if (pattern.test(source)) return source.replace(pattern, replacement);
    }
    return source;
  }

  function translateTextNode(node) {
    const raw = node.nodeValue || "";
    const clean = raw.trim();
    if (!clean) return;
    const translated = text(clean);
    if (translated !== clean) node.nodeValue = raw.replace(clean, translated);
  }

  function translateTree(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE && root.hasAttribute("placeholder")) {
      const placeholder = root.getAttribute("placeholder");
      const translated = text(placeholder);
      if (translated !== placeholder) root.setAttribute("placeholder", translated);
    }
    Array.from(root.childNodes).forEach(translateTree);
  }

  function translateDocument() {
    if (translating) return;
    translating = true;
    translateTree(document.documentElement);
    translating = false;
  }

  const observer = new MutationObserver((records) => {
    if (translating) return;
    translating = true;
    records.forEach((record) => {
      if (record.type === "characterData") translateTextNode(record.target);
      record.addedNodes.forEach(translateTree);
    });
    translating = false;
  });

  window.PortfolioLocale = {
    text,
    translateDocument,
    add(entries) {
      Object.entries(entries).forEach(([source, target]) => translations.set(source, target));
      translateDocument();
    },
    addPattern(pattern, replacement) {
      patterns.push([pattern, replacement]);
      translateDocument();
    }
  };

  translateDocument();
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();

