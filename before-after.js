const beforeAfterComparisons = [
  ...document.querySelectorAll("[data-before-after]"),
];

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

beforeAfterComparisons.forEach((comparison) => {
  const range = comparison.querySelector('input[type="range"]');

  if (!range) return;

  let introTimers = [];
  let introStarted = false;
  let pointerStart = null;
  let pointerMoved = false;

  const setPosition = (value, syncRange = true) => {
    const safeValue = Math.max(0, Math.min(100, Number(value)));
    comparison.style.setProperty("--position", `${safeValue}%`);

    if (syncRange) {
      range.value = String(safeValue);
    }
  };

  const stopIntro = () => {
    introTimers.forEach((timer) => window.clearTimeout(timer));
    introTimers = [];
    comparison.classList.remove("is-intro");
  };

  const startIntro = () => {
    if (introStarted || prefersReducedMotion) return;

    introStarted = true;
    comparison.classList.add("is-intro");
    setPosition(50);

    [
      [320, 24],
      [1380, 76],
      [2540, 50],
    ].forEach(([delay, position], index, sequence) => {
      introTimers.push(
        window.setTimeout(() => {
          setPosition(position);

          if (index === sequence.length - 1) {
            comparison.classList.remove("is-intro");
          }
        }, delay),
      );
    });
  };

  range.addEventListener("input", () => {
    setPosition(range.value, false);
  });

  range.addEventListener("pointerdown", (event) => {
    stopIntro();
    pointerStart = event.clientX;
    pointerMoved = false;
    comparison.classList.add("is-dragging");
  });

  range.addEventListener("pointermove", (event) => {
    if (pointerStart === null) return;

    if (Math.abs(event.clientX - pointerStart) > 8) {
      pointerMoved = true;
    }
  });

  const finishPointer = () => {
    comparison.classList.remove("is-dragging");
    pointerStart = null;
  };

  range.addEventListener("pointerup", finishPointer);
  range.addEventListener("pointercancel", finishPointer);

  range.addEventListener("click", (event) => {
    if (pointerMoved) {
      pointerMoved = false;
      return;
    }

    event.preventDefault();
    comparison.classList.remove("is-dragging");

    const showAfter = comparison.dataset.nextSide !== "before";
    comparison.dataset.nextSide = showAfter ? "before" : "after";
    setPosition(showAfter ? 0 : 100);
  });

  range.addEventListener("keydown", stopIntro);
  range.addEventListener("focus", stopIntro);

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    setPosition(50);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;

      startIntro();
      observer.disconnect();
    },
    { threshold: 0.45 },
  );

  observer.observe(comparison);
});
