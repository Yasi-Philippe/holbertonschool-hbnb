# HBnB - Part 2

## 📌 Overview

In this phase of the HBnB project, we implement the **Presentation** and **Business Logic** layers using Python and Flask. The project structure, business classes, and RESTful API endpoints are fully functional, covering user, place, review, and amenity management following REST best practices.

JWT authentication and role management will be addressed in a later phase with Flask and flask-restx.

## ✅ Objectives

- **Set Up the Project Structure:**
  Organize the project into a modular architecture, following best practices for Python and Flask applications. Create the necessary packages for the Presentation and Business Logic layers.

- **Implement the Business Logic Layer:**
  Develop core classes (`User`, `Place`, `Review`, `Amenity`), implement relationships between entities, and use the **Facade pattern** to simplify communication between layers.

- **Build RESTful API Endpoints:**
  Implement CRUD operations for all entities using flask-restx, with data serialization returning extended attributes for related objects.

- **Test and Validate the API:**
  Ensure each endpoint works correctly and handles edge cases via automated unit tests and manual testing with cURL or Postman.

## 🧾 Learning Objectives

- Modular Design and Architecture
- API Development with Flask and flask-restx
- Business Logic Implementation
- Data Serialization and Composition Handling
- Testing and Debugging

## 📁 Project Structure

```
hbnb/
├── app/
│   ├── __init__.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── users.py
│   │       ├── places.py
│   │       ├── reviews.py
│   │       └── amenities.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base_model.py
│   │   ├── user.py
│   │   ├── place.py
│   │   ├── review.py
│   │   └── amenity.py
│   ├── services/
│   │   ├── __init__.py
│   │   └── facade.py
│   └── persistence/
│       ├── __init__.py
│       └── repository.py
├── tests/
│   ├── __init__.py
│   ├── test_user.py
│   ├── test_place.py
│   ├── test_review.py
│   └── test_amenity.py
├── run.py
├── config.py
├── requirements.txt
└── README.md
```

### Key Files

| File                            | Role                                                                                   |
| ------------------------------- | -------------------------------------------------------------------------------------- |
| `app/__init__.py`               | Creates the Flask app and registers all API namespaces                                 |
| `app/services/facade.py`        | Central hub for all business logic operations (Facade pattern)                         |
| `app/persistence/repository.py` | In-memory storage (will be replaced by SQL in Part 3)                                  |
| `app/models/base_model.py`      | Provides `id` (UUID), `created_at`, `updated_at`, and validation helpers to all models |

## ⚒️ Architecture

The application follows a **3-layer architecture**:

| Layer              | Description                                                    | Location                        |
| ------------------ | -------------------------------------------------------------- | ------------------------------- |
| **Presentation**   | Flask-RESTX API endpoints                                      | `app/api/v1/`                   |
| **Business Logic** | Models (`User`, `Place`, `Review`, `Amenity`) + Facade pattern | `app/models/` + `app/services/` |
| **Persistence**    | In-memory repository                                           | `app/persistence/`              |

### Facade Pattern

All API endpoints communicate exclusively through a single `HBnBFacade` instance, which acts as the unique entry point to the business logic:

```
API → HBnBFacade → Models / Repository
```

## 📥 Installation & Setup

### Prerequisites

- Python 3.8+
- pip
- Virtual environment tool (optional but recommended)

### Steps

1. Clone the repository:

```bash
git clone https://github.com/<your-username>/holbertonschool-hbnb.git
cd holbertonschool-hbnb/part2/hbnb
```

2. Create a virtual environment (recommended):

