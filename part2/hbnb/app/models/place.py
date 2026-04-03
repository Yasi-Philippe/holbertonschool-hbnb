from app.models.base_model import BaseModel
from app.models.user import User


class Place(BaseModel):
    def __init__(self, title, description, price, latitude, longitude, owner):
        super().__init__()

        self.title = self._validate_field("title", title, str, 100, True)
        self.description = self._validate_field("description", description, str, None, False)
        self.price = self._validate_field("price", price, float, None, True, min_value=0.01)
        self.latitude = self._validate_field("latitude", latitude, float, None, True, min_value=-90, max_value=90)
        self.longitude = self._validate_field("longitude", longitude, float, None, True, min_value=-180, max_value=180)
        self.owner = self._validate_field("owner", owner, expected_type=User, required=True)
        self.amenities = []  # List of amenity IDs
        self.reviews = []    # List of review

    def add_amenity(self, amenity_id):
        """Add an amenity to the place"""
        if amenity_id not in self.amenities:
            self.amenities.append(amenity_id)

    def add_review(self, review_id):
        """Add a review to the place"""
        if review_id not in self.reviews:
            self.reviews.append(review_id)

    def to_dict(self):
        """Convert the Place instance to a dictionary"""
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "owner": self.owner,
            "amenities": self.amenities,
            "reviews": self.reviews
        }
