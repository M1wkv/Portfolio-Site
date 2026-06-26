window.PORTFOLIO_SUPABASE = {
  url: "https://xidxcafcdfmoxxvnjjkl.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpZHhjYWZjZGZtb3h4dm5qamtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0OTE2MTcsImV4cCI6MjA5ODA2NzYxN30.sklmfAkty3s_OpuOeZOtnUZGfN9YmFAU5P6hrnmw15Y",
  bucket: "portfolio"
};

window.createPortfolioSupabase = () => {
  if (!window.supabase || !window.PORTFOLIO_SUPABASE) return null;
  const { url, anonKey } = window.PORTFOLIO_SUPABASE;
  return window.supabase.createClient(url, anonKey);
};
