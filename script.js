// ==================== NAVBAR SCROLL EFFECT ====================
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 100);
    }
});

// ==================== PRIVACY NOTICE BANNER ====================
(function () {
    const banner = document.getElementById('privacyNotice');
    const btn    = document.getElementById('dismissPrivacyNotice');
    if (!banner) return;
    try {
        if (localStorage.getItem('aurbon_privacy_dismissed') === '1') {
            banner.hidden = true;
        }
    } catch (_) {}
    if (btn) {
        btn.addEventListener('click', function () {
            banner.hidden = true;
            try { localStorage.setItem('aurbon_privacy_dismissed', '1'); } catch (_) {}
        });
    }
})();

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobileViewport = window.matchMedia('(max-width: 768px)').matches;
const isFinePointer = window.matchMedia('(pointer: fine)').matches && window.innerWidth > 900;

// ==================== KINETIC HERO HEADLINE SPLIT ====================
// Split the bright headline line into per-word spans so the CSS mask-reveal
// (.kinetic-word / .kinetic-word-inner) has something to animate. Runs
// before the preloader hands off so the spans exist from the first paint.
(function splitHeroHeadline() {
    const el = document.querySelector('.hero-headline-bright');
    if (!el) return;
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) =>
        `<span class="kinetic-word"><span class="kinetic-word-inner" style="--d:${i * 70}ms">${w}</span></span>`
    ).join(' ');
})();

// ==================== PRELOADER ====================
// A brief intro before the hero reveals itself: the signature mark draws
// itself on stroke by stroke (like it's being painted), timed alongside a
// percentage counter. The hero's entrance (including the kinetic headline)
// triggers the moment the preloader finishes, so the two feel like one
// coordinated moment rather than a veil lifting on a page that then
// separately fades in.
(function preloaderSequence() {
    const preloader = document.getElementById('preloader');
    const heroContent = document.querySelector('.hero-content');

    function revealHero() {
        if (heroContent) heroContent.classList.add('in-view');
    }

    if (!preloader) { revealHero(); return; }

    if (reduceMotion) {
        preloader.classList.add('done');
        revealHero();
        return;
    }

    document.body.style.overflow = 'hidden';
    const countEl = document.getElementById('preloaderCount');
    const fillEl = document.getElementById('preloaderFill');
    const duration = 1700;
    const start = performance.now();

    // Draw the signature: each path gets a dasharray/dashoffset equal to its
    // own length, then they're animated to 0 in sequence (delay/duration
    // proportional to each path's share of the total ink), so it reads as
    // one continuous pen stroke rather than several pieces popping in at once.
    const sigSvg = document.getElementById('preloaderSignature');
    if (sigSvg) {
        const paths = Array.from(sigSvg.querySelectorAll('path'));
        const lengths = paths.map(p => p.getTotalLength());
        const totalLength = lengths.reduce((a, b) => a + b, 0) || 1;
        let cumulative = 0;
        paths.forEach((p, i) => {
            const len = lengths[i];
            p.style.strokeDasharray = String(len);
            p.style.strokeDashoffset = String(len);
            const delay = (cumulative / totalLength) * duration;
            const segDuration = Math.max(90, (len / totalLength) * duration);
            p.style.transition = `stroke-dashoffset ${segDuration}ms ease-out ${delay}ms`;
            cumulative += len;
        });
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                paths.forEach(p => { p.style.strokeDashoffset = '0'; });
            });
        });
    }

    function finish() {
        preloader.classList.add('done');
        document.body.style.overflow = '';
        revealHero();
    }

    function tick(now) {
        const t = Math.min(1, (now - start) / duration);
        const pct = Math.round(t * 100);
        if (countEl) countEl.textContent = pct;
        if (fillEl) fillEl.style.width = pct + '%';
        if (t < 1) {
            requestAnimationFrame(tick);
        } else {
            finish();
        }
    }
    requestAnimationFrame(tick);

    // Safety net: never let a stalled tab leave the preloader stuck forever.
    setTimeout(finish, 3200);
})();

