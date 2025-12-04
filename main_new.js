// IntersectionObserver to activate scrolly after hook
const scrolly = document.getElementById("scrolly");
const hook = document.getElementById("hook");

const observerIntro = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) {
      scrolly.classList.add("active"); // show map + panel after hook scrolls out
    }
  });
}, { threshold: 0.1 });

observerIntro.observe(hook);

// Section activation
(function initScrolly() {
  const sections = Array.from(document.querySelectorAll("#sections section"));
  if (!sections.length) return;

  const activateSection = (el) => {
    sections.forEach(s => s.classList.remove("is-active"));
    el.classList.add("is-active");

    const chapterKey = el.dataset.chapter;
    console.log("Active section:", chapterKey);

    // Hook into your map logic here
    switch (chapterKey) {
      case "1":
        // renderPanel(1); drawMap(); etc.
        break;
      case "2":
        // renderPanel(2);
        break;
      case "3":
        // renderPanel(3);
        break;
      case "4":
        // renderPanel(4);
        break;
      case "conclusion":
        // optional final state
        break;
      default:
        break;
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
        activateSection(entry.target);
      }
    });
  }, {
    threshold: [0.6, 0.8]
  });

  sections.forEach(s => observer.observe(s));
  activateSection(sections[0]);
})();
