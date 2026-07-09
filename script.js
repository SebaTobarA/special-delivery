/* =========================================================
   Special Delivery — script.js
   JS vanilla, sin dependencias. Responsabilidades:
   1) Menú de navegación móvil
   2) Carrusel de videos (flechas, dots, swipe táctil, autoplay)
   3) Facade de YouTube: solo crea el <iframe> al hacer click
   4) Header que gana sombra al hacer scroll
   5) Scroll-reveal de secciones (IntersectionObserver)
   6) Contador de miembros conectados en Discord (API pública de invitaciones)
   7) Scroll horizontal con relato por pasos en "Acerca de la Guild"
   8) Partículas de fondo decorativas en "Acerca de la Guild"
   ========================================================= */

(function () {
  'use strict';

  // Se respeta en todo el archivo: sin animaciones de movimiento continuo
  // (autoplay del carrusel, etc.) para quien prefiere menos motion.
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 1) Menú móvil ---------- */
  var navToggle = document.getElementById('navToggle');
  var primaryNav = document.getElementById('primaryNav');

  if (navToggle && primaryNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = primaryNav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Cierra el menú al elegir un link (mejora la navegación en mobile)
    primaryNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        primaryNav.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 2) Carrusel de videos ---------- */
  // Lista editable de videos (máximo 10). Para sumar uno nuevo, agregá un
  // objeto con el ID del video de YouTube (lo que va después de "v=" en la
  // URL), el título, el nombre del canal y el mes de publicación ("AAAA-MM").
  // TODO: reemplazar por los videos reales de
  // https://www.youtube.com/@SpecialDeliveryRO y https://www.youtube.com/@StyanSnow
  var VIDEOS = [
    { videoId: 'dQw4w9WgXcQ', title: '[Placeholder] Título del video 1', channel: 'Special Delivery - Ragnarok Online', date: '2026-01' },
    { videoId: 'dQw4w9WgXcQ', title: '[Placeholder] Título del video 2', channel: 'Styan', date: '2025-12' },
    { videoId: 'dQw4w9WgXcQ', title: '[Placeholder] Título del video 3', channel: 'Special Delivery - Ragnarok Online', date: '2025-11' }
  ].slice(0, 10);

  var MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

  function formatVideoDate(yyyyMm) {
    var parts = yyyyMm.split('-');
    var monthName = MONTH_NAMES_ES[parseInt(parts[1], 10) - 1] || '';
    return monthName + ' ' + parts[0];
  }

  var PLAY_ICON_SVG = '<svg viewBox="0 0 68 48" width="68" height="48"><path d="M66.5 7.7c-.8-3-2.9-5.3-5.7-6.1C55.8 0 34 0 34 0S12.2 0 7.2 1.6C4.4 2.4 2.3 4.7 1.5 7.7 0 13 0 24 0 24s0 11 1.5 16.3c.8 3 2.9 5.3 5.7 6.1C12.2 48 34 48 34 48s21.8 0 26.8-1.6c2.8-.8 4.9-3.1 5.7-6.1C68 35 68 24 68 24s0-11-1.5-16.3z" fill="#4dd8e8" opacity="0.9"/><path d="M45 24 27 14v20z" fill="#0a0a0d"/></svg>';
  var CALENDAR_ICON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7 2v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm12 6v11H5V8h14Z"/></svg>';

  var track = document.getElementById('carouselTrack');
  var prevBtn = document.getElementById('carouselPrev');
  var nextBtn = document.getElementById('carouselNext');
  var dotsWrap = document.getElementById('carouselDots');

  if (track && prevBtn && nextBtn && dotsWrap && VIDEOS.length) {
    // Arma cada slide: miniatura (facade lazy-load) + título + canal + fecha
    VIDEOS.forEach(function (video) {
      var slide = document.createElement('div');
      slide.className = 'carousel-slide';

      var facade = document.createElement('div');
      facade.className = 'yt-facade';
      facade.setAttribute('data-video-id', video.videoId);
      facade.setAttribute('role', 'button');
      facade.setAttribute('tabindex', '0');
      facade.setAttribute('aria-label', 'Reproducir video: ' + video.title);
      facade.innerHTML =
        '<img class="yt-thumb" src="https://i.ytimg.com/vi/' + encodeURIComponent(video.videoId) + '/hqdefault.jpg" ' +
        'alt="Miniatura: ' + video.title + '" loading="lazy">' +
        '<span class="yt-play" aria-hidden="true">' + PLAY_ICON_SVG + '</span>';

      var meta = document.createElement('div');
      meta.className = 'yt-meta';
      meta.innerHTML =
        '<p class="yt-title"></p>' +
        '<div class="yt-meta-row">' +
        '<span class="yt-channel"></span>' +
        '<span class="yt-date">' + CALENDAR_ICON_SVG + '<span></span></span>' +
        '</div>';
      meta.querySelector('.yt-title').textContent = video.title;
      meta.querySelector('.yt-channel').textContent = video.channel;
      meta.querySelector('.yt-date span').textContent = formatVideoDate(video.date);

      slide.appendChild(facade);
      slide.appendChild(meta);
      track.appendChild(slide);
    });

    var slides = Array.prototype.slice.call(track.children);
    var current = 0;

    // Genera los dots dinámicamente según la cantidad de slides
    slides.forEach(function (_, index) {
      var dot = document.createElement('button');
      dot.className = 'carousel-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', 'Ir al video ' + (index + 1));
      dot.addEventListener('click', function () {
        goTo(index);
      });
      dotsWrap.appendChild(dot);
    });

    var dots = Array.prototype.slice.call(dotsWrap.children);

    function update() {
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      update();
    }

    prevBtn.addEventListener('click', function () {
      goTo(current - 1);
    });

    nextBtn.addEventListener('click', function () {
      goTo(current + 1);
    });

    // El track necesita transición + layout en fila para el translateX
    track.style.transition = 'transform 0.3s ease';
    track.style.willChange = 'transform';

    // Swipe táctil (mobile)
    var touchStartX = 0;
    var touchDeltaX = 0;

    track.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchDeltaX = 0;
    }, { passive: true });

    track.addEventListener('touchmove', function (e) {
      touchDeltaX = e.touches[0].clientX - touchStartX;
    }, { passive: true });

    track.addEventListener('touchend', function () {
      var SWIPE_THRESHOLD = 40;
      if (touchDeltaX > SWIPE_THRESHOLD) {
        goTo(current - 1);
      } else if (touchDeltaX < -SWIPE_THRESHOLD) {
        goTo(current + 1);
      }
    });

    update();

    // Autoplay suave: avanza solo, se pausa con hover/foco/touch y se
    // detiene para siempre apenas se carga un video real (ver sección 3).
    var AUTOPLAY_MS = 6000;
    var autoplayTimer = null;

    function startAutoplay() {
      if (prefersReducedMotion || autoplayTimer || slides.length < 2) return;
      autoplayTimer = window.setInterval(function () {
        goTo(current + 1);
      }, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }

    var carouselEl = document.getElementById('videoCarousel');
    carouselEl.addEventListener('pointerenter', stopAutoplay);
    carouselEl.addEventListener('pointerleave', startAutoplay);
    carouselEl.addEventListener('focusin', stopAutoplay);
    carouselEl.addEventListener('focusout', startAutoplay);
    carouselEl.addEventListener('touchstart', stopAutoplay, { passive: true });

    startAutoplay();

    // La sección 3 llama a esto al reproducir un video para no seguir avanzando encima
    var stopCarouselAutoplay = stopAutoplay;
  }

  /* ---------- 3) Facade de YouTube (lazy-load real) ---------- */
  // No se inserta ningún <iframe> hasta que el usuario hace click,
  // así el carrusel no carga varios reproductores de YouTube de entrada.
  function loadYouTubeVideo(facade) {
    var videoId = facade.getAttribute('data-video-id');
    if (!videoId) return;

    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + encodeURIComponent(videoId) + '?autoplay=1';
    iframe.title = 'Video de Special Delivery';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.loading = 'lazy';

    facade.replaceWith(iframe);
  }

  document.querySelectorAll('.yt-facade').forEach(function (facade) {
    facade.addEventListener('click', function () {
      loadYouTubeVideo(facade);
      if (typeof stopCarouselAutoplay === 'function') stopCarouselAutoplay();
    });

    // Accesible por teclado (Enter / Espacio) ya que es un elemento con role="button"
    facade.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadYouTubeVideo(facade);
        if (typeof stopCarouselAutoplay === 'function') stopCarouselAutoplay();
      }
    });
  });

  /* ---------- 4) Header con sombra al hacer scroll ---------- */
  var siteHeader = document.querySelector('.site-header');

  if (siteHeader) {
    var ticking = false;

    function updateHeaderState() {
      siteHeader.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(updateHeaderState);
        ticking = true;
      }
    }, { passive: true });

    updateHeaderState();
  }

  /* ---------- 5) Scroll-reveal con IntersectionObserver ---------- */
  var revealEls = document.querySelectorAll('.reveal');

  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Sin soporte de IntersectionObserver: mostrar todo directamente
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---------- 6) Conectados en Discord ---------- */
  // Usa la API pública de invitaciones de Discord (sin autenticación, sin
  // necesidad de habilitar el widget del server). Si falla o el servidor
  // bloquea la petición, el badge queda oculto y el botón sigue funcionando
  // como un link normal a Discord.
  var DISCORD_INVITE_CODE = 'XnTrEKEGw';
  var DISCORD_REFRESH_MS = 60000;

  function updateDiscordOnlineCount() {
    fetch('https://discord.com/api/v10/invites/' + DISCORD_INVITE_CODE + '?with_counts=true')
      .then(function (res) {
        if (!res.ok) throw new Error('Discord invite request failed');
        return res.json();
      })
      .then(function (data) {
        var online = data.approximate_presence_count;
        if (typeof online !== 'number') return;

        // Visualmente solo se muestra el número (el punto verde ya indica "en línea"),
        // pero se deja un aria-label con la frase completa para lectores de pantalla.
        document.querySelectorAll('[data-discord-online-count]').forEach(function (el) {
          el.textContent = String(online);
        });
        document.querySelectorAll('[data-discord-online]').forEach(function (el) {
          el.hidden = false;
          el.setAttribute('aria-label', online + (online === 1 ? ' conectado' : ' conectados'));
        });
      })
      .catch(function () {
        // Silencioso a propósito: sin conteo, el botón es un link normal.
      });
  }

  updateDiscordOnlineCount();
  window.setInterval(updateDiscordOnlineCount, DISCORD_REFRESH_MS);

  /* ---------- 7) Scroll horizontal con relato por pasos ("Acerca de la Guild") ---------- */
  // Por defecto el HTML ya se ve bien apilado normalmente y 100% legible
  // (progressive enhancement). Solo si hay soporte y sin prefers-reduced-motion
  // se arma una "línea de tiempo" con dos tipos de paso:
  //   - "chapter": el cambio de panel (desliza horizontalmente, ver translateX)
  //   - "beat": un elemento [data-beat] que aparece (fade u slide-left) a
  //     medida que se hace scroll dentro del rango asignado a ese paso.
  var hscroll = document.getElementById('hscrollHistoria');

  if (hscroll && !prefersReducedMotion) {
    var hscrollSticky = hscroll.querySelector('.hscroll-sticky');
    var hscrollTrack = hscroll.querySelector('.hscroll-track');
    var hscrollPanels = Array.prototype.slice.call(hscrollTrack.children);

    var hscrollTimeline = [];
    hscrollPanels.forEach(function (panel, panelIndex) {
      if (panelIndex > 0) {
        hscrollTimeline.push({ type: 'chapter' });
      }
      var beats = panel.querySelectorAll('[data-beat]');
      beats.forEach(function (beatEl) {
        hscrollTimeline.push({
          type: 'beat',
          el: beatEl,
          effect: beatEl.getAttribute('data-beat-effect') || 'fade'
        });
      });
    });

    if (hscrollPanels.length > 1 && hscrollTimeline.length) {
      hscroll.classList.add('hscroll-enabled');

      var HSCROLL_STEP_VH = 42; // alto de scroll dedicado a cada paso del relato
      hscroll.style.height = (hscrollTimeline.length * HSCROLL_STEP_VH) + 'vh';

      var hscrollStepSize = 1 / hscrollTimeline.length;
      var hscrollTicking = false;

      function updateHscroll() {
        var rect = hscroll.getBoundingClientRect();
        var scrollableDistance = hscroll.offsetHeight - window.innerHeight;
        var overallProgress = scrollableDistance > 0 ? (-rect.top) / scrollableDistance : 0;
        overallProgress = Math.max(0, Math.min(1, overallProgress));

        var chapterOffset = 0;

        hscrollTimeline.forEach(function (step, index) {
          var stepStart = index * hscrollStepSize;
          var localProgress = (overallProgress - stepStart) / hscrollStepSize;
          localProgress = Math.max(0, Math.min(1, localProgress));

          if (step.type === 'chapter') {
            chapterOffset += localProgress;
            return;
          }

          step.el.style.opacity = String(localProgress);
          step.el.style.transform = step.effect === 'slide-left'
            ? 'translateX(' + ((1 - localProgress) * 70) + 'px)'
            : 'translateY(' + ((1 - localProgress) * 16) + 'px)';
        });

        hscrollTrack.style.transform = 'translateX(-' + (chapterOffset * hscrollSticky.clientWidth) + 'px)';
        hscrollTicking = false;
      }

      window.addEventListener('scroll', function () {
        if (!hscrollTicking) {
          window.requestAnimationFrame(updateHscroll);
          hscrollTicking = true;
        }
      }, { passive: true });

      window.addEventListener('resize', updateHscroll);
      updateHscroll();
    }
  }

  /* ---------- 8) Partículas de fondo decorativas ---------- */
  // Puramente visuales (aria-hidden en el HTML). Se generan una sola vez con
  // posiciones/tamaños/tiempos aleatorios y luego animan solo con CSS (sin
  // costo de JS continuo). Se omiten directamente con prefers-reduced-motion.
  var particlesContainer = document.getElementById('aboutParticles');

  if (particlesContainer && !prefersReducedMotion) {
    var PARTICLE_COUNT = 26;

    for (var i = 0; i < PARTICLE_COUNT; i++) {
      var particle = document.createElement('span');
      var size = 2 + Math.random() * 3;
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      particle.style.width = size + 'px';
      particle.style.height = size + 'px';
      particle.style.opacity = String(0.15 + Math.random() * 0.35);
      particle.style.animationDuration = (4 + Math.random() * 5) + 's';
      particle.style.animationDelay = (Math.random() * 6) + 's';
      if (i % 3 === 0) {
        particle.style.background = 'var(--color-secondary)';
      }
      particlesContainer.appendChild(particle);
    }
  }

})();
