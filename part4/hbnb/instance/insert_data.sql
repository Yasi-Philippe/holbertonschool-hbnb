-- --- USERS TEST ---
INSERT INTO users (id, first_name, last_name, email, password, is_admin, created_at, updated_at)
VALUES
('a1111111-1111-1111-1111-111111111111','Alice','Dupont','alice@mail.com','$2b$12$XWq3b0c5h9kU8sHxYgR0ne1ZTcKmEvz3iVFO0YvJZmLQ1P0wFDSi2',FALSE, datetime('now'), datetime('now')),
('b2222222-2222-2222-2222-222222222222','Bob','Martin','bob@mail.com','$2b$12$XWq3b0c5h9kU8sHxYgR0ne1ZTcKmEvz3iVFO0YvJZmLQ1P0wFDSi2',FALSE, datetime('now'), datetime('now')),
('c3333333-3333-3333-3333-333333333333','Carla','Leroy','carla@mail.com','$2b$12$XWq3b0c5h9kU8sHxYgR0ne1ZTcKmEvz3iVFO0YvJZmLQ1P0wFDSi2',FALSE, datetime('now'), datetime('now')),
('c4444444-4444-4444-4444-444444444444','Admin','Leroy','admin@mail.com','$2b$12$4xDOAnY/hCxAZJx1gqOhNOELtJLTM/2dyfrqZv95V9QtdPgsBfJ7q',TRUE, datetime('now'), datetime('now'));

-- --- PLACES TEST ---
INSERT INTO places (id, title, description, price, latitude, longitude, owner_id, created_at, updated_at)
VALUES
('p1111111-1111-1111-1111-111111111111','Appartement cosy','Un petit appartement très confortable',75.00,48.8566,2.3522,'a1111111-1111-1111-1111-111111111111', datetime('now'), datetime('now')),
('p2222222-2222-2222-2222-222222222222','Maison de campagne','Grande maison avec jardin',120.50,47.2184,-1.5536,'b2222222-2222-2222-2222-222222222222', datetime('now'), datetime('now')),
('p3333333-3333-3333-3333-333333333333','Studio moderne','Studio en centre-ville',60.00,43.6047,1.4442,'c3333333-3333-3333-3333-333333333333', datetime('now'), datetime('now'));

-- --- REVIEWS TEST ---
INSERT INTO reviews (id, text, rating, user_id, place_id, created_at, updated_at)
VALUES
('r1111111-1111-1111-1111-111111111111','Super logement, très propre',5,'b2222222-2222-2222-2222-222222222222','p1111111-1111-1111-1111-111111111111', datetime('now'), datetime('now')),
('r2222222-2222-2222-2222-222222222222','Un peu bruyant mais bien situé',3,'c3333333-3333-3333-3333-333333333333','p1111111-1111-1111-1111-111111111111', datetime('now'), datetime('now')),
('r3333333-3333-3333-3333-333333333333','Maison magnifique, parfait pour famille',5,'a1111111-1111-1111-1111-111111111111','p2222222-2222-2222-2222-222222222222', datetime('now'), datetime('now')),
('r4444444-4444-4444-4444-444444444444','Studio correct pour le prix',4,'b2222222-2222-2222-2222-222222222222','p3333333-3333-3333-3333-333333333333', datetime('now'), datetime('now'));

-- --- AMENITIES ---
INSERT INTO amenities (id, name, created_at, updated_at)
VALUES
('b1e9f0a2-7f64-4e3b-9dcb-3b0b7c7a8f1d','WiFi', datetime('now'), datetime('now')),
('d3a8e2c7-4d12-4c9f-a6d7-9f8b3d0c6f5e','Swimming Pool', datetime('now'), datetime('now')),
('f0b9c8d2-6e1a-4b3f-b5c2-8a1d7e9f4b2c','Air Conditioning', datetime('now'), datetime('now'));

-- --- PLACES_AMENITIES ---
INSERT INTO places_amenities (place_id, amenity_id)
VALUES
-- Appartement cosy
('p1111111-1111-1111-1111-111111111111','b1e9f0a2-7f64-4e3b-9dcb-3b0b7c7a8f1d'),
('p1111111-1111-1111-1111-111111111111','f0b9c8d2-6e1a-4b3f-b5c2-8a1d7e9f4b2c'),
-- Maison de campagne
('p2222222-2222-2222-2222-222222222222','b1e9f0a2-7f64-4e3b-9dcb-3b0b7c7a8f1d'),
('p2222222-2222-2222-2222-222222222222','d3a8e2c7-4d12-4c9f-a6d7-9f8b3d0c6f5e'),
-- Studio moderne
('p3333333-3333-3333-3333-333333333333','f0b9c8d2-6e1a-4b3f-b5c2-8a1d7e9f4b2c');
