'use strict';

const API_URL = 'http://127.0.0.1:5000';

/* ---- Place image map (title → filename) ------------------- */
const PLACE_IMAGES = {
    'Country House':                    'place_default.jpg',
    'Cosy Apartment':                   'place_appartement.jpg',
    'Modern Studio':                    'place_studio.jpg',
    'Lavender Provençal Villa':         'Villa Provençale en lavande.jpg',
    'Snowy Alpine Chalet':              'alpine chalet snow mountains.jpg',
    'Parisian Industrial Loft':         'paris industrial loft brick.jpg',
    'Forest Treehouse':                 'treehouse forest france.jpg',
    'Parisian Haussmann Suite':         'haussmann apartment paris moldings.jpg',
    'Renovated Normandy Farmhouse':     'normandy farmhouse renovated.png',
    'Mediterranean Seafront Villa':     'mediterranean seaside villa infinity pool.jpg',
    'Parisian Houseboat':               'paris houseboat seine river.jpg',
    'Bordeaux Bastide Estate':          'bordeaux bastide vineyard.jpg',
    'Garrigue Stone Cottage':           'provence stone house garrigue.jpg',
    'Corsican Mountain Cottage':        'corsica mountain farmhouse.jpg',
    'Cosy Lyon Studio':                 'lyon old town studio apartment.jpg',
    'Breton Manor with Sea View':       'brittany granite manor sea view.jpg',
    'Nice Belle Époque Apartment':      'nice belle epoque balcony sea.jpg',
    "Brittany Fisherman's Cottage":     'saint-malo fisherman house.jpg',
    'Tuscan Olive Grove Villa':         'tuscany villa olive trees pool.jpg',
    'Marrakech Riad':                   'marrakech riad courtyard fountain.jpg',
    'Forest Tiny House':                'tiny house forest france.jpg',
    'New York Style Loft':              'new york loft style terrace.jpg',
    'Luxury Arctic Igloo':              'arctic luxury igloo northern lights.jpg',
    'Castle':                           'castle.jpg',
};

/* ---- Images used in the hero background slideshow --------- */
const SLIDESHOW_IMAGES = [
    'place_default.jpg',
    'place_appartement.jpg',
    'place_studio.jpg',
    'Villa Provençale en lavande.jpg',
    'alpine chalet snow mountains.jpg',
    'treehouse forest france.jpg',
    'haussmann apartment paris moldings.jpg',
    'mediterranean seaside villa infinity pool.jpg',
    'paris houseboat seine river.jpg',
    'bordeaux bastide vineyard.jpg',
    'corsica mountain farmhouse.jpg',
    'nice belle epoque balcony sea.jpg',
    'tuscany villa olive trees pool.jpg',
    'tiny house forest france.jpg',
    'new york loft style terrace.jpg',
    'arctic luxury igloo northern lights.jpg',
    'castle.jpg',
];

/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Retrieve a cookie value by name.
 * @param {string} name
 * @returns {string|null}
 */
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

/**
 * Extract the place ID from the current URL query string (?id=...).
 * @returns {string|null}
 */
function getPlaceIdFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Render a star rating string (e.g. "★★★☆☆" for rating 3).
 * @param {number} rating  integer 1–5
 * @returns {string}
 */
function renderStars(rating) {
    const filled = '★'.repeat(Math.min(Math.max(rating, 0), 5));
    const empty  = '☆'.repeat(5 - filled.length);
    return filled + empty;
}

/**
 * Safely escape HTML to prevent XSS when setting textContent is not possible.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str !== null && str !== undefined ? String(str) : '';
    return div.innerHTML;
}

/**
 * Show a feedback message element.
 * @param {HTMLElement} el
 * @param {string}      text
 * @param {'error'|'success'} type
 */
function showMessage(el, text, type) {
    if (!el) return;
    el.textContent = text;
    el.className = `error-message show ${type}`;
}

/**
 * Decode the payload of a JWT token (client-side, no signature verification).
 * @param {string} token
 * @returns {object|null}
 */
function decodeJWT(token) {
    try {
        const payload = token.split('.')[1];
        const base64  = payload.replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64));
    } catch (_) {
        return null;
    }
}

/**
 * Returns true if the stored JWT token has is_admin = true.
 * @returns {boolean}
 */
function isAdminUser() {
    const token  = getCookie('token');
    if (!token) return false;
    const claims = decodeJWT(token);
    return !!(claims && claims.is_admin === true);
}

/**
 * Update all nav links (login / logout / admin) based on auth state.
 * Call once at the start of every page setup function.
 */
function updateNavLinks() {
    const token      = getCookie('token');
    const loginLink  = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const adminLink  = document.getElementById('admin-link');

    const addPlaceLink = document.getElementById('add-place-link');
    if (loginLink)  loginLink.style.display  = token ? 'none'  : '';
    if (addPlaceLink) addPlaceLink.style.display = token ? 'inline-flex' : 'none';
    if (logoutLink) {
        logoutLink.style.display = token ? 'flex' : 'none';
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            window.location.href = 'index.html';
        });
    }
    if (adminLink)  adminLink.style.display  = isAdminUser() ? 'flex' : 'none';
}

