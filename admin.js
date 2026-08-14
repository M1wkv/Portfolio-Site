(() => {
  const STORAGE_CONTENT = "portfolioSphere.adminContent";
  const STORAGE_CV = "portfolioSphere.cvNodes";
  const STORAGE_ASSETS = "portfolioSphere.assets";
  const supabaseClient = window.createPortfolioSupabase ? window.createPortfolioSupabase() : null;
  const bucketName = window.PORTFOLIO_SUPABASE?.bucket || "portfolio";
  let saveStage = "";

  const defaultContent = {
    profile: {
      name: "Alexander",
      role: "CV / ART DIRECTION / AI DESIGN",
      photo: "",
      photoUrl: "",
      description: "Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.",
      socials: { telegram: "", behance: "", linkedin: "", instagram: "" }
    },
    cv: {
      intro: "Коммуникационный дизайнер, специализируюсь на создании статичных визуальных материалов и разработке брендинга.",
      skills: "Коммуникационный дизайн, Визуальные концепции, Key visual, Брендинг, Рекламные материалы, Полиграфия, Digital-креативы, Дизайн презентаций, Ретушь, Типографика, Верстка, AI-графика",
      tools: "Figma, Photoshop, 3DS Max, Cinema 4D, Illustrator",
      about: "UX/UI дизайнер, создаю цифровые продукты, которые решают задачи бизнеса. Более 4 лет проектирую удобные интерфейсы для веб-сайтов и мобильных приложений.",
      experienceItems: "Communication Designer | Freelance | 2012 - нояб. 2018\nSenior Graphic Designer | Unique Present Media Holding | авг. 2018 - нояб. 2020\nCommunication Designer | Eight Media Maker | нояб. 2020 - нояб. 2022\nCommunication Designer | Tenge Bank | май 2024 - сент. 2024\nHead of Design | Salad Agency | нояб. 2020 - наст. время",
      pdf: "",
      pdfName: "",
      pdfUrl: ""
    },
    portfolio: { projects: [] },
    services: [
      { title: "Branding", description: "Visual identity, key visuals, guidelines.", enabled: true },
      { title: "SMM design", description: "Social media layouts, campaign packs, content systems.", enabled: true },
      { title: "Presentations", description: "Pitch decks, portfolio decks, case packaging.", enabled: true },
      { title: "Web / UI", description: "Landing pages, portfolio sites, interface concepts.", enabled: true },
      { title: "Print", description: "Posters, packaging layouts, printed brand materials.", enabled: true }
    ],
    contacts: { telegram: "", email: "", phone: "", behance: "", linkedin: "", formEndpoint: "" },
    settings: {
      siteTitle: "Portfolio Sphere",
      description: "Creative portfolio with interactive sphere gallery and design cases.",
      favicon: "",
      faviconName: "",
      faviconUrl: "",
      language: "ru",
      analytics: "",
      sphere: {
        size: 0.6,
        elementScale: 0.6,
        itemCount: 50,
        fisheye: 0.15,
        rotationX: 0.14,
        rotationY: -0.09,
        projectScale: 0.5,
        projectItemCount: 20,
        projectGap: 0.5,
        projectWidth: 0.75,
        projectLength: 1.25,
        tabletSize: 0.65,
        tabletElementScale: 0.42,
        tabletItemCount: 50,
        tabletFisheye: 0.15,
        tabletRotationX: 0.14,
        tabletRotationY: -0.09,
        mobileSize: 0.7,
        mobileElementScale: 0.24,
        mobileItemCount: 40,
        mobileFisheye: 0.15,
        mobileRotationX: 0.14,
        mobileRotationY: -0.09,
        tabletProjectScale: 0.44,
        tabletProjectItemCount: 16,
        tabletProjectGap: 0.5,
        tabletProjectWidth: 0.7,
        tabletProjectLength: 1.08,
        mobileProjectScale: 0.38,
        mobileProjectItemCount: 12,
        mobileProjectGap: 0.5,
        mobileProjectWidth: 0.66,
        mobileProjectLength: 0.9,
        waterTransparency: 50,
        waterDarkening: 50,
        waterFrost: 5
      }
    }
  };

  let content = clone(defaultContent);
  let session = null;
  let activeProjectId = null;
  const pendingProjectRemovalIds = new Set();

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
  const projectsBackButton = document.getElementById("projectsBackButton");
  const portfolioModeText = document.getElementById("portfolioModeText");
  const sphereSettingInputs = Array.from(form.querySelectorAll('input[type="range"][name^="settings.sphere."]'));
  const analyticsContent = document.getElementById("analyticsContent");
  const analyticsState = document.getElementById("analyticsState");
  const analyticsRefresh = document.getElementById("analyticsRefresh");
  let analyticsLoaded = false;

  const sectionLabels = {
    cv: ["CV / Резюме", "Резюме"],
    portfolio: ["Portfolio / Кейсы", "Кейсы"],
    settings: ["Settings / Настройки сайта", "Настройки сайта"]
  };

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
      if (!parsed?.portfolioSphere) return fallback;
      const sphere = { ...fallback.sphere, ...(parsed.sphere || {}) };
      if (parsed.portfolioSphere < 2) {
        if (Number(sphere.size) === 0.4) sphere.size = 0.6;
        if (Number(sphere.elementScale) === 0.4) sphere.elementScale = 0.6;
      }
      return {
        analytics: typeof parsed.analytics === "string" ? parsed.analytics : "",
        sphere
      };
    } catch (error) {
      return fallback;
    }
  }

  function encodeSettingsPayload() {
    return JSON.stringify({
      portfolioSphere: 3,
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
      const responses = await Promise.all([
        supabaseClient.from("profile").select("*").limit(1).maybeSingle(),
        supabaseClient.from("cv_sections").select("*").order("sort_order", { ascending: true }),
        supabaseClient.from("projects").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: false }),
        supabaseClient.from("project_images").select("*").order("sort_order", { ascending: true }),
        supabaseClient.from("services").select("*").order("sort_order", { ascending: true }),
        supabaseClient.from("contacts").select("*").limit(1).maybeSingle(),
        supabaseClient.from("site_settings").select("*").limit(1).maybeSingle()
      ]);
      const failedResponse = responses.find((response) => response.error);
      if (failedResponse) throw failedResponse.error;

      const [
        { data: profile },
        { data: cvRows },
        { data: projects },
        { data: images },
        { data: services },
        { data: contacts },
        { data: settings }
      ] = responses;

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
          name: profile?.name || defaultContent.profile.name,
          role: profile?.role || defaultContent.profile.role,
          photoUrl: profile?.photo_url || "",
          description: profile?.short_description || defaultContent.profile.description,
          socials: profile?.socials || {}
        },
        cv: {
          intro: cvByPosition.get("intro")?.description || defaultContent.cv.intro,
          skills: cvByPosition.get("skills")?.description || defaultContent.cv.skills,
          tools: cvByPosition.get("tools")?.description || defaultContent.cv.tools,
          about: cvByPosition.get("about")?.description || defaultContent.cv.about,
          experienceItems: cvByPosition.get("experience_items")?.description || defaultContent.cv.experienceItems,
          pdf: "",
          pdfName: cvByPosition.get("pdf")?.title || "",
          pdfUrl: cvByPosition.get("pdf")?.description || ""
        },
        portfolio: {
          projects: (projects || []).map((project) => ({
            id: project.id,
            title: project.title || "Untitled",
            category: project.category || "",
            status: project.status || "published",
            cover: "",
            coverName: "",
            coverUrl: project.cover_url || "",
            coverGallerySrc: (imageMap.get(project.id) || []).some((image) => image.src === project.cover_url)
              ? project.cover_url
              : "",
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
          ? services.map((service) => ({ title: service.title || "", description: service.description || "", enabled: true }))
          : defaultContent.services,
        contacts: contacts ? {
          telegram: contacts.telegram || "",
          email: contacts.email || "",
          phone: contacts.phone || "",
          behance: contacts.behance || "",
          linkedin: contacts.linkedin || "",
          formEndpoint: cvByPosition.get("contact_form")?.description || ""
        } : defaultContent.contacts,
        settings: settings ? {
          siteTitle: settings.site_title || defaultContent.settings.siteTitle,
          description: settings.meta_description || defaultContent.settings.description,
          faviconUrl: settings.favicon_url || "",
          language: settings.language || "ru",
          analytics: packedSettings.analytics,
          sphere: packedSettings.sphere
        } : defaultContent.settings
      };
    } catch (error) {
      setStatus(`Supabase load skipped: ${error.message}`);
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
    document.getElementById("profilePhotoName").textContent = content.profile.photo || content.profile.photoUrl ? "Image selected" : "No file selected";
    document.getElementById("cvPdfName").textContent = content.cv.pdfName || content.cv.pdfUrl || "No file selected";
    document.getElementById("faviconName").textContent = content.settings.faviconName || content.settings.faviconUrl || "No file selected";
    updateSphereSettingValues();
  }

  function updateSphereSettingValues() {
    sphereSettingInputs.forEach((input) => {
      const output = form.querySelector(`[data-sphere-value="${input.name}"]`);
      if (!output) return;
      const value = Number(input.value);
      if (/itemcount/i.test(input.name) || /(?:Transparency|Darkening|Frost)$/.test(input.name)) output.textContent = String(Math.round(value));
      else output.textContent = input.name === "settings.sphere.size" ? value.toFixed(1) : value.toFixed(2);
    });
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
    const [kicker, title] = sectionLabels[tabName] || sectionLabels.cv;
    sectionKicker.textContent = kicker;
    sectionTitle.textContent = title;
    if (tabName === "settings" && session && !analyticsLoaded) loadAnalytics();
  }

  function setAnalyticsText(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value ?? 0);
  }

  function renderAnalyticsList(id, rows, labelKey, valueKey, emptyText) {
    const target = document.getElementById(id);
    if (!target) return;
    if (!rows?.length) {
      target.innerHTML = `<p class="analytics-empty">${escapeHtml(emptyText)}</p>`;
      return;
    }
    const max = Math.max(...rows.map((row) => Number(row[valueKey]) || 0), 1);
    target.innerHTML = rows.map((row) => {
      const value = Number(row[valueKey]) || 0;
      return `<div class="analytics-list-row"><span>${escapeHtml(row[labelKey] || "-")}</span><i><b style="width:${Math.max(4, value / max * 100).toFixed(1)}%"></b></i><strong>${value}</strong></div>`;
    }).join("");
  }

  function renderAnalytics(data) {
    setAnalyticsText("analyticsToday", data.todayVisitors);
    setAnalyticsText("analyticsTodayViews", `${data.todayViews || 0} просмотров`);
    setAnalyticsText("analyticsWeek", data.visitors7);
    setAnalyticsText("analyticsWeekViews", `${data.views7 || 0} просмотров`);
    setAnalyticsText("analyticsMonth", data.visitors30);
    setAnalyticsText("analyticsMonthViews", `${data.views30 || 0} просмотров`);
    setAnalyticsText("analyticsProjectsCount", data.projectOpens30);
    setAnalyticsText("analyticsCvCount", data.cvOpens30);
    setAnalyticsText("analyticsContactCount", data.contactClicks30);
    const chart = document.getElementById("analyticsChart");
    const series = Array.isArray(data.series) ? data.series : [];
    const max = Math.max(...series.map((entry) => Number(entry.visitors) || 0), 1);
    if (chart) chart.innerHTML = series.map((entry) => {
      const height = Math.max(3, (Number(entry.visitors) || 0) / max * 100);
      const date = new Date(`${entry.day}T00:00:00`);
      const label = Number.isNaN(date.getTime()) ? entry.day : date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
      return `<i title="${escapeHtml(label)}: ${Number(entry.visitors) || 0}"><b style="height:${height.toFixed(1)}%"></b></i>`;
    }).join("");
    renderAnalyticsList("analyticsProjects", data.projects, "title", "opens", "Открытий проектов пока нет");
    renderAnalyticsList("analyticsSources", data.sources, "source", "visits", "Источники появятся после первых посещений");
    renderAnalyticsList("analyticsDevices", data.devices?.map((row) => ({ ...row, device: ({ mobile: "Мобильные", tablet: "Планшеты", desktop: "Компьютеры" })[row.device] || row.device })), "device", "visits", "Данных об устройствах пока нет");
  }

  async function loadAnalytics() {
    if (!supabaseClient || !session) return;
    analyticsRefresh.disabled = true;
    analyticsState.hidden = false;
    analyticsState.textContent = "Загрузка статистики...";
    try {
      const { data, error } = await supabaseClient.rpc("get_portfolio_analytics", { p_days: 30 });
      if (error) throw error;
      renderAnalytics(data || {});
      analyticsLoaded = true;
      analyticsState.hidden = true;
      analyticsContent.hidden = false;
    } catch (error) {
      analyticsState.textContent = `Не удалось загрузить статистику: ${error.message}`;
    } finally {
      analyticsRefresh.disabled = false;
    }
  }

  function readFile(input, callback) {
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => callback(reader.result, file.name, file);
    reader.readAsDataURL(file);
  }

  function dataUrlFromBlob(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Не удалось прочитать изображение"));
      reader.readAsDataURL(blob);
    });
  }

  async function optimizeImageFile(file, options = {}) {
    if (!file?.type?.startsWith("image/") || /image\/(gif|svg\+xml|avif|webp)/i.test(file.type)) {
      return { src: await dataUrlFromBlob(file), title: file.name, file, optimized: false };
    }
    const maxDimension = Math.max(800, Number(options.maxDimension) || 2400);
    const quality = Math.max(0.55, Math.min(0.92, Number(options.quality) || 0.82));
    let bitmap;
    try {
      bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d", { alpha: true });
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob) throw new Error("WebP недоступен");
      const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
      const optimizedFile = new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: file.lastModified });
      return {
        src: await dataUrlFromBlob(optimizedFile),
        title: optimizedFile.name,
        file: optimizedFile,
        optimized: true,
        originalSize: file.size,
        optimizedSize: optimizedFile.size
      };
    } catch (error) {
      return { src: await dataUrlFromBlob(file), title: file.name, file, optimized: false };
    } finally {
      bitmap?.close?.();
    }
  }

  async function readOptimizedImage(input, options = {}) {
    const file = input.files && input.files[0];
    if (!file) return null;
    return optimizeImageFile(file, options);
  }

  function readFiles(input) {
    const files = Array.from(input.files || []);
    return Promise.all(files.map((file) => optimizeImageFile(file, { maxDimension: 2400, quality: 0.82 })));
  }

  function createProject() {
    return {
      id: `project-${Date.now()}`,
      title: "New case",
      category: "",
      status: "published",
      cover: "",
      coverName: "",
      coverUrl: "",
      coverGallerySrc: "",
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
    return project.coverGallerySrc || project.cover || project.coverUrl || "";
  }

  function projectGalleryUrls(project) {
    return String(project.galleryUrls || "")
      .split(/\r?\n/)
      .map((url) => url.trim())
      .filter(Boolean)
      .map((src, index) => ({ src, title: `${project.title || "Project"} URL ${index + 1}` }));
  }

  function isPersistedProject(project) {
    return Boolean(project.id && !String(project.id).startsWith("project-"));
  }

  function renderProjectTiles() {
    projectsList.classList.remove("is-editor");
    projectsBackButton.hidden = true;
    addProjectButton.hidden = false;
    portfolioModeText.textContent = "Выберите кейс, чтобы открыть его настройки.";

    if (!content.portfolio.projects.length) {
      projectsList.innerHTML = '<div class="projects-empty">Кейсов пока нет. Добавьте первый проект.</div>';
      return;
    }

    content.portfolio.projects.forEach((project, index) => {
      const cover = projectCover(project);
      const galleryCount = project.gallery.length + projectGalleryUrls(project).length;
      const tile = document.createElement("button");
      tile.className = "project-tile";
      tile.type = "button";
      tile.setAttribute("aria-label", `Открыть кейс ${project.title || index + 1}`);
      tile.innerHTML = `
        <span class="project-tile-media">${cover ? `<img src="${escapeHtml(cover)}" alt="">` : ""}</span>
        <span class="project-tile-copy">
          <strong>${escapeHtml(project.title || "Без названия")}</strong>
          <span class="project-tile-meta">
            <span>${project.status === "published" ? "Опубликован" : "Скрыт"}</span>
            <span>${galleryCount} изображений</span>
          </span>
        </span>
      `;
      tile.addEventListener("click", () => {
        activeProjectId = project.id;
        renderProjects();
      });
      projectsList.appendChild(tile);
    });
  }

  function renderProjectEditor(project, index) {
    projectsList.classList.add("is-editor");
    projectsBackButton.hidden = false;
    addProjectButton.hidden = true;
    portfolioModeText.textContent = `Редактирование: ${project.title || "Без названия"}`;

    const card = document.createElement("article");
    card.className = "project-card";
    const cover = projectCover(project);
    const galleryUrls = projectGalleryUrls(project);
    const galleryCount = project.gallery.length + galleryUrls.length;
    const galleryMarkup = project.gallery.length
      ? project.gallery.map((image, galleryIndex) => {
          const isCover = cover === image.src;
          return `
          <figure class="project-gallery-item${isCover ? " is-cover" : ""}">
            <img src="${escapeHtml(image.src)}" alt="${escapeHtml(image.title || `Изображение ${galleryIndex + 1}`)}" loading="lazy">
            <button class="project-gallery-cover" type="button" data-gallery-cover="${galleryIndex}" aria-pressed="${isCover}" title="${isCover ? "Текущая обложка" : "Сделать обложкой"}">${isCover ? "ОБЛОЖКА" : "СДЕЛАТЬ ОБЛОЖКОЙ"}</button>
            <button class="project-gallery-remove" type="button" data-gallery-remove="${galleryIndex}" aria-label="Удалить изображение ${galleryIndex + 1}" title="Удалить изображение">×</button>
          </figure>
        `;
        }).join("")
      : '<p class="project-gallery-empty">В галерее пока нет изображений.</p>';
    card.innerHTML = `
      <div class="project-head">
        <div class="project-meta">
          <span>Кейс ${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(project.title || "Без названия")}</strong>
        </div>
        <button class="project-remove" type="button">УДАЛИТЬ</button>
      </div>
      <div class="project-preview">
        ${cover ? `<img src="${escapeHtml(cover)}" alt="">` : `<span>Нет обложки</span>`}
        <div>
          <b>${project.status === "published" ? "Опубликован" : "Скрыт"}</b>
          <small>${galleryCount} изображений в галерее</small>
        </div>
      </div>
      <div class="project-grid">
        <label><span>Название</span><input data-project-field="title" type="text"></label>
        <label><span>Статус</span><select data-project-field="status"><option value="published">Опубликован</option><option value="hidden">Скрыт</option></select></label>
        <label class="wide"><span>Галерея</span><input data-project-file="gallery" type="file" accept="image/*" multiple><small>${project.gallery.length ? `${project.gallery.length} изображений выбрано. Обложка выбирается ниже.` : "Загрузите изображения, затем выберите обложку ниже."}</small></label>
        <div class="project-gallery-manager">
          <div class="project-gallery-manager-head"><span>Изображения проекта / выбор обложки</span><b>${project.gallery.length}</b></div>
          <div class="project-gallery-grid">${galleryMarkup}</div>
        </div>
        <label class="project-gallery"><span>Описание</span><textarea data-project-field="description" rows="4"></textarea></label>
        <div class="project-details-grid">
          <label><span>Инструменты</span><textarea data-project-field="tools" rows="3"></textarea></label>
          <label><span>Срок и год</span><textarea data-project-field="timeline" rows="3" placeholder="Например: 3 недели | 2025"></textarea></label>
          <label><span>Задача</span><textarea data-project-field="scope" rows="3"></textarea></label>
          <label><span>Визуальная идея</span><textarea data-project-field="result" rows="3"></textarea></label>
          <label><span>Моя роль</span><textarea data-project-field="category" rows="3" placeholder="Через запятую или с новой строки"></textarea></label>
        </div>
      </div>
    `;
    ["title", "status", "description", "tools", "timeline", "scope", "result", "category"].forEach((fieldName) => {
      const field = card.querySelector(`[data-project-field="${fieldName}"]`);
      field.value = project[fieldName] || "";
      field.addEventListener("input", () => {
        project[fieldName] = field.value;
        if (fieldName === "title") {
          card.querySelector(".project-meta strong").textContent = project.title || "Без названия";
          portfolioModeText.textContent = `Редактирование: ${project.title || "Без названия"}`;
        }
      });
      field.addEventListener("change", () => {
        project[fieldName] = field.value;
        if (fieldName === "status") renderProjects();
      });
    });
    card.querySelector('[data-project-file="gallery"]').addEventListener("change", (event) => {
      readFiles(event.currentTarget).then((images) => {
        project.gallery = [...project.gallery, ...images];
        renderProjects();
      });
    });
    card.querySelectorAll("[data-gallery-remove]").forEach((button) => {
      button.addEventListener("click", () => {
        const galleryIndex = Number(button.dataset.galleryRemove);
        if (!Number.isInteger(galleryIndex)) return;
        const removedImage = project.gallery[galleryIndex];
        if (removedImage?.src === project.coverGallerySrc) {
          project.coverGallerySrc = "";
          project.coverUrl = "";
          project.coverName = "";
        }
        project.gallery.splice(galleryIndex, 1);
        renderProjects();
      });
    });
    card.querySelectorAll("[data-gallery-cover]").forEach((button) => {
      button.addEventListener("click", () => {
        const galleryIndex = Number(button.dataset.galleryCover);
        const image = project.gallery[galleryIndex];
        if (!Number.isInteger(galleryIndex) || !image?.src) return;
        project.cover = "";
        project.coverFile = null;
        project.coverGallerySrc = image.src;
        project.coverUrl = image.src.startsWith("data:") ? "" : image.src;
        project.coverName = image.title || `Изображение ${galleryIndex + 1}`;
        renderProjects();
      });
    });
    card.querySelector(".project-remove").addEventListener("click", () => {
      if (isPersistedProject(project)) pendingProjectRemovalIds.add(project.id);
      content.portfolio.projects.splice(index, 1);
      activeProjectId = null;
      renderProjects();
    });
    projectsList.appendChild(card);
  }

  function renderProjects() {
    projectsList.innerHTML = "";
    const activeIndex = content.portfolio.projects.findIndex((project) => project.id === activeProjectId);
    if (activeIndex < 0) {
      activeProjectId = null;
      renderProjectTiles();
      return;
    }
    renderProjectEditor(content.portfolio.projects[activeIndex], activeIndex);
  }

  function dataUrlToBlob(dataUrl) {
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
    if (!match) throw new Error("Неверный формат загружаемого файла");
    const mimeType = match[1] || "application/octet-stream";
    const payload = match[3] || "";
    const binary = match[2] ? atob(payload) : decodeURIComponent(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return new Blob([bytes], { type: mimeType });
  }

  async function uploadDataUrl(path, dataUrl) {
    if (!supabaseClient || !dataUrl || !dataUrl.startsWith("data:")) return dataUrl || "";
    const blob = dataUrlToBlob(dataUrl);
    const config = window.PORTFOLIO_SUPABASE || {};
    const accessToken = session?.access_token;
    if (!config.url || !config.publishableKey || !accessToken) {
      throw new Error("Нет активной сессии для загрузки изображения");
    }

    const encodedPath = path.split("/").map((part) => encodeURIComponent(part)).join("/");
    const uploadUrl = `${config.url}/storage/v1/object/${encodeURIComponent(bucketName)}/${encodedPath}`;
    const sizeMb = Math.max(1, blob.size / (1024 * 1024));
    const uploadTimeout = Math.min(10 * 60 * 1000, Math.max(3 * 60 * 1000, Math.ceil(sizeMb) * 60 * 1000));
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        await new Promise((resolve, reject) => {
          const request = new XMLHttpRequest();
          request.open("POST", uploadUrl, true);
          request.setRequestHeader("apikey", config.publishableKey);
          request.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          request.setRequestHeader("x-upsert", "true");
          request.setRequestHeader("cache-control", "31536000");
          request.setRequestHeader("Content-Type", blob.type || "application/octet-stream");
          request.upload.onprogress = (event) => {
            if (!event.lengthComputable) return;
            const progress = Math.min(99, Math.round((event.loaded / event.total) * 100));
            setStatus(`${saveStage}: ${progress}%${attempt > 1 ? ` (попытка ${attempt}/${maxAttempts})` : ""}`);
          };
          request.onload = () => {
            if (request.status >= 200 && request.status < 300) {
              resolve();
              return;
            }
            let responseMessage = request.responseText || request.statusText || "неизвестная ошибка";
            try {
              responseMessage = JSON.parse(request.responseText).message || responseMessage;
            } catch (error) {
              // The Storage response may be plain text.
            }
            const uploadError = new Error(`Storage вернул ${request.status}: ${responseMessage}`);
            uploadError.retryable = request.status === 408 || request.status === 429 || request.status >= 500;
            reject(uploadError);
          };
          request.onerror = () => {
            const uploadError = new Error("Браузер не смог соединиться с Supabase Storage");
            uploadError.retryable = true;
            reject(uploadError);
          };
          request.ontimeout = () => {
            const uploadError = new Error(`Supabase Storage не ответил за ${Math.round(uploadTimeout / 1000)} секунд`);
            uploadError.retryable = true;
            reject(uploadError);
          };
          request.timeout = uploadTimeout;
          request.send(blob);
        });
        break;
      } catch (error) {
        if (!error?.retryable || attempt === maxAttempts) throw error;
        setStatus(`${saveStage}: повторная попытка ${attempt + 1}/${maxAttempts}`);
        await new Promise((resolve) => window.setTimeout(resolve, attempt * 1500));
      }
    }
    return supabaseClient.storage.from(bucketName).getPublicUrl(path).data.publicUrl;
  }

  function storagePath(folder, fileName) {
    const safe = String(fileName || "file").replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
    return `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safe || "file"}`;
  }

  function portfolioStoragePath(url) {
    if (!url) return "";
    try {
      const parsed = new URL(url);
      const marker = "/storage/v1/object/public/portfolio/";
      const index = parsed.pathname.indexOf(marker);
      return index >= 0 ? decodeURIComponent(parsed.pathname.slice(index + marker.length)) : "";
    } catch (error) {
      return "";
    }
  }

  async function removePortfolioFiles(urls) {
    const paths = Array.from(new Set((urls || []).map(portfolioStoragePath).filter(Boolean)));
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await supabaseClient.storage.from(bucketName).remove(paths.slice(index, index + 100));
      if (error) throw error;
    }
  }

  async function saveProjects() {
    saveStage = "проверка списка проектов";
    const { data: existingProjects, error: existingError } = await supabaseClient
      .from("projects")
      .select("id,status");
    if (existingError) throw existingError;

    const existingById = new Map((existingProjects || []).map((project) => [project.id, project]));
    for (const [index, project] of content.portfolio.projects.entries()) {
      const previousProjectId = project.id;
      saveStage = `загрузка обложки проекта «${project.title || index + 1}»`;
      let coverUrl = project.cover?.startsWith("data:")
        ? await uploadDataUrl(storagePath("covers", project.coverName || `${project.title}-cover`), project.cover)
        : project.coverUrl || project.cover || "";
      const selectedGalleryCoverSrc = project.coverGallerySrc || "";
      if (selectedGalleryCoverSrc && !selectedGalleryCoverSrc.startsWith("data:")) {
        coverUrl = selectedGalleryCoverSrc;
      }
      const desiredStatus = project.status || "published";
      const existingProject = existingById.get(project.id);
      const payload = {
        title: project.title || "Untitled",
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

      saveStage = `сохранение проекта «${project.title || index + 1}»`;
      const projectQuery = existingProject
        ? supabaseClient.from("projects").update(payload).eq("id", project.id)
        : supabaseClient.from("projects").insert(payload);
      const { data: savedProject, error: projectError } = await projectQuery.select("id").single();
      if (projectError) throw projectError;

      const projectId = savedProject.id;
      saveStage = `проверка галереи проекта «${project.title || index + 1}»`;
      const { data: previousImages, error: previousImagesError } = await supabaseClient
        .from("project_images")
        .select("id,image_url")
        .eq("project_id", projectId);
      if (previousImagesError) throw previousImagesError;

      const rows = [];
      for (const [galleryIndex, image] of project.gallery.entries()) {
        saveStage = `загрузка изображения ${galleryIndex + 1} проекта «${project.title || index + 1}»`;
        const imageUrl = image.src?.startsWith("data:")
          ? await uploadDataUrl(storagePath("gallery", image.title || `${project.title}-${galleryIndex}`), image.src)
          : image.src || "";
        if (selectedGalleryCoverSrc && image.src === selectedGalleryCoverSrc) coverUrl = imageUrl;
        if (imageUrl) rows.push({ project_id: projectId, image_url: imageUrl, title: image.title || project.title, sort_order: galleryIndex });
      }
      projectGalleryUrls(project).forEach((image, urlIndex) => {
        rows.push({ project_id: projectId, image_url: image.src, title: image.title || project.title, sort_order: rows.length + urlIndex });
      });

      if (rows.length) {
        saveStage = `сохранение галереи проекта «${project.title || index + 1}»`;
        const { error: imageError } = await supabaseClient.from("project_images").insert(rows);
        if (imageError) throw imageError;
      }
      const previousImageIds = (previousImages || []).map((image) => image.id);
      if (previousImageIds.length) {
        const { error: deleteImagesError } = await supabaseClient.from("project_images").delete().in("id", previousImageIds);
        if (deleteImagesError) throw deleteImagesError;
      }
      const retainedUrls = new Set(rows.map((row) => row.image_url).concat(coverUrl).filter(Boolean));
      await removePortfolioFiles((previousImages || [])
        .map((image) => image.image_url)
        .filter((url) => !retainedUrls.has(url)));

      saveStage = `публикация проекта «${project.title || index + 1}»`;
      const { data: publishedProject, error: publishError } = await supabaseClient
        .from("projects")
        .update({ status: desiredStatus, cover_url: coverUrl, updated_at: new Date().toISOString() })
        .eq("id", projectId)
        .select("id,status")
        .single();
      if (publishError) throw publishError;
      if (publishedProject.status !== desiredStatus) throw new Error(`Не удалось установить статус проекта «${project.title || index + 1}»`);

      project.id = projectId;
      project.status = publishedProject.status;
      if (activeProjectId === previousProjectId) activeProjectId = projectId;
      project.cover = "";
      project.coverUrl = coverUrl;
      project.coverGallerySrc = coverUrl;
    }

    const removedIds = Array.from(pendingProjectRemovalIds);
    if (removedIds.length) {
      const [{ data: removedImages }, { data: removedProjects }] = await Promise.all([
        supabaseClient.from("project_images").select("image_url").in("project_id", removedIds),
        supabaseClient.from("projects").select("cover_url").in("id", removedIds)
      ]);
      const { error: removeImagesError } = await supabaseClient.from("project_images").delete().in("project_id", removedIds);
      if (removeImagesError) throw removeImagesError;
      const { error: removeProjectsError } = await supabaseClient.from("projects").delete().in("id", removedIds);
      if (removeProjectsError) throw removeProjectsError;
      await removePortfolioFiles([
        ...(removedImages || []).map((image) => image.image_url),
        ...(removedProjects || []).map((project) => project.cover_url)
      ]);
      pendingProjectRemovalIds.clear();
    }
  }

  async function saveSupabaseContent() {
    if (!supabaseClient || !session) return;

    saveStage = "проверка сессии Supabase";
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError || !sessionData.session) {
      session = null;
      renderAuthPanel();
      throw new Error("Сессия закончилась. Войдите в админ-панель заново.");
    }
    session = sessionData.session;
    const expiresSoon = Number(session.expires_at || 0) * 1000 < Date.now() + 60000;
    if (expiresSoon) {
      saveStage = "обновление сессии Supabase";
      const { data: refreshedSession, error: refreshError } = await supabaseClient.auth.refreshSession();
      if (refreshError || !refreshedSession.session) {
        session = null;
        renderAuthPanel();
        throw new Error("Сессия закончилась. Войдите в админ-панель заново.");
      }
      session = refreshedSession.session;
    }

    saveStage = "загрузка фотографии профиля";
    const photoUrl = content.profile.photo?.startsWith("data:")
      ? await uploadDataUrl(storagePath("profile", "profile-photo"), content.profile.photo)
      : content.profile.photoUrl || content.profile.photo || "";
    const faviconUrl = content.settings.favicon?.startsWith("data:")
      ? await uploadDataUrl(storagePath("settings", content.settings.faviconName || "favicon"), content.settings.favicon)
      : content.settings.faviconUrl || content.settings.favicon || "";
    saveStage = "загрузка PDF-CV";
    const cvPdfUrl = content.cv.pdf?.startsWith("data:")
      ? await uploadDataUrl(storagePath("cv", content.cv.pdfName || "cv.pdf"), content.cv.pdf)
      : content.cv.pdfUrl || content.cv.pdf || "";

    saveStage = "сохранение профиля";
    await upsertSingle("profile", {
      name: content.profile.name,
      role: content.profile.role,
      photo_url: photoUrl,
      short_description: content.profile.description,
      socials: content.profile.socials || {},
      updated_at: new Date().toISOString()
    });

    saveStage = "сохранение резюме";
    await replaceRows("cv_sections", [
      { position: "intro", title: "Вводный текст", description: content.cv.intro, sort_order: 1 },
      { position: "skills", title: "Навыки", description: content.cv.skills, sort_order: 2 },
      { position: "tools", title: "Инструменты", description: content.cv.tools, sort_order: 3 },
      { position: "about", title: "Обо мне", description: content.cv.about, sort_order: 4 },
      { position: "experience_items", title: "Опыт работы", description: content.cv.experienceItems, sort_order: 5 },
      ...(cvPdfUrl ? [{ position: "pdf", title: content.cv.pdfName || "PDF-CV", description: cvPdfUrl, sort_order: 6 }] : []),
      ...(content.contacts.formEndpoint ? [{ position: "contact_form", title: "Форма заявки", description: content.contacts.formEndpoint, sort_order: 7 }] : [])
    ]);
    content.cv.pdf = "";
    content.cv.pdfUrl = cvPdfUrl;

    saveStage = "сохранение разделов сайта";
    await replaceRows("services", content.services
      .filter((service) => service.enabled)
      .map((service, index) => ({
        title: service.title,
        description: service.description,
        sort_order: index,
        updated_at: new Date().toISOString()
      })));

    saveStage = "сохранение контактов";
    await upsertSingle("contacts", {
      telegram: content.contacts.telegram,
      email: content.contacts.email,
      phone: content.contacts.phone,
      behance: content.contacts.behance,
      linkedin: content.contacts.linkedin,
      updated_at: new Date().toISOString()
    });

    saveStage = "сохранение настроек сайта";
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
    const cvSummary = [content.cv.intro, content.cv.skills, content.cv.about].filter(Boolean).join(" ");
    const profileSummary = content.profile.description || defaultContent.profile.description;
    const nodes = [
      { look: "center", yaw: 0, pitch: 0, eyebrow: content.profile.role, title: content.profile.name, body: profileSummary, type: "hero" },
      { look: "top", yaw: 0, pitch: 34, title: "Profile", body: profileSummary },
      { look: "bottom", yaw: 0, pitch: -34, title: "CV", body: cvSummary || defaultContent.cv.experienceItems },
      { look: "left", yaw: -42, pitch: 0, title: "Services", body: services || defaultContent.services.map((service) => service.title).join(", ") },
      { look: "right", yaw: 42, pitch: 0, title: "Contact", body: contact || "Available for visual identity, AI art direction, portfolio sites and design case packaging." }
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
    setStatus("Saving...");
    saveButton.disabled = true;
    try {
      await saveSupabaseContent();
      await saveLocalCopy();
      await syncSphereData();
      saveButton.textContent = "SAVED";
      setStatus(supabaseClient && session ? "Saved to Supabase" : "Saved locally");
      window.setTimeout(() => {
        saveButton.textContent = "SAVE";
      }, 900);
    } catch (error) {
      const message = error?.message || "Неизвестная ошибка";
      const connectionError = /failed to fetch|networkerror|network request failed/i.test(message);
      const detailedMessage = connectionError
        ? `Нет соединения с Supabase на этапе: ${saveStage || "сохранение"}. Проверьте, что проект Supabase активен и доступен в этой сети.`
        : message;
      setStatus(`Save failed: ${detailedMessage}`);
      alert(`Save failed: ${detailedMessage}`);
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
      setStatus("Supabase config missing");
      return;
    }
    const { data } = await supabaseClient.auth.getSession();
    const allowedAdminId = window.PORTFOLIO_SUPABASE?.adminUserId;
    session = data.session && (!allowedAdminId || data.session.user.id === allowedAdminId) ? data.session : null;
    if (data.session && !session) await supabaseClient.auth.signOut();
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
        <span>${escapeHtml(session.user.email || "Signed in")}</span>
        <button id="logoutButton" type="button">LOGOUT</button>
      `;
      panel.querySelector("#logoutButton").addEventListener("click", async () => {
        await supabaseClient.auth.signOut();
        session = null;
        saveButton.disabled = true;
        renderAuthPanel();
        setStatus("Logged out");
      });
      saveButton.disabled = false;
      setStatus("Ready");
      if (document.querySelector('[data-tab="settings"]')?.classList.contains("is-active")) loadAnalytics();
      return;
    }
    panel.innerHTML = `
      <form id="authForm">
        <strong>SUPABASE LOGIN</strong>
        <input name="email" type="email" placeholder="Email" autocomplete="username" required>
        <input name="password" type="password" placeholder="Password" autocomplete="current-password" required>
        <button type="submit">LOGIN</button>
        <small>Войди пользователем, которого создал в Supabase Authentication.</small>
      </form>
    `;
    saveButton.disabled = true;
    panel.querySelector("#authForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      setStatus("Logging in...");
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: formData.get("email"),
        password: formData.get("password")
      });
      if (error) {
        setStatus(`Login failed: ${error.message}`);
        alert(error.message);
        return;
      }
      const allowedAdminId = window.PORTFOLIO_SUPABASE?.adminUserId;
      if (allowedAdminId && data.session?.user.id !== allowedAdminId) {
        await supabaseClient.auth.signOut();
        session = null;
        setStatus("Access denied");
        alert("У этой учетной записи нет доступа к админ-панели.");
        return;
      }
      session = data.session;
      renderAuthPanel();
    });
  }

  tabs.forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
  analyticsRefresh?.addEventListener("click", () => {
    analyticsLoaded = false;
    loadAnalytics();
  });
  addProjectButton.addEventListener("click", () => {
    const project = createProject();
    content.portfolio.projects.push(project);
    activeProjectId = project.id;
    renderProjects();
  });
  projectsBackButton.addEventListener("click", () => {
    activeProjectId = null;
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
      activeProjectId = null;
      bindInputs();
      renderProjects();
      resetButton.textContent = "RESET DONE";
      setStatus("Reset local data done");
      window.setTimeout(() => {
        resetButton.textContent = "RESET";
      }, 900);
    });
  });
  saveButton.addEventListener("click", saveContent);

  document.getElementById("profilePhotoInput").addEventListener("change", (event) => {
    readOptimizedImage(event.currentTarget, { maxDimension: 1600, quality: 0.84 }).then((image) => {
      if (!image) return;
      content.profile.photo = image.src;
      content.profile.photoUrl = "";
      document.querySelector('[name="profile.photo"]').value = image.src;
      document.getElementById("profilePhotoName").textContent = image.title;
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
    readOptimizedImage(event.currentTarget, { maxDimension: 512, quality: 0.88 }).then((image) => {
      if (!image) return;
      content.settings.favicon = image.src;
      content.settings.faviconUrl = "";
      content.settings.faviconName = image.title;
      document.querySelector('[name="settings.favicon"]').value = image.src;
      document.getElementById("faviconName").textContent = image.title;
    });
  });
  sphereSettingInputs.forEach((input) => input.addEventListener("input", updateSphereSettingValues));

  setupAuth();
  loadContent().then((storedContent) => {
    content = storedContent;
    bindInputs();
    renderProjects();
    if (!supabaseClient) setStatus("Ready locally");
  });
})();
