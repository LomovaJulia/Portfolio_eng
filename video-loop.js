const showreel = document.querySelector("#showreel-video");

if (showreel) {
  showreel.muted = true;
  showreel.loop = true;
  let showreelInView = true;

  const nativeZoomActive = () => {
    const scale = window.visualViewport?.scale || 1;
    return Math.abs(scale - 1) > 0.02;
  };

  const keepShowreelPlaying = () => {
    const shouldPlay =
      document.visibilityState === "visible" &&
      showreelInView &&
      !nativeZoomActive();

    if (!shouldPlay && !showreel.paused) {
      showreel.pause();
      return;
    }

    if (shouldPlay && showreel.paused) {
      showreel.play().catch(() => {});
    }
  };

  window.addEventListener("load", keepShowreelPlaying);
  document.addEventListener("visibilitychange", keepShowreelPlaying);
  showreel.addEventListener("canplay", keepShowreelPlaying);
  showreel.addEventListener("pause", keepShowreelPlaying);

  if ("IntersectionObserver" in window) {
    const showreelObserver = new IntersectionObserver(
      ([entry]) => {
        showreelInView = Boolean(entry?.isIntersecting);
        keepShowreelPlaying();
      },
      { threshold: 0.01 },
    );
    showreelObserver.observe(showreel);
  }

  window.visualViewport?.addEventListener("resize", keepShowreelPlaying, {
    passive: true,
  });
}

const clickVideos = [...document.querySelectorAll("[data-click-video]")];

const getVideoCard = (video) =>
  video.closest("[data-video-card]") || video.closest(".phone");

const prepareClickVideo = (video) => {
  video.setAttribute("preload", "auto");
  video.playsInline = true;

  if (
    video.dataset.preloadStarted !== "true" &&
    video.readyState < HTMLMediaElement.HAVE_FUTURE_DATA
  ) {
    video.dataset.preloadStarted = "true";
    video.load();
  }
};

const setVideoLoading = (video, loading) => {
  const videoCard = getVideoCard(video);
  const playButton = videoCard?.querySelector("[data-video-play], .phone-play");
  videoCard?.classList.toggle("is-loading", loading);
  playButton?.setAttribute("aria-busy", String(loading));
};

const playClickVideo = async (selectedVideo) => {
  clickVideos.forEach((video) => {
    if (video !== selectedVideo) {
      video.pause();
      video.currentTime = 0;
    }
  });

  const selectedCard = getVideoCard(selectedVideo);
  selectedCard?.classList.remove("show-end-card");
  selectedCard?.classList.remove("play-error");

  if (
    Number.isFinite(selectedVideo.duration) &&
    selectedVideo.currentTime >= selectedVideo.duration - 0.2
  ) {
    selectedVideo.currentTime = 0;
  }

  prepareClickVideo(selectedVideo);
  setVideoLoading(
    selectedVideo,
    selectedVideo.readyState < HTMLMediaElement.HAVE_FUTURE_DATA,
  );
  selectedVideo.muted = false;

  try {
    await selectedVideo.play();
  } catch (error) {
    // Some mobile browsers still reject audible playback after a delayed
    // media request. Fall back to muted playback instead of leaving a dead UI.
    selectedVideo.muted = true;

    try {
      await selectedVideo.play();
    } catch (fallbackError) {
      setVideoLoading(selectedVideo, false);
      selectedCard?.classList.add("play-error");
      console.warn("Video playback failed", error, fallbackError);
    }
  }
};

clickVideos.forEach((video) => {
  const videoCard = getVideoCard(video);
  const playButton = videoCard?.querySelector("[data-video-play], .phone-play");
  let manuallyPaused = false;

  const prepareSelectedVideo = () => prepareClickVideo(video);

  playButton?.addEventListener("pointerdown", prepareSelectedVideo, {
    passive: true,
  });
  playButton?.addEventListener("touchstart", prepareSelectedVideo, {
    passive: true,
  });
  playButton?.addEventListener("click", (event) => {
    event.preventDefault();
    playClickVideo(video);
  });

  video.addEventListener("click", () => {
    if (video.paused) {
      playClickVideo(video);
      return;
    }

    manuallyPaused = true;
    video.pause();
  });

  video.addEventListener("loadstart", () => {
    if (!video.paused) setVideoLoading(video, true);
  });
  video.addEventListener("waiting", () => {
    if (!video.paused) {
      videoCard?.classList.remove("is-playing");
      setVideoLoading(video, true);
    }
  });
  video.addEventListener("playing", () => {
    setVideoLoading(video, false);
    videoCard?.classList.remove("play-error");
    videoCard?.classList.add("is-playing");
  });
  video.addEventListener("pause", () => {
    setVideoLoading(video, false);
    videoCard?.classList.remove("is-playing");

    const stoppedNearEnd =
      video.matches("[data-pink-video]") &&
      Number.isFinite(video.duration) &&
      video.duration > 0 &&
      video.currentTime / video.duration >= 0.75;

    if (!manuallyPaused && stoppedNearEnd) {
      videoCard?.classList.add("show-end-card");
    }

    manuallyPaused = false;
  });
  video.addEventListener("error", () => {
    delete video.dataset.preloadStarted;
    setVideoLoading(video, false);
    videoCard?.classList.remove("is-playing");
    videoCard?.classList.add("play-error");
  });
  video.addEventListener("ended", () => {
    if (video.matches("[data-pink-video]")) {
      videoCard?.classList.remove("is-playing");
      videoCard?.classList.add("show-end-card");
    }
  });
});

const primeSlideVideos = (slide) => {
  if (!slide || slide.dataset.videosPrimed === "true") return;

  const videos = [...slide.querySelectorAll("[data-click-video]")];
  if (!videos.length) return;

  slide.dataset.videosPrimed = "true";
  videos.forEach(prepareClickVideo);
};

const primeHashSlide = () => {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (target?.matches("section")) primeSlideVideos(target);
};

let primeFrame = 0;
const primeNearestSlide = () => {
  primeFrame = 0;
  const slides = [...document.querySelectorAll(".portfolio section")];
  const nearestSlide = slides
    .filter((slide) => slide.getBoundingClientRect().bottom > 0)
    .sort(
      (first, second) =>
        Math.abs(first.getBoundingClientRect().top) -
        Math.abs(second.getBoundingClientRect().top),
    )[0];

  primeSlideVideos(nearestSlide);
};

const scheduleNearestSlidePrime = () => {
  if (primeFrame) return;
  primeFrame = window.requestAnimationFrame(primeNearestSlide);
};

primeHashSlide();
window.requestAnimationFrame(() =>
  window.requestAnimationFrame(scheduleNearestSlidePrime),
);
window.addEventListener("scroll", scheduleNearestSlidePrime, { passive: true });
window.addEventListener("hashchange", () => {
  primeHashSlide();
  scheduleNearestSlidePrime();
});

const isVideoNearViewport = (video) => {
  if (Math.abs((window.visualViewport?.scale || 1) - 1) > 0.02) return true;

  const rect = video.getBoundingClientRect();
  const margin = 120;
  return (
    rect.bottom >= -margin &&
    rect.top <= window.innerHeight + margin &&
    rect.right >= -margin &&
    rect.left <= window.innerWidth + margin
  );
};

if ("IntersectionObserver" in window) {
  const clickVideoObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (
          !entry.isIntersecting &&
          !isVideoNearViewport(entry.target) &&
          !entry.target.paused
        ) {
          entry.target.pause();
        }
      });
    },
    { rootMargin: "120px 0px", threshold: 0.01 },
  );

  clickVideos.forEach((video) => clickVideoObserver.observe(video));
}