/** @deprecated use updateNavLinks() */
function updateNavAdminLink() { updateNavLinks(); }

/* ============================================================
   LOGIN PAGE  (login.html)
   ============================================================ */

function setupLoginPage() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email    = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const errorEl  = document.getElementById('error-message');

        if (errorEl) errorEl.className = 'error-message';

        try {
            const response = await loginUser(email, password);

            if (response.ok) {
                const data = await response.json();
                document.cookie = `token=${data.access_token}; path=/`;
                window.location.href = 'index.html';
            } else {
                const data = await response.json().catch(() => ({}));
                const msg  = data.msg || data.error || 'Invalid credentials. Please try again.';
                showMessage(errorEl, msg, 'error');
            }
        } catch (err) {
            showMessage(
                errorEl,
                'Connection error. Make sure the API server is running at ' + API_URL,
                'error'
            );
        }
    });
}

async function loginUser(email, password) {
    return fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
}

/* ============================================================
   INDEX PAGE  (index.html)
   ============================================================ */

function setupIndexPage() {
    const token = getCookie('token');
    updateNavLinks();
    fetchPlaces(token);
    setupPriceFilter();
    setupKeywordFilter();
    setupHeroSlideshow();
    setupHeroFade();
    setupScrollFadeIn();
    setupHeroScrollArrow();
    setupHeroCTAButtons();
    setupFeaturedSection();
}

function setupHeroScrollArrow() {
    const btn = document.getElementById('hero-scroll-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        document.getElementById('featured-section')?.scrollIntoView({ behavior: 'smooth' });
    });
}

function setupHeroCTAButtons() {
    document.getElementById('btn-featured')?.addEventListener('click', () => {
        document.getElementById('featured-section')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('btn-all-places')?.addEventListener('click', () => {
        document.getElementById('places-list')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('featured-scroll-btn')?.addEventListener('click', () => {
        document.querySelector('main')?.scrollIntoView({ behavior: 'smooth' });
    });
}

async function setupFeaturedSection() {
    const stage   = document.getElementById('featured-stage');
    const dotsEl  = document.getElementById('featured-dots');
    if (!stage) return;

    /* Wait up to 3 s for fetchPlaces() to populate window._allPlaces */
    if (!window._allPlaces) {
        await new Promise(resolve => {
            const t0 = Date.now();
            const poll = setInterval(() => {
                if (window._allPlaces || Date.now() - t0 > 3000) {
                    clearInterval(poll);
                    resolve();
                }
            }, 100);
        });
    }
    const places = window._allPlaces || [];

    /* Pick places that have a dedicated (non-default) image, shuffle, take up to 6 */
    const candidates = places.filter(p =>
        PLACE_IMAGES[p.title] && PLACE_IMAGES[p.title] !== 'place_default.jpg'
    );
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }
    const featured = candidates.slice(0, 6);

    if (featured.length === 0) {
        stage.innerHTML = '<div class="featured-placeholder">No featured places available.</div>';
        return;
    }

    /* Fetch full details (amenities + reviews) for each featured place */
    const details = await Promise.all(
        featured.map(p =>
            fetch(`${API_URL}/api/v1/places/${p.id}`)
                .then(r => r.ok ? r.json() : { ...p, reviews: [], amenities: [] })
                .catch(() => ({ ...p, reviews: [], amenities: [] }))
        )
    );

    /* Build cards */
    stage.innerHTML = '';
    details.forEach((place, i) => {
        const reviews   = (place.reviews || []).slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
        const topReview = reviews[0];
        const amenities = (place.amenities || []).slice(0, 5).map(a => a.name || a).join(', ');
        const img       = PLACE_IMAGES[place.title] || 'place_default.jpg';

        const card = document.createElement('div');
        card.className = 'featured-card' + (i === 0 ? ' active' : '');
        card.innerHTML = `
            <img src="${img}" alt="${escapeHtml(place.title)}" class="featured-img">
            <div class="featured-overlay">
                ${topReview ? `<blockquote class="featured-quote">"${escapeHtml(topReview.text)}"</blockquote>` : ''}
                <div class="featured-meta">
                    <span class="featured-name">${escapeHtml(place.title)}</span>
                    <span class="featured-price">$${Number(place.price || 0).toFixed(0)}<span class="featured-night"> / night</span></span>
                </div>
                ${amenities ? `<div class="featured-amenities"><span class="featured-includes">Includes:</span> ${escapeHtml(amenities)}</div>` : ''}
                <a href="place.html?id=${encodeURIComponent(place.id)}" class="featured-cta">View Place &#8594;</a>
            </div>`;
        stage.appendChild(card);
    });

    /* Build dots */
    dotsEl.innerHTML = '';
    details.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.className = 'featured-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Featured place ${i + 1}`);
        dotsEl.appendChild(dot);
    });

    const cards = Array.from(stage.querySelectorAll('.featured-card'));
    const dots  = Array.from(dotsEl.querySelectorAll('.featured-dot'));
    let current = 0;
    let timer   = setInterval(() => goTo((current + 1) % cards.length, true), 5000);

    function goTo(idx, forward = true) {
        if (idx === current) return;
        clearInterval(timer);

        const outgoing = cards[current];
        outgoing.classList.add(forward ? 'exit-left' : 'exit-right');
        outgoing.classList.remove('active');
        dots[current].classList.remove('active');
        setTimeout(() => outgoing.classList.remove('exit-left', 'exit-right'), 500);

        current = idx;
        cards[current].classList.add('active');
        dots[current].classList.add('active');
        timer = setInterval(() => goTo((current + 1) % cards.length, true), 5000);
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i, i > current)));
    document.getElementById('featured-prev')?.addEventListener('click', () =>
        goTo((current - 1 + cards.length) % cards.length, false)
    );
    document.getElementById('featured-next')?.addEventListener('click', () =>
        goTo((current + 1) % cards.length, true)
    );
}

