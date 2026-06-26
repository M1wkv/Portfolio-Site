(async () => {
  const STORAGE_ASSETS = "portfolioSphere.assets";
  const STORAGE_CV = "portfolioSphere.cvNodes";
  const client = window.createPortfolioSupabase ? window.createPortfolioSupabase() : null;

  function normalizeAssets(items) {
    return items
      .filter((item) => item && typeof item.src === "string" && item.src.trim())
      .map((item) => ({ src: item.src.trim(), title: item.title || "" }));
  }

  async function loadAssets() {
    if (!client) return [];
    const { data: projects, error } = await client
      .from("projects")
      .select("id,title,cover_url,status,sort_order,created_at")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !projects?.length) return [];

    const ids = projects.map((project) => project.id);
    const { data: images } = await client
      .from("project_images")
      .select("project_id,image_url,title,sort_order,created_at")
      .in("project_id", ids)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const imageMap = new Map();
    (images || []).forEach((image) => {
      if (!imageMap.has(image.project_id)) imageMap.set(image.project_id, []);
      imageMap.get(image.project_id).push(image);
    });

    const assets = [];
    projects.forEach((project) => {
      if (project.cover_url) assets.push({ src: project.cover_url, title: project.title || "" });
      (imageMap.get(project.id) || []).forEach((image) => {
        if (image.image_url) assets.push({ src: image.image_url, title: project.title || image.title || "" });
      });
    });
    return normalizeAssets(assets);
  }

  async function loadCvNodes() {
    if (!client) return [];
    const [{ data: profile }, { data: cv }, { data: services }, { data: contacts }] = await Promise.all([
      client.from("profile").select("*").limit(1).maybeSingle(),
      client.from("cv_sections").select("*").order("sort_order", { ascending: true }),
      client.from("services").select("*").order("sort_order", { ascending: true }),
      client.from("contacts").select("*").limit(1).maybeSingle()
    ]);
    if (!profile && !cv?.length) return [];

    const profileText = profile?.short_description || "Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.";
    const cvText = (cv || [])
      .map((section) => [section.title, section.description].filter(Boolean).join(": "))
      .filter(Boolean)
      .join(" ");
    const serviceText = (services || []).map((service) => service.title).filter(Boolean).join(", ");
    const contactText = contacts
      ? [contacts.telegram, contacts.email, contacts.phone].filter(Boolean).join(" / ")
      : "";

    return [
      { look: "center", yaw: 0, pitch: 0, eyebrow: profile?.role || "CV / ART DIRECTION / AI DESIGN", title: profile?.name || "Alexander", body: profileText, type: "hero" },
      { look: "top", yaw: 0, pitch: 34, title: "Profile", body: profileText },
      { look: "bottom", yaw: 0, pitch: -34, title: "CV", body: cvText || "Portfolio systems, AI campaigns, social content packs, landing visuals and case studies." },
      { look: "left", yaw: -42, pitch: 0, title: "Services", body: serviceText || "Branding, SMM design, presentations, Web / UI, print." },
      { look: "right", yaw: 42, pitch: 0, title: "Contact", body: contactText || "Available for visual identity, AI art direction, portfolio sites and design case packaging." }
    ];
  }

  function loadScript(src) {
    const script = document.createElement("script");
    script.src = src;
    script.defer = true;
    document.body.appendChild(script);
  }

  try {
    const [assets, cvNodes] = await Promise.all([loadAssets(), loadCvNodes()]);
    if (assets.length) localStorage.setItem(STORAGE_ASSETS, JSON.stringify(assets));
    if (cvNodes.length) localStorage.setItem(STORAGE_CV, JSON.stringify(cvNodes));
  } catch (error) {
    console.warn("Supabase bootstrap skipped", error);
  } finally {
    loadScript("sphere.js");
  }
})();
