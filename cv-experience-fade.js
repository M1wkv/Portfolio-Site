(() => {
  const track = document.getElementById("cvExperienceList");
  if (!track) return;

  const updateEdges = () => {
    const remaining = Math.max(0, track.scrollWidth - track.clientWidth);
    track.classList.toggle("can-scroll-left", track.scrollLeft > 2);
    track.classList.toggle("can-scroll-right", track.scrollLeft < remaining - 2);
  };

  track.addEventListener("scroll", updateEdges, { passive: true });
  window.addEventListener("resize", updateEdges);
  new ResizeObserver(updateEdges).observe(track);
  new MutationObserver(updateEdges).observe(track, { childList: true });
  updateEdges();
})();
