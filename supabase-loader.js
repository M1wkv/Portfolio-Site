(async () => {
  const STORAGE_ASSETS = "portfolioSphere.assets";
  const STORAGE_CV = "portfolioSphere.cvNodes";
  const SPHERE_ASSET_LIMIT = 100;
  const client = window.createPortfolioSupabase ? window.createPortfolioSupabase() : null;
  let activeContentSignature = "";

  function normalizeAssets(items) {
    return (Array.isArray(items) ? items : [])
      .filter((item) => item && typeof item.src === "string" && item.src.trim())
      .map((item) => ({
        src: item.src.trim(),
        title: item.title || "",
        projectId: item.projectId || item.project_id || ""
      }));
  }

  function shuffle(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index--) {
      const nextIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
    }
    return result;
  }

  function selectBalancedAssets(projectGroups, requestedLimit = 50) {
    const groups = shuffle(projectGroups)
      .map((group) => {
        const uniqueAssets = Array.from(
          new Map(normalizeAssets(group.assets).map((asset) => [asset.src, asset])).values()
        );
        return { ...group, assets: shuffle(uniqueAssets) };
      })
      .filter((group) => group.assets.length);
    if (!groups.length) return [];

    const limit = Math.max(10, Math.min(SPHERE_ASSET_LIMIT, Math.round(Number(requestedLimit) || 50)));
    const quota = Math.floor(limit / groups.length);
    const remainder = limit % groups.length;
    const allocations = groups.map((_, index) => quota + (index < remainder ? 1 : 0));
    const selected = [];
    const maxAllocation = Math.max(...allocations);
    for (let assetIndex = 0; assetIndex < maxAllocation; assetIndex++) {
      groups.forEach((group, groupIndex) => {
        if (assetIndex >= allocations[groupIndex]) return;
        const asset = group.assets[assetIndex % group.assets.length];
        selected.push({ ...asset, projectId: group.projectId });
      });
    }
    return shuffle(selected);
  }

  function exposeAssetDiagnostics(assets, projectGroups) {
    const selectedCounts = assets.reduce((result, asset) => {
      result[asset.projectId] = (result[asset.projectId] || 0) + 1;
      return result;
    }, {});
    const summary = Object.fromEntries(projectGroups.map((group) => [group.projectId, {
      title: group.title,
      available: group.assets.length,
      selected: selectedCounts[group.projectId] || 0
    }]));
    document.documentElement.dataset.sphereAssetCount = String(assets.length);
    document.documentElement.dataset.sphereProjectCount = String(projectGroups.length);
    document.documentElement.dataset.sphereProjectCounts = JSON.stringify(selectedCounts);
    document.documentElement.dataset.sphereProjectSummary = JSON.stringify(summary);
  }

  async function loadAssetBundle() {
    if (!client) return { assets: [], projectAssets: [], signature: "", projectGroups: [] };
    const { data: projects, error: projectsError } = await client
      .from("projects")
      .select("id,title,cover_url,status,sort_order,created_at,updated_at")
      .eq("status", "published")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (projectsError) throw projectsError;
    if (!projects?.length) return { assets: [], projectAssets: [], signature: "", projectGroups: [] };

    const projectIds = projects.map((project) => project.id);
    const { data: images, error: imagesError } = await client
      .from("project_images")
      .select("id,project_id,image_url,title,sort_order,created_at")
      .in("project_id", projectIds)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (imagesError) throw imagesError;

    const imagesByProject = new Map();
    (images || []).forEach((image) => {
      if (!imagesByProject.has(image.project_id)) imagesByProject.set(image.project_id, []);
      imagesByProject.get(image.project_id).push(image);
    });

    const projectGroups = projects.map((project) => {
      const assets = [];
      if (project.cover_url) assets.push({ src: project.cover_url, title: project.title || "", projectId: project.id });
      (imagesByProject.get(project.id) || []).forEach((image) => {
        if (image.image_url) assets.push({ src: image.image_url, title: project.title || image.title || "", projectId: project.id });
      });
      return {
        projectId: project.id,
        title: project.title || "Untitled",
        updatedAt: project.updated_at || project.created_at || "",
        assets
      };
    }).filter((group) => group.assets.length);

    const signature = projectGroups
      .map((group) => `${group.projectId}:${group.assets.length}:${group.updatedAt}`)
      .sort()
      .join("|");
    const projectAssets = projectGroups.flatMap((group) => Array.from(
      new Map(normalizeAssets(group.assets).map((asset) => [asset.src, asset])).values()
    ).map((asset) => ({ ...asset, projectId: group.projectId })));
    return { assets: selectBalancedAssets(projectGroups), projectAssets, signature, projectGroups };
  }

  async function loadCvNodes() {
    if (!client) return [];
    const t = window.PortfolioLocale?.text || ((value) => value);
    const [{ data: profile }, { data: cv }, { data: services }, { data: contacts }] = await Promise.all([
      client.from("profile").select("*").limit(1).maybeSingle(),
      client.from("cv_sections").select("*").order("sort_order", { ascending: true }),
      client.from("services").select("*").order("sort_order", { ascending: true }),
      client.from("contacts").select("*").limit(1).maybeSingle()
    ]);
    if (!profile && !cv?.length) return [];

    const profileText = t(profile?.short_description || "Creative designer building visual systems, AI-assisted image stories and interactive portfolio experiences.");
    const cvText = (cv || []).filter((section) => section.description).map((section) => [t(section.title), t(section.description)].join(": ")).join(" ");
    const serviceText = (services || []).map((service) => t(service.title)).filter(Boolean).join(", ");
    const contactText = contacts ? [contacts.telegram, contacts.email, contacts.phone].filter(Boolean).join(" / ") : "";
    return [
      { look: "center", yaw: 0, pitch: 0, eyebrow: t(profile?.role || "CV / ART DIRECTION / AI DESIGN"), title: t(profile?.name || "Alexander"), body: profileText, type: "hero" },
      { look: "top", yaw: 0, pitch: 34, title: t("Profile"), body: profileText },
      { look: "bottom", yaw: 0, pitch: -34, title: t("CV"), body: cvText || t("Portfolio systems, AI campaigns, social content packs, landing visuals and case studies.") },
      { look: "left", yaw: -42, pitch: 0, title: t("Services"), body: serviceText || t("Branding, SMM design, presentations, Web / UI, print.") },
      { look: "right", yaw: 42, pitch: 0, title: t("Contact"), body: contactText || t("Available for visual identity, AI art direction, portfolio sites and design case packaging.") }
    ];
  }

  async function loadSphereSettings() {
    const defaults = { size: 0.6, elementScale: 0.6, itemCount: 50, fisheye: 0.15, rotationX: 0.14, rotationY: -0.09 };
    if (!client) return { values: defaults, signature: "" };
    const { data, error } = await client.from("site_settings").select("analytics,updated_at").limit(1).maybeSingle();
    if (error) throw error;
    try {
      const parsed = JSON.parse(data?.analytics || "null");
      const values = parsed?.portfolioSphere ? { ...defaults, ...(parsed.sphere || {}) } : defaults;
      if (parsed?.portfolioSphere < 2) {
        if (Number(values.size) === 0.4) values.size = 0.6;
        if (Number(values.elementScale) === 0.4) values.elementScale = 0.6;
      }
      return { values, signature: data?.updated_at || data?.analytics || "" };
    } catch (error) {
      return { values: defaults, signature: data?.updated_at || "" };
    }
  }

  function loadSphereScript() {
    const script = document.createElement("script");
    script.async = false;
    script.src = "sphere.js?v=20260630-project-ribbon-rollback-1";
    script.onload = () => {
      document.documentElement.dataset.sphereScriptLoaded = "true";
    };
    script.onerror = () => {
      document.documentElement.dataset.sphereRuntimeError = "script-load";
    };
    document.body.appendChild(script);
  }

  window.addEventListener("error", (event) => {
    if (String(event.filename || "").includes("sphere.js")) {
      document.documentElement.dataset.sphereRuntimeError = event.message || "runtime-error";
    }
  });

  function setBootstrapPayload(payload) {
    window.PORTFOLIO_BOOTSTRAP = payload;
    document.getElementById("sphereBootstrapData")?.remove();
    const dataNode = document.createElement("script");
    dataNode.id = "sphereBootstrapData";
    dataNode.type = "application/json";
    dataNode.textContent = JSON.stringify(payload);
    document.head.appendChild(dataNode);
  }

  async function refreshIfContentChanged() {
    if (!client || document.visibilityState !== "visible" || !activeContentSignature) return;
    try {
      const [bundle, sphereSettings] = await Promise.all([loadAssetBundle(), loadSphereSettings()]);
      const nextSignature = `${bundle.signature}|${sphereSettings.signature}`;
      if (bundle.signature && nextSignature !== activeContentSignature) location.reload();
    } catch (error) {
      console.warn("Sphere content refresh skipped", error);
    }
  }

  try {
    const [bundle, cvNodes, sphereSettings] = await Promise.all([loadAssetBundle(), loadCvNodes(), loadSphereSettings()]);
    bundle.assets = selectBalancedAssets(bundle.projectGroups, sphereSettings.values.itemCount);
    activeContentSignature = `${bundle.signature}|${sphereSettings.signature}`;
    setBootstrapPayload({ assets: bundle.assets, projectAssets: bundle.projectAssets, cvNodes, sphereSettings: sphereSettings.values });
    if (bundle.assets.length) localStorage.setItem(STORAGE_ASSETS, JSON.stringify(bundle.assets));
    else localStorage.removeItem(STORAGE_ASSETS);
    if (cvNodes.length) localStorage.setItem(STORAGE_CV, JSON.stringify(cvNodes));
    exposeAssetDiagnostics(bundle.assets, bundle.projectGroups);
  } catch (error) {
    setBootstrapPayload({ assets: [], projectAssets: [], cvNodes: [], sphereSettings: { size: 0.6, elementScale: 0.6, itemCount: 50, fisheye: 0.15, rotationX: 0.14, rotationY: -0.09 } });
    console.warn("Supabase bootstrap skipped", error);
  } finally {
    loadSphereScript();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshIfContentChanged();
  });
  window.setInterval(refreshIfContentChanged, 15000);
})();