function setupHeroSlideshow() {
    const hero = document.querySelector('.hero');
    if (!hero) return;

    /* Build shuffled copy of the curated slideshow list */
    const images = [...SLIDESHOW_IMAGES];
    for (let i = images.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [images[i], images[j]] = [images[j], images[i]];
    }

    const slider = document.createElement('div');
    slider.className = 'hero-bg-slider';
    slider.setAttribute('aria-hidden', 'true');

    const imgEls = images.map(src => {
        const img = document.createElement('img');
        img.src = src;
        img.className = 'hero-bg-img';
        img.alt = '';
        slider.appendChild(img);
        return img;
    });

    /* Insert as very first child so it sits behind everything */
    hero.insertBefore(slider, hero.firstChild);

    let current = 0;
    imgEls[0].classList.add('active');

    setInterval(() => {
        const outgoing = imgEls[current];

        /* Freeze the live transform so the fade-out doesn't snap back */
        const frozenTransform = window.getComputedStyle(outgoing).transform;
        outgoing.style.transform = frozenTransform;
        outgoing.style.animation = 'none';
        outgoing.classList.remove('active');

        /* After the opacity transition finishes, reset the inline styles
           so the image is clean if it cycles back into view */
        setTimeout(() => {
            outgoing.style.transform = '';
            outgoing.style.animation = '';
        }, 2400); /* slightly longer than the 2.2s opacity transition */

        current = (current + 1) % imgEls.length;
        const incoming = imgEls[current];
        /* Clear any leftover inline styles in case this image was outgoing before */
        incoming.style.transform = '';
        incoming.style.animation = '';
        incoming.classList.add('active');
    }, 6000);
}

function setupHeroFade() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    window.addEventListener('scroll', () => {
        const heroH  = hero.offsetHeight;
        const scrollY = window.scrollY;
        const opacity = Math.max(0, 1 - (scrollY / (heroH * 0.65)));
        hero.style.opacity = opacity;
    }, { passive: true });
}

/* Shared IntersectionObserver — created once, reused for dynamic cards */
let _scrollObserver = null;

function getScrollObserver() {
    if (_scrollObserver) return _scrollObserver;
    _scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
    return _scrollObserver;
}

function watchScrollFade(el) {
    el.classList.add('scroll-fade');
    getScrollObserver().observe(el);
}

function setupScrollFadeIn() {
    /* Static page elements — cards are added dynamically via watchScrollFade */
    document.querySelectorAll(
        '.filters, .place-details, .reviews-section, .add-review, ' +
        '.auth-container, .admin-section, .admin-header'
    ).forEach(el => watchScrollFade(el));
}

async function fetchPlaces(token) {
    try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/v1/places/`, { headers });

        if (!response.ok) throw new Error('Failed to fetch places');

        const places = await response.json();
        window._allPlaces = places; // keep reference for filter
        displayPlaces(places);
    } catch (err) {
        const list = document.getElementById('places-list');
        if (list) {
            list.innerHTML = `
                <div class="empty-state">
                    <h3>Could not load places</h3>
                    <p>Make sure the API server is running at <strong>${API_URL}</strong></p>
                </div>`;
        }
    }
}

function displayPlaces(places) {
    const list = document.getElementById('places-list');
    if (!list) return;

    if (!places || places.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <h3>No places available yet</h3>
                <p>Check back soon for new listings.</p>
            </div>`;
        return;
    }

    list.innerHTML = '';

    // Group into shelf rows of 3
    const ROW_SIZE = 3;
    for (let i = 0; i < places.length; i += ROW_SIZE) {
        const rowPlaces = places.slice(i, i + ROW_SIZE);

        const shelfRow = document.createElement('div');
        shelfRow.className = 'shelf-row';

        const cardsWrapper = document.createElement('div');
        cardsWrapper.className = 'shelf-row-cards';

        rowPlaces.forEach(place => {
            const card = document.createElement('div');
            card.className = 'place-card';
            card.dataset.price = place.price !== undefined ? place.price : 0;

            const price = place.price !== undefined
                ? `<strong>$${Number(place.price).toFixed(2)}</strong> / night`
                : 'Price unavailable';

            const imgSrc  = PLACE_IMAGES[place.title];
            const imgHtml = imgSrc
                ? `<img src="${imgSrc}" alt="${escapeHtml(place.title)}">`
                : '🏠';

            card.innerHTML = `
                <div class="place-card-img" role="img" aria-label="Place illustration">${imgHtml}</div>
                <h3>${escapeHtml(place.title)}</h3>
                <p class="price">${price}</p>
                <a href="place.html?id=${encodeURIComponent(place.id)}"
                   class="details-button">View Details</a>
            `;

            cardsWrapper.appendChild(card);
            watchScrollFade(card);
        });

        shelfRow.appendChild(cardsWrapper);
        list.appendChild(shelfRow);
    }
}

