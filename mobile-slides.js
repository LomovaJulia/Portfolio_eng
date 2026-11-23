(() => {
  const MOBILE_BREAKPOINT = 980;
  const SLIDE_WIDTH = 1600;
  const SLIDE_HEIGHT = 900;
  const root = document.documentElement;
  const portfolio = document.querySelector(".portfolio");

  if (!portfolio) return;

  const slides = Array.from(portfolio.children).filter((element) =>
    element.matches("section"),
  );

  const updateScale = () => {
    const scale = Math.min(1, Math.max(0.18, (window.innerWidth - 20) / SLIDE_WIDTH));
    root.style.setProperty("--mobile-slide-scale", String(scale));
    document.querySelectorAll(".mobile-slide-frame").forEach((frame) => {
      frame.style.height = `${SLIDE_HEIGHT * scale}px`;
    });
  };

  const enterMobileSlides = () => {
    root.classList.add("mobile-slide-mode");

    slides.forEach((slide) => {
      if (slide.parentElement?.classList.contains("mobile-slide-frame")) return;

      const frame = document.createElement("div");
      frame.className = "mobile-slide-frame";
      portfolio.insertBefore(frame, slide);
      frame.appendChild(slide);
    });

    updateScale();

    if (window.location.hash) {
      requestAnimationFrame(() => {
        const target = document.querySelector(window.location.hash);
        target?.parentElement?.scrollIntoView({ block: "start" });
      });
    }
  };

  const leaveMobileSlides = () => {
    document.querySelectorAll(".mobile-slide-frame").forEach((frame) => {
      const slide = frame.firstElementChild;
      if (slide) portfolio.insertBefore(slide, frame);
      frame.remove();
    });

    root.classList.remove("mobile-slide-mode");
    root.style.removeProperty("--mobile-slide-scale");
  };

  const syncLayout = () => {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      enterMobileSlides();
    } else {
      leaveMobileSlides();
    }
  };

  syncLayout();
  window.addEventListener("resize", syncLayout, { passive: true });
})();
