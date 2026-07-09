/* =========================================================
   Special Delivery — script.js
   JS vanilla, sin dependencias. Responsabilidades:
   1) Menú de navegación móvil
   2) Carrusel de videos (flechas, dots, swipe táctil, autoplay)
   3) Facade de YouTube: solo crea el <iframe> al hacer click
   4) Header que gana sombra al hacer scroll
   5) Scroll-reveal de secciones (IntersectionObserver)
   6) Contador de miembros conectados en Discord (API pública de invitaciones)
   7) Scroll horizontal tipo carrusel en "Acerca de la Guild"
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
  var track = document.getElementById('carouselTrack');
  var prevBtn = document.getElementById('carouselPrev');
  var nextBtn = document.getElementById('carouselNext');
  var dotsWrap = document.getElementById('carouselDots');

  if (track && prevBtn && nextBtn && dotsWrap) {
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

  /* ---------- 7) Scroll horizontal tipo carrusel ("Acerca de la Guild") ---------- */
  // Por defecto el HTML ya se ve bien apilado normalmente (progressive
  // enhancement). Solo si hay más de un panel y el usuario no pidió menos
  // movimiento, se activa el "pin" con position:sticky + translateX según
  // el progreso de scroll dentro del contenedor alto (.hscroll).
  var hscroll = document.getElementById('hscrollHistoria');

  if (hscroll && !prefersReducedMotion) {
    var hscrollSticky = hscroll.querySelector('.hscroll-sticky');
    var hscrollTrack = hscroll.querySelector('.hscroll-track');
    var hscrollPanels = Array.prototype.slice.call(hscrollTrack.children);

    if (hscrollPanels.length > 1) {
      hscroll.classList.add('hscroll-enabled');
      hscroll.style.height = (hscrollPanels.length * 100) + 'vh';

      var hscrollTicking = false;

      function updateHscroll() {
        var rect = hscroll.getBoundingClientRect();
        var scrollableDistance = hscroll.offsetHeight - window.innerHeight;
        var progress = scrollableDistance > 0 ? (-rect.top) / scrollableDistance : 0;
        progress = Math.max(0, Math.min(1, progress));

        var maxTranslate = hscrollTrack.scrollWidth - hscrollSticky.clientWidth;
        hscrollTrack.style.transform = 'translateX(-' + (progress * maxTranslate) + 'px)';
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

})();