```bash
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

## 🔎 Usage

1. Run the application:

```bash
python run.py
```

2. Open a browser and visit: http://127.0.0.1:5000

3. Swagger documentation is accessible at: http://127.0.0.1:5000/api/v1/

## 🔁 API Endpoints & cURL Examples

> 💡 All endpoints are prefixed with `/api/v1/`

---

### Users

| Method | Endpoint                  | Description           | Status Codes  |
| ------ | ------------------------- | --------------------- | ------------- |
| POST   | `/api/v1/users/`          | Register a new user   | 201, 400      |
| GET    | `/api/v1/users/`          | Retrieve all users    | 200           |
| GET    | `/api/v1/users/<user_id>` | Retrieve a user by ID | 200, 404      |
| PUT    | `/api/v1/users/<user_id>` | Update a user         | 200, 400, 404 |

**Create a User**

```bash
curl -X POST http://127.0.0.1:5000/api/v1/users/ \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com"
  }'
```

Response (201):

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com"
}
```

**Get All Users**

```bash
curl http://127.0.0.1:5000/api/v1/users/
```

**Get User by ID**

```bash
curl http://127.0.0.1:5000/api/v1/users/<user_id>
```

**Update a User**

```bash
curl -X PUT http://127.0.0.1:5000/api/v1/users/<user_id> \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane.doe@example.com"
  }'
```

> 💡 Use a valid `user_id`

---

### Amenities

| Method | Endpoint                         | Description               | Status Codes  |
| ------ | -------------------------------- | ------------------------- | ------------- |
| POST   | `/api/v1/amenities/`             | Create a new amenity      | 201, 400      |
| GET    | `/api/v1/amenities/`             | Retrieve all amenities    | 200           |
| GET    | `/api/v1/amenities/<amenity_id>` | Retrieve an amenity by ID | 200, 404      |
| PUT    | `/api/v1/amenities/<amenity_id>` | Update an amenity         | 200, 400, 404 |

**Create an Amenity**

```bash
curl -X POST http://127.0.0.1:5000/api/v1/amenities/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Wi-Fi"}'
```

Response (201):

```json
{
  "id": "1fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Wi-Fi"
}
```

**Update an Amenity**

```bash
curl -X PUT http://127.0.0.1:5000/api/v1/amenities/<amenity_id> \
  -H "Content-Type: application/json" \
  -d '{"name": "Air Conditioning"}'
```

> 💡 Use a valid `amenity_id`

---

### Places

| Method | Endpoint                            | Description                 | Status Codes  |
| ------ | ----------------------------------- | --------------------------- | ------------- |
| POST   | `/api/v1/places/`                   | Create a new place          | 201, 400      |
| GET    | `/api/v1/places/`                   | Retrieve all places         | 200           |
| GET    | `/api/v1/places/<place_id>`         | Retrieve a place by ID      | 200, 404      |
| PUT    | `/api/v1/places/<place_id>`         | Update a place              | 200, 400, 404 |
| GET    | `/api/v1/places/<place_id>/reviews` | Get all reviews for a place | 200, 404      |

**Create a Place**

```bash
curl -X POST http://127.0.0.1:5000/api/v1/places/ \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Cozy Apartment",
    "description": "A nice place to stay",
    "price": 100.0,
    "latitude": 48.8566,
    "longitude": 2.3522,
    "owner_id": "<user_id>"
  }'
```

> 💡 Use a valid `user_id`

Response (201):

```json
{
  "id": "2fa85f64-5717-4562-b3fc-2c963f66afa6",
  "title": "Cozy Apartment",
  "description": "A nice place to stay",
  "price": 100.0,
  "latitude": 48.8566,
  "longitude": 2.3522,
  "owner_id": "<user_id>"
}
```

#### ⚠️ Validation Rules for Places

| Field       | Rule                                               |
| ----------- | -------------------------------------------------- |
| `title`     | Required, max 100 characters                       |
| `price`     | Required, must be a positive number                |
| `latitude`  | Required, must be between -90 and 90 (inclusive)   |
| `longitude` | Required, must be between -180 and 180 (inclusive) |
| `owner_id`  | Required, must reference an existing user          |

---

### Reviews

| Method | Endpoint                      | Description             | Status Codes  |
| ------ | ----------------------------- | ----------------------- | ------------- |
| POST   | `/api/v1/reviews/`            | Create a new review     | 201, 400      |
| GET    | `/api/v1/reviews/`            | Retrieve all reviews    | 200           |
| GET    | `/api/v1/reviews/<review_id>` | Retrieve a review by ID | 200, 404      |
| PUT    | `/api/v1/reviews/<review_id>` | Update a review         | 200, 400, 404 |
| DELETE | `/api/v1/reviews/<review_id>` | Delete a review         | 200, 404      |