// ==================== SNOW LOGOS ====================
// Small brand marks drifting down through the hero like snow. Generated
// once at load (desktop/mobile get different counts), gated out entirely
// under prefers-reduced-motion (handled in CSS, but skip the DOM work too).
if (!reduceMotion) {
    const snowContainer = document.getElementById('snowLogos');
    if (snowContainer) {
        const count = isMobileViewport ? 10 : 22;
        const frag = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            const img = document.createElement('img');
            img.src = 'main_logo.png';
            img.alt = '';
            img.className = 'snow-logo';
            const size = 12 + Math.random() * 22;
            img.style.setProperty('--sx', (Math.random() * 100) + '%');
            img.style.setProperty('--size', size + 'px');
            img.style.setProperty('--dur', (11 + Math.random() * 12) + 's');
            img.style.setProperty('--delay', (-Math.random() * 20) + 's');
            img.style.setProperty('--drift', (Math.random() * 90 - 45) + 'px');
            img.style.setProperty('--spin', (Math.random() * 300 - 150) + 'deg');
            img.style.setProperty('--peak', (0.25 + Math.random() * 0.35).toFixed(2));
            frag.appendChild(img);
        }
        snowContainer.appendChild(frag);
    }
}

// ==================== SCROLL REVEAL ====================
if (!reduceMotion) {
    const revealEls = document.querySelectorAll(
        '.perf-card, .racket-showcase-row, .youre-early-inner, .testing-inner, .design-inner, .story-content, .launch-inner'
    );
    revealEls.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in-view');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
}

// ==================== SCROLL PARALLAX ====================
// Subtle depth parallax on the hero and showcase product shots — desktop/
// tablet only (disabled on mobile and whenever prefers-reduced-motion is
// set, since a scroll-coupled transform is exactly the kind of thing that
// feels janky on a weaker mobile GPU). No hover/tilt interaction on the
// racket images — scroll position is the only thing driving their transform.
if (!reduceMotion && !isMobileViewport) {
    const heroImgs = Array.from(document.querySelectorAll('.hero-media-img'));
    const showcaseImgs = Array.from(document.querySelectorAll('.racket-showcase-img'));

    let ticking = false;
    function onScrollParallax() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            const y = window.scrollY;

            heroImgs.forEach(img => {
                const factor = img.classList.contains('hero-media-img-left') ? 0.07 : 0.12;
                img.style.transform = `translateY(${y * factor}px)`;
            });

            showcaseImgs.forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                    img.style.transform = `translateY(${(progress - 0.5) * 36}px)`;
                }
            });

            ticking = false;
        });
    }
    window.addEventListener('scroll', onScrollParallax, { passive: true });
}

// ==================== CUSTOM CURSOR (dot + trailing ring + ambient glow) ====================
if (!reduceMotion && isFinePointer) {
    document.body.classList.add('custom-cursor-active');

    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    const glow = document.getElementById('cursorGlow');

    let mouseX = -100, mouseY = -100;
    let ringX = -100, ringY = -100;
    let hasMoved = false;

    window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        hasMoved = true;
        if (dot) {
            dot.style.setProperty('--cx', mouseX + 'px');
            dot.style.setProperty('--cy', mouseY + 'px');
        }
        if (glow) {
            glow.style.setProperty('--cx', mouseX + 'px');
            glow.style.setProperty('--cy', mouseY + 'px');
            glow.classList.add('active');
        }
    }, { passive: true });

    document.addEventListener('mouseleave', () => { if (glow) glow.classList.remove('active'); });

    function lerpRing() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        if (ring && hasMoved) {
            ring.style.setProperty('--rx', ringX + 'px');
            ring.style.setProperty('--ry', ringY + 'px');
        }
        requestAnimationFrame(lerpRing);
    }
    requestAnimationFrame(lerpRing);

    document.querySelectorAll('a, button, .perf-card, .racket-showcase-img-wrap').forEach(el => {
        el.addEventListener('mouseenter', () => { if (ring) ring.classList.add('hover'); });
        el.addEventListener('mouseleave', () => { if (ring) ring.classList.remove('hover'); });
    });
}

// ==================== MAGNETIC BUTTONS ====================
if (!reduceMotion && isFinePointer) {
    document.querySelectorAll('.btn-primary, .btn-nav-launch--primary').forEach(el => {
        el.addEventListener('mousemove', (e) => {
            const rect = el.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            el.style.transform = `translate(${x * 0.22}px, ${y * 0.22 - 3}px) scale(1.03)`;
        });
        el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
}