function applyFilters() {
    const priceVal   = document.getElementById('price-filter')?.value || 'all';
    const keyword    = (document.getElementById('keyword-filter')?.value || '').toLowerCase().trim();
    const isFiltered = priceVal !== 'all' || keyword !== '';

    document.querySelectorAll('.shelf-row').forEach(row => {
        let anyVisible = false;
        row.querySelectorAll('.place-card').forEach(card => {
            const price = parseFloat(card.dataset.price) || 0;
            const title = (card.querySelector('h3')?.textContent || '').toLowerCase();

            const priceOk   = priceVal === 'all'
                || (priceVal === '100plus' ? price > 100 : price <= parseFloat(priceVal));
            const keywordOk = !keyword || title.includes(keyword);

            const visible = priceOk && keywordOk;
            card.style.display = visible ? '' : 'none';
            if (visible) anyVisible = true;
        });
        // In normal mode hide empty rows; in filtered mode CSS handles layout via display:contents
        row.style.display = isFiltered ? '' : (anyVisible ? '' : 'none');
    });

    // Toggle flat-layout mode so visible cards reflow into clean rows of 3
    const placesList = document.getElementById('places-list');
    if (placesList) placesList.classList.toggle('is-filtered', isFiltered);
}

function setupPriceFilter() {
    const filter = document.getElementById('price-filter');
    if (!filter) return;
    filter.addEventListener('change', applyFilters);
}

function setupKeywordFilter() {
    const input = document.getElementById('keyword-filter');
    if (!input) return;
    input.addEventListener('input', applyFilters);
}

/* ============================================================
   PLACE DETAILS PAGE  (place.html)
   ============================================================ */

function setupPlacePage() {
    const token = getCookie('token');
    updateNavLinks();
    setupScrollFadeIn();
    const addReviewSection = document.getElementById('add-review');

    const placeId = getPlaceIdFromURL();
    if (!placeId) {
        window.location.href = 'index.html';
        return;
    }

    if (addReviewSection) {
        addReviewSection.style.display = token ? 'block' : 'none';
    }

    fetchPlaceDetails(token, placeId);
    loadSuggestions(placeId);

    if (token) {
        setupPlaceReviewForm(token, placeId);
    }
}

async function loadSuggestions(currentPlaceId) {
    const container = document.getElementById('suggestions-list');
    if (!container) return;

    try {
        const res = await fetch(`${API_URL}/api/v1/places/`);
        if (!res.ok) { container.innerHTML = ''; return; }

        const places = await res.json();
        const others = places.filter(p => p.id !== currentPlaceId).slice(0, 4);

        if (!others.length) {
            container.innerHTML = '<p style="color:var(--text-light);font-size:13px;font-weight:300;">No other places available.</p>';
            return;
        }

        container.innerHTML = others.map(p => {
            const imgSrc  = PLACE_IMAGES[p.title];
            const imgHtml = imgSrc
                ? `<img src="${imgSrc}" alt="${escapeHtml(p.title)}">`
                : '🏠';
            const price = p.price !== undefined
                ? `$${Number(p.price).toFixed(2)} / night`
                : 'Price unavailable';
            return `
                <a href="place.html?id=${encodeURIComponent(p.id)}" class="suggestion-card">
                    <div class="suggestion-img">${imgHtml}</div>
                    <div class="suggestion-info">
                        <p class="suggestion-title">${escapeHtml(p.title)}</p>
                        <p class="suggestion-price">${price}</p>
                    </div>
                </a>`;
        }).join('');
    } catch (_) {
        container.innerHTML = '';
    }
}

