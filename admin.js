(() => {
  const STORAGE_CONTENT = "portfolioSphere.adminContent";
  const STORAGE_CV = "portfolioSphere.cvNodes";
  const STORAGE_ASSETS = "portfolioSphere.assets";
  const supabaseClient = window.createPortfolioSupabase ? window.createPortfolioSupabase() : null;
  const bucketName = window.PORTFOLIO_SUPABASE?.bucket || "portfolio";

  const defaultContent = {
    profile: {
      name: "Александр",
      role: "РЕЗЮМЕ / АРТ-ДИРЕКШН / ИИ-ДИЗАЙН",
      photo: "",
      photoUrl: "",
      description: "Креативный дизайнер. Создаю визуальные системы, проекты с использованием ИИ и интерактивные портфолио.",
      socials: { telegram: "", behance: "", linkedin: "", instagram: "" }
    },
    cv: {
      experience: "Системы портфолио, ИИ-кампании, контент для социальных сетей, визуалы для лендингов и дизайн-кейсы.",
      education: "",
      skills: "Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea и основы веб-вёрстки.",
      certificates: "",
      pdf: "",
      pdfName: "",
      pdfUrl: ""
    },
    portfolio: { projects: [] },
    services: [
      { title: "Брендинг", description: "Айдентика, ключевые визуалы и гайдлайны.", enabled: true },
      { title: "SMM-дизайн", description: "Макеты для социальных сетей, кампании и контент-системы.", enabled: true },
      { title: "Презентации", description: "Питч-деки, портфолио и оформление кейсов.", enabled: true },
      { title: "Web / UI", description: "Лендинги, сайты-портфолио и концепции интерфейсов.", enabled: true },
      { title: "Печатный дизайн", description: "Постеры, упаковка и печатные материалы бренда.", enabled: true }
    ],
    contacts: { telegram: "", email: "", phone: "", behance: "", linkedin: "", formEndpoint: "" },
    settings: {
      siteTitle: "Сфера портфолио",
      description: "Креативное портфолио с интерактивной сферой и дизайн-кейсами.",
      favicon: "",
      faviconName: "",
      faviconUrl: "",
      language: "ru",
      analytics: "",
      sphere: { size: 0.4, elementScale: 0.4, fisheye: 0.15, rotationX: 0.14, rotationY: -0.09 }
    }
  };

  let content = clone(defaultContent);
  let session = null;

  const tabs = Array.from(document.querySelectorAll("[data-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-panel]"));
  const form = document.getElementById("adminForm");
  const sectionKicker = document.getElementById("sectionKicker");
  const sectionTitle = document.getElementById("sectionTitle");
  const saveButton = document.getElementById("saveButton");
  const resetButton = document.getElementById("resetButton");
  const saveStatus = document.getElementById("saveStatus");
  const projectsList = document.getElementById("projectsList");
  const addProjectButton = document.getElementById("addProjectButton");
  const servicesList = document.getElementById("servicesList");

  const sectionLabels = {
    profile: ["Профиль / Главный блок", "Главный блок"],
    cv: ["Резюме", "Резюме"],
    portfolio: ["Портфолио / Кейсы", "Кейсы"],
    services: ["Услуги", "Услуги"],
    contacts: ["Контакты", "Связь"],
    settings: ["Настройки / SEO", "SEO и настройки"]
  };

  const knownTextTranslations = new Map([
    ["Alexander", "Александр"],
    ["CV / ART DIRECTION / AI DESIGN", "РЕЗЮМЕ / АРТ-ДИРЕКШН / ИИ-ДИЗАЙН"],
    ["Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.", defaultContent.profile.description],
    ["Portfolio systems, AI campaigns, social content packs, landing visuals and case studies.", defaultContent.cv.experience],
    ["Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea and web layout basics.", defaultContent.cv.skills],
    ["Branding", "Брендинг"], ["SMM design", "SMM-дизайн"], ["Presentations", "Презентации"], ["Print", "Печатный дизайн"],
    ["Visual identity, key visuals, guidelines.", "Айдентика, ключевые визуалы и гайдлайны."],
    ["Social media layouts, campaign packs, content systems.", "Макеты для социальных сетей, кампании и контент-системы."],
    ["Pitch decks, portfolio decks, case packaging.", "Питч-деки, портфолио и оформление кейсов."],
    ["Landing pages, portfolio sites, interface concepts.", "Лендинги, сайты-портфолио и концепции интерфейсов."],
    ["Posters, packaging layouts, printed brand materials.", "Постеры, упаковка и печатные материалы бренда."],
    ["Portfolio Sphere", "Сфера портфолио"],
    ["Creative portfolio with interactive sphere gallery and design cases.", "Креативное портфолио с интерактивной сферой и дизайн-кейсами."]
  ]);

  function localizeKnownText(value) {
    return knownTextTranslations.get(value) || value;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeContent(base, next) {
    const result = clone(base);
    if (!next || typeof next !== "object") return result;
    Object.assign(result.profile, next.profile || {});
    Object.assign(result.profile.socials, next.profile?.socials || {});
    Object.assign(result.cv, next.cv || {});
    result.portfolio.projects = Array.isArray(next.portfolio?.projects) ? next.portfolio.projects : result.portfolio.projects;
    result.services = Array.isArray(next.services) ? next.services : result.services;
    Object.assign(result.contacts, next.contacts || {});
    Object.assign(result.settings, next.settings || {});
    Object.assign(result.settings.sphere, next.settings?.sphere || {});
    return result;
  }

  function decodeSettingsPayload(value) {
    const fallback = { analytics: String(value || ""), sphere: clone(defaultContent.settings.sphere) };
    try {
      const parsed = JSON.parse(value || "null");
      if (parsed?.portfolioSphere !== 1) return fallback;
      return {
        analytics: typeof parsed.analytics === "string" ? parsed.analytics : "",
        sphere: { ...fallback.sphere, ...(parsed.sphere || {}) }
      };
    } catch (error) {
      return fallback;
    }
  }

  function encodeSettingsPayload() {
    return JSON.stringify({
      portfolioSphere: 1,
      analytics: content.settings.analytics || "",
      sphere: content.settings.sphere || defaultContent.settings.sphere
    });
  }

  function loadLocalContent() {
    try {
      return mergeContent(defaultContent, JSON.parse(localStorage.getItem(STORAGE_CONTENT) || "null"));
    } catch (error) {
      return clone(defaultContent);
    }
  }

  async function loadContent() {
    const supabaseContent = await loadSupabaseContent();
    if (supabaseContent) return mergeContent(defaultContent, supabaseContent);
    try {
      const stored = await window.PortfolioStorage.get(STORAGE_CONTENT);
      return mergeContent(defaultContent, stored || loadLocalContent());
    } catch (error) {
      return loadLocalContent();
    }
  }

  async function loadSupabaseContent() {
    if (!supabaseClient) return null;
    try {
      const [
        { data: profile },
        { data: cvRows },
        { data: projects },
        { data: images },
        { data: services },
        { data: contacts },
        { data: settings }
      ] = await Promise.all([
        supabaseClient.from("profile").select("*").limit(1).maybeSingle(),
        supabaseClient.from("cv_sections").select("*").order("sort_order", { ascending: true }),
        supabaseClient.from("projects").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
        supabaseClient.from("project_images").select("*").order("sort_order", { ascending: true }),
        supabaseClient.from("services").select("*").order("sort_order", { ascending: true }),
        supabaseClient.from("contacts").select("*").limit(1).maybeSingle(),
        supabaseClient.from("site_settings").select("*").limit(1).maybeSingle()
      ]);

      const imageMap = new Map();
      (images || []).forEach((image) => {
        if (!imageMap.has(image.project_id)) imageMap.set(image.project_id, []);
        imageMap.get(image.project_id).push({ src: image.image_url, title: image.title || "" });
      });

      const cvByPosition = new Map((cvRows || []).map((row) => [row.position, row]));
      const firstCv = cvRows?.[0];
      const packedSettings = decodeSettingsPayload(settings?.analytics);

      return {
        profile: {
          name: localizeKnownText(profile?.name || defaultContent.profile.name),
          role: localizeKnownText(profile?.role || defaultContent.profile.role),
          photoUrl: profile?.photo_url || "",
          description: localizeKnownText(profile?.short_description || defaultContent.profile.description),
          socials: profile?.socials || {}
        },
        cv: {
          experience: localizeKnownText(cvByPosition.get("experience")?.description || firstCv?.description || defaultContent.cv.experience),
          education: localizeKnownText(cvByPosition.get("education")?.description || ""),
          skills: localizeKnownText(cvByPosition.get("skills")?.description || defaultContent.cv.skills),
          certificates: localizeKnownText(cvByPosition.get("certificates")?.description || "")
        },
        portfolio: {
          projects: (projects || []).map((project) => ({
            id: project.id,
            title: project.title || "Без названия",
            category: project.category || "",
            status: project.status || "published",
            cover: "",
            coverName: "",
            coverUrl: project.cover_url || "",
            description: project.description || "",
            tools: project.tools || "",
            timeline: project.timeline || "",
            scope: project.scope || "",
            result: project.result || "",
            gallery: imageMap.get(project.id) || [],
            galleryUrls: ""
          }))
        },
        services: Array.isArray(services) && services.length
          ? services.map((service) => ({ title: localizeKnownText(service.title || ""), description: localizeKnownText(service.description || ""), enabled: true }))
          : defaultContent.services,
        contacts: contacts ? {
          telegram: contacts.telegram || "",
          email: contacts.email || "",
          phone: contacts.phone || "",
          behance: contacts.behance || "",
          linkedin: contacts.linkedin || "",
          formEndpoint: ""
        } : defaultContent.contacts,
        settings: settings ? {
          siteTitle: localizeKnownText(settings.site_title || defaultContent.settings.siteTitle),
          description: localizeKnownText(settings.meta_description || defaultContent.settings.description),
          faviconUrl: settings.favicon_url || "",
          language: settings.language || "ru",
          analytics: packedSettings.analytics,
          sphere: packedSettings.sphere
        } : defaultContent.settings
      };
    } catch (error) {
      setStatus(`Не удалось загрузить данные Supabase: ${error.message}`);
      return null;
    }
  }

  function getPath(path) {
    return path.split(".").reduce((value, key) => value && value[key], content);
  }

  function setPath(path, value) {
    const keys = path.split(".");
    let target = content;
    keys.slice(0, -1).forEach((key) => {
      if (!target[key]) target[key] = {};
      target = target[key];
    });
    target[keys[keys.length - 1]] = value;
  }

  function bindInputs() {
    Array.from(form.elements).forEach((field) => {
      if (!field.name) return;
      const value = getPath(field.name);
      field.value = value ?? "";
    });
    document.getElementById("profilePhotoName").textContent = content.profile.photo || content.profile.photoUrl ? "Изображение выбрано" : "Файл не выбран";
    document.getElementById("cvPdfName").textContent = content.cv.pdfName || content.cv.pdfUrl || "Файл не выбран";
    document.getElementById("faviconName").textContent = content.settings.faviconName || content.settings.faviconUrl || "Файл не выбран";
  }

  function collectInputs() {
    Array.from(form.elements).forEach((field) => {
      if (!field.name) return;
      setPath(field.name, field.value.trim());
    });
  }

  function switchTab(tabName) {
    tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === tabName));
    panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === tabName));
    const [kicker, title] = sectionLabels[tabName] || sectionLabels.profile;
    sectionKicker.textContent = kicker;
    sectionTitle.textContent = title;
  }

  function readFile(input, callback) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result, file.name, file);
    reader.readAsDataURL(file);
  }

  function readFiles(input) {
    const files = Array.from(input.files || []);
    return Promise.all(files.map((file) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ src: reader.result, title: file.name, file });
      reader.readAsDataURL(file);
    })));
  }

  function createProject() {
    return {
      id: `project-${Date.now()}`,
      title: "Новый кейс",
      category: "Дизайн",
      status: "published",
      cover: "",
      coverName: "",
      coverUrl: "",
      description: "",
      gallery: [],
      galleryUrls: "",
      tools: "",
      timeline: "",
      scope: "",
      result: ""
    };
  }

  function projectCover(project) {
    return project.cover || project.coverUrl || "";
  }

  function projectGalleryUrls(project) {
    return String(project.galleryUrls || "")
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean)
      .map((src, index) => ({ src, title: `${project.title || "Проект"} URL ${index + 1}` }));
  }

  function renderProjects() {
    projectsList.innerHTML = "";
    content.portfolio.projects.forEach((project, index) => {
      const card = document.createElement("article");
      card.className = "project-card";
      const cover = projectCover(project);
      const galleryUrls = projectGalleryUrls(project);
      const galleryCount = project.gallery.length + galleryUrls.length;
      card.innerHTML = `
        <div class="project-head">
          <div class="project-meta">
            <span>Проект ${String(index + 1).padStart(2, "0")}</span>
            <strong>${escapeHtml(project.title || "Без названия")}</strong>
          </div>
          <button class="project-remove" type="button">УДАЛИТЬ</button>
        </div>
        <div class="project-preview">
          ${cover ? `<img src="${cover}" alt="">` : `<span>Нет обложки</span>`}
          <div>
            <b>${project.status === "published" ? "Опубликован" : "Скрыт"}</b>
            <small>Изображений в галерее: ${galleryCount}</small>
          </div>
        </div>
        <div class="project-grid">
          <label><span>Название</span><input data-project-field="title" type="text"></label>
          <label><span>Категория</span><input data-project-field="category" type="text"></label>
          <label><span>Статус</span><select data-project-field="status"><option value="published">Опубликован</option><option value="hidden">Скрыт</option></select></label>
          <label><span>Обложка</span><input data-project-file="cover" type="file" accept="image/*"><small>${project.coverName || project.coverUrl || "Обложка не выбрана"}</small></label>
          <label><span>Обложка URL</span><input data-project-field="coverUrl" type="text" placeholder="https://..."></label>
          <label class="project-gallery"><span>Галерея</span><input data-project-file="gallery" type="file" accept="image/*" multiple><small>${project.gallery.length ? `Выбрано изображений: ${project.gallery.length}` : "Изображения не выбраны"}</small></label>
          <label class="project-gallery"><span>Галерея URL</span><textarea data-project-field="galleryUrls" rows="4" placeholder="Одна ссылка на строку"></textarea></label>
          <label class="project-gallery"><span>Описание</span><textarea data-project-field="description" rows="4"></textarea></label>
          <label><span>Инструменты</span><input data-project-field="tools" type="text"></label>
          <label><span>Срок</span><input data-project-field="timeline" type="text"></label>
          <label class="project-gallery"><span>Задачи</span><textarea data-project-field="scope" rows="3"></textarea></label>
          <label class="project-gallery"><span>Результат</span><textarea data-project-field="result" rows="3"></textarea></label>
        </div>
      `;
      ["title", "category", "status", "coverUrl", "galleryUrls", "description", "tools", "timeline", "scope", "result"].forEach((fieldName) => {
        const field = card.querySelector(`[data-project-field="${fieldName}"]`);
        field.value = project[fieldName] || "";
        field.addEventListener("input", () => {
          project[fieldName] = field.value;
          if (fieldName === "title") card.querySelector(".project-meta strong").textContent = project.title || "Без названия";
        });
        field.addEventListener("change", () => {
          project[fieldName] = field.value;
          if (["coverUrl", "galleryUrls", "status"].includes(fieldName)) renderProjects();
        });
      });
      card.querySelector('[data-project-file="cover"]').addEventListener("change", (event) => {
        readFile(event.currentTarget, (data, name, file) => {
          project.cover = data;
          project.coverFile = file;
          project.coverName = name;
          renderProjects();
        });
      });
      card.querySelector('[data-project-file="gallery"]').addEventListener("change", (event) => {
        readFiles(event.currentTarget).then((images) => {
          project.gallery = images;
          renderProjects();
        });
      });
      card.querySelector(".project-remove").addEventListener("click", () => {
        content.portfolio.projects.splice(index, 1);
        renderProjects();
      });
      projectsList.appendChild(card);
    });
  }

  function renderServices() {
    servicesList.innerHTML = "";
    content.services.forEach((service) => {
      const card = document.createElement("article");
      card.className = "service-card";
      card.innerHTML = `
        <div class="service-head"><strong>${escapeHtml(service.title)}</strong></div>
        <textarea rows="3"></textarea>
        <label><span>Активна</span><input type="checkbox"></label>
      `;
      const text = card.querySelector("textarea");
      const checkbox = card.querySelector('input[type="checkbox"]');
      text.value = service.description || "";
      checkbox.checked = !!service.enabled;
      text.addEventListener("input", () => {
        service.description = text.value;
      });
      checkbox.addEventListener("change", () => {
        service.enabled = checkbox.checked;
      });
      servicesList.appendChild(card);
    });
  }

  async function uploadDataUrl(path, dataUrl) {
    if (!supabaseClient || !dataUrl || !dataUrl.startsWith("data:")) return dataUrl || "";
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const { error } = await supabaseClient.storage.from(bucketName).upload(path, blob, {
      cacheControl: "3600",
      upsert: true,
      contentType: blob.type || "application/octet-stream"
    });
    if (error) throw error;
    return supabaseClient.storage.from(bucketName).getPublicUrl(path).data.publicUrl;
  }

  function storagePath(folder, fileName) {
    const safe = String(fileName || "file").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
    return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safe || "file"}`;
  }

  async function saveProjects() {
    const { data: existingProjects, error: existingError } = await supabaseClient
      .from("projects")
      .select("id,status");
    if (existingError) throw existingError;

    const existingById = new Map((existingProjects || []).map((project) => [project.id, project]));
    const retainedIds = [];

    for (const [index, project] of content.portfolio.projects.entries()) {
      const coverUrl = project.cover?.startsWith("data:")
        ? await uploadDataUrl(storagePath("covers", project.coverName || `${project.title}-cover`), project.cover)
        : project.coverUrl || project.cover || "";
      const desiredStatus = project.status || "published";
      const existingProject = existingById.get(project.id);
      const payload = {
        title: project.title || "Без названия",
        subtitle: "",
        description: project.description || "",
        category: project.category || "",
        status: existingProject?.status || "hidden",
        cover_url: coverUrl,
        tools: project.tools || "",
        timeline: project.timeline || "",
        scope: project.scope || "",
        result: project.result || "",
        sort_order: index,
        updated_at: new Date().toISOString()
      };

      const projectQuery = existingProject
        ? supabaseClient.from("projects").update(payload).eq("id", project.id)
        : supabaseClient.from("projects").insert(payload);
      const { data: savedProject, error: projectError } = await projectQuery.select("id").single();
      if (projectError) throw projectError;

      const projectId = savedProject.id;
      retainedIds.push(projectId);
      const { data: previousImages, error: previousImagesError } = await supabaseClient
        .from("project_images")
        .select("id")
        .eq("project_id", projectId);
      if (previousImagesError) throw previousImagesError;

      const rows = [];
      for (const [galleryIndex, image] of project.gallery.entries()) {
        const imageUrl = image.src?.startsWith("data:")
          ? await uploadDataUrl(storagePath("gallery", image.title || `${project.title}-${galleryIndex}`), image.src)
          : image.src || "";
        if (imageUrl) rows.push({ project_id: projectId, image_url: imageUrl, title: image.title || project.title, sort_order: galleryIndex });
      }
      projectGalleryUrls(project).forEach((image, urlIndex) => {
        rows.push({ project_id: projectId, image_url: image.src, title: image.title || project.title, sort_order: rows.length + urlIndex });
      });

      if (rows.length) {
        const { error: imageError } = await supabaseClient.from("project_images").insert(rows);
        if (imageError) throw imageError;
      }
      const previousImageIds = (previousImages || []).map((image) => image.id);
      if (previousImageIds.length) {
        const { error: deleteImagesError } = await supabaseClient.from("project_images").delete().in("id", previousImageIds);
        if (deleteImagesError) throw deleteImagesError;
      }

      const { error: publishError } = await supabaseClient
        .from("projects")
        .update({ status: desiredStatus, updated_at: new Date().toISOString() })
        .eq("id", projectId);
      if (publishError) throw publishError;

      project.id = projectId;
      project.cover = "";
      project.coverUrl = coverUrl;
    }

    const removedIds = (existingProjects || [])
      .map((project) => project.id)
      .filter((projectId) => !retainedIds.includes(projectId));
    if (removedIds.length) {
      const { error: removeImagesError } = await supabaseClient.from("project_images").delete().in("project_id", removedIds);
      if (removeImagesError) throw removeImagesError;
      const { error: removeProjectsError } = await supabaseClient.from("projects").delete().in("id", removedIds);
      if (removeProjectsError) throw removeProjectsError;
    }
  }

  async function saveSupabaseContent() {
    if (!supabaseClient || !session) return;

    const photoUrl = content.profile.photo?.startsWith("data:")
      ? await uploadDataUrl(storagePath("profile", "profile-photo"), content.profile.photo)
      : content.profile.photoUrl || content.profile.photo || "";
    const faviconUrl = content.settings.favicon?.startsWith("data:")
      ? await uploadDataUrl(storagePath("settings", content.settings.faviconName || "favicon"), content.settings.favicon)
      : content.settings.faviconUrl || content.settings.favicon || "";

    await upsertSingle("profile", {
      name: content.profile.name,
      role: content.profile.role,
      photo_url: photoUrl,
      short_description: content.profile.description,
      socials: content.profile.socials || {},
      updated_at: new Date().toISOString()
    });

    await replaceRows("cv_sections", [
      { position: "experience", title: "Опыт", description: content.cv.experience, sort_order: 1 },
      { position: "education", title: "Образование", description: content.cv.education, sort_order: 2 },
      { position: "skills", title: "Навыки", description: content.cv.skills, sort_order: 3 },
      { position: "certificates", title: "Сертификаты", description: content.cv.certificates, sort_order: 4 }
    ]);

    await replaceRows("services", content.services
      .filter((service) => service.enabled)
      .map((service, index) => ({
        title: service.title,
        description: service.description,
        sort_order: index,
        updated_at: new Date().toISOString()
      })));

    await upsertSingle("contacts", {
      telegram: content.contacts.telegram,
      email: content.contacts.email,
      phone: content.contacts.phone,
      behance: content.contacts.behance,
      linkedin: content.contacts.linkedin,
      updated_at: new Date().toISOString()
    });

    await upsertSingle("site_settings", {
      site_title: content.settings.siteTitle,
      meta_description: content.settings.description,
      favicon_url: faviconUrl,
      language: content.settings.language,
      analytics: encodeSettingsPayload(),
      updated_at: new Date().toISOString()
    });

    await saveProjects();
  }

  async function upsertSingle(table, payload) {
    const { data: existing } = await supabaseClient.from(table).select("id").limit(1).maybeSingle();
    const query = existing?.id
      ? supabaseClient.from(table).update(payload).eq("id", existing.id)
      : supabaseClient.from(table).insert(payload);
    const { error } = await query;
    if (error) throw error;
  }

  async function replaceRows(table, rows) {
    const { error: deleteError } = await supabaseClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (deleteError) throw deleteError;
    if (!rows.length) return;
    const { error } = await supabaseClient.from(table).insert(rows);
    if (error) throw error;
  }

  async function syncSphereData() {
    const services = content.services.filter((service) => service.enabled).map((service) => service.title).join(", ");
    const contact = [content.contacts.telegram, content.contacts.email, content.contacts.phone].filter(Boolean).join(" / ");
    const cvSummary = [content.cv.experience, content.cv.skills].filter(Boolean).join(" ");
    const profileSummary = content.profile.description || defaultContent.profile.description;
    const nodes = [
      { look: "center", yaw: 0, pitch: 0, eyebrow: content.profile.role, title: content.profile.name, body: profileSummary, type: "hero" },
      { look: "top", yaw: 0, pitch: 34, title: "Профиль", body: profileSummary },
      { look: "bottom", yaw: 0, pitch: -34, title: "Резюме", body: cvSummary || defaultContent.cv.experience },
      { look: "left", yaw: -42, pitch: 0, title: "Услуги", body: services || defaultContent.services.map((service) => service.title).join(", ") },
      { look: "right", yaw: 42, pitch: 0, title: "Контакты", body: contact || "Открыт к проектам по айдентике, ИИ-арт-дирекшну, сайтам-портфолио и оформлению дизайн-кейсов." }
    ];
    await window.PortfolioStorage.set(STORAGE_CV, nodes);

    if (supabaseClient && session) {
      await window.PortfolioStorage.remove(STORAGE_ASSETS);
      localStorage.removeItem(STORAGE_ASSETS);
      return;
    }

    const media = [];
    content.portfolio.projects
      .filter((project) => project.status === "published")
      .forEach((project) => {
        const cover = projectCover(project);
        if (cover) media.push({ src: cover, title: project.title });
        project.gallery.forEach((image) => media.push({ src: image.src, title: project.title || image.title }));
        projectGalleryUrls(project).forEach((image) => media.push({ src: image.src, title: project.title || image.title }));
      });
    if (media.length) {
      await window.PortfolioStorage.set(STORAGE_ASSETS, media);
    } else {
      await window.PortfolioStorage.remove(STORAGE_ASSETS);
      localStorage.removeItem(STORAGE_ASSETS);
    }
  }

  function setStatus(message) {
    saveStatus.textContent = message;
  }

  async function saveLocalCopy() {
    await window.PortfolioStorage.set(STORAGE_CONTENT, content);
    try {
      localStorage.setItem(STORAGE_CONTENT, JSON.stringify({
        ...content,
        profile: { ...content.profile, photo: "" },
        cv: { ...content.cv, pdf: "" },
        settings: { ...content.settings, favicon: "" },
        portfolio: {
          projects: content.portfolio.projects.map((project) => ({
            ...project,
            cover: "",
            coverFile: null,
            gallery: project.gallery.map((image) => ({ ...image, src: image.src?.startsWith("data:") ? "" : image.src, file: null }))
          }))
        }
      }));
    } catch (error) {
      localStorage.removeItem(STORAGE_CONTENT);
    }
  }

  async function saveContent() {
    collectInputs();
    setStatus("Сохранение...");
    saveButton.disabled = true;
    try {
      await saveSupabaseContent();
      await saveLocalCopy();
      await syncSphereData();
      saveButton.textContent = "СОХРАНЕНО";
      setStatus(supabaseClient && session ? "Сохранено в Supabase" : "Сохранено локально");
      window.setTimeout(() => {
        saveButton.textContent = "СОХРАНИТЬ";
      }, 900);
    } catch (error) {
      setStatus(`Ошибка сохранения: ${error.message}`);
      alert(`Ошибка сохранения: ${error.message}`);
    } finally {
      saveButton.disabled = false;
    }
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[char]));
  }

  async function setupAuth() {
    if (!supabaseClient) {
      setStatus("Не найдена конфигурация Supabase");
      return;
    }
    const { data } = await supabaseClient.auth.getSession();
    session = data.session;
    renderAuthPanel();
  }

  function renderAuthPanel() {
    let panel = document.getElementById("authPanel");
    if (!panel) {
      panel = document.createElement("section");
      panel.id = "authPanel";
      panel.className = "auth-panel";
      document.body.appendChild(panel);
    }
    if (session) {
      panel.innerHTML = `
        <span>${escapeHtml(session.user.email || "Выполнен вход")}</span>
        <button id="logoutButton" type="button">ВЫЙТИ</button>
      `;
      panel.querySelector("#logoutButton").addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        session = null;
        saveButton.disabled = true;
        renderAuthPanel();
        setStatus("Вы вышли из аккаунта");
      });
      saveButton.disabled = false;
      setStatus("Готово");
      return;
    }
    panel.innerHTML = `
      <form id="authForm">
        <strong>ВХОД В SUPABASE</strong>
        <input name="email" type="email" placeholder="Эл. почта" required>
        <input name="password" type="password" placeholder="Пароль" required>
        <button type="submit">ВОЙТИ</button>
        <small>Войдите под пользователем, созданным в Supabase Authentication.</small>
      </form>
    `;
    saveButton.disabled = true;
    panel.querySelector("#authForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setStatus("Вход...");
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: formData.get("email"),
        password: formData.get("password")
      });
      if (error) {
        setStatus(`Ошибка входа: ${error.message}`);
        alert(error.message);
        return;
      }
      session = data.session;
      renderAuthPanel();
    });
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
  addProjectButton.addEventListener("click", () => {
    content.portfolio.projects.push(createProject());
    renderProjects();
  });
  resetButton.addEventListener("click", () => {
    Promise.all([
      window.PortfolioStorage.remove(STORAGE_CONTENT),
      window.PortfolioStorage.remove(STORAGE_CV),
      window.PortfolioStorage.remove(STORAGE_ASSETS)
    ]).finally(() => {
      localStorage.removeItem(STORAGE_CONTENT);
      localStorage.removeItem(STORAGE_CV);
      localStorage.removeItem(STORAGE_ASSETS);
      content = clone(defaultContent);
      bindInputs();
      renderProjects();
      renderServices();
      resetButton.textContent = "СБРОШЕНО";
      setStatus("Локальные данные сброшены");
      window.setTimeout(() => {
        resetButton.textContent = "СБРОСИТЬ";
      }, 900);
    });
  });
  saveButton.addEventListener("click", saveContent);

  document.getElementById("profilePhotoInput").addEventListener("change", (event) => {
    readFile(event.currentTarget, (data, name) => {
      content.profile.photo = data;
      content.profile.photoUrl = "";
      document.querySelector('[name="profile.photo"]').value = data;
      document.getElementById("profilePhotoName").textContent = name;
    });
  });
  document.getElementById("cvPdfInput").addEventListener("change", (event) => {
    readFile(event.currentTarget, (data, name) => {
      content.cv.pdf = data;
      content.cv.pdfName = name;
      document.querySelector('[name="cv.pdf"]').value = data;
      document.getElementById("cvPdfName").textContent = name;
    });
  });
  document.getElementById("faviconInput").addEventListener("change", (event) => {
    readFile(event.currentTarget, (data, name) => {
      content.settings.favicon = data;
      content.settings.faviconUrl = "";
      content.settings.faviconName = name;
      document.querySelector('[name="settings.favicon"]').value = data;
      document.getElementById("faviconName").textContent = name;
    });
  });

  setupAuth();
  loadContent().then((storedContent) => {
    content = storedContent;
    bindInputs();
    renderProjects();
    renderServices();
    if (!supabaseClient) setStatus("Локальный режим готов");
  });
})();

