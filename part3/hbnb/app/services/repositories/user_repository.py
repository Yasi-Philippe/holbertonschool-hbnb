from app.models.user import User
from app.persistence.repository import SQLAlchemyRepository
# TODO: Comment the import cuz idk
from app import db


class UserRepository(SQLAlchemyRepository):
    def __init__(self):
        super().__init__(User)

    def get_user_by_email(self, email):
        return self.model.query.filter_by(email=email).first()