async function fetchPlaceDetails(token, placeId) {
    const section = document.getElementById('place-details');
    if (!section) return;

    section.innerHTML = '<div class="loading">Loading place details</div>';

    try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_URL}/api/v1/places/${placeId}`, { headers });

        if (!response.ok) throw new Error('Place not found');

        const place = await response.json();
        const admin = isAdminUser();
        displayPlaceDetails(place, token, admin);
    } catch (err) {
        section.innerHTML = `
            <div class="empty-state">
                <h3>Place not found</h3>
                <p><a href="index.html">← Back to listings</a></p>
            </div>`;
    }
}

function displayPlaceDetails(place, token, admin) {
    const section = document.getElementById('place-details');
    if (!section) return;

    const owner       = place.owner || {};
    const ownerName   = [owner.first_name, owner.last_name].filter(Boolean).join(' ') || 'Unknown host';
    const ownerInitial = ownerName.charAt(0).toUpperCase();

    const amenitiesHtml = (place.amenities || []).length > 0
        ? `<h2>Amenities</h2>
           <div class="amenities-list">
               ${place.amenities.map(a => `<span class="amenity-tag">${escapeHtml(a.name)}</span>`).join('')}
           </div>`
        : '';

    const descriptionHtml = place.description
        ? `<h2>About this place</h2>
           <p class="place-description">${escapeHtml(place.description)}</p>`
        : '';

    const coordsText = (place.latitude !== undefined && place.longitude !== undefined)
        ? `${Number(place.latitude).toFixed(4)}, ${Number(place.longitude).toFixed(4)}`
        : 'Location unavailable';

    const detailImg = PLACE_IMAGES[place.title];
    const detailImgHtml = detailImg
        ? `<div class="place-detail-image"><img src="${detailImg}" alt="${escapeHtml(place.title)}"></div>`
        : '';

    section.innerHTML = `
        <div class="place-hero">
            <h1>${escapeHtml(place.title)}</h1>
            <div class="place-meta">
                <span class="meta-item">📍 ${escapeHtml(coordsText)}</span>
                <span class="price-tag">$${Number(place.price).toFixed(2)} / night</span>
            </div>
        </div>
        ${detailImgHtml}
        <div class="place-info">
            <div class="host-info">
                <div class="host-avatar" aria-hidden="true">${escapeHtml(ownerInitial)}</div>
                <div>
                    <h3>Hosted by ${escapeHtml(ownerName)}</h3>
                    <p>${escapeHtml(owner.email || '')}</p>
                </div>
            </div>
            ${descriptionHtml}
            ${amenitiesHtml}
        </div>
        ${admin ? `
        <div class="admin-controls">
            <button class="btn-danger" id="admin-delete-place">🗑 Delete this place</button>
        </div>` : ''}
    `;

    if (admin && token) {
        const deleteBtn = document.getElementById('admin-delete-place');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                if (!confirm('Permanently delete this place? This cannot be undone.')) return;
                try {
                    const res = await fetch(`${API_URL}/api/v1/places/${place.id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        alert('Place deleted.');
                        window.location.href = 'index.html';
                    } else {
                        const d = await res.json().catch(() => ({}));
                        alert(d.error || 'Failed to delete place.');
                    }
                } catch (_) {
                    alert('Connection error.');
                }
            });
        }
    }

    displayReviews(place.reviews || [], token, admin);
}