> ⚠️ DELETE is only implemented for reviews in this part of the project.

**Create a Review**

```bash
curl -X POST http://127.0.0.1:5000/api/v1/reviews/ \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Amazing place, highly recommended!",
    "rating": 5,
    "user_id": "<user_id>",
    "place_id": "<place_id>"
  }'
```

> 💡 Use valid `user_id` & `place_id`

Response (201):

```json
{
  "id": "4fa85f64-5717-4562-b3fc-2c963f66afa6",
  "text": "Amazing place, highly recommended!",
  "rating": 5,
  "user_id": "<user_id>",
  "place_id": "<place_id>"
}
```

**Delete a Review**

```bash
curl -X DELETE http://127.0.0.1:5000/api/v1/reviews/<review_id>
```

> 💡 Use a valid `review_id`

Response (200):

```json
{
  "message": "Review deleted successfully"
}
```

#### ⚠️ Validation Rules for Reviews

| Field      | Rule                                       |
| ---------- | ------------------------------------------ |
| `text`     | Required, cannot be empty                  |
| `rating`   | Required, integer between 1 and 5          |
| `user_id`  | Required, must reference an existing user  |
| `place_id` | Required, must reference an existing place |

---

## 🧪 Unit Tests

The project includes a comprehensive test suite located in the `tests/` directory, covering all API endpoints with **53 tests** across 4 test files.

### Running the Tests

```bash
python3 -m unittest discover -s tests -v
```

### Test Report Summary

```
Ran 53 tests in 0.500s

OK
```

### Test Files Overview

| File                    | Entity  | Tests | Description                                      |
| ----------------------- | ------- | ----- | ------------------------------------------------ |
| `tests/test_user.py`    | User    | 11    | CRUD operations + validation                     |
| `tests/test_amenity.py` | Amenity | 8     | CRUD operations + validation                     |
| `tests/test_place.py`   | Place   | 16    | CRUD operations + validation + boundary tests    |
| `tests/test_review.py`  | Review  | 18    | CRUD operations + validation + boundary + delete |

### Detailed Test Breakdown

#### `test_user.py` — 11 tests

| Test                                | Description                | Expected |
| ----------------------------------- | -------------------------- | -------- |
| `test_create_user`                  | Create a valid user        | 201      |
| `test_create_user_empty_first_name` | Empty first_name           | 400      |
| `test_create_user_empty_last_name`  | Empty last_name            | 400      |
| `test_create_user_invalid_email`    | Invalid email format       | 400      |
| `test_create_user_duplicate_email`  | Duplicate email address    | 400      |
| `test_create_user_name_too_long`    | first_name > 50 chars      | 400      |
| `test_get_user_by_id`               | Retrieve user by valid ID  | 200      |
| `test_get_user_not_found`           | Retrieve non-existent user | 404      |
| `test_get_all_users`                | List all users             | 200      |
| `test_update_user`                  | Update an existing user    | 200      |
| `test_update_user_not_found`        | Update non-existent user   | 404      |

#### `test_amenity.py` — 8 tests

| Test                                | Description                   | Expected |
| ----------------------------------- | ----------------------------- | -------- |
| `test_create_amenity`               | Create a valid amenity        | 201      |
| `test_create_amenity_empty_name`    | Empty name                    | 400      |
| `test_create_amenity_name_too_long` | name > 50 chars               | 400      |
| `test_get_amenity_by_id`            | Retrieve amenity by valid ID  | 200      |
| `test_get_amenity_not_found`        | Retrieve non-existent amenity | 404      |
| `test_get_all_amenities`            | List all amenities            | 200      |
| `test_update_amenity`               | Update an existing amenity    | 200      |
| `test_update_amenity_not_found`     | Update non-existent amenity   | 404      |

