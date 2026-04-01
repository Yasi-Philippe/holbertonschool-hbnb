from app.models.base_model import BaseModel
from app import bcrypt
from app import db
from sqlalchemy.orm import relationship


class User(BaseModel):
    __tablename__ = 'users'

    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    password = db.Column(db.String(128), nullable=False)
    is_admin = db.Column(db.Boolean, default=False)
    places_children = relationship('Place', backref='sibling_places', lazy=True)
    reviews_children = relationship('Review', backref='usr_sibling_reviews', lazy=True)

    def __init__(self, first_name, last_name, email, password, is_admin=False):
        super().__init__()
        self.first_name = self._validate_field("first_name", first_name, str, 50, True)
        self.last_name = self._validate_field("last_name", last_name, str, 50, True)
        self.email = self._validate_field("email", email, str, 100, True, fmt='email')
        self.password = self._validate_field("password", password, str, 128, True)
        self.is_admin = self._validate_field("is_admin", is_admin, bool, None, False)

    def hash_password(self, password):
        """Hashes the password before storing it."""
        self.password = bcrypt.generate_password_hash(password).decode('utf-8')

    def verify_password(self, password):
        """Verifies if the provided password matches the hashed password."""
        return bcrypt.check_password_hash(self.password, password)
