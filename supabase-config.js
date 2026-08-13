window.PORTFOLIO_SUPABASE = {
  url: "https://xidxcafcdfmoxxvnjjkl.supabase.co",
  publishableKey: "sb_publishable_NqqwEaFUoKm9csGuEXuKWA_7aoUmFk8",
  adminUserId: "eb549008-aaa8-43d8-a7b3-a8feb3acd167",
  bucket: "portfolio"
};

window.createPortfolioSupabase = () => {
  if (!window.supabase || !window.PORTFOLIO_SUPABASE) return null;
  if (window.__portfolioSupabaseClient) return window.__portfolioSupabaseClient;
  const { url, publishableKey } = window.PORTFOLIO_SUPABASE;
  window.__portfolioSupabaseClient = window.supabase.createClient(url, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true
    }
  });
  return window.__portfolioSupabaseClient;
};