#### `test_place.py` — 16 tests

| Test                                           | Description                 | Expected |
| ---------------------------------------------- | --------------------------- | -------- |
| `test_create_place`                            | Create a valid place        | 201      |
| `test_create_place_missing_title`              | Empty title                 | 400      |
| `test_create_place_negative_price`             | Negative price              | 400      |
| `test_create_place_zero_price`                 | Zero price                  | 400      |
| `test_create_place_invalid_latitude`           | Latitude > 90               | 400      |
| `test_create_place_invalid_latitude_negative`  | Latitude < -90              | 400      |
| `test_create_place_invalid_longitude`          | Longitude > 180             | 400      |
| `test_create_place_invalid_longitude_negative` | Longitude < -180            | 400      |
| `test_create_place_invalid_owner`              | Non-existent owner_id       | 400      |
| `test_create_place_latitude_boundary_90`       | Latitude = 90 (boundary)    | 201      |
| `test_create_place_latitude_boundary_minus90`  | Latitude = -90 (boundary)   | 201      |
| `test_create_place_longitude_boundary_180`     | Longitude = 180 (boundary)  | 201      |
| `test_get_place_by_id`                         | Retrieve place by valid ID  | 200      |
| `test_get_place_not_found`                     | Retrieve non-existent place | 404      |
| `test_get_all_places`                          | List all places             | 200      |
| `test_update_place`                            | Update an existing place    | 200      |
| `test_update_place_not_found`                  | Update non-existent place   | 404      |

#### `test_review.py` — 18 tests

| Test                                         | Description                    | Expected |
| -------------------------------------------- | ------------------------------ | -------- |
| `test_create_review`                         | Create a valid review          | 201      |
| `test_create_review_empty_text`              | Empty text                     | 400      |
| `test_create_review_invalid_rating_too_high` | Rating > 5                     | 400      |
| `test_create_review_invalid_rating_too_low`  | Rating < 1                     | 400      |
| `test_create_review_invalid_user`            | Non-existent user_id           | 400      |
| `test_create_review_invalid_place`           | Non-existent place_id          | 400      |
| `test_create_review_rating_min`              | Rating = 1 (boundary)          | 201      |
| `test_create_review_rating_max`              | Rating = 5 (boundary)          | 201      |
| `test_get_review_by_id`                      | Retrieve review by valid ID    | 200      |
| `test_get_review_not_found`                  | Retrieve non-existent review   | 404      |
| `test_get_all_reviews`                       | List all reviews               | 200      |
| `test_update_review`                         | Update an existing review      | 200      |
| `test_update_review_not_found`               | Update non-existent review     | 404      |
| `test_delete_review`                         | Delete an existing review      | 200      |
| `test_delete_review_not_found`               | Delete non-existent review     | 404      |
| `test_get_reviews_by_place`                  | Get reviews for a place        | 200      |
| `test_get_reviews_by_place_not_found`        | Reviews for non-existent place | 404      |

### Test Design Notes

- Each test class clears all in-memory repositories in `setUp()` to ensure **test isolation** (no state leaks between tests).
- Tests cover **valid cases**, **invalid input validation** (empty fields, wrong types, out-of-range values), **not-found scenarios** (404), and **boundary values** (edge cases like lat=90, rating=1).
- Review tests include a full lifecycle: create → read → update → delete.

## 📘 Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [Flask-RESTx Documentation](https://flask-restx.readthedocs.io/)
- [Python Project Structure Best Practices](https://docs.python-guide.org/writing/structure/)
- [Facade Design Pattern in Python](https://refactoring.guru/design-patterns/facade/python/example)
- [Python OOP Basics](https://docs.python.org/3/tutorial/classes.html)
- [Why You Should Use UUIDs](https://segment.com/blog/a-brief-history-of-the-uuid/)
- [Testing REST APIs with cURL](https://everything.curl.dev/)
- [Designing RESTful APIs](https://restfulapi.net/)

## 👥 Authors

Yasi Hubner

Mario Colomas
