from app.models.base_model import BaseModel
from app import db


class Review(BaseModel):
    __tablename__ = 'reviews'

    id = db.Column(db.String(100), primary_key=True)
    text = db.Column(db.String(100), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    place_id = db.Column(db.Integer, db.ForeignKey('places.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    def __init__(self, text, rating, place, user):
        super().__init__()

        self.text = self._validate_field("text", text, expected_type=str, required=True)
        self.rating = self._validate_field("rating", rating, expected_type=int, required=True, min_value=1, max_value=5)
        self.user_id = self._validate_field("user_id", user.id, expected_type=str, max_length=100, required=True)
        self.place_id = self._validate_field("place_id", place.id, expected_type=str, max_length=100, required=True)
