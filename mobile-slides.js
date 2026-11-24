(() => {
  const MOBILE_BREAKPOINT = 980;
  const SLIDE_WIDTH = 1600;
  const SLIDE_HEIGHT = 900;
  const root = document.documentElement;
  const portfolio = document.querySelector(".portfolio");
  const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  let lastLayoutWidth = 0;

  if (!portfolio) return;

  const slides = Array.from(portfolio.children).filter((element) =>
    element.matches("section"),
  );

  const updateScale = () => {
    // Pinch-to-zoom changes the visual viewport and fires many window resize
    // events. The layout viewport stays stable, so use its width and skip
    // duplicate work instead of fighting the browser's native zoom gesture.
    const layoutWidth = root.clientWidth;
    if (!layoutWidth || layoutWidth === lastLayoutWidth) return;

    lastLayoutWidth = layoutWidth;
    const scale = Math.min(1, Math.max(0.18, (layoutWidth - 20) / SLIDE_WIDTH));
    root.style.setProperty("--mobile-slide-scale", String(scale));
    document.querySelectorAll(".mobile-slide-frame").forEach((frame) => {
      frame.style.height = `${SLIDE_HEIGHT * scale}px`;
    });
  };

  const enterMobileSlides = () => {
    if (root.classList.contains("mobile-slide-mode")) {
      updateScale();
      return;
    }

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
    if (!root.classList.contains("mobile-slide-mode")) return;

    document.querySelectorAll(".mobile-slide-frame").forEach((frame) => {
      const slide = frame.firstElementChild;
      if (slide) portfolio.insertBefore(slide, frame);
      frame.remove();
    });

    root.classList.remove("mobile-slide-mode");
    root.style.removeProperty("--mobile-slide-scale");
    lastLayoutWidth = 0;
  };

  const syncLayout = () => {
    if (mobileQuery.matches) {
      enterMobileSlides();
    } else {
      leaveMobileSlides();
    }
  };

  syncLayout();
  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", syncLayout);
  } else {
    mobileQuery.addListener?.(syncLayout);
  }

  if ("ResizeObserver" in window) {
    const layoutObserver = new ResizeObserver(() => {
      if (mobileQuery.matches) updateScale();
    });
    layoutObserver.observe(root);
  } else {
    window.addEventListener(
      "orientationchange",
      () => window.requestAnimationFrame(updateScale),
      { passive: true },
    );
  }
})();
