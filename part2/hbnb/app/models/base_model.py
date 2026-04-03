from datetime import datetime
import re
import uuid


class BaseModel:
    def __init__(self):
        self.id = str(uuid.uuid4())
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    def save(self):
        """Update the updated_at timestamp whenever the object is modified"""
        self.updated_at = datetime.now()

    def update(self, data):
        """Update the attributes of the object based on the provided dictionary"""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.save()  # Update the updated_at timestamp

    """Validation Helpers"""
    def _validate_required(self, name, value):
        if value is None:
            raise ValueError(f"{name} is required")
        if isinstance(value, str) and value.strip() == '':
            raise ValueError(f"{name} must not be empty")
        return (value)

    def _validate_type(self, name, value, expected_type):
        if not isinstance(value, expected_type):
            raise ValueError(f"{name} must be of type {expected_type.__name__}")
        return (value)

    def _validate_length(self, name, value, max_length):
        if len(value) > max_length:
            raise ValueError(f"{name} must be at most {max_length} characters long")
        return (value)

    def _validate_format(self, name, value, fmt):
        if fmt == 'email':
            pattern = r"[^@]+@[^@]+\.[^@]+"
            if not re.match(pattern, value):
                raise ValueError(f"{name} must be a valid email address")
        return (value)

    def _validate_range(self, name, value, min_value, max_value):
        if not (min_value <= value <= max_value):
            raise ValueError(f"{name} must be between {min_value} and {max_value}")
        return (value)

    def _validate_field(self, name, value, expected_type=None, max_length=None, required=False, fmt=None, min_value=None, max_value=None):
        if required:
            self._validate_required(name, value)
        if expected_type:
            value = self._validate_type(name, value, expected_type)
        if max_length is not None:
            value = self._validate_length(name, value, max_length)
        if fmt:
            value = self._validate_format(name, value, fmt)
        if min_value is not None and max_value is not None:
            value = self._validate_range(name, value, min_value, max_value)
        elif min_value is not None:
            if value < min_value:
                raise ValueError(f"{name} must be at least {min_value}")
        return value
