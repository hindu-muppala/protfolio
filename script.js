(function () {
  "use strict";

  const body = document.body;
  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navMenu = document.querySelector("[data-nav-menu]");
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const sections = Array.from(document.querySelectorAll("main section[id]"));
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const year = document.querySelector("[data-year]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  function setHeaderState() {
    if (!header) {
      return;
    }
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  function closeMenu() {
    if (!navToggle || !navMenu) {
      return;
    }
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    navMenu.classList.remove("is-open");
    body.classList.remove("nav-open");
  }

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
      navMenu.classList.toggle("is-open", !isOpen);
      body.classList.toggle("nav-open", !isOpen);
    });

    navLinks.forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });

    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }

          const activeLink = document.querySelector('.nav-links a[href="#' + entry.target.id + '"]');
          navLinks.forEach(function (link) {
            link.classList.toggle("is-active", link === activeLink);
          });
        });
      },
      {
        rootMargin: "-38% 0px -52% 0px",
        threshold: 0.01
      }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  } else {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  }

  const canvas = document.getElementById("hero-canvas");
  const context = canvas ? canvas.getContext("2d") : null;
  let particles = [];
  let pointer = { x: null, y: null };
  let animationFrame = null;

  function particleCount() {
    if (window.innerWidth < 520) {
      return 34;
    }
    if (window.innerWidth < 900) {
      return 48;
    }
    return 70;
  }

  function resizeCanvas() {
    if (!canvas || !context) {
      return;
    }

    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const bounds = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(bounds.width * ratio));
    canvas.height = Math.max(1, Math.floor(bounds.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    particles = Array.from({ length: particleCount() }, function () {
      return {
        x: Math.random() * bounds.width,
        y: Math.random() * bounds.height,
        vx: (Math.random() - 0.5) * 0.34,
        vy: (Math.random() - 0.5) * 0.34,
        radius: 1.4 + Math.random() * 2.2
      };
    });
  }

  function drawNetwork() {
    if (!canvas || !context) {
      return;
    }

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.clearRect(0, 0, width, height);

    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#07111f");
    gradient.addColorStop(0.55, "#0b1b2d");
    gradient.addColorStop(1, "#09121e");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i += 1) {
      const point = particles[i];

      if (!reducedMotion.matches) {
        point.x += point.vx;
        point.y += point.vy;

        if (point.x < -10) {
          point.x = width + 10;
        } else if (point.x > width + 10) {
          point.x = -10;
        }

        if (point.y < -10) {
          point.y = height + 10;
        } else if (point.y > height + 10) {
          point.y = -10;
        }

        if (pointer.x !== null && pointer.y !== null) {
          const dx = point.x - pointer.x;
          const dy = point.y - pointer.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120 && distance > 0) {
            point.x += (dx / distance) * 0.16;
            point.y += (dy / distance) * 0.16;
          }
        }
      }

      for (let j = i + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = point.x - other.x;
        const dy = point.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = width < 760 ? 108 : 142;

        if (distance < maxDistance) {
          const opacity = 1 - distance / maxDistance;
          context.strokeStyle = "rgba(34, 211, 238, " + (opacity * 0.22).toFixed(3) + ")";
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(point.x, point.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }

      context.fillStyle = "rgba(245, 248, 251, 0.72)";
      context.beginPath();
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = "rgba(52, 211, 153, 0.05)";
    context.fillRect(width * 0.72, 0, width * 0.28, height);

    if (!reducedMotion.matches) {
      animationFrame = requestAnimationFrame(drawNetwork);
    }
  }

  if (canvas && context) {
    resizeCanvas();
    drawNetwork();

    window.addEventListener("resize", function () {
      window.clearTimeout(window.__portfolioResizeTimer);
      window.__portfolioResizeTimer = window.setTimeout(function () {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        resizeCanvas();
        drawNetwork();
      }, 120);
    });

    window.addEventListener("pointermove", function (event) {
      const bounds = canvas.getBoundingClientRect();
      pointer.x = event.clientX - bounds.left;
      pointer.y = event.clientY - bounds.top;
    }, { passive: true });

    window.addEventListener("pointerleave", function () {
      pointer = { x: null, y: null };
    });
  }
}());
