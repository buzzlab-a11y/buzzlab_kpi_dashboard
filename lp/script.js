// Scroll fade-in animation
const observer = new IntersectionObserver(
  (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
  { threshold: 0.1 }
);

document.querySelectorAll('.feature-card, .problem-item, .channel-item, .benefit-item').forEach(el => {
  el.classList.add('fade-in');
  observer.observe(el);
});

// Animated counter for participant count
const countEl = document.getElementById('count');
if (countEl) {
  const target = parseInt(countEl.textContent, 10);
  let current = Math.max(0, target - 30);
  const timer = setInterval(() => {
    current += 1;
    countEl.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 40);
}
