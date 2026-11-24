(() => {
  const MOBILE_BREAKPOINT = 980;
  const SLIDE_WIDTH = 1600;
  const SLIDE_HEIGHT = 900;
  const root = document.documentElement;
  const portfolio = document.querySelector(".portfolio");
  const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
  const isTouchDevice =
    navigator.maxTouchPoints > 0 || window.matchMedia("(pointer: coarse)").matches;
  let lastLayoutWidth = 0;
  let mobileMode = mobileQuery.matches;

  if (!portfolio) return;

  const slides = Array.from(portfolio.children).filter((element) =>
    element.matches("section"),
  );

  const updateScale = (layoutWidth = lastLayoutWidth || root.clientWidth) => {
    // Keep the layout width frozen while the user pinches. iOS Safari may
    // report changing client widths during native zoom, which must not alter
    // the slide's own scale or frame height.
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
      updateScale(lastLayoutWidth);
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

    updateScale(root.clientWidth);

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
    if (mobileMode) {
      enterMobileSlides();
    } else {
      leaveMobileSlides();
    }
  };

  const refreshAfterRealLayoutChange = () => {
    const visualScale = window.visualViewport?.scale || 1;
    if (Math.abs(visualScale - 1) > 0.02) return;

    const layoutWidth = root.clientWidth;
    mobileMode = layoutWidth <= MOBILE_BREAKPOINT;
    lastLayoutWidth = 0;
    syncLayout();
    if (mobileMode) updateScale(layoutWidth);
  };

  syncLayout();

  window.addEventListener(
    "orientationchange",
    () => {
      window.requestAnimationFrame(() =>
        window.requestAnimationFrame(refreshAfterRealLayoutChange),
      );
    },
    { passive: true },
  );

  // Desktop window resizing still needs to switch layouts. Touch devices use
  // orientationchange only, so pinch-to-zoom can never trigger a re-layout.
  if (!isTouchDevice) {
    window.addEventListener("resize", refreshAfterRealLayoutChange, {
      passive: true,
    });
  }
})();
