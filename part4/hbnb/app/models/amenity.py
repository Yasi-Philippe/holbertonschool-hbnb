from app.models.base_model import BaseModel
from app import db


class Amenity(BaseModel):
    __tablename__ = 'amenities'

    id = db.Column(db.String(100), primary_key=True)
    name = db.Column(db.String(50), nullable=False)

    def __init__(self, name):
        super().__init__()

        self.name = self._validate_field("name", name, str, 50, True)