async function displayReviews(reviews, token, admin) {
    const reviewsList = document.getElementById('reviews-list');
    if (!reviewsList) return;

    if (reviews.length === 0) {
        reviewsList.innerHTML =
            '<p class="no-reviews">No reviews yet. Be the first to share your experience!</p>';
        return;
    }

    reviewsList.innerHTML = '<div class="loading">Loading reviews</div>';

    const cards = await Promise.all(reviews.map(async (review) => {
        let userName = 'Guest';
        try {
            const res = await fetch(`${API_URL}/api/v1/users/${review.user_id}`);
            if (res.ok) {
                const user = await res.json();
                userName = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'Guest';
            }
        } catch (_) { /* keep default */ }

        const stars = renderStars(review.rating);
        const deleteBtn = (admin && token)
            ? `<button class="btn-sm btn-delete btn-delete-review"
                       data-review-id="${escapeHtml(review.id)}">🗑 Delete</button>`
            : '';

        return `
            <div class="review-card">
                <div class="review-header">
                    <span class="reviewer-name">${escapeHtml(userName)}</span>
                    <span class="review-stars" title="${review.rating} out of 5 stars">${stars}</span>
                    ${deleteBtn}
                </div>
                <p class="review-text">${escapeHtml(review.text)}</p>
            </div>`;
    }));

    reviewsList.innerHTML = cards.join('');

    if (admin && token) {
        reviewsList.querySelectorAll('.btn-delete-review').forEach(btn => {
            btn.addEventListener('click', async () => {
                const reviewId = btn.dataset.reviewId;
                if (!confirm('Delete this review? This cannot be undone.')) return;
                try {
                    const res = await fetch(`${API_URL}/api/v1/reviews/${reviewId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        btn.closest('.review-card').remove();
                        if (!reviewsList.querySelector('.review-card')) {
                            reviewsList.innerHTML =
                                '<p class="no-reviews">No reviews yet.</p>';
                        }
                    } else {
                        const d = await res.json().catch(() => ({}));
                        alert(d.error || 'Failed to delete review.');
                    }
                } catch (_) {
                    alert('Connection error.');
                }
            });
        });
    }
}

function setupPlaceReviewForm(token, placeId) {
    const form = document.getElementById('review-form');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const text   = document.getElementById('review-text').value.trim();
        const rating = parseInt(document.getElementById('rating').value, 10);
        const msgEl  = document.getElementById('review-message');

        if (!text || !rating) {
            showMessage(msgEl, 'Please fill in all fields.', 'error');
            return;
        }

        try {
            const response = await submitReview(token, placeId, text, rating);
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                showMessage(msgEl, 'Review submitted successfully!', 'success');
                form.reset();
                // Refresh reviews
                const placeRes = await fetch(`${API_URL}/api/v1/places/${placeId}`);
                if (placeRes.ok) {
                    const place = await placeRes.json();
                    displayReviews(place.reviews || [], token, isAdminUser());
                }
            } else {
                showMessage(msgEl, data.error || 'Failed to submit review.', 'error');
            }
        } catch (err) {
            showMessage(msgEl, 'Connection error. Please try again.', 'error');
        }
    });
}

/* ============================================================
   ADD REVIEW PAGE  (add_review.html)
   ============================================================ */

function setupAddReviewPage() {
    const token = checkAuthAndRedirect();
    if (!token) return;

    const placeId = getPlaceIdFromURL();
    if (!placeId) {
        window.location.href = 'index.html';
        return;
    }

    const form  = document.getElementById('review-form');
    const msgEl = document.getElementById('review-message');
    if (!form) return;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const text   = document.getElementById('review-text').value.trim();
        const rating = parseInt(document.getElementById('rating').value, 10);

        if (!text || !rating) {
            showMessage(msgEl, 'Please complete all fields before submitting.', 'error');
            return;
        }

        try {
            const response = await submitReview(token, placeId, text, rating);
            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                showMessage(msgEl, 'Review submitted successfully! Redirecting…', 'success');
                form.reset();
                setTimeout(() => {
                    window.location.href = `place.html?id=${encodeURIComponent(placeId)}`;
                }, 1600);
            } else {
                showMessage(msgEl, data.error || 'Failed to submit review. Please try again.', 'error');
            }
        } catch (err) {
            showMessage(msgEl, 'Connection error. Please try again.', 'error');
        }
    });
}

function checkAuthAndRedirect() {
    const token = getCookie('token');
    if (!token) {
        window.location.href = 'index.html';
        return null;
    }
    return token;
}

async function submitReview(token, placeId, reviewText, rating) {
    return fetch(`${API_URL}/api/v1/reviews/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: reviewText, rating, place_id: placeId })
    });
}

/* ============================================================
   ADMIN PAGE  (admin.html)
   ============================================================ */

function setupAdminPage() {
    const token = checkAuthAndRedirect();
    if (!token) return;

    if (!isAdminUser()) {
        window.location.href = 'index.html';
        return;
    }

    updateNavLinks();
    setupScrollFadeIn();

    loadUsersSection(token);
    loadAmenitiesSection(token);
    loadPlacesAdminSection(token);
    setupCreateUserForm(token);
    setupCreateAmenityForm(token);
    setupCreatePlaceForm(token);
}

/* ---- Users ------------------------------------------------- */

async function loadUsersSection(token) {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);">Loading…</td></tr>';
    try {
        const res = await fetch(`${API_URL}/api/v1/users/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const users = await res.json();
        renderUsersTable(users, token, tbody);
    } catch (_) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:var(--primary);">Failed to load users.</td></tr>';
    }
}

function renderUsersTable(users, token, tbody) {
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:var(--text-light);">No users found.</td></tr>';
        return;
    }
    tbody.innerHTML = users.map(u => `
        <tr id="user-row-${escapeHtml(u.id)}">
            <td>${escapeHtml(u.first_name)} ${escapeHtml(u.last_name)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td><span class="badge ${u.is_admin ? 'badge-admin' : 'badge-user'}">${u.is_admin ? 'Admin' : 'User'}</span></td>
            <td>
                <button class="btn-sm btn-edit" onclick="startEditUser('${escapeHtml(u.id)}','${escapeHtml(u.first_name)}','${escapeHtml(u.last_name)}','${escapeHtml(u.email)}')">Edit</button>
            </td>
        </tr>`).join('');
}

function startEditUser(id, firstName, lastName, email) {
    const row = document.getElementById(`user-row-${id}`);
    if (!row) return;
    row.classList.add('edit-row');
    row.innerHTML = `
        <td><input id="ue-fn-${id}" value="${escapeHtml(firstName)}" placeholder="First name">
            <input id="ue-ln-${id}" value="${escapeHtml(lastName)}" placeholder="Last name" style="margin-top:4px;"></td>
        <td><input id="ue-em-${id}" value="${escapeHtml(email)}" placeholder="Email"></td>
        <td><input id="ue-pw-${id}" type="password" placeholder="New password (optional)"></td>
        <td>
            <button class="btn-sm btn-save" onclick="saveEditUser('${id}')">Save</button>
            <button class="btn-sm btn-cancel" onclick="loadUsersSection(getCookie('token'))" style="margin-left:4px;">Cancel</button>
        </td>`;
}

async function saveEditUser(id) {
    const token = getCookie('token');
    const body  = {
        first_name: document.getElementById(`ue-fn-${id}`).value.trim(),
        last_name:  document.getElementById(`ue-ln-${id}`).value.trim(),
        email:      document.getElementById(`ue-em-${id}`).value.trim()
    };
    const pw = document.getElementById(`ue-pw-${id}`).value;
    if (pw) body.password = pw;

    try {
        const res = await fetch(`${API_URL}/api/v1/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body)
        });
        if (res.ok) {
            loadUsersSection(token);
        } else {
            const d = await res.json().catch(() => ({}));
            alert(d.error || 'Failed to update user.');
        }
    } catch (_) {
        alert('Connection error.');
    }
}

function setupCreateUserForm(token) {
    const form = document.getElementById('create-user-form');
    const msgEl = document.getElementById('create-user-msg');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const body = {
            first_name: document.getElementById('new-user-fn').value.trim(),
            last_name:  document.getElementById('new-user-ln').value.trim(),
            email:      document.getElementById('new-user-email').value.trim(),
            password:   document.getElementById('new-user-pw').value
        };
        try {
            const res = await fetch(`${API_URL}/api/v1/users/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                showMessage(msgEl, 'User created successfully!', 'success');
                form.reset();
                loadUsersSection(token);
            } else {
                showMessage(msgEl, d.error || 'Failed to create user.', 'error');
            }
        } catch (_) {
            showMessage(msgEl, 'Connection error.', 'error');
        }
    });
}

/* ---- Amenities -------------------------------------------- */

async function loadAmenitiesSection(token) {
    const tbody = document.getElementById('amenities-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:var(--text-light);">Loading…</td></tr>';
    try {
        const res = await fetch(`${API_URL}/api/v1/amenities/`);
        if (!res.ok) throw new Error();
        const amenities = await res.json();
        renderAmenitiesTable(amenities, token, tbody);
    } catch (_) {
        tbody.innerHTML = '<tr><td colspan="2" style="color:var(--primary);">Failed to load amenities.</td></tr>';
    }
}

function renderAmenitiesTable(amenities, token, tbody) {
    if (!amenities.length) {
        tbody.innerHTML = '<tr><td colspan="2" style="color:var(--text-light);">No amenities found.</td></tr>';
        return;
    }
    tbody.innerHTML = amenities.map(a => `
        <tr id="amenity-row-${escapeHtml(a.id)}">
            <td>${escapeHtml(a.name)}</td>
            <td>
                <button class="btn-sm btn-edit" onclick="startEditAmenity('${escapeHtml(a.id)}','${escapeHtml(a.name)}')">Edit</button>
            </td>
        </tr>`).join('');
}

function startEditAmenity(id, name) {
    const row = document.getElementById(`amenity-row-${id}`);
    if (!row) return;
    row.classList.add('edit-row');
    row.innerHTML = `
        <td><input id="ae-name-${id}" value="${escapeHtml(name)}" placeholder="Amenity name"></td>
        <td>
            <button class="btn-sm btn-save" onclick="saveEditAmenity('${id}')">Save</button>
            <button class="btn-sm btn-cancel" onclick="loadAmenitiesSection(getCookie('token'))" style="margin-left:4px;">Cancel</button>
        </td>`;
}

async function saveEditAmenity(id) {
    const token = getCookie('token');
    const name  = document.getElementById(`ae-name-${id}`).value.trim();
    if (!name) { alert('Name cannot be empty.'); return; }
    try {
        const res = await fetch(`${API_URL}/api/v1/amenities/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name })
        });
        if (res.ok) {
            loadAmenitiesSection(token);
        } else {
            const d = await res.json().catch(() => ({}));
            alert(d.error || 'Failed to update amenity.');
        }
    } catch (_) {
        alert('Connection error.');
    }
}

