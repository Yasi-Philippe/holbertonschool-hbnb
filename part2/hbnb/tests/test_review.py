import unittest
from app import create_app
from app.services import facade


class TestReviewEndpoints(unittest.TestCase):
    """Tests for Review API endpoints"""

    def setUp(self):
        """Create app, test client, a user and a place before each test"""
        self.app = create_app()
        self.client = self.app.test_client()
        # Clear all repos to avoid state leaking between tests
        facade.user_repo._storage.clear()
        facade.place_repo._storage.clear()
        facade.review_repo._storage.clear()
        facade.amenity_repo._storage.clear()

        # Create a user (owner of the place)
        user_response = self.client.post('/api/v1/users/', json={
            "first_name": "Owner",
            "last_name": "User",
            "email": "owner@example.com"
        })
        self.owner_id = user_response.get_json()["id"]

        # Create a second user (the reviewer)
        reviewer_response = self.client.post('/api/v1/users/', json={
            "first_name": "Reviewer",
            "last_name": "User",
            "email": "reviewer@example.com"
        })
        self.reviewer_id = reviewer_response.get_json()["id"]

        # Create a place
        place_response = self.client.post('/api/v1/places/', json={
            "title": "Test Place",
            "description": "Place for review testing",
            "price": 80.0,
            "latitude": 48.8566,
            "longitude": 2.3522,
            "owner_id": self.owner_id
        })
        self.place_id = place_response.get_json()["id"]

    def _create_valid_review(self):
        """Helper: create a valid review and return the response"""
        return self.client.post('/api/v1/reviews/', json={
            "text": "Great place, very clean!",
            "rating": 5,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })

    # ====== POST /api/v1/reviews/ ======

    def test_create_review(self):
        """Test creating a valid review"""
        response = self._create_valid_review()
        self.assertEqual(response.status_code, 201)
        data = response.get_json()
        self.assertIn("id", data)
        self.assertEqual(data["text"], "Great place, very clean!")
        self.assertEqual(data["rating"], 5)
        self.assertEqual(data["user_id"], self.reviewer_id)
        self.assertEqual(data["place_id"], self.place_id)

    def test_create_review_empty_text(self):
        """Test creating a review with empty text -> 400"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "",
            "rating": 4,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_review_invalid_rating_too_high(self):
        """Test creating a review with rating > 5 -> 400"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Good place",
            "rating": 6,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_review_invalid_rating_too_low(self):
        """Test creating a review with rating < 1 -> 400"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Bad place",
            "rating": 0,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_review_invalid_user(self):
        """Test creating a review with non-existent user_id -> 400"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Ghost review",
            "rating": 3,
            "user_id": "nonexistent-user-id",
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 400)

    def test_create_review_invalid_place(self):
        """Test creating a review with non-existent place_id -> 400"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Ghost place review",
            "rating": 3,
            "user_id": self.reviewer_id,
            "place_id": "nonexistent-place-id"
        })
        self.assertEqual(response.status_code, 400)

    # ====== Boundary tests for rating ======

    def test_create_review_rating_min(self):
        """Test creating a review with rating = 1 (valid boundary)"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Not great",
            "rating": 1,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 201)

    def test_create_review_rating_max(self):
        """Test creating a review with rating = 5 (valid boundary)"""
        response = self.client.post('/api/v1/reviews/', json={
            "text": "Amazing!",
            "rating": 5,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 201)

    # ====== GET /api/v1/reviews/<review_id> ======

    def test_get_review_by_id(self):
        """Test retrieving an existing review by ID"""
        create_response = self._create_valid_review()
        review_id = create_response.get_json()["id"]

        response = self.client.get(f'/api/v1/reviews/{review_id}')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertEqual(data["text"], "Great place, very clean!")

    def test_get_review_not_found(self):
        """Test retrieving a review with non-existent ID -> 404"""
        response = self.client.get('/api/v1/reviews/nonexistent-id')
        self.assertEqual(response.status_code, 404)

    # ====== GET /api/v1/reviews/ ======

    def test_get_all_reviews(self):
        """Test listing all reviews"""
        self._create_valid_review()
        response = self.client.get('/api/v1/reviews/')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

    # ====== PUT /api/v1/reviews/<review_id> ======

    def test_update_review(self):
        """Test updating an existing review"""
        create_response = self._create_valid_review()
        review_id = create_response.get_json()["id"]

        response = self.client.put(f'/api/v1/reviews/{review_id}', json={
            "text": "Updated: Still a great place!",
            "rating": 4,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 200)

    def test_update_review_not_found(self):
        """Test updating a non-existent review -> 404"""
        response = self.client.put('/api/v1/reviews/nonexistent-id', json={
            "text": "Ghost review",
            "rating": 3,
            "user_id": self.reviewer_id,
            "place_id": self.place_id
        })
        self.assertEqual(response.status_code, 404)

    # ====== DELETE /api/v1/reviews/<review_id> ======

    def test_delete_review(self):
        """Test deleting an existing review"""
        create_response = self._create_valid_review()
        review_id = create_response.get_json()["id"]

        response = self.client.delete(f'/api/v1/reviews/{review_id}')
        self.assertEqual(response.status_code, 200)

        # Verify it's gone
        get_response = self.client.get(f'/api/v1/reviews/{review_id}')
        self.assertEqual(get_response.status_code, 404)

    def test_delete_review_not_found(self):
        """Test deleting a non-existent review -> 404"""
        response = self.client.delete('/api/v1/reviews/nonexistent-id')
        self.assertEqual(response.status_code, 404)

    # ====== GET /api/v1/places/<place_id>/reviews ======

    def test_get_reviews_by_place(self):
        """Test getting all reviews for a specific place"""
        self._create_valid_review()

        response = self.client.get(f'/api/v1/places/{self.place_id}/reviews')
        self.assertEqual(response.status_code, 200)
        data = response.get_json()
        self.assertIsInstance(data, list)
        self.assertGreaterEqual(len(data), 1)

    def test_get_reviews_by_place_not_found(self):
        """Test getting reviews for a non-existent place -> 404"""
        response = self.client.get('/api/v1/places/nonexistent-id/reviews')
        self.assertEqual(response.status_code, 404)


if __name__ == '__main__':
    unittest.main()
