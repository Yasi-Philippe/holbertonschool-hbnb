from app.models.base_model import BaseModel
from app.models.user import User
from app import db
from sqlalchemy.orm import relationship


places_amenities = db.Table('places_amenities',
    db.Column('place_id', db.String(36), db.ForeignKey('places.id'), primary_key=True),
    db.Column('amenity_id', db.String(100), db.ForeignKey('amenities.id'), primary_key=True)
)


class Place(BaseModel):
    __tablename__ = 'places'

    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    owner_id = db.Column(db.String(50), db.ForeignKey('users.id'), nullable=False)
    # TODO: Do not include relationships
    # amenities = db.Column(db.PickleType, default=[])
    # reviews = db.Column(db.PickleType, default=[])
    reviews = relationship('Review', backref='place', lazy=True)
    amenities = relationship('Amenity', secondary=places_amenities, lazy='subquery',
                           backref=db.backref('sibling_places', lazy=True))

    def __init__(self, title, description, price, latitude, longitude, owner):
        super().__init__()

        self.title = self._validate_field("title", title, str, 100, True)
        self.description = self._validate_field("description", description, str, None, False)
        self.price = self._validate_field("price", price, float, None, True, min_value=0.01)
        self.latitude = self._validate_field("latitude", latitude, float, None, True, min_value=-90, max_value=90)
        self.longitude = self._validate_field("longitude", longitude, float, None, True, min_value=-180, max_value=180)
        owner = self._validate_field("owner", owner, expected_type=User, required=True)
        self.owner_id = owner.id
        # self.amenities = []  # Handled by relationship
        # self.reviews = []    # Handled by relationship

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
            "owner_id": self.owner_id,
            "amenities": self.amenities,
            "reviews": self.reviews
        }
