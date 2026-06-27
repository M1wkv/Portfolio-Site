(async () => {
  const STORAGE_ASSETS = "portfolioSphere.assets";
  const STORAGE_CV = "portfolioSphere.cvNodes";
  const SPHERE_ASSET_LIMIT = 50;
  const client = window.createPortfolioSupabase ? window.createPortfolioSupabase() : null;
  let activeProjectSignature = "";

  function normalizeAssets(items) {
    return items
      .filter((item) => item && typeof item.src === "string" && item.src.trim())
      .map((item) => ({ src: item.src.trim(), title: item.title || "", projectId: item.projectId || item.project_id || "" }));
  }

  function shuffle(items) {
    const result = items.slice();
    for (let index = result.length - 1; index > 0; index--) {
      const nextIndex = Math.floor(Math.random() * (index + 1));
      [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
    }
    return result;
  }

  function takeBalancedProjectAssets(projectGroups) {
    const groups = shuffle(projectGroups)
      .map((group) => ({ ...group, assets: shuffle(normalizeAssets(group.assets)) }))
      .filter((group) => group.assets.length);
    if (!groups.length) return [];

    const limit = SPHERE_ASSET_LIMIT;
    const quota = Math.max(1, Math.floor(limit / groups.length));
    const queues = groups.map((group) => {
      const queue = [];

      for (let index = 0; index < quota; index++) {
        const cycle = Math.floor(index / group.assets.length);
        const source = cycle === 0 ? group.assets : shuffle(group.assets);
        queue.push({ ...source[index % source.length], projectId: group.projectId });
      }

      return { projectId: group.projectId, queue };
    });

    const selected = [];
    for (let index = 0; index < quota; index++) {
      queues.forEach((group) => {
        selected.push(group.queue[index]);
      });
    }

    return selected;
  }

  function exposeAssetDiagnostics(assets) {
    const summary = assets.reduce((result, asset) => {
      const key = asset.projectId || "missing";
      if (!result[key]) result[key] = { count: 0, title: asset.title || "", samples: [] };
      result[key].count += 1;
      if (result[key].samples.length < 3) result[key].samples.push(asset.src);
      return result;
    }, {});
    document.documentElement.dataset.sphereAssetCount = String(assets.length);
    document.documentElement.dataset.sphereProjectCounts = JSON.stringify(
      Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, value.count]))
    );
    document.documentElement.dataset.sphereProjectSummary = JSON.stringify(summary);
  }

  function projectSignature(assets) {
    return Array.from(new Set(assets.map((asset) => asset.projectId).filter(Boolean))).sort().join("|");
  }

  async function refreshIfProjectsChanged() {
    if (!client || document.visibilityState !== "visible" || !activeProjectSignature) return;
    try {
      const nextAssets = await loadAssets();
      const nextSignature = projectSignature(nextAssets);
      if (nextSignature && nextSignature !== activeProjectSignature) {
        localStorage.setItem(STORAGE_ASSETS, JSON.stringify(nextAssets));
        location.reload();
      }
    } catch (error) {
      console.warn("Sphere project refresh skipped", error);
    }
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

    const projectGroups = projects.map((project) => {
      const assets = [];
      if (project.cover_url) assets.push({ src: project.cover_url, title: project.title || "", projectId: project.id });
      (imageMap.get(project.id) || []).forEach((image) => {
        if (image.image_url) assets.push({ src: image.image_url, title: project.title || image.title || "", projectId: project.id });
      });
      return { projectId: project.id, assets };
    });
    return takeBalancedProjectAssets(projectGroups);
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

  function patchSphereSource(source) {
    let patched = source;
    patched = patched.replace(
      "function loadItems(nextAssets) {",
      "function exposeLoadedProjectDiagnostics() {\n    const loaded = {};\n    const failed = {};\n    items.forEach((item) => {\n      const key = item.projectId || item.title || \"missing\";\n      if (item.loaded) loaded[key] = (loaded[key] || 0) + 1;\n      if (item.loadFailed) failed[key] = (failed[key] || 0) + 1;\n    });\n    document.documentElement.dataset.sphereLoadedProjectCounts = JSON.stringify(loaded);\n    document.documentElement.dataset.sphereFailedProjectCounts = JSON.stringify(failed);\n  }\n\n  function loadItems(nextAssets) {"
    );
    patched = patched.replace(
      "const defaultAssets = (window.SPHERE_ASSETS || []).slice(0, 100);",
      "const defaultAssets = window.PORTFOLIO_SUPABASE ? [] : (window.SPHERE_ASSETS || []).slice(0, 100);"
    );
    patched = patched.replace(
      "let ribbonAutoPhaseStartedAt = 0;\n  let cvLook",
      "let ribbonAutoPhaseStartedAt = 0;\n  let activeProjectKey = \"\";\n  let cvLook"
    );
    patched = patched.replace(
      "title: asset.title || `Work ${index + 1}`,\n        loaded: false",
      "title: asset.title || `Work ${index + 1}`,\n        projectId: asset.projectId || asset.project_id || \"\",\n        loaded: false,\n        loadFailed: false"
    );
    patched = patched.replace(
      "item.img.onload = () => {\n        item.loaded = true;\n      };\n      item.img.onerror = () => {\n        item.loaded = false;\n      };",
      "item.img.onload = () => {\n        item.loaded = true;\n        item.loadFailed = false;\n        exposeLoadedProjectDiagnostics();\n      };\n      item.img.onerror = () => {\n        item.loaded = false;\n        item.loadFailed = true;\n        exposeLoadedProjectDiagnostics();\n      };"
    );
    patched = patched.replace(
      "title: typeof asset.title === \"string\" ? asset.title.trim() : \"\"",
      "title: typeof asset.title === \"string\" ? asset.title.trim() : \"\",\n        projectId: typeof asset.projectId === \"string\" ? asset.projectId : (typeof asset.project_id === \"string\" ? asset.project_id : \"\")"
    );
    patched = patched.replace(
      "const supabaseAssets = await loadSupabaseAssets();\n      if (supabaseAssets.length) return supabaseAssets;\n      if (!window.PortfolioStorage) return loadStoredAssets();\n      return normalizeAssets(await window.PortfolioStorage.get(STORAGE_ASSETS) || loadStoredAssets());",
      "const storedAssets = loadStoredAssets();\n      if (storedAssets.length) return storedAssets;\n      if (!window.PortfolioStorage) return storedAssets;\n      return normalizeAssets(await window.PortfolioStorage.get(STORAGE_ASSETS) || storedAssets);"
    );
    const spatialReplacement = `function getVisibleItems() {
    return mixSpatialItems(items.slice(0, Math.min(MAX_VISIBLE_ITEMS, items.length)));
  }

  function projectKey(item) {
    return item?.projectId || item?.title || item?.src || "";
  }

  function initialSphereSlot(index, count) {
    const point = fibonacciPoint(index, count);
    const cosY = Math.cos(0.48);
    const sinY = Math.sin(0.48);
    const cosX = Math.cos(-0.22);
    const sinX = Math.sin(-0.22);
    const x1 = point.x * cosY - point.z * sinY;
    const z1 = point.x * sinY + point.z * cosY;
    const y1 = point.y * cosX - z1 * sinX;
    const z2 = point.y * sinX + z1 * cosX;
    return { index, depth: z2, angle: Math.atan2(y1, x1), radius: Math.hypot(x1, y1) };
  }

  function mixSpatialItems(sourceItems) {
    if (sourceItems.length < 3) return sourceItems;
    const groups = new Map();
    sourceItems.forEach((item) => {
      const key = projectKey(item);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    });
    const queues = Array.from(groups.entries())
      .map(([key, groupItems]) => ({ key, title: groupItems[0]?.title || "", items: groupItems.slice() }))
      .filter((group) => group.items.length);
    if (queues.length < 2) return sourceItems;
    const allSlots = sourceItems.map((_, index) => initialSphereSlot(index, sourceItems.length));
    const frontCandidates = allSlots.filter((slot) => slot.depth > 0.1);
    const anchorSlots = [];
    const anchorCount = Math.min(frontCandidates.length, queues.length * 3);
    for (let anchorIndex = 0; anchorIndex < anchorCount; anchorIndex++) {
      const targetAngle = -Math.PI + (Math.PI * 2 * anchorIndex) / anchorCount;
      const targetRadius = 0.42 + (Math.floor(anchorIndex / queues.length) % 3) * 0.12;
      let bestIndex = 0;
      let bestScore = -Infinity;
      frontCandidates.forEach((slot, index) => {
        const angleDistance = Math.abs(Math.atan2(Math.sin(slot.angle - targetAngle), Math.cos(slot.angle - targetAngle)));
        const score = slot.depth * 1.4 - angleDistance * 0.75 - Math.abs(slot.radius - targetRadius) * 1.2;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      });
      anchorSlots.push(frontCandidates.splice(bestIndex, 1)[0]);
    }
    const anchorIndexes = new Set(anchorSlots.map((slot) => slot.index));
    const depthSortedSlots = allSlots.filter((slot) => !anchorIndexes.has(slot.index)).sort((a, b) => b.depth - a.depth);
    const slots = [];
    const bandSize = Math.max(queues.length, queues.length * 2);
    for (let start = 0; start < depthSortedSlots.length; start += bandSize) {
      slots.push(...depthSortedSlots.slice(start, start + bandSize).sort((a, b) => a.angle - b.angle));
    }
    const mixed = new Array(sourceItems.length);
    anchorSlots.forEach((slot, index) => {
      const group = queues[index % queues.length];
      mixed[slot.index] = group.items.shift();
    });
    let slotIndex = 0;
    let cycle = 0;
    while (slotIndex < slots.length && queues.some((group) => group.items.length)) {
      const active = queues.filter((group) => group.items.length);
      const start = cycle % active.length;
      for (let offset = 0; offset < active.length && slotIndex < slots.length; offset++) {
        const group = active[(start + offset) % active.length];
        mixed[slots[slotIndex].index] = group.items.shift();
        slotIndex += 1;
      }
      cycle += 1;
    }
    return mixed.filter(Boolean);
  }

  function getProjectItems() {
    if (!activeProjectKey) return getVisibleItems();
    const projectItems = items.filter((item) => projectKey(item) === activeProjectKey);
    return projectItems.length ? projectItems.slice(0, Math.min(MAX_VISIBLE_ITEMS, projectItems.length)) : getVisibleItems();
  }

  function getRenderItems() {
    return projectActive() ? getProjectItems() : getVisibleItems();
  }`;
    patched = patched.replace(
      "function getVisibleItems() {\n    return items.slice(0, Math.min(MAX_VISIBLE_ITEMS, items.length));\n  }",
      spatialReplacement
    );
    patched = patched.replace(
      "const visibleItems = getVisibleItems();\n    const sphereEntries",
      "const visibleItems = getRenderItems();\n    const sphereEntries"
    );
    patched = patched.replace(
      "function openProject(item) {\n    const index = Math.max(0, getVisibleItems().findIndex((candidate) => candidate === item));",
      "function openProject(item) {\n    activeProjectKey = projectKey(item);\n    const projectItems = getProjectItems();\n    const index = Math.max(0, projectItems.findIndex((candidate) => candidate === item));"
    );
    patched = patched.replace(
      "function centerProjectItem(item, index) {\n    const visibleItems = getVisibleItems();",
      "function centerProjectItem(item, index) {\n    const visibleItems = getProjectItems();"
    );
    patched = patched.replace(
      "function syncCenteredProjectTitle() {\n    if (viewMode !== \"project\") return;\n    const visibleItems = getVisibleItems();",
      "function syncCenteredProjectTitle() {\n    if (viewMode !== \"project\") return;\n    const visibleItems = getProjectItems();"
    );
    patched = patched.replace(
      "function closeProject() {\n    transitionTarget = 0;\n    viewMode = \"sphere\";",
      "function closeProject() {\n    transitionTarget = 0;\n    viewMode = \"sphere\";\n    activeProjectKey = \"\";"
    );
    return patched;
  }

  async function loadScript(src) {
    const script = document.createElement("script");
    try {
      const response = await fetch(`${src}?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error(`Unable to load ${src}`);
      const source = await response.text();
      const blob = new Blob([patchSphereSource(source)], { type: "text/javascript" });
      script.src = URL.createObjectURL(blob);
    } catch (error) {
      console.warn("Sphere runtime patch skipped", error);
      script.src = src;
    }
    document.body.appendChild(script);
  }

  try {
    localStorage.removeItem(STORAGE_ASSETS);
    const [assets, cvNodes] = await Promise.all([loadAssets(), loadCvNodes()]);
    if (assets.length) {
      localStorage.setItem(STORAGE_ASSETS, JSON.stringify(assets));
      activeProjectSignature = projectSignature(assets);
      exposeAssetDiagnostics(assets);
    }
    else localStorage.removeItem(STORAGE_ASSETS);
    if (cvNodes.length) localStorage.setItem(STORAGE_CV, JSON.stringify(cvNodes));
  } catch (error) {
    localStorage.removeItem(STORAGE_ASSETS);
    console.warn("Supabase bootstrap skipped", error);
  } finally {
    loadScript("sphere.js");
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") refreshIfProjectsChanged();
  });
  window.setInterval(refreshIfProjectsChanged, 60000);
})();

