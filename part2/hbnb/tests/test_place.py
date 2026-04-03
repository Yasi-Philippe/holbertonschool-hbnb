import unittest
from app import create_app
from app.services import facade


class TestPlaceEndpoints(unittest.TestCase):
    """Tests for Place API endpoints"""

    def setUp(self):
        """Create app, test client, and a valid owner user before each test"""
        self.app = create_app()
        self.client = self.app.test_client()
        # Clear all repos to avoid state leaking between tests
        facade.user_repo._storage.clear()
        facade.place_repo._storage.clear()
        facade.review_repo._storage.clear()
        facade.amenity_repo._storage.clear()

        # Create a user to be the owner of places
        response = self.client.post('/api/v1/users/', json={
            "first_name": "Owner",
            "last_name": "User",
            "email": "owner@example.com"
        })
        self.owner_id = response.get_json()["id"]

    def _create_valid_place(self):
        """Helper: create a valid place and return the response JSON"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Cozy Apartment",
            "description": "A nice place to stay",
            "price": 100.0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        return response

    # ====== POST /api/v1/places/ ======

    def test_create_place(self):
        """Test creating a valid place"""
        response = self._create_valid_place()
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertEqual(data["title"], "Cozy Apartment")
        self.assertEqual(data["price"], 100.0)

    def test_create_place_missing_title(self):
        """Test creating a place with empty title -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "",
            "price": 100.0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_place_negative_price(self):
        """Test creating a place with negative price -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Bad Price Place",
            "price": -50.0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_place_zero_price(self):
        """Test creating a place with zero price -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Free Place",
            "price": 0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_place_invalid_latitude(self):
        """Test creating a place with latitude > 90 -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Bad Lat Place",
            "price": 100.0,
            "latitude": 100.0,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_place_invalid_latitude_negative(self):
        """Test creating a place with latitude < -90 -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Bad Lat Place",
            "price": 100.0,
            "latitude": -91.0,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_place_invalid_longitude(self):
        """Test creating a place with longitude > 180 -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Bad Lon Place",
            "price": 100.0,
            "latitude": 48.8566,
            "longitude": 200.0,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_place_invalid_longitude_negative(self):
        """Test creating a place with longitude < -180 -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Bad Lon Place",
            "price": 100.0,
            "latitude": 48.8566,
            "longitude": -181.0,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_place_invalid_owner(self):
        """Test creating a place with non-existent owner_id -> 400"""
        response = self.client.post('/api/v1/places/', json={
            "title": "No Owner Place",
            "price": 100.0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": "nonexistent-owner-id"
        })
        self.assertEqual(response.status_code, 400)

    # ====== Boundary tests (valid edges) ======

    def test_create_place_latitude_boundary_90(self):
        """Test creating a place with latitude = 90 (valid boundary)"""
        response = self.client.post('/api/v1/places/', json={
            "title": "North Pole Place",
            "price": 50.0,
            "latitude": 90.0,
            "longitude": 0.0,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 201)

    def test_create_place_latitude_boundary_minus90(self):
        """Test creating a place with latitude = -90 (valid boundary)"""
        response = self.client.post('/api/v1/places/', json={
            "title": "South Pole Place",
            "price": 50.0,
            "latitude": -90.0,
            "longitude": 0.0,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 201)

    def test_create_place_longitude_boundary_180(self):
        """Test creating a place with longitude = 180 (valid boundary)"""
        response = self.client.post('/api/v1/places/', json={
            "title": "Date Line Place",
            "price": 50.0,
            "latitude": 0.0,
            "longitude": 180.0,
            "owner_id": self.owner_id
        })
        self.assertEqual(response.status_code, 201)

    # ====== GET /api/v1/places/<place_id> ======

    def test_get_place_by_id(self):
        """Test retrieving an existing place by ID"""
        create_response = self._create_valid_place()
        place_id = create_response.get_json()["id"]

        response = self.client.get(f'/api/v1/places/{place_id}')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["title"], "Cozy Apartment")

    def test_get_place_not_found(self):
        """Test retrieving a place with non-existent ID -> 404"""
        response = self.client.get('/api/v1/places/nonexistent-id')
        self.assertEqual(response.status_code, 404)

    # ====== GET /api/v1/places/ ======

    def test_get_all_places(self):
        """Test listing all places"""
        self._create_valid_place()
        response = self.client.get('/api/v1/places/')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

    # ====== PUT /api/v1/places/<place_id> ======

    def test_update_place(self):
        """Test updating an existing place"""
        create_response = self._create_valid_place()
        place_id = create_response.get_json()["id"]

        response = self.client.put(f'/api/v1/places/{place_id}', json={
            "title": "Updated Apartment"
        })
        self.assertEqual(response.status_code, 200)

    def test_update_place_not_found(self):
        """Test updating a non-existent place -> 404"""
        response = self.client.put('/api/v1/places/nonexistent-id', json={
            "title": "Ghost Place"
        })
        self.assertEqual(response.status_code, 404)


if __name__ == '__main__':
    unittest.main()
