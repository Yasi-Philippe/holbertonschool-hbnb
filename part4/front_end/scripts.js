'use strict';

const API_URL = 'http://127.0.0.1:5000';

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

    if (loginLink)  loginLink.style.display  = token ? 'none'  : '';
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

    const imageMap = {
        'Maison de campagne': 'place_default.jpg',
        'Appartement cosy':   'place_appartement.jpg',
        'Studio moderne':     'place_studio.jpg'
    };

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

            const imgSrc  = imageMap[place.title];
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
        });

        shelfRow.appendChild(cardsWrapper);
        list.appendChild(shelfRow);
    }
}

function setupPriceFilter() {
    const filter = document.getElementById('price-filter');
    if (!filter) return;

    filter.addEventListener('change', (event) => {
        const value = event.target.value;

        document.querySelectorAll('.shelf-row').forEach(row => {
            let anyVisible = false;
            row.querySelectorAll('.place-card').forEach(card => {
                const price   = parseFloat(card.dataset.price) || 0;
                const visible = (value === 'all') || (price <= parseFloat(value));
                card.style.display = visible ? '' : 'none';
                if (visible) anyVisible = true;
            });
            // hide the whole shelf row (including the plank) if all cards are filtered out
            row.style.display = anyVisible ? '' : 'none';
        });
    });
}

/* ============================================================
   PLACE DETAILS PAGE  (place.html)
   ============================================================ */

function setupPlacePage() {
    const token = getCookie('token');
    updateNavLinks();
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

    if (token) {
        setupPlaceReviewForm(token, placeId);
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

    const detailImageMap = {
        'Maison de campagne': 'place_default.jpg',
        'Appartement cosy':   'place_appartement.jpg',
        'Studio moderne':     'place_studio.jpg'
    };
    const detailImg = detailImageMap[place.title];
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

    loadUsersSection(token);
    loadAmenitiesSection(token);
    loadPlacesAdminSection(token);
    setupCreateUserForm(token);
    setupCreateAmenityForm(token);
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
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-light);">Loading…</td></tr>';
    try {
        const res = await fetch(`${API_URL}/api/v1/places/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error();
        const places = await res.json();
        renderPlacesAdminTable(places, token, tbody);
    } catch (_) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--primary);">Failed to load places.</td></tr>';
    }
}

function renderPlacesAdminTable(places, token, tbody) {
    if (!places.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="color:var(--text-light);">No places found.</td></tr>';
        return;
    }
    tbody.innerHTML = places.map(p => `
        <tr id="place-admin-row-${escapeHtml(p.id)}">
            <td><a href="place.html?id=${encodeURIComponent(p.id)}" style="color:var(--primary);font-weight:600;">${escapeHtml(p.title)}</a></td>
            <td>${p.price !== undefined ? '$' + Number(p.price).toFixed(2) : '—'}</td>
            <td>${escapeHtml(p.owner_id)}</td>
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
   PAGE ROUTER  –  auto-detect the current page and bootstrap
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    if (path.includes('login.html')) {
        setupLoginPage();
    } else if (path.includes('admin.html')) {
        setupAdminPage();
    } else if (path.includes('add_review.html')) {
        setupAddReviewPage();
    } else if (path.includes('place.html')) {
        setupPlacePage();
    } else {
        // Default: index.html (or file opened directly)
        setupIndexPage();
    }
});
