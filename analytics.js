(() => {
  if (location.pathname.toLowerCase().includes("admin")) return;

  const SESSION_KEY = "portfolioSphere.analyticsSession";
  const UUID_FALLBACK = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";

  function sessionId() {
    let value = sessionStorage.getItem(SESSION_KEY);
    if (value) return value;
    value = crypto.randomUUID?.() || UUID_FALLBACK.replace(/[xy]/g, (token) => {
      const number = Math.random() * 16 | 0;
      return (token === "x" ? number : (number & 3 | 8)).toString(16);
    });
    sessionStorage.setItem(SESSION_KEY, value);
    return value;
  }

  function deviceType() {
    if (matchMedia("(max-width: 767px)").matches) return "mobile";
    if (matchMedia("(max-width: 1023px)").matches) return "tablet";
    return "desktop";
  }

  function referrerHost() {
    if (!document.referrer) return "";
    try {
      const host = new URL(document.referrer).hostname.replace(/^www\./, "");
      return host === location.hostname.replace(/^www\./, "") ? "" : host;
    } catch (error) {
      return "";
    }
  }

  let client = null;

  function track(eventType, details = {}) {
    if (!client) return;
    const projectId = String(details.projectId || "").trim();
    client.rpc("track_analytics_event", {
      p_event_type: eventType,
      p_session_id: sessionId(),
      p_project_id: /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(projectId) ? projectId : null,
      p_project_title: String(details.projectTitle || "").slice(0, 160),
      p_page_path: `${location.pathname}${location.hash}`.slice(0, 300),
      p_referrer_host: referrerHost(),
      p_device_type: deviceType()
    }).then(({ error }) => {
      if (error) console.warn("Analytics event skipped", error.message);
    });
  }

  window.PortfolioAnalytics = { track };

  let attempts = 0;
  function start() {
    client = window.createPortfolioSupabase?.() || null;
    if (!client && attempts++ < 40) {
      window.setTimeout(start, 100);
      return;
    }
    if (client) track("page_view");
  }
  start();
})();
