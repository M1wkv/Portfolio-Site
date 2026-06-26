(() => {
  const STORAGE_CONTENT = "portfolioSphere.adminContent";
  const STORAGE_CV = "portfolioSphere.cvNodes";
  const STORAGE_ASSETS = "portfolioSphere.assets";

  const defaultContent = {
    profile: {
      name: "Alexander",
      role: "CV / ART DIRECTION / AI DESIGN",
      photo: "",
      description: "Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.",
      socials: {
        telegram: "",
        behance: "",
        linkedin: "",
        instagram: ""
      }
    },
    cv: {
      experience: "Portfolio systems, AI campaigns, social content packs, landing visuals and case studies.",
      education: "",
      skills: "Figma, Photoshop, Illustrator, After Effects, Midjourney, Runway, Krea and web layout basics.",
      certificates: "",
      pdf: "",
      pdfName: ""
    },
    portfolio: {
      projects: []
    },
    services: [
      { title: "Branding", description: "Visual identity, key visuals, guidelines.", enabled: true },
      { title: "SMM design", description: "Social media layouts, campaign packs, content systems.", enabled: true },
      { title: "Presentations", description: "Pitch decks, portfolio decks, case packaging.", enabled: true },
      { title: "Web / UI", description: "Landing pages, portfolio sites, interface concepts.", enabled: true },
      { title: "Print", description: "Posters, packaging layouts, printed brand materials.", enabled: true }
    ],
    contacts: {
      telegram: "",
      email: "",
      phone: "",
      behance: "",
      linkedin: "",
      formEndpoint: ""
    },
    settings: {
      siteTitle: "Portfolio Sphere",
      description: "Creative portfolio with interactive sphere gallery and design cases.",
      favicon: "",
      faviconName: "",
      language: "ru",
      analytics: ""
    }
  };

  let content = clone(defaultContent);

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
    profile: ["Profile / Главный блок", "Главный блок"],
    cv: ["CV / Резюме", "Резюме"],
    portfolio: ["Portfolio / Кейсы", "Кейсы"],
    services: ["Services / Услуги", "Услуги"],
    contacts: ["Contacts / Связь", "Связь"],
    settings: ["Settings / SEO", "SEO и настройки"]
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
    return result;
  }

  function loadLocalContent() {
    try {
      return mergeContent(defaultContent, JSON.parse(localStorage.getItem(STORAGE_CONTENT) || "null"));
    } catch (error) {
      return clone(defaultContent);
    }
  }

  async function loadContent() {
    try {
      const stored = await window.PortfolioStorage.get(STORAGE_CONTENT);
      return mergeContent(defaultContent, stored || loadLocalContent());
    } catch (error) {
      return loadLocalContent();
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
      field.value = value || "";
    });
    document.getElementById("profilePhotoName").textContent = content.profile.photo ? "Image selected" : "No file selected";
    document.getElementById("cvPdfName").textContent = content.cv.pdfName || "No file selected";
    document.getElementById("faviconName").textContent = content.settings.faviconName || "No file selected";
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
    reader.onload = () => callback(reader.result, file.name);
    reader.readAsDataURL(file);
  }

  function createProject() {
    return {
      id: `project-${Date.now()}`,
      title: "New case",
      category: "Design",
      status: "published",
      cover: "",
      coverName: "",
      coverUrl: "",
      description: "",
      gallery: [],
      galleryUrls: ""
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
      .map((src, index) => ({ src, title: `${project.title || "Project"} URL ${index + 1}` }));
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
            <span>Project ${String(index + 1).padStart(2, "0")}</span>
            <strong>${project.title || "Untitled"}</strong>
          </div>
          <button class="project-remove" type="button">REMOVE</button>
        </div>
        <div class="project-preview">
          ${cover ? `<img src="${cover}" alt="">` : `<span>No cover</span>`}
          <div>
            <b>${project.status === "published" ? "Published" : "Hidden"}</b>
            <small>${galleryCount} gallery images</small>
          </div>
        </div>
        <div class="project-grid">
          <label>
            <span>Название</span>
            <input data-project-field="title" type="text">
          </label>
          <label>
            <span>Категория</span>
            <input data-project-field="category" type="text">
          </label>
          <label>
            <span>Статус</span>
            <select data-project-field="status">
              <option value="published">Опубликован</option>
              <option value="hidden">Скрыт</option>
            </select>
          </label>
          <label>
            <span>Обложка</span>
            <input data-project-file="cover" type="file" accept="image/*">
            <small>${project.coverName || "No cover selected"}</small>
          </label>
          <label>
            <span>Обложка URL</span>
            <input data-project-field="coverUrl" type="text" placeholder="https://...">
          </label>
          <label class="project-gallery">
            <span>Галерея</span>
            <input data-project-file="gallery" type="file" accept="image/*" multiple>
            <small>${project.gallery.length ? `${project.gallery.length} images selected` : "No gallery images selected"}</small>
          </label>
          <label class="project-gallery">
            <span>Галерея URL</span>
            <textarea data-project-field="galleryUrls" rows="4" placeholder="Одна ссылка на строку"></textarea>
          </label>
          <label class="project-gallery">
            <span>Описание</span>
            <textarea data-project-field="description" rows="4"></textarea>
          </label>
        </div>
      `;
      card.querySelector('[data-project-field="title"]').value = project.title || "";
      card.querySelector('[data-project-field="category"]').value = project.category || "";
      card.querySelector('[data-project-field="status"]').value = project.status || "published";
      card.querySelector('[data-project-field="coverUrl"]').value = project.coverUrl || "";
      card.querySelector('[data-project-field="galleryUrls"]').value = project.galleryUrls || "";
      card.querySelector('[data-project-field="description"]').value = project.description || "";
      card.querySelectorAll("[data-project-field]").forEach((field) => {
        field.addEventListener("input", () => {
          project[field.dataset.projectField] = field.value;
          card.querySelector(".project-meta strong").textContent = project.title || "Untitled";
        });
        field.addEventListener("change", () => {
          project[field.dataset.projectField] = field.value;
          if (["coverUrl", "galleryUrls", "status"].includes(field.dataset.projectField)) {
            renderProjects();
          }
        });
      });
      card.querySelector('[data-project-file="cover"]').addEventListener("change", (event) => {
        readFile(event.currentTarget, (data, name) => {
          project.cover = data;
          project.coverName = name;
          renderProjects();
        });
      });
      card.querySelector('[data-project-file="gallery"]').addEventListener("change", (event) => {
        const files = Array.from(event.currentTarget.files || []);
        Promise.all(files.map((file) => new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ src: reader.result, title: file.name });
          reader.readAsDataURL(file);
        }))).then((images) => {
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
        <div class="service-head">
          <strong>${service.title}</strong>
        </div>
        <textarea rows="3"></textarea>
        <label>
          <span>Active</span>
          <input type="checkbox">
        </label>
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

  async function syncSphereData() {
    const services = content.services.filter((service) => service.enabled).map((service) => service.title).join(", ");
    const contact = [content.contacts.telegram, content.contacts.email, content.contacts.phone].filter(Boolean).join(" / ");
    const cvSummary = [content.cv.experience, content.cv.skills].filter(Boolean).join(" ");
    const profileSummary = content.profile.description || defaultContent.profile.description;
    const nodes = [
      { look: "center", yaw: 0, pitch: 0, eyebrow: content.profile.role, title: content.profile.name, body: profileSummary, type: "hero" },
      { look: "top", yaw: 0, pitch: 34, title: "Profile", body: profileSummary },
      { look: "bottom", yaw: 0, pitch: -34, title: "CV", body: cvSummary || defaultContent.cv.experience },
      { look: "left", yaw: -42, pitch: 0, title: "Services", body: services || defaultContent.services.map((service) => service.title).join(", ") },
      { look: "right", yaw: 42, pitch: 0, title: "Contact", body: contact || "Available for visual identity, AI art direction, portfolio sites and design case packaging." }
    ];
    await window.PortfolioStorage.set(STORAGE_CV, nodes);
    try {
      localStorage.setItem(STORAGE_CV, JSON.stringify(nodes));
    } catch (error) {
      localStorage.removeItem(STORAGE_CV);
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
      try {
        localStorage.setItem(STORAGE_ASSETS, JSON.stringify(media.filter((item) => !item.src.startsWith("data:"))));
      } catch (error) {
        localStorage.removeItem(STORAGE_ASSETS);
      }
    } else {
      await window.PortfolioStorage.remove(STORAGE_ASSETS);
      localStorage.removeItem(STORAGE_ASSETS);
    }
  }

  function setStatus(message) {
    saveStatus.textContent = message;
  }

  async function saveContent() {
    collectInputs();
    setStatus("Saving...");
    saveButton.disabled = true;
    try {
      await window.PortfolioStorage.set(STORAGE_CONTENT, content);
      await syncSphereData();
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
              gallery: project.gallery.map((image) => ({ ...image, src: image.src.startsWith("data:") ? "" : image.src }))
            }))
          }
        }));
      } catch (error) {
        localStorage.removeItem(STORAGE_CONTENT);
      }
      saveButton.textContent = "SAVED";
      setStatus("Saved");
      window.setTimeout(() => {
        saveButton.textContent = "SAVE";
      }, 900);
    } catch (error) {
      setStatus(`Save failed: ${error.message}`);
      alert(`Save failed: ${error.message}`);
    } finally {
      saveButton.disabled = false;
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

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
      resetButton.textContent = "RESET DONE";
      setStatus("Reset done");
      window.setTimeout(() => {
        resetButton.textContent = "RESET";
      }, 900);
    });
  });

  saveButton.addEventListener("click", saveContent);

  document.getElementById("profilePhotoInput").addEventListener("change", (event) => {
    readFile(event.currentTarget, (data, name) => {
      content.profile.photo = data;
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
      content.settings.faviconName = name;
      document.querySelector('[name="settings.favicon"]').value = data;
      document.getElementById("faviconName").textContent = name;
    });
  });

  loadContent().then((storedContent) => {
    content = storedContent;
    bindInputs();
    renderProjects();
    renderServices();
    setStatus("Ready");
  });
})();