function setupCreateAmenityForm(token) {
    const form  = document.getElementById('create-amenity-form');
    const msgEl = document.getElementById('create-amenity-msg');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('new-amenity-name').value.trim();
        if (!name) return;
        try {
            const res = await fetch(`${API_URL}/api/v1/amenities/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name })
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                showMessage(msgEl, 'Amenity created!', 'success');
                form.reset();
                loadAmenitiesSection(token);
            } else {
                showMessage(msgEl, d.error || 'Failed to create amenity.', 'error');
            }
        } catch (_) {
            showMessage(msgEl, 'Connection error.', 'error');
        }
    });
}

/* ---- Places (admin view) ---------------------------------- */

async function loadPlacesAdminSection(token) {
    const tbody = document.getElementById('places-admin-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-light);">Loading…</td></tr>';
    try {
        const [placesRes, usersRes] = await Promise.all([
            fetch(`${API_URL}/api/v1/places/`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_URL}/api/v1/users/`,  { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (!placesRes.ok) throw new Error();
        const places = await placesRes.json();
        const users  = usersRes.ok ? await usersRes.json() : [];
        const userMap = {};
        users.forEach(u => { userMap[u.id] = `${u.first_name} ${u.last_name}`.trim(); });
        renderPlacesAdminTable(places, token, tbody, userMap);
    } catch (_) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--primary);">Failed to load places.</td></tr>';
    }
}

