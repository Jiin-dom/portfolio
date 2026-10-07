(() => {
  const root = document.documentElement;
  const cursor = document.querySelector(".cursor-dot");
  const menuBtn = document.querySelector(".menu-btn");
  const mobileNav = document.querySelector("#mobile-nav");
  const navLinks = [...document.querySelectorAll(".nav-link[data-section]")];
  const sections = ["intro", "about", "work", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const tiltTarget = document.querySelector("[data-tilt]");
  const reveals = [...document.querySelectorAll(".reveal")];
  const hoverables = [...document.querySelectorAll("a, button, .hero-visual, .project-media")];

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (cursor && finePointer) {
    let x = -100;
    let y = -100;
    let tx = x;
    let ty = y;

    window.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
      cursor.classList.add("is-on");
    });

    window.addEventListener("pointerleave", () => {
      cursor.classList.remove("is-on");
    });

    hoverables.forEach((el) => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-hover"));
    });

    const tick = () => {
      x += (tx - x) * 0.22;
      y += (ty - y) * 0.22;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (tiltTarget && finePointer && !reduceMotion) {
    tiltTarget.addEventListener("pointermove", (e) => {
      const rect = tiltTarget.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      tiltTarget.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 8}deg)`;
      tiltTarget.classList.add("is-hot");
    });

    tiltTarget.addEventListener("pointerleave", () => {
      tiltTarget.style.transform = "";
      tiltTarget.classList.remove("is-hot");
    });
  }

  const setMenu = (open) => {
    if (!menuBtn || !mobileNav) return;
    menuBtn.setAttribute("aria-expanded", String(open));
    mobileNav.hidden = !open;
    document.body.classList.toggle("menu-open", open);
  };

  menuBtn?.addEventListener("click", () => {
    const open = menuBtn.getAttribute("aria-expanded") !== "true";
    setMenu(open);
  });

  mobileNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMenu(false));
  });

  const syncNav = () => {
    const y = window.scrollY + window.innerHeight * 0.28;
    let current = sections[0]?.id || "intro";
    for (const section of sections) {
      if (section.offsetTop <= y) current = section.id;
    }
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.dataset.section === current);
    });
  };

  window.addEventListener("scroll", syncNav, { passive: true });
  syncNav();

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  // Soft parallax on hero title while scrolling intro
  const heroTitle = document.querySelector(".hero-title");
  if (heroTitle && !reduceMotion) {
    window.addEventListener(
      "scroll",
      () => {
        const max = Math.max(window.innerHeight * 0.7, 1);
        const p = Math.min(window.scrollY / max, 1);
        heroTitle.style.transform = `translateY(${p * -36}px)`;
        heroTitle.style.filter = p > 0.05 ? `blur(${p * 4}px)` : "none";
        heroTitle.style.opacity = String(1 - p * 0.55);
      },
      { passive: true }
    );
  }

  root.dataset.ready = "true";
})();
