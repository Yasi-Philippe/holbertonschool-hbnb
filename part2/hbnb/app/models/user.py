from app.models.base_model import BaseModel


class User(BaseModel):
    def __init__(self, first_name, last_name, email, password, is_admin=False):
        super().__init__()

        self.first_name = self._validate_field("first_name", first_name, str, 50, True)
        self.last_name = self._validate_field("last_name", last_name, str, 50, True)
        self.email = self._validate_field("email", email, str, 100, True, fmt='email')
        self.is_admin = self._validate_field("is_admin", is_admin, bool, None, False)