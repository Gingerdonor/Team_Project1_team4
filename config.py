# config.py
import os

# 프로젝트의 기본 경로를 설정합니다.
# 이 파일(config.py)이 run.py와 같은 위치(프로젝트 루트)에 있다고 가정합니다.
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """
    애플리케이션의 기본 설정을 담는 클래스.
    환경 변수가 설정되어 있으면 그 값을 사용하고, 
    없으면 기본값을 사용합니다. (배포 시 유리)
    """
    
    # 1. 보안을 위한 시크릿 키
    #    - 실제 배포 시에는 'your_very_secret_key' 대신
    #      환경 변수(SECRET_KEY)에 설정된 값을 사용해야 합니다.
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your_very_secret_and_complex_key'

    # 2. 데이터베이스 설정
    #    - 기본값: 프로젝트 루트 폴더에 app.db라는 이름의 SQLite 데이터베이스
    #    - 'saju_app' 폴더 내부가 아닌, run.py와 같은 위치에 DB 파일이 생성됩니다.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    
    # 3. SQLAlchemy 설정
    #    - 이벤트 알림 기능을 비활성화하여 오버헤드를 줄입니다.
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # TODO: 나중에 이메일 설정, API 키 등 다른 설정들을 추가할 수 있습니다.
    # MAIL_SERVER = ...
    # MAIL_PORT = ...