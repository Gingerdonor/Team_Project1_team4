# saju_app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager
from config import Config

# 확장 라이브러리 초기화 (아직 앱에 연결 안 함)
db = SQLAlchemy()
bcrypt = Bcrypt()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'  # Blueprint 이름으로 변경
login_manager.login_message_category = 'info'

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(Config)

    # 확장 라이브러리를 앱에 연결
    db.init_app(app)
    bcrypt.init_app(app)
    login_manager.init_app(app)

    # --- Blueprint 등록 ---
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from .routes.main import main_bp
    app.register_blueprint(main_bp)
    
    from .routes.custom import custom_bp
    app.register_blueprint(custom_bp)
    
    from .routes.attendance import attendance_bp
    app.register_blueprint(attendance_bp)

    from .routes.settings import settings_bp
    app.register_blueprint(settings_bp)

    # --- User 로더 ---
    from .models import User
    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    return app