from flask_restx import Namespace, Resource, fields
from app.services import facade
from flask_jwt_extended import jwt_required, get_jwt

api = Namespace('amenities', description='Amenity operations')

# Define the amenity model for input validation and documentation
amenity_model = api.model('Amenity', {
    'name': fields.String(required=True, description='Name of the amenity')
})


@api.route('/')
class AmenityList(Resource):
    @api.expect(amenity_model)
    @api.response(201, 'Amenity successfully created')
    @api.response(400, 'Invalid input data')
    @api.doc(security='apiKey')  # Marquer comme protégé dans Swagger
    @jwt_required()
    def post(self):
        """Register a new amenity"""
        try:
            amenity_data = api.payload
            current_user = get_jwt()
            # Admin privileges are required to create amenities.
            if not current_user.get('is_admin'):
                return {'error': 'Admin privileges required'}, 403

            new_amenity = facade.create_amenity(amenity_data)
            return {'id': new_amenity.id, 'name': new_amenity.name}, 201
        except (ValueError, TypeError, KeyError) as e:
            return {'error': str(e)}, 400

    @api.response(200, 'List of amenities retrieved successfully')
    def get(self):
        """Retrieve a list of all amenities"""
        amenities = facade.get_all_amenities()
        return [{'id': amenity.id, 'name': amenity.name} for amenity in amenities], 200


@api.route('/<amenity_id>')
class AmenityResource(Resource):
    @api.response(200, 'Amenity details retrieved successfully')
    @api.response(404, 'Amenity not found')
    def get(self, amenity_id):
        """Get amenity details by ID"""
        amenity = facade.get_amenity(amenity_id)
        if not amenity:
            return {'error': 'Amenity not found'}, 404
        return {'id': amenity.id, 'name': amenity.name}, 200

    @api.expect(amenity_model)
    @api.response(200, 'Amenity updated successfully')
    @api.response(404, 'Amenity not found')
    @api.response(400, 'Invalid input data')
    @api.doc(security='apiKey')  # Marquer comme protégé dans Swagger
    @jwt_required()
    def put(self, amenity_id):
        """Update an amenity's information"""
        try:
            amenity_data = api.payload
            # Admin privileges are required to update amenities.
            current_user = get_jwt()
            if not current_user.get('is_admin'):
                return {'error': 'Admin privileges required'}, 403

            updated_amenity = facade.update_amenity(amenity_id, amenity_data)
            if len(updated_amenity.get("name")) == 0:
                return {'error': 'Amenity name is empty'}, 400
            if not updated_amenity:
                return {'error': 'Amenity not found'}, 404
            return {'id': updated_amenity.get("id"), 'name': updated_amenity.get("name")}, 200
        except (ValueError, TypeError, KeyError) as e:
            return {'error': str(e)}, 400
