from flask_restx import Namespace, Resource, fields
from app.services import facade
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

api = Namespace('places', description='Place operations')

# Define the models for related entities
amenity_model = api.model('PlaceAmenity', {
    'id': fields.String(description='Amenity ID'),
    'name': fields.String(description='Name of the amenity')
})

user_model = api.model('PlaceUser', {
    'id': fields.String(description='User ID'),
    'first_name': fields.String(description='First name of the owner'),
    'last_name': fields.String(description='Last name of the owner'),
    'email': fields.String(description='Email of the owner')
})

# Adding the review model
review_model = api.model('PlaceReview', {
    'id': fields.String(description='Review ID'),
    'text': fields.String(description='Text of the review'),
    'rating': fields.Integer(description='Rating of the place (1-5)'),
    'user_id': fields.String(description='ID of the user')
})

# Define the place model for input validation and documentation
place_model = api.model('Place', {
    'title': fields.String(required=True, description='Title of the place'),
    'description': fields.String(description='Description of the place'),
    'price': fields.Float(required=True, description='Price per night'),
    'latitude': fields.Float(required=True, description='Latitude of the place'),
    'longitude': fields.Float(required=True, description='Longitude of the place'),
    'owner_id': fields.String(required=True, description='ID of the owner'),
    'owner': fields.Nested(user_model, description='Owner of the place'),
    'amenities': fields.List(fields.String, required=True, description="List of amenities ID's")
})

put_place_model = api.model('PUT_Place', {
    'title': fields.String(required=True, description='Title of the place'),
    'description': fields.String(description='Description of the place'),
    'price': fields.Float(required=True, description='Price per night'),
})


@api.route('/')
class PlaceList(Resource):
    @api.expect(place_model)
    @api.response(201, 'Place successfully created')
    @api.response(400, 'Invalid input data')
    @api.doc(security='apiKey')  # Marquer comme protégé dans Swagger
    @jwt_required()
    def post(self):
        """Register a new place"""
        try:
            place_data = api.payload
            current_user = get_jwt_identity()  # Get the current user's identity from the JWT token
            place_data['owner_id'] = current_user  # Set the owner_id to the current user's ID

            new_place = facade.create_place(place_data)

            return {
                'id': new_place.id,
                'title': new_place.title,
                'description': new_place.description,
                'price': new_place.price,
                'latitude': new_place.latitude,
                'longitude': new_place.longitude,
                'owner_id': new_place.owner_id
            }, 201
        except (ValueError, TypeError, KeyError) as e:
            return {'error': str(e)}, 400

    @api.response(200, 'List of places retrieved successfully')
    def get(self):
        """Retrieve a list of all places"""
        places = facade.get_all_places()

        return [{
            "id": place.id,
            "title": place.title,
            "latitude": place.latitude,
            "longitude": place.longitude,
            "owner_id": place.owner_id
        } for place in places], 200


@api.route('/<place_id>')
class PlaceResource(Resource):
    @api.response(200, 'Place details retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get place details by ID"""
        place = facade.get_place(place_id)
        if not place:
            return {"error": "Place not found"}, 404

        owner = facade.get_user(place.owner_id)
        if not owner:
            return {"error": "Owner not found"}, 404
        return {
            "id": place.id,
            "title": place.title,
            "description": place.description,
            "price": place.price,
            "latitude": place.latitude,
            "longitude": place.longitude,
            # TODO: Expected Responses is not the same about docs github
            "owner": {
                "id": owner.id,
                "first_name": owner.first_name,
                "last_name": owner.last_name,
                "email": owner.email
            },
            "amenities": [
                {
                    "id": amenity.id,
                    "name": amenity.name
                }
                for amenity in place.amenities
            ],
            "reviews": [
                {
                    "id": review.id,
                    "text": review.text,
                    "rating": review.rating,
                    "user_id": review.user_id
                }
                for review in place.reviews
            ]
        }, 200

    @api.expect(put_place_model)
    @api.response(200, 'Place updated successfully')
    @api.response(404, 'Place not found')
    @api.response(400, 'Invalid input data')
    @api.doc(security='apiKey')  # Marquer comme protégé dans Swagger
    @jwt_required()
    def put(self, place_id):
        """Update a place's information"""
        try:
            place_data = api.payload
            current_user = get_jwt()
            is_admin = current_user.get('is_admin')
            user_id = current_user.get('sub')

            place = facade.get_place(place_id)
            if not place:
                return {"error": "Place not found"}, 404
            # Show the data of place

            if place.owner_id != user_id and not is_admin:
                return {"error": "Unauthorized action."}, 403

            updated_place = facade.update_place(place_id, place_data)
            if not updated_place:
                return {"error": "Place not found"}, 404
            if len(updated_place.title) == 0:
                return {"error": "Place title is empty"}, 400
            if len(updated_place.description) == 0:
                return {"error": "Place description is empty"}, 400
            if updated_place.price <= 0:
                return {"error": "Place price must be greater than zero"}, 400

            return {"message": "Place updated successfully"}, 200
        except (ValueError, TypeError, KeyError) as e:
            return {'error': str(e)}, 400

    @api.response(200, 'Place deleted successfully')
    @api.response(404, 'Place not found')
    @jwt_required()
    def delete(self, place_id):
        """Delete a place"""
        current_user = get_jwt()
        is_admin = current_user.get('is_admin')
        user_id = current_user.get('sub')

        place = facade.get_place(place_id)
        if not place:
            return {'message': 'Place not found'}, 404

        if place.owner_id != user_id and not is_admin:
            return {'error': 'Unauthorized action'}, 403

        facade.delete_place(place_id)
        return {'message': 'Place successfully deleted'}, 200


@api.route('/<place_id>/reviews')
class PlaceReviewList(Resource):
    @api.response(200, 'List of reviews for the place retrieved successfully')
    @api.response(404, 'Place not found')
    def get(self, place_id):
        """Get all reviews for a specific place"""

        place = facade.get_place(place_id)
        if not place:
            return {"error": "Place not found"}, 404

        reviews = facade.get_reviews_by_place(place_id)

        return [
            {
                "id": review.id,
                "text": review.text,
                "rating": review.rating,
                "user_id": review.user_id
            }
            for review in reviews
        ], 200
