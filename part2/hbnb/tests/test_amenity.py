import unittest
from app import create_app
from app.services import facade


class TestAmenityEndpoints(unittest.TestCase):
    """Tests for Amenity API endpoints"""

    def setUp(self):
        """Create app and test client before each test"""
        self.app = create_app()
        self.client = self.app.test_client()
        # Clear all repos to avoid state leaking between tests
        facade.user_repo._storage.clear()
        facade.place_repo._storage.clear()
        facade.review_repo._storage.clear()
        facade.amenity_repo._storage.clear()

    # ====== POST /api/v1/amenities/ ======

    def test_create_amenity(self):
        """Test creating a valid amenity"""
        response = self.client.post('/api/v1/amenities/', json={
            "name": "WiFi"
        })
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertEqual(data["name"], "WiFi")

    def test_create_amenity_empty_name(self):
        """Test creating an amenity with empty name -> 400"""
        response = self.client.post('/api/v1/amenities/', json={
            "name": ""
        })
        self.assertEqual(response.status_code, 400)

    def test_create_amenity_name_too_long(self):
        """Test creating an amenity with name > 50 chars -> 400"""
        response = self.client.post('/api/v1/amenities/', json={
            "name": "A" * 51
        })
        self.assertEqual(response.status_code, 400)

    # ====== GET /api/v1/amenities/<amenity_id> ======

    def test_get_amenity_by_id(self):
        """Test retrieving an existing amenity by ID"""
        create_response = self.client.post('/api/v1/amenities/', json={
            "name": "Pool"
        })
        amenity_id = create_response.get_json()["id"]

        response = self.client.get(f'/api/v1/amenities/{amenity_id}')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["name"], "Pool")

    def test_get_amenity_not_found(self):
        """Test retrieving an amenity with non-existent ID -> 404"""
        response = self.client.get('/api/v1/amenities/nonexistent-id')
        self.assertEqual(response.status_code, 404)

    # ====== GET /api/v1/amenities/ ======

    def test_get_all_amenities(self):
        """Test listing all amenities"""
        self.client.post('/api/v1/amenities/', json={"name": "WiFi"})
        self.client.post('/api/v1/amenities/', json={"name": "Pool"})

        response = self.client.get('/api/v1/amenities/')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 2)

    # ====== PUT /api/v1/amenities/<amenity_id> ======

    def test_update_amenity(self):
        """Test updating an existing amenity"""
        create_response = self.client.post('/api/v1/amenities/', json={
            "name": "WiFi"
        })
        amenity_id = create_response.get_json()["id"]

        response = self.client.put(f'/api/v1/amenities/{amenity_id}', json={
            "name": "High-Speed WiFi"
        })
        self.assertEqual(response.status_code, 200)

    def test_update_amenity_not_found(self):
        """Test updating a non-existent amenity -> 404"""
        response = self.client.put('/api/v1/amenities/nonexistent-id', json={
            "name": "Ghost Amenity"
        })
        self.assertEqual(response.status_code, 404)


if __name__ == '__main__':
    unittest.main()