function renderPlacesAdminTable(places, token, tbody, userMap = {}) {
    if (!places.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-light);">No places found.</td></tr>';
        return;
    }
    tbody.innerHTML = places.map(p => `
        <tr id="place-admin-row-${escapeHtml(p.id)}">
            <td><a href="place.html?id=${encodeURIComponent(p.id)}" style="color:var(--primary-light);font-weight:600;">${escapeHtml(p.title)}</a></td>
            <td>${p.price !== undefined ? '$' + Number(p.price).toFixed(2) : '—'}</td>
            <td style="color:var(--text-bright);font-weight:500;">${escapeHtml(userMap[p.owner_id] || '—')}</td>
            <td>
                <button class="btn-sm btn-delete" onclick="adminDeletePlace('${escapeHtml(p.id)}')">🗑 Delete</button>
            </td>
        </tr>`).join('');
}

async function adminDeletePlace(placeId) {
    const token = getCookie('token');
    if (!confirm('Permanently delete this place? This cannot be undone.')) return;
    try {
        const res = await fetch(`${API_URL}/api/v1/places/${placeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
            const row = document.getElementById(`place-admin-row-${placeId}`);
            if (row) row.remove();
        } else {
            const d = await res.json().catch(() => ({}));
            alert(d.error || 'Failed to delete place.');
        }
    } catch (_) {
        alert('Connection error.');
    }
}

/* ============================================================
   CREATE PLACE PAGE  (create_place.html)
   ============================================================ */

function setupCreatePlacePage() {
    const token = checkAuthAndRedirect();
    if (!token) return;
    updateNavLinks();
    setupScrollFadeIn();

    const form  = document.getElementById('create-place-form');
    const msgEl = document.getElementById('place-message');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('place-title').value.trim();
        const desc  = document.getElementById('place-description').value.trim();
        const price = parseFloat(document.getElementById('place-price').value);
        const lat   = parseFloat(document.getElementById('place-lat').value);
        const lng   = parseFloat(document.getElementById('place-lng').value);

        if (!title || isNaN(price) || isNaN(lat) || isNaN(lng)) {
            showMessage(msgEl, 'Title, price, latitude and longitude are required.', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/v1/places/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, description: desc, price, latitude: lat, longitude: lng, amenities: [] })
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                showMessage(msgEl, 'Place published! Redirecting to your listing…', 'success');
                form.reset();
                setTimeout(() => {
                    window.location.href = `place.html?id=${encodeURIComponent(d.id)}`;
                }, 1400);
            } else {
                showMessage(msgEl, d.error || 'Failed to create place.', 'error');
            }
        } catch (_) {
            showMessage(msgEl, 'Connection error. Please try again.', 'error');
        }
    });
}

/* ---- Admin: create place form (admin panel) --------------- */
function setupCreatePlaceForm(token) {
    const form  = document.getElementById('create-place-form');
    const msgEl = document.getElementById('create-place-msg');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title  = document.getElementById('new-place-title').value.trim();
        const desc   = document.getElementById('new-place-desc').value.trim();
        const price  = parseFloat(document.getElementById('new-place-price').value);
        const lat    = parseFloat(document.getElementById('new-place-lat').value);
        const lng    = parseFloat(document.getElementById('new-place-lng').value);

        if (!title || isNaN(price) || isNaN(lat) || isNaN(lng)) {
            showMessage(msgEl, 'Title, price, latitude and longitude are required.', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/api/v1/places/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, description: desc, price, latitude: lat, longitude: lng, amenities: [] })
            });
            const d = await res.json().catch(() => ({}));
            if (res.ok) {
                showMessage(msgEl, 'Place created successfully!', 'success');
                form.reset();
                loadPlacesAdminSection(token);
            } else {
                showMessage(msgEl, d.error || 'Failed to create place.', 'error');
            }
        } catch (_) {
            showMessage(msgEl, 'Connection error.', 'error');
        }
    });
}

/* ============================================================
   PAGE ROUTER  –  auto-detect the current page and bootstrap
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    setupHeaderHideOnScroll();

    if (path.includes('login.html')) {
        setupLoginPage();
    } else if (path.includes('admin.html')) {
        setupAdminPage();
    } else if (path.includes('add_review.html')) {
        setupAddReviewPage();
    } else if (path.includes('create_place.html')) {
        setupCreatePlacePage();
    } else if (path.includes('place.html')) {
        setupPlacePage();
    } else {
        // Default: index.html (or file opened directly)
        setupIndexPage();
    }
});

function setupHeaderHideOnScroll() {
    const header = document.querySelector('header');
    if (!header) return;
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        const currentY = window.scrollY;
        if (currentY > lastY && currentY > 80) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }
        lastY = currentY;
    }, { passive: true });
}
