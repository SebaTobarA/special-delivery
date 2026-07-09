/* =========================================================
   Special Delivery — script.js
   JS vanilla, sin dependencias. Tres responsabilidades:
   1) Menú de navegación móvil
   2) Carrusel de videos (flechas, dots, swipe táctil)
   3) Facade de YouTube: solo crea el <iframe> al hacer click
   ========================================================= */

(function () {
  'use strict';

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
    });

    // Accesible por teclado (Enter / Espacio) ya que es un elemento con role="button"
    facade.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        loadYouTubeVideo(facade);
      }
    });
  });

})();
