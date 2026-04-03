from app.persistence.repository import InMemoryRepository
from app.models.user import User
from app.models.place import Place
from app.models.review import Review
from app.models.amenity import Amenity


class HBnBFacade:
    def __init__(self):
        self.user_repo = InMemoryRepository()
        self.place_repo = InMemoryRepository()
        self.review_repo = InMemoryRepository()
        self.amenity_repo = InMemoryRepository()

    # User operations
    def create_user(self, user_data):
        user = User(**user_data)
        self.user_repo.add(user)
        return user

    def get_user(self, user_id):
        return self.user_repo.get(user_id)

    def get_user_by_email(self, email):
        return self.user_repo.get_by_attribute("email", email)

    def get_all_users(self):
        return self.user_repo.get_all()

    def update_user(self, user_id, new_data):
        user = self.get_user(user_id)
        if not user:
            return None
        new_user = {
            "id": user_id,
            "first_name": new_data.get("first_name"),
            "last_name": new_data.get("last_name"),
            "email": new_data.get("email"),
        }
        self.user_repo.update(user_id, new_user)
        return new_user

    # Amenity operations
    def create_amenity(self, amenity_data):
        amenity = Amenity(**amenity_data)
        self.amenity_repo.add(amenity)
        return amenity

    def get_amenity(self, amenity_id):
        return self.amenity_repo.get(amenity_id)

    def get_all_amenities(self):
        return self.amenity_repo.get_all()

    def update_amenity(self, amenity_id, amenity_data):
        amenity = self.get_amenity(amenity_id)
        if not amenity:
            return None
        new_amenity = {"id": amenity_id, "name": amenity_data.get("name")}
        self.amenity_repo.update(amenity_id, new_amenity)
        return new_amenity

    # Place Operations
    def create_place(self, place_data):
        owner = self.get_user(place_data.get("owner_id"))
        if not owner:
            raise ValueError("Owner not found")

        place = Place(
            title=place_data["title"],
            description=place_data.get("description", ""),
            price=place_data["price"],
            latitude=place_data["latitude"],
            longitude=place_data["longitude"],
            owner=owner,
        )

        place.amenities = place_data.get("amenities", [])

        self.place_repo.add(place)
        return place

    def get_place(self, place_id):
        return self.place_repo.get(place_id)

    def get_all_places(self):
        return self.place_repo.get_all()

    def update_place(self, place_id, data):
        place = self.place_repo.get(place_id)
        if not place:
            return None

        place.update(data)
        return place

    def delete_place(self, place_id):
        self.place_repo.delete(place_id)

    # Review operations
    def create_review(self, review_data):
        user = self.get_user(review_data.get("user_id"))
        place = self.get_place(review_data.get("place_id"))
        if not user:
            raise ValueError("User not found")
        if not place:
            raise ValueError("Place not found")
        if not review_data.get("rating"):
            raise ValueError("Rating is required")
        review = Review(
            text=review_data.get("text"),
            rating=review_data.get("rating"),
            user=user,
            place=place
        )
        self.review_repo.add(review)
        return review

    def get_review(self, review_id):
        return self.review_repo.get(review_id)

    def get_all_reviews(self):
        return self.review_repo.get_all()

    def get_reviews_by_place(self, place_id):
        all_reviews = self.get_all_reviews()
        return [review for review in all_reviews if review.place_id == place_id]

    def update_review(self, review_id, review_data):
        review = self.get_review(review_id)
        if not review:
            return None
        new_review = {
            "id": review_id,
            "text": review_data.get("text"),
            "rating": review_data.get("rating"),
            "user_id": review_data.get("user_id"),
            "place_id": review_data.get("place_id")
            }
        self.review_repo.update(review_id, new_review)
        return new_review

    def delete_review(self, review_id):
        self.review_repo.delete(review_id)
