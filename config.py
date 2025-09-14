import os

# Database Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'dresstest'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': int(os.getenv('DB_PORT', 3306))
}

# YOLOv8 Model Configuration
MODEL_PATH = "best.pt"
CONFIDENCE_THRESHOLD = 0.5

# Class mapping for the trained model
CLASS_NAMES = {
    0: 'blouse',
    1: 'doll_shoes', 
    2: 'id_student',
    3: 'pants',
    4: 'polo_shirt',
    5: 'shoes',
    6: 'skirt'
}

# Dress code requirements
DRESS_CODE_REQUIREMENTS = {
    'Male': ['polo_shirt', 'pants', 'shoes'],
    'Female': ['blouse', 'skirt', 'shoes']
}

# Class mapping for display names
DISPLAY_NAMES = {
    'blouse': 'Blouse',
    'doll_shoes': 'Shoes',
    'id_student': 'Student ID',
    'pants': 'Black Pants', 
    'polo_shirt': 'Polo Shirt',
    'shoes': 'Shoes',
    'skirt': 'Skirt'
}
