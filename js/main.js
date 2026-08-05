// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (window.scrollY > 100) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Profile card 3D tilt effect
const profileCard = document.querySelector('.profile-card');
if (profileCard) {
    profileCard.addEventListener('mousemove', (e) => {
        const rect = profileCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 10;
        const rotateY = (centerX - x) / 10;
        
        profileCard.querySelector('.profile-inner').style.transform = 
            `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    profileCard.addEventListener('mouseleave', () => {
        profileCard.querySelector('.profile-inner').style.transform = 
            'rotateX(0) rotateY(0)';
    });
}

/* -------------------------------------------------------------------------
   Scroll reveals

   Was gsap.from({opacity: 0}) driven by ScrollTrigger at start: 'top 80%'.
   Two failures, both measured on this page rather than assumed:

   1. On a tall viewport the elements in the final screenful can never reach
      the 80% line, because the page runs out of scroll distance before they
      get there. They stayed invisible permanently: 7 of 18 at 1920x9000, 6 of
      18 at 3840x2400. That is the "everything disappears when I zoom out"
      report, and it is worst on exactly the large monitors a reviewer uses.
   2. gsap.registerPlugin() ran on line 1, so when the cdnjs fetch failed the
      ReferenceError aborted this entire file. The mobile nav stopped opening
      and the project count silently fell back to its stale hardcoded 7.

   IntersectionObserver reports elements that are already intersecting at
   observe() time, so there is no trigger line to miss, and nothing here
   depends on a third party staying up.

   The old config also had toggleActions ending in 'reverse', which re-hid
   content on the way back up. Reveals are now one-way: unobserve on first
   sight, so nothing that has been read can vanish again.
   ------------------------------------------------------------------------- */
(() => {
    // The inline script in <head> armed a timer to un-hide everything if this
    // file never loaded. It loaded.
    clearTimeout(window.__revealFallback);

    const SELECTOR =
        '.project-card, .publication-card, .contact-left, .contact-right, .social-card';
    const targets = [...document.querySelectorAll(SELECTOR)];
    // Content that waits for a partner element rather than for its own position.
    const late = [...document.querySelectorAll('.reveal-late')];

    const show = (el) => {
        el.classList.add('is-visible');
        // Lets one element pull others in with it, declared in the markup. The
        // Job Intelligence Agent card uses this to bring in the ASCEND research
        // group and tag row as it lands in the slot beside them.
        const also = el.dataset.revealsAlso;
        if (also) document.querySelectorAll(also).forEach(el2 => {
            // Same delay as the puller, so the two start on the same frame.
            // Letting the ASCEND groups trail the JIA card pulled the eye to
            // JIA first and a reader lost their place in the card they were
            // already reading.
            el2.style.animationDelay = el.style.animationDelay;
            el2.classList.add('is-visible');
        });
    };

    const hide = (el) => {
        // Pinned elements are ones the end-of-document guard had to force on.
        // Re-hiding those is how they got stranded in the first place.
        if (el.dataset.revealPinned) return;
        el.classList.remove('is-visible');
        el.style.animationDelay = '';
        const also = el.dataset.revealsAlso;
        if (also) document.querySelectorAll(also).forEach(el2 => el2.classList.remove('is-visible'));
    };

    // Reduced motion is handled in CSS now, as an opacity-only fade, so this no
    // longer short-circuits on it. Skipping the observer entirely would mean no
    // feedback at all for those users, and it was also why the reveals looked
    // dead to anyone browsing with the setting on.
    if (!('IntersectionObserver' in window)) {
        targets.concat(late).forEach(el => el.classList.add('is-visible'));
        return;
    }

    // -20% on the bottom edge so an element is a fifth of the way into the
    // viewport before it starts moving. With no margin at all the whole
    // transition plays while the card is still below the fold and the reveal is
    // invisible: measured firing with the card's top at y=899 of a 900px
    // viewport, which reads as "the animation is gone".
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry, i) => {
            if (entry.isIntersecting) {
                // 0.1s step, the same stagger the GSAP version used. Capped so
                // the tail of a large batch does not sit waiting a full second.
                entry.target.style.animationDelay = Math.min(i, 6) * 100 + 'ms';
                show(entry.target);
            } else if (entry.boundingClientRect.top > 0) {
                // Gone back DOWN past the trigger line, so it can play again on
                // the way in. An element scrolled off the top keeps its revealed
                // state: the GSAP config reversed on leaveBack only, never on
                // leave, and content above you has already been read.
                hide(entry.target);
            }
        });
    }, { rootMargin: '0px 0px -20% 0px', threshold: 0 });

    targets.forEach(el => io.observe(el));

    /* That negative margin reintroduces the very thing this block replaced: a
       line the elements in the final screenful can never cross, because the
       page runs out of scroll distance first. Measured, a -10% margin alone
       stranded the four social cards at 3840x2400.

       This is the guard. At the end of the document, or when the document does
       not scroll at all, anything still hidden is shown outright and pinned so
       the observer cannot take it back. The pretty timing is best-effort; the
       visibility is guaranteed. */
    const sweep = () => {
        const doc = document.documentElement;
        const scrolls = doc.scrollHeight > window.innerHeight;
        if (scrolls && window.innerHeight + window.scrollY < doc.scrollHeight - 4) return;
        targets.forEach(el => {
            if (!el.classList.contains('is-visible')) {
                el.dataset.revealPinned = '1';
                show(el);
            }
        });
        late.forEach(el => el.classList.add('is-visible'));
    };

    let queued = false;
    const onScroll = () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(() => { queued = false; sweep(); });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    sweep();
})();


/* -------------------------------------------------------------------------
   Live stat numbers
   These were hardcoded ("2+", "10+") and needed hand-editing to stay true.
   Years counts from the first professional role; the project count is read
   off the DOM, so adding or removing a card keeps the number honest.
   ------------------------------------------------------------------------- */
(() => {
    const CAREER_START = new Date(2024, 6, 1); // July 2024 - NCDC

    const years = document.querySelector('[data-stat="years"]');
    if (years) {
        const months = (Date.now() - CAREER_START) / (1000 * 60 * 60 * 24 * 30.44);
        years.textContent = Math.max(1, Math.floor(months / 12)) + '+';
    }

    const projects = document.querySelector('[data-stat="projects"]');
    if (projects) {
        projects.textContent = document.querySelectorAll('.project-card').length;
    }

    const year = document.querySelector('[data-current-year]');
    if (year) year.textContent = new Date().getFullYear();
})();


/* -------------------------------------------------------------------------
   Mobile navigation toggle
   The links collapse into a panel below 720px (see css/style.css). Keeps
   aria-expanded in sync so the control is announced correctly, and closes on
   link activation, outside click, or Escape.
   ------------------------------------------------------------------------- */
(() => {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.getElementById('nav-links');
    if (!toggle || !links) return;

    const setOpen = (open) => {
        links.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!links.classList.contains('open'));
    });

    // Navigating to a section should dismiss the panel, not leave it covering
    // the content the user just jumped to.
    links.addEventListener('click', (e) => {
        if (e.target.closest('a')) setOpen(false);
    });

    document.addEventListener('click', (e) => {
        if (!links.classList.contains('open')) return;
        if (!links.contains(e.target) && e.target !== toggle) setOpen(false);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && links.classList.contains('open')) {
            setOpen(false);
            toggle.focus();
        }
    });

    // Returning to a wide viewport must clear the open state, or the desktop
    // nav inherits a stale .open class.
    window.matchMedia('(min-width: 721px)').addEventListener('change', (ev) => {
        if (ev.matches) setOpen(false);
    });
})();


/* -------------------------------------------------------------------------
   Résumé viewer
   Both résumé links keep their real PDF href and target="_blank", so a
   middle click, a disabled-JS visit, or a screen reader still gets a plain
   working link. A plain left click opens this panel instead, so "opened the
   résumé" stops being the same event as "downloaded the résumé".

   Pages are rendered with PDF.js onto <canvas>, not shown via a plugin-
   embedded <iframe>: an embedded PDF renders through whatever native viewer
   (or lack of one) the visitor's browser happens to ship, which is exactly
   the inconsistency this viewer exists to remove. PDF.js is vendored locally
   (assets/vendor/pdfjs/) and only fetched on first open, never on page load.
   ------------------------------------------------------------------------- */
(() => {
    const modal = document.getElementById('resume-modal');
    const body = document.getElementById('resume-modal-body');
    if (!modal || !body || !document.querySelector('[data-resume-trigger]')) return;

    const RESUME_SRC = '/assets/M_SARMAD_SOHAIL_CV.pdf';
    // Dynamic import() requires a real path, not a bare specifier - a
    // leading "assets/..." (no slash) is read as a package name and fails.
    const PDFJS_SRC = '/assets/vendor/pdfjs/pdf.min.mjs';
    const PDFJS_WORKER_SRC = '/assets/vendor/pdfjs/pdf.worker.min.mjs';
    const MAX_ZOOM = 3;
    // How much the zoom changes per wheel "click" - kept low since a
    // standard mouse wheel already fires several of these per notch.
    const ZOOM_SENSITIVITY = 0.0008;
    let lastFocused = null;
    let renderStarted = false;
    let zoomGroup = null;
    // The zoom group is transformed, and a transform doesn't occupy layout
    // space - so a scaled-up document would overflow its scroll container
    // without the container ever growing a scrollbar to match. This sizer is
    // the layout stand-in: an empty box kept at exactly the group's scaled
    // size, so the scroll container sees the real dimensions.
    let sizer = null;
    let pageWraps = [];
    // The group's unscaled layout size, measured once after render - every
    // sizer dimension is this times the current zoom.
    let naturalWidth = 0;
    let naturalHeight = 0;
    let firstPageHeight = 0;
    let zoom = 1;
    // How far out zoom is allowed to go - not a flat 1, since "1" (fit
    // width) can still be taller than the box on a multi-page or dense
    // résumé. Recomputed from the first page's real size, and again on
    // resize: a window that just got shorter needs to zoom out further than
    // it did before to still show a whole page.
    let minZoom = 1;
    const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(minZoom, z));

    // Read from the element rather than hardcoded, since the panel's padding
    // is not the same on a phone as it is on a desktop.
    const bodyPadding = (axis) => {
        const cs = getComputedStyle(body);
        return axis === 'x'
            ? parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
            : parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    };

    const recomputeMinZoom = () => {
        if (!firstPageHeight) return;
        minZoom = Math.min(1, (body.clientHeight - bodyPadding('y')) / firstPageHeight);
    };

    const syncSizer = () => {
        if (!sizer || !naturalWidth) return;
        sizer.style.width = `${naturalWidth * zoom}px`;
        sizer.style.height = `${naturalHeight * zoom}px`;
    };

    const showFallback = () => {
        // Same origin, so this still renders inline in any browser that
        // has a PDF plugin at all - a worse experience than the canvas
        // render, but better than a blank panel.
        body.innerHTML = '';
        const iframe = document.createElement('iframe');
        iframe.src = RESUME_SRC;
        iframe.title = "Muhammad Sarmad Sohail's résumé";
        body.appendChild(iframe);
        zoomGroup = null;
        sizer = null;
    };

    // page.getAnnotations() rects are in PDF user space, not viewport space -
    // this is the same conversion PDF.js's own AnnotationLayer does, done by
    // hand here since only clickable links are needed, not the full editable
    // annotation machinery pdf_viewer.mjs would otherwise pull in.
    const addLinkOverlay = (page, viewport, wrap) => async () => {
        const annotations = await page.getAnnotations();
        const linkLayer = document.createElement('div');
        linkLayer.className = 'resume-link-layer';
        annotations
            .filter(a => a.subtype === 'Link' && a.url)
            .forEach(a => {
                const [x1, y1] = viewport.convertToViewportPoint(a.rect[0], a.rect[1]);
                const [x2, y2] = viewport.convertToViewportPoint(a.rect[2], a.rect[3]);
                const link = document.createElement('a');
                link.href = a.url;
                link.target = '_blank';
                link.rel = 'noopener';
                link.style.left = `${Math.min(x1, x2)}px`;
                link.style.top = `${Math.min(y1, y2)}px`;
                link.style.width = `${Math.abs(x2 - x1)}px`;
                link.style.height = `${Math.abs(y2 - y1)}px`;
                linkLayer.appendChild(link);
            });
        wrap.appendChild(linkLayer);
    };

    const renderResume = async () => {
        if (renderStarted) return;
        renderStarted = true;

        // PDF.js + its worker is a ~1.8MB fetch on first open - without this,
        // that's a blank well with nothing happening for however long that
        // takes. Removed the moment the first page's canvas is in the DOM.
        const loading = document.createElement('div');
        loading.className = 'resume-loading';
        loading.innerHTML = '<span class="resume-spinner" aria-hidden="true"></span>Loading résumé…';
        body.appendChild(loading);

        try {
            const pdfjsLib = await import(PDFJS_SRC);
            pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
            const doc = await pdfjsLib.getDocument({ url: RESUME_SRC }).promise;
            const targetWidth = Math.min(body.clientWidth - bodyPadding('x'), 1000) || 700;
            const onPhone = window.matchMedia('(max-width: 768px)').matches;

            sizer = document.createElement('div');
            sizer.className = 'resume-zoom-sizer';
            zoomGroup = document.createElement('div');
            zoomGroup.className = 'resume-zoom-group';
            sizer.appendChild(zoomGroup);
            body.appendChild(sizer);

            for (let num = 1; num <= doc.numPages; num++) {
                const page = await doc.getPage(num);
                const unscaled = page.getViewport({ scale: 1 });
                // CSS-pixel scale: what the page is actually laid out and
                // clicked/selected at. Capped at 1.4x its natural size so
                // "fit width" doesn't also mean "blurry oversized text" on a
                // narrow document.
                const cssScale = Math.min(targetWidth / unscaled.width, 1.4);
                const cssViewport = page.getViewport({ scale: cssScale });
                // Raster scale: same CSS size, rendered at device-pixel density
                // so the canvas isn't the limiting factor once a visitor zooms.
                //
                // A phone fits A4 into about 370 CSS px, so "fit width" is
                // already a 0.6x reduction of the page - and it's the zoomed-in
                // reading, not the fitted view, that anyone actually reads from
                // there. Hence the higher density cap and the extra headroom
                // above it: at 2x on a 3x screen the fitted view was already
                // softer than the display could show. Bounded on total pixels
                // rather than by the multiplier alone, so a longer document
                // can't quietly ask a phone for a canvas it can't allocate.
                const MAX_CANVAS_PX = 4e6;
                const density = Math.min(window.devicePixelRatio || 1, onPhone ? 3 : 2);
                let rasterScale = cssScale * density * (onPhone ? 1.5 : 1);
                const wanted = (unscaled.width * rasterScale) * (unscaled.height * rasterScale);
                if (wanted > MAX_CANVAS_PX) rasterScale *= Math.sqrt(MAX_CANVAS_PX / wanted);
                const pixelViewport = page.getViewport({ scale: rasterScale });

                const wrap = document.createElement('div');
                wrap.className = 'resume-page-wrap';
                wrap.style.width = `${cssViewport.width}px`;
                wrap.style.height = `${cssViewport.height}px`;

                const canvas = document.createElement('canvas');
                canvas.className = 'resume-page';
                canvas.width = pixelViewport.width;
                canvas.height = pixelViewport.height;
                canvas.style.width = `${cssViewport.width}px`;
                canvas.style.height = `${cssViewport.height}px`;
                wrap.appendChild(canvas);

                const textLayerDiv = document.createElement('div');
                textLayerDiv.className = 'resume-text-layer';
                wrap.appendChild(textLayerDiv);

                zoomGroup.appendChild(wrap);
                pageWraps.push(wrap);

                if (num === 1) {
                    // "Fit width" (zoom 1) can still be taller than the box,
                    // e.g. a dense résumé on a short window - this lets
                    // zooming out go far enough to see the whole first page
                    // at once instead of stopping at a height that still
                    // needs scrolling.
                    firstPageHeight = cssViewport.height;
                    recomputeMinZoom();
                }

                await page.render({ canvasContext: canvas.getContext('2d'), viewport: pixelViewport }).promise;
                loading.remove();

                const textLayer = new pdfjsLib.TextLayer({
                    textContentSource: page.streamTextContent(),
                    container: textLayerDiv,
                    viewport: cssViewport,
                });
                await textLayer.render();

                // Deliberately not awaited - a page is readable the moment its
                // canvas and text are up, and the link overlay is an
                // enhancement on top. Failing to build it shouldn't take the
                // render down with it, hence the catch rather than a throw.
                addLinkOverlay(page, cssViewport, wrap)().catch(() => {});
            }

            // Measured after every page is in, so the sizer has a real
            // unscaled size to multiply by. width:max-content on the group
            // keeps this independent of whatever the sizer is set to, so
            // there's no feedback loop between the two.
            naturalWidth = zoomGroup.offsetWidth;
            naturalHeight = zoomGroup.offsetHeight;
            syncSizer();
        } catch (err) {
            loading.remove();
            showFallback();
        }
    };

    // A small on-screen "140%" while zoom is actively changing, not a
    // permanent fixture - fades in on the first change, fades back out once
    // the wheel/tap has been idle for a moment. Lives on the panel, not the
    // scrolling body, so it stays put in the corner regardless of scroll.
    const zoomIndicator = document.createElement('div');
    zoomIndicator.className = 'resume-zoom-indicator';
    modal.querySelector('.resume-modal-panel').appendChild(zoomIndicator);
    let zoomIndicatorTimer = null;
    const showZoomIndicator = () => {
        zoomIndicator.textContent = `${Math.round(zoom * 100)}%`;
        zoomIndicator.classList.add('visible');
        clearTimeout(zoomIndicatorTimer);
        zoomIndicatorTimer = setTimeout(() => zoomIndicator.classList.remove('visible'), 900);
    };

    // Shared by wheel-zoom and double-click/tap-zoom, so both anchor the same
    // way: vertical follows the cursor, horizontal always re-centres (a résumé
    // is one column, so cursor-anchored horizontal zoom just read as the page
    // sliding sideways).
    //
    // Both are measured rather than predicted - the cursor's position is taken
    // as a fraction of the document before the zoom, then the same fraction is
    // located again afterwards and the difference is scrolled away. An earlier
    // version computed the scroll delta from a formula instead, which was
    // correct but only for the exact layout it assumed; this holds whatever the
    // sizer's auto margins do at a given zoom level (they centre a short
    // document, but collapse to zero once it outgrows the box).
    const applyZoom = (newZoom, clientY) => {
        if (!zoomGroup || !sizer) return;
        const before = sizer.getBoundingClientRect();
        const cursorFraction = before.height ? (clientY - before.top) / before.height : 0;

        zoom = clampZoom(newZoom);
        zoomGroup.style.transform = `scale(${zoom})`;
        syncSizer();

        const after = sizer.getBoundingClientRect();
        const view = body.getBoundingClientRect();
        // Put the line that was under the cursor back under the cursor.
        body.scrollTop += (after.top + cursorFraction * after.height) - clientY;
        // ...and the page's own centre back in the middle of the box. Reads as
        // growing evenly left-right, but unlike scaling from a centred
        // transform-origin, the overflow it creates is all on the scrollable
        // side - so the left margin stays reachable instead of being stranded
        // off the edge where scrollLeft can't reach it.
        body.scrollLeft += (after.left + after.width / 2)
            - (view.left + body.clientLeft + body.clientWidth / 2);
        showZoomIndicator();
    };

    // Ctrl/Cmd + wheel zooms the document instead of the browser page - the
    // listener only exists on this element, so a wheel anywhere else (the
    // toolbar, the backdrop) is untouched and behaves normally.
    body.addEventListener('wheel', (e) => {
        if (!zoomGroup || !(e.ctrlKey || e.metaKey)) return;
        e.preventDefault();
        applyZoom(zoom * Math.exp(-e.deltaY * ZOOM_SENSITIVITY), e.clientY);
    }, { passive: false });

    // Double-click toggles between "fit width" and a comfortable reading
    // bump, rather than cycling through three states - the two-state toggle
    // is the one virtually every reader/viewer app already trained people
    // on, so there's nothing new to learn. Whichever side of the midpoint
    // the current zoom is on decides the direction, so it still does the
    // right thing if the wheel left zoom at some in-between value.
    const DBLCLICK_ZOOM = 1.8;
    // Which kind of pointer was used last, not which kinds the device has.
    //
    // A double-tap that has already zoomed is usually reported as a dblclick
    // as well, and running the toggle a second time lands straight back where
    // it started - which is what "double tap does nothing" was. A 600ms guard
    // was not enough, because mobile Safari synthesises that dblclick late and
    // unevenly; but latching "this device has touched, ignore dblclick
    // forever" is worse. A Surface, a touchscreen laptop, an iPad with a
    // trackpad: one stray touch would have cost that person double-click zoom
    // for the rest of the session, and they would have no idea why.
    //
    // pointerdown reports the type of each interaction as it happens, so both
    // input methods keep working and whichever one is in the visitor's hand
    // right now is the one that gets listened to.
    let lastPointerType = 'mouse';
    if (window.PointerEvent) {
        body.addEventListener('pointerdown', (e) => {
            lastPointerType = e.pointerType || 'mouse';
        }, { passive: true, capture: true });
    }
    // Fallback for anything without pointer events, where a touchstart is the
    // only signal available. Set on touchstart below, cleared on mousedown -
    // a real mouse never fires touchstart, so the two cannot fight.
    let touchUsed = false;
    if (!window.PointerEvent) {
        body.addEventListener('mousedown', () => { touchUsed = false; }, { passive: true });
    }
    const cameFromTouch = () =>
        window.PointerEvent ? lastPointerType === 'touch' : touchUsed;
    const toggleZoom = (clientY) => {
        const midpoint = (1 + DBLCLICK_ZOOM) / 2;
        applyZoom(zoom < midpoint ? DBLCLICK_ZOOM : 1, clientY);
    };

    body.addEventListener('dblclick', (e) => {
        if (!zoomGroup || cameFromTouch()) return;
        e.preventDefault();
        toggleZoom(e.clientY);
        // A double-click on the text layer also selects the word under it,
        // by default - that's a separate browser behaviour dblclick's own
        // preventDefault() doesn't reach, but clearing it explicitly right
        // after does.
        window.getSelection().removeAllRanges();
    });

    /* Touch zoom.

       A phone has no Ctrl+wheel, and the browser's own pinch-zoom is the wrong
       tool for this: it scales the entire page, viewer chrome included, and
       leaves the document itself rendered at the resolution it was rasterised
       at - so text gets bigger and blurrier rather than bigger and sharper.
       (This is very likely what an early "the résumé looks distorted on my
       phone" report actually was - the same view tested clean in isolation.)
       css/style.css sets touch-action on the panel to decline the browser's
       version; these two gestures replace it, driving the same applyZoom the
       wheel does, which re-centres and re-anchors properly and lets the canvas
       resolution underneath do its job. */
    const pinchDistance = (touches) => Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
    );

    let pinchStartDistance = 0;
    let pinchStartZoom = 1;
    let lastTapTime = 0;
    let lastTapX = 0;
    let lastTapY = 0;

    body.addEventListener('touchstart', (e) => {
        touchUsed = true;
        if (!zoomGroup || e.touches.length !== 2) return;
        pinchStartDistance = pinchDistance(e.touches);
        pinchStartZoom = zoom;
    }, { passive: true });

    body.addEventListener('touchmove', (e) => {
        if (!zoomGroup || e.touches.length !== 2 || !pinchStartDistance) return;
        // Not passive: without this the second finger reads as a pan and the
        // document scrolls away underneath the pinch.
        e.preventDefault();
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        applyZoom(pinchStartZoom * (pinchDistance(e.touches) / pinchStartDistance), midY);
    }, { passive: false });

    body.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) pinchStartDistance = 0;
        if (!zoomGroup || e.touches.length || e.changedTouches.length !== 1) return;

        // Double-tap. Recognised here rather than left to dblclick, which
        // mobile Safari fires unreliably (and only after a delay) on content
        // that isn't a form control.
        const touch = e.changedTouches[0];
        const now = Date.now();
        // 350ms and 40px rather than the tighter numbers a mouse would need -
        // a thumb is neither as fast nor as still as a cursor.
        const nearLast = Math.hypot(touch.clientX - lastTapX, touch.clientY - lastTapY) < 40;
        if (now - lastTapTime < 350 && nearLast) {
            e.preventDefault();
            toggleZoom(touch.clientY);
            lastTapTime = 0;
        } else {
            lastTapTime = now;
            lastTapX = touch.clientX;
            lastTapY = touch.clientY;
        }
    }, { passive: false });

    // Left/Right jumps between pages instead of relying on plain scrolling.
    // On document, not modal: a modal-scoped listener only fires while focus
    // is somewhere inside it, and clicking the canvas or text layer to select
    // something moves focus to document.body - outside the modal's subtree -
    // which silently killed this after any such click. Gated on .open instead,
    // same pattern as the existing Escape handler below.
    document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('open')) return;
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        if (!pageWraps.length) return;
        e.preventDefault();
        // getBoundingClientRect for both sides of this comparison, not
        // offsetTop against scrollTop - offsetTop is an unscaled layout
        // measurement, scrollTop reflects the current (possibly zoomed)
        // visual size, and comparing the two directly only happened to work
        // at zoom 1. This is the same coordinate space scrollIntoView itself
        // uses below, so it stays correct at any zoom level.
        const viewportTop = body.getBoundingClientRect().top;
        const current = pageWraps.findIndex((w) => {
            const r = w.getBoundingClientRect();
            return r.top + r.height / 2 >= viewportTop;
        });
        const target = e.key === 'ArrowRight'
            ? Math.min(pageWraps.length - 1, Math.max(0, current) + 1)
            : Math.max(0, (current === -1 ? pageWraps.length : current) - 1);
        pageWraps[target].scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // inert removes an element from tab order, click hit-testing, and the
    // accessibility tree all at once - everything behind the modal becomes
    // simultaneously untabbable and unannounced, in one property, rather
    // than hand-tracking aria-hidden/tabindex on every sibling separately.
    // With nowhere else left to tab to, the browser's own Tab order already
    // stays inside the modal; the keydown handler below only adds the wrap-
    // around from the last focusable element back to the first.
    const setBackgroundInert = (isInert) => {
        [...document.body.children].forEach((el) => {
            if (el !== modal && el.tagName !== 'SCRIPT') el.inert = isInert;
        });
    };

    const open = () => {
        lastFocused = document.activeElement;
        renderResume();
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        setBackgroundInert(true);
        modal.querySelector('.resume-modal-close').focus();
        document.body.style.overflow = 'hidden';
    };

    const close = () => {
        // Reset before hiding, not after: a display:none element has no scroll
        // box, so writing scrollTop to it is silently dropped and the old
        // position comes straight back the next time it's shown.
        if (zoomGroup) {
            zoom = 1;
            zoomGroup.style.transform = 'scale(1)';
            syncSizer();
            body.scrollTop = 0;
            body.scrollLeft = 0;
        }
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        setBackgroundInert(false);
        document.body.style.overflow = '';
        if (lastFocused) lastFocused.focus();
    };

    // A window that changed size changes how far out "whole page fits" is, and
    // the old floor would otherwise stay pinned to whatever the window was when
    // the résumé first rendered - leaving a shortened window unable to zoom out
    // far enough to see a full page.
    window.addEventListener('resize', () => {
        if (!zoomGroup) return;
        recomputeMinZoom();
        const clamped = clampZoom(zoom);
        if (clamped !== zoom) {
            zoom = clamped;
            zoomGroup.style.transform = `scale(${zoom})`;
        }
        syncSizer();
    });

    // Wraps Tab at the modal's own boundary. Link/download/print/close, plus
    // any clickable link inside the résumé itself once it's rendered - all
    // recomputed on every Tab press since the résumé's own links don't exist
    // until PDF.js finishes.
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab' || !modal.classList.contains('open')) return;
        const focusable = [...modal.querySelectorAll('button, a[href]')]
            .filter((el) => el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // Delegated rather than bound to each trigger at load, so a résumé link
    // added later - the phone quick-action bar builds one - opens the viewer
    // too instead of falling through to its plain-PDF href.
    document.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-resume-trigger]');
        // Let the deliberate escape hatches through: a middle click, or a
        // modified click asking for a new tab or a download.
        if (!trigger || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        open();
    });

    modal.querySelectorAll('[data-resume-close]').forEach(el =>
        el.addEventListener('click', close));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) close();
    });

    // The @media print rule in css/style.css hides everything except the
    // rendered canvases, so printing is just asking the browser to print -
    // no native PDF viewer or its print button involved.
    const printBtn = modal.querySelector('[data-resume-print]');
    printBtn.addEventListener('click', () => window.print());
})();


/* -------------------------------------------------------------------------
   Hero profile card tilt - touch devices
   Desktop keeps the existing :hover tilt (scoped to (hover: hover) in
   css/style.css, since a touchscreen firing :hover on tap would otherwise
   fight with this).

   iOS has required an explicit "wants to use Motion & Orientation" permission
   prompt for DeviceOrientationEvent since iOS 13 (Sept 2019) - virtually every
   iPhone in use today. That's not something to ask a portfolio visitor for,
   so this never calls DeviceOrientationEvent.requestPermission() at all.
   Instead it feature-detects: a browser that would need that call (the
   method's mere existence, not a UA string) gets a touch-drag tilt instead;
   everything else gets the real sensor, silently, permission dialog never
   shown to anyone regardless of platform.

   The tunables in `cfg` below are a starting point, not measured values. They
   are tuned on a real phone with tools/gyro-tune.py, which injects a slider
   overlay without that overlay ever entering src/. Numbers picked at a desk
   are guesses wearing decimal points.
   ------------------------------------------------------------------------- */
(() => {
    const card = document.querySelector('.profile-card');
    const inner = document.querySelector('.profile-inner');
    if (!card || !inner) return;

    /* Gated on hover capability, not viewport width. A phone turned to
       landscape is still a phone, but the old test was `max-width: 768px`
       evaluated once at load - so a phone that started in landscape, or was
       rotated into it, got no tilt at all: this module had bailed, and the
       desktop :hover tilt it fell back to is itself scoped to (hover: hover),
       which a touchscreen never matches. Capability does not change when a
       device is rotated, so that gap cannot reopen.

       This also keeps hybrid laptops on the desktop behaviour, which is the
       right call and matches how the CSS already scopes the :hover tilt. */
    if (window.matchMedia('(hover: hover)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const apply = (rx, ry) => {
        inner.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    };
    const clamp = (v, max) => Math.max(-max, Math.min(max, v));

    /* Independent per axis on purpose. Roll - holding the phone and turning it
       left or right - is a deliberate gesture, and reads as one. Pitch swings
       20-30 degrees from nothing more than normal reading posture and thumb
       scrolling, so the equal 0.4 on both axes that shipped made the card
       pitch constantly for reasons unrelated to intent. That is why the
       vertical axis felt wrong while the horizontal one felt fine: it was not
       responding to anything the visitor meant to do. */
    const cfg = {
        rollMult: 0.5,
        rollMax: 15,
        pitchMult: 0.15,
        pitchMax: 5,
        /* Bleed of the reference angle toward the current one, per frame.
           The baseline used to latch on the first reading and never move, so a
           page that loaded while the phone was on its way out of a pocket left
           the card skewed for the entire session with no way back.

           0.001 is roughly a 17-second recovery. The figure first proposed was
           0.01, and it is wrong: at 1% per frame a held tilt washes back to
           neutral in under two seconds, which quietly converts a
           position-sensitive effect into a velocity-sensitive one. Slow enough
           to be invisible, fast enough to undo a bad calibration. */
        drift: 0.001,
        /* Sensor readings are too jittery to apply raw - ease toward the
           target rather than snapping to it. */
        ease: 0.15,
    };

    const needsIOSPermission = typeof DeviceOrientationEvent !== 'undefined'
        && typeof DeviceOrientationEvent.requestPermission === 'function';

    // iOS, or any other browser gating orientation behind a permission prompt:
    // the card tilts with the finger dragging across it instead. Also the
    // fallback when a sensor exists on paper but never actually reports.
    let touchDragOn = false;
    const enableTouchDrag = () => {
        if (touchDragOn) return;
        touchDragOn = true;
        const TOUCH_MAX = 10;
        const reset = () => {
            inner.style.transition = 'transform 0.6s';
            apply(0, 0);
        };
        card.addEventListener('touchstart', () => {
            inner.style.transition = 'none';
        }, { passive: true });
        card.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const rect = card.getBoundingClientRect();
            const x = (touch.clientX - rect.left) / rect.width - 0.5;
            const y = (touch.clientY - rect.top) / rect.height - 0.5;
            apply(clamp(y * -TOUCH_MAX * 2, TOUCH_MAX),
                  clamp(x * TOUCH_MAX * 2, TOUCH_MAX));
        }, { passive: true });
        card.addEventListener('touchend', reset);
        card.addEventListener('touchcancel', reset);
    };

    if (typeof DeviceOrientationEvent === 'undefined' || needsIOSPermission) {
        enableTouchDrag();
        return;
    }

    let rawBeta = null;
    let rawGamma = null;
    let baseBeta = 0;
    let baseGamma = 0;
    let smoothX = 0;
    let smoothY = 0;
    let targetX = 0;
    let targetY = 0;
    let raf = null;
    let sawReading = false;

    // screen.orientation is unavailable on older Safari, where the deprecated
    // window.orientation is the only source. Either can be absent; 0 is the
    // right answer when neither exists, because a device that cannot report a
    // rotation cannot be rotated as far as the page is concerned.
    const screenAngle = () => {
        const a = (screen.orientation && typeof screen.orientation.angle === 'number')
            ? screen.orientation.angle
            : (typeof window.orientation === 'number' ? window.orientation : 0);
        return ((a % 360) + 360) % 360;
    };

    const frame = () => {
        if (rawBeta !== null) {
            baseBeta += (rawBeta - baseBeta) * cfg.drift;
            baseGamma += (rawGamma - baseGamma) * cfg.drift;

            /* beta and gamma are reported against the DEVICE, not the screen.
               Turn the phone to landscape and the two swap roles, so the
               effect was driving the wrong axis there - silently, because
               nothing errors and the card still moves. Rotating the tilt
               vector by the screen angle puts it back into the frame the
               visitor is actually looking at. */
            const rad = screenAngle() * Math.PI / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const dBeta = rawBeta - baseBeta;
            const dGamma = rawGamma - baseGamma;
            const roll = dGamma * cos + dBeta * sin;
            const pitch = dBeta * cos - dGamma * sin;

            targetY = clamp(roll * cfg.rollMult, cfg.rollMax);
            targetX = clamp(pitch * -cfg.pitchMult, cfg.pitchMax);
        }
        smoothX += (targetX - smoothX) * cfg.ease;
        smoothY += (targetY - smoothY) * cfg.ease;
        apply(smoothX, smoothY);
        raf = requestAnimationFrame(frame);
    };

    /* Driven by rAF rather than by the sensor tick, which is what the previous
       version did. Two reasons, and the second is the real one: Android sensor
       rates vary from about 30 to 120 Hz across devices, so easing and drift
       applied per reading meant both the smoothing and the recovery time were
       different on different phones for no visible reason. Per frame, they are
       the same everywhere. */
    const start = () => { if (raf === null) raf = requestAnimationFrame(frame); };
    const stop = () => {
        if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    };

    // A sensor can exist and never report: motion permission switched off in
    // Android settings, or hardware that simply has no gyroscope. That used to
    // leave the card completely dead with no fallback.
    const fallbackTimer = setTimeout(() => {
        if (!sawReading) enableTouchDrag();
    }, 1000);

    window.addEventListener('deviceorientation', (e) => {
        if (e.beta === null || e.gamma === null) return;
        if (!sawReading) {
            sawReading = true;
            clearTimeout(fallbackTimer);
            // Calibrated to whatever angle the phone happens to be held at
            // when the first reading arrives, not an assumed "flat" or
            // "upright". A hardcoded resting angle would be actively worse for
            // anyone reading in bed or with the phone flat on a desk.
            baseBeta = e.beta;
            baseGamma = e.gamma;
            inner.style.transition = 'none';
            start();
        }
        rawBeta = e.beta;
        rawGamma = e.gamma;
    });

    // A requestAnimationFrame loop that never stops is a battery cost on the
    // device least able to afford it. Browsers throttle rAF in background tabs
    // but do not all stop it.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else if (sawReading) start();
    });

    // Read by tools/gyro-tune.py, which is a local-only harness - it is never
    // deployed, and nothing in the shipped site reads this back.
    window.__gyroCfg = cfg;
})();


/* -------------------------------------------------------------------------
   Phone layout - expand/collapse controls
   The page carries a lot of detail, which is the point of it on a desktop and
   the problem with it on a phone: eleven project cards and a full ASCEND
   breakdown came to twenty-one screens of scrolling, most of it before the
   visitor reached anything they came for.

   Everything folded away here is still in the markup and still in the
   accessibility tree - it is hidden by a class added below, not omitted. No
   JS, a crawler, or a print of the page all get the full content, which is
   also why the hiding is gated on .m-curated rather than applied in CSS
   outright: a failure here has to fail open.
   ------------------------------------------------------------------------- */
(() => {
    /* Mounted at every width, hidden above 768px by CSS rather than by not
       existing. The guard here used to be `max-width: 768px` tested once at
       load, which was wrong in both directions:

         load portrait  -> rotate landscape : buttons injected, their styling
                                              gone with the media query - bare
                                              unstyled controls on screen
         load landscape -> rotate portrait  : this never ran at all - eleven
                                              full project cards, no collapse,
                                              no quick-action bar

       Letting CSS decide visibility fixes all four load/rotate combinations
       with no teardown logic to get wrong. The cost is a handful of
       display:none elements in the desktop DOM, which are absent from the
       accessibility tree and contribute nothing to layout. */
    let uid = 0;
    const makeToggle = (region, label, expandedLabel) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'm-toggle';
        btn.textContent = label;
        btn.setAttribute('aria-expanded', 'false');
        if (!region.id) region.id = `m-region-${++uid}`;
        btn.setAttribute('aria-controls', region.id);
        region.classList.add('m-collapsed');
        region.after(btn);
        btn.addEventListener('click', () => {
            const anchorBefore = btn.getBoundingClientRect().top;
            const open = !region.classList.toggle('m-collapsed');
            btn.setAttribute('aria-expanded', String(open));
            btn.textContent = open ? expandedLabel : label;
            if (!open) {
                // Closing pulls the whole breakdown out from above the button,
                // which otherwise drops the reader several cards further down
                // the page than where they pressed it. Put the control back on
                // the same line of the screen it was on a moment ago.
                window.scrollBy({ top: btn.getBoundingClientRect().top - anchorBefore,
                                  behavior: 'instant' });
            }
        });
        return btn;
    };

    document.querySelectorAll('[data-m-collapse], [data-m-clamp]').forEach((region) => {
        const label = region.dataset.mCollapse || region.dataset.mClamp;
        // "Show breakdown" / "Hide breakdown" - the pair names the same thing
        // twice, so the control reads as one switch rather than two states of
        // a generic "show less".
        makeToggle(region, label, label.replace(/^Show\b/, 'Hide'));
    });

    /* The ASCEND detail groups normally wait for the Job Intelligence Agent
       card to reach them (data-reveals-also), which is a two-column effect:
       the two sit side by side there. In one phone column JIA is three cards
       further down, so waiting for it would leave ASCEND's own tag row blank
       until the visitor had scrolled well past the card it belongs to.

       This one genuinely is phone-only - it changes what the desktop reveal
       machinery does, not just what is visible - so it stays behind a width
       test, and re-runs when the width changes so a phone that started in
       landscape gets it on rotating back.

       Applied, never undone. Once something has been revealed, re-hiding it on
       a width change is a flash of vanishing content, and the desktop reveal
       it would restore has already been passed. */
    const phone = window.matchMedia('(max-width: 768px)');
    const revealLate = () => {
        if (!phone.matches) return;
        document.querySelectorAll('.reveal-late').forEach(el => el.classList.add('is-visible'));
    };
    revealLate();
    phone.addEventListener('change', revealLate);

    const grid = document.querySelector('.projects-grid');
    if (!grid) return;
    const rest = [...grid.querySelectorAll('.project-card:not([data-m-order])')];
    if (!rest.length) return;

    grid.classList.add('m-curated');
    const showAll = document.createElement('button');
    showAll.type = 'button';
    showAll.className = 'm-toggle m-show-all';
    showAll.setAttribute('aria-expanded', 'false');
    showAll.setAttribute('aria-controls', 'projects-grid');
    if (!grid.id) grid.id = 'projects-grid';
    const collapsedLabel = `Show ${rest.length} more projects`;
    showAll.textContent = collapsedLabel;
    grid.after(showAll);

    showAll.addEventListener('click', () => {
        const anchorBefore = showAll.getBoundingClientRect().top;
        const expanded = grid.classList.toggle('m-expanded');
        showAll.setAttribute('aria-expanded', String(expanded));
        showAll.textContent = expanded ? 'Show fewer projects' : collapsedLabel;

        if (expanded) {
            // These were display:none, so the reveal observer never saw them
            // cross its trigger line and they would fade in only on the next
            // scroll. They were asked for by name; show them immediately.
            //
            // Deliberately no scroll correction here. The new cards land
            // between the fifth one and this button, which is below where the
            // visitor is looking - so leaving the scroll position alone is
            // what puts the sixth card exactly where their eye already is.
            rest.forEach(card => card.classList.add('is-visible'));
        } else {
            // Collapsing takes several screens out from above the button, so
            // without this the visitor is left somewhere in the footer with no
            // idea what just happened. Restoring the button to the same point
            // on screen it occupied a moment ago puts them back where they
            // pressed it. Instant, because it is a correction for a layout
            // change rather than a journey to somewhere new.
            const anchorAfter = showAll.getBoundingClientRect().top;
            window.scrollBy({ top: anchorAfter - anchorBefore, behavior: 'instant' });
        }
    });
})();


/* -------------------------------------------------------------------------
   Phone layout - horizontal scroll affordance
   The tag rows scroll sideways, and a row of pills clipped mid-pill is a weak
   signal on its own - it reads as a layout accident as often as it reads as
   "there is more". A soft edge is the stronger cue, but only if it is honest:
   a fade pinned to the right says "keep going" while you are sitting at the
   end of the row, and says nothing on the left once you have scrolled away
   from the start. Both edges are wrong at once, and the reader learns to
   ignore it.

   So the softening follows the scroll: each edge is soft only while there is
   still something behind it, and square the moment there is not. Soft means
   keep going, hard means wall, and the reader never has to think about which.

   Considered and rejected: the pure-CSS scroll-shadow trick (two background
   layers, one attached local and one scroll, so they cover each other at the
   ends) needs an opaque background to hide the shadow against, and these rows
   sit on a translucent card. Scroll-driven animations (animation-timeline:
   scroll(self inline)) would do this with no script at all, but are still
   Chromium-only, and a cue this quiet is not worth shipping to some visitors
   and not others.
   ------------------------------------------------------------------------- */
(() => {
    // Mounted at every width, for the reasons given on the expand/collapse
    // module above. This one is safe at any width regardless: it only ever
    // adds classes that are styled inside the phone media query, and the
    // rows it watches scroll horizontally on a desktop too.
    const rows = [...document.querySelectorAll('.project-tech, .tech-items')];
    if (!rows.length) return;

    const update = (row) => {
        // A row inside a hidden card measures 0 for everything, which would
        // read as "no overflow" and leave both edges square once it is shown.
        if (!row.clientWidth) return;
        const max = row.scrollWidth - row.clientWidth;
        row.classList.toggle('m-scroll-start', row.scrollLeft > 1);
        row.classList.toggle('m-scroll-end', row.scrollLeft < max - 1);
    };

    rows.forEach((row) => {
        update(row);
        row.addEventListener('scroll', () => update(row), { passive: true });
    });

    // Rows change size without ever being scrolled: a card revealed by "show
    // more" measures for the first time, and a rotation changes every row at
    // once. Observing the element covers both, and covers the initial measure
    // for rows that start hidden.
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver((entries) => entries.forEach(e => update(e.target)));
        rows.forEach(row => ro.observe(row));
    }
})();


/* -------------------------------------------------------------------------
   Phone layout - quick actions
   The two things a visitor is most likely to want - the résumé, and a way to
   get in touch - are in the hero and in the footer respectively, which on a
   phone means the top and the bottom of nine screens. This keeps both a thumb
   away from wherever they happen to be.

   Built here rather than in the markup because it is a duplicate of links that
   already exist on the page: adding it to the HTML would repeat them for
   screen readers and crawlers whether or not the bar is ever shown.
   ------------------------------------------------------------------------- */
(() => {
    // Mounted at every width, for the reasons given on the expand/collapse
    // module above. `.m-quickbar` is display:none outside the phone media
    // query, so on a desktop this is an empty div with two unreachable links
    // in it - no layout, no tab stops, nothing in the accessibility tree.
    const hero = document.getElementById('hero');
    const resumeLink = document.querySelector('[data-resume-trigger]');
    if (!hero || !resumeLink) return;

    const bar = document.createElement('div');
    bar.className = 'm-quickbar';
    // Not a <nav>: it holds two shortcuts, not the site's navigation, and
    // announcing it as a second nav landmark alongside the real one is noise.
    bar.setAttribute('aria-label', 'Quick actions');

    const resume = document.createElement('a');
    resume.className = 'm-quickbar-btn';
    resume.href = resumeLink.getAttribute('href');
    resume.target = '_blank';
    resume.rel = 'noopener';
    resume.dataset.resumeTrigger = '';
    resume.textContent = 'Résumé';

    const contact = document.createElement('a');
    contact.className = 'm-quickbar-btn m-quickbar-primary';
    contact.href = '#contact';
    contact.textContent = 'Get in touch';

    bar.append(resume, contact);
    document.body.appendChild(bar);

    // Held back until the hero has been passed - the same two actions are
    // already sitting right there in it, and covering the first screen with a
    // duplicate of what it already shows is just a smaller first screen.
    const io = new IntersectionObserver(([entry]) => {
        document.body.classList.toggle('m-quickbar-on', !entry.isIntersecting);
    }, { threshold: 0, rootMargin: '-40% 0px 0px 0px' });
    io.observe(hero);
})();

/* -------------------------------------------------------------------------
   Beacon.

   Deliberately boring. It posts an event name, a path, and at most one number
   to one endpoint. Everything worth knowing - where the visitor is, which
   network and organisation they are on, what device, which browser - is worked
   out at the other end from headers the browser sends anyway. So reading this
   in DevTools tells you the site counts pageviews, and nothing else. That is
   the whole design; there is no clever half hidden here to find.

   Adds no elements and no styles, so it cannot move the page by construction.
   ------------------------------------------------------------------------- */
(() => {
    // Filled in after the Worker is deployed. Empty means every function below
    // returns immediately - the site runs exactly as it did before.
    const ENDPOINT = 'https://portfolio-visits.msarmadsohail.workers.dev/api/e';
    if (!ENDPOINT) return;

    // Own-visit opt-out. Without it the most frequent visitor by a wide margin
    // is whoever is building the site. Visit once with ?notrack=1 per browser.
    try {
        if (/[?&]notrack=1/.test(location.search)) localStorage.setItem('nt', '1');
        if (localStorage.getItem('nt') === '1') return;
    } catch (e) { /* private mode: fall through and just track */ }

    const send = (payload) => {
        const body = JSON.stringify(payload);
        try {
            // sendBeacon is the only thing that reliably survives a page being
            // closed, which is exactly when the engagement events fire.
            if (navigator.sendBeacon) {
                navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
                return;
            }
            fetch(ENDPOINT, {
                method: 'POST', body, keepalive: true,
                headers: { 'Content-Type': 'application/json' }
            }).catch(() => {});
        } catch (e) { /* never let telemetry break the page */ }
    };

    const path = () => location.pathname + location.search;

    send({ e: 'pageview', p: path(), r: document.referrer });

    /* Which link was taken. A closed set of short keys - the point is "they went
       for the CV", not a URL log. */
    const keyFor = (a) => {
        if (a.hasAttribute('download')) return 'resume-download';
        if (a.hasAttribute('data-resume-trigger')) return 'resume-view';
        const href = a.getAttribute('href') || '';
        if (href.startsWith('mailto:')) return 'email';
        let host = '';
        try { host = new URL(a.href, location.href).host.replace(/^www\./, ''); } catch (e) { return ''; }
        if (!host || host === location.host) return '';
        if (host === 'github.com') return href.split('/').length > 4 ? 'github-repo' : 'github-profile';
        if (host.endsWith('linkedin.com')) return 'linkedin';
        if (host.startsWith('scholar.google')) return 'scholar';
        if (host === 'drive.google.com') return 'drive';
        return 'outbound';
    };

    // Capture phase, passive, and never preventDefault - the résumé modal and
    // the smooth-scroll handlers keep their behaviour untouched.
    document.addEventListener('click', (ev) => {
        const t = ev.target.closest('[data-resume-print]');
        if (t) { send({ e: 'click', p: path(), t: 'resume-print' }); return; }
        const a = ev.target.closest('a[href]');
        if (!a) return;
        const k = keyFor(a);
        if (k) send({ e: 'click', p: path(), t: k });
    }, { capture: true, passive: true });

    /* How far down, and how long. Both are read off variables already being
       maintained and reported once, on the way out - not streamed while the
       visitor scrolls, which would be several hundred writes for one reader. */
    let deepest = 0;
    const measure = () => {
        const reach = window.scrollY + window.innerHeight;
        const full = document.documentElement.scrollHeight;
        if (full > 0) deepest = Math.max(deepest, Math.min(100, Math.round((reach / full) * 100)));
    };
    measure();
    window.addEventListener('scroll', measure, { passive: true });

    let visibleMs = 0;
    let since = document.visibilityState === 'visible' ? Date.now() : 0;
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') { since = Date.now(); return; }
        if (since) { visibleMs += Date.now() - since; since = 0; }
    });

    let reported = false;
    const report = () => {
        if (reported) return;
        reported = true;
        if (since) visibleMs += Date.now() - since;
        const bucket = deepest >= 100 ? 100 : deepest >= 75 ? 75 : deepest >= 50 ? 50 : deepest >= 25 ? 25 : 0;
        const p = path();
        send({ e: 'engagement', p, t: 'scroll', v: bucket });
        send({ e: 'engagement', p, t: 'time', v: Math.round(visibleMs / 1000) });
    };
    // pagehide is the reliable one; iOS Safari often never fires unload at all.
    window.addEventListener('pagehide', report);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') report();
    });
})();
