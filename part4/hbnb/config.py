import os


class Config:
    SECRET_KEY = os.getenv(
        'SECRET_KEY', 'ff866263-9b7a-45fb-82ec-2b8eac3137a9'
    )
    JWT_SECRET_KEY = os.getenv(
        'JWT_SECRET_KEY', 'ff866263-9b7a-45fb-82ec-2b8eac3137a9'
    )
    DEBUG = False


class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///development.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False


config = {
    'development': DevelopmentConfig,
    'default': DevelopmentConfig
}
