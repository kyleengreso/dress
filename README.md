# Dress Code Detection System

A web application that uses YOLOv8 for automatic dress code detection and compliance checking. Built with FastAPI backend and HTML/JavaScript frontend with Bootstrap styling.

## Features

- **Image Upload & Webcam Capture**: Upload images or capture directly from webcam
- **YOLOv8 Object Detection**: Trained model for detecting dress code items
- **Gender-Specific Rules**: Different requirements for male and female students
- **Compliance Checking**: Automatic violation detection based on missing items
- **Database Integration**: MySQL database for logging violations and student data
- **Modern UI**: Clean, responsive interface with Bootstrap styling
- **Real-time Results**: Displays detected items with bounding boxes

## Dress Code Requirements

### Male Students
- Polo Shirt
- Black Pants  
- Shoes

### Female Students
- Blouse
- Skirt
- Shoes

## Detected Classes

The YOLOv8 model is trained to detect:
- `blouse` - Female blouse
- `doll_shoes` - Female shoes
- `pants` - Male pants
- `polo_shirt` - Male polo shirt
- `shoes` - Male shoes
- `skirt` - Female skirt

## Setup Instructions

### Prerequisites
- Python 3.8+
- MySQL Server
- Webcam (optional, for camera capture)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Database Setup
1. Create MySQL database named `dresstest`
2. Import the database schema:
```bash
mysql -u root -p dresstest < dresstest_db.sql
```

3. Add dummy data:
```bash
python add_dummy_data.py
```

### 3. Configuration
Update database credentials in `config.py`:
```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'dresstest',
    'user': 'your_username',
    'password': 'your_password',
    'port': 3306
}
```

### 4. Model File
Ensure `best.pt` (YOLOv8 trained model) is in the project root directory.

### 5. Run Application
```bash
python main.py
```

The application will be available at: `http://localhost:8000`

## API Endpoints

### `GET /`
Serves the main HTML interface

### `POST /detect`
**Parameters:**
- `file`: Image file (multipart/form-data)
- `student_id`: Optional student ID for logging

**Response:**
```json
{
    "success": true,
    "image": "base64_encoded_image_with_bounding_boxes",
    "detections": [
        {
            "class": "Polo Shirt",
            "confidence": 0.85,
            "bbox": [x1, y1, x2, y2]
        }
    ],
    "compliance": {
        "is_compliant": false,
        "missing_items": ["Black Pants"],
        "detected_items": ["Polo Shirt", "Shoes"],
        "gender": "Male"
    },
    "message": "Violation: Missing Black Pants"
}
```

### `GET /health`
Health check endpoint

## Database Schema

### Tables
- **students**: Student information with RFID tags
- **admins**: System administrators with different roles
- **violations**: Logged dress code violations
- **case_notes**: Notes on violation cases
- **requirements**: Dress code requirements by gender

## Project Structure
```
dresstest/
├── main.py                 # FastAPI backend
├── config.py              # Configuration settings
├── add_dummy_data.py      # Script to populate database
├── requirements.txt       # Python dependencies
├── best.pt               # YOLOv8 trained model
├── dresstest_db.sql      # Database schema
├── README.md             # This file
└── static/
    ├── index.html        # Frontend interface
    └── app.js            # JavaScript functionality
```

## Usage

1. **Upload Image**: Click "Choose Image" or drag & drop an image
2. **Use Camera**: Click "Use Camera" to capture from webcam
3. **Student ID**: Optionally enter student ID for violation logging
4. **Detect**: Click "Detect Dress Code" to analyze the image
5. **View Results**: See compliance status, detected items, and missing items

## Development

### Adding New Classes
1. Update `CLASS_NAMES` in `config.py`
2. Update `DRESS_CODE_REQUIREMENTS` as needed
3. Update `DISPLAY_NAMES` for user-friendly labels
4. Retrain YOLOv8 model with new classes

### Database Extensions
The modular design allows easy extension of database functionality:
- Add new tables in the SQL schema
- Update violation logging in `main.py`
- Create new API endpoints for data management

## Troubleshooting

### Common Issues
1. **Model not found**: Ensure `best.pt` is in the project root
2. **Database connection**: Check MySQL server and credentials
3. **Camera access**: Ensure browser permissions for webcam
4. **Port conflicts**: Change port in `main.py` if 8000 is occupied

### Performance
- Adjust `CONFIDENCE_THRESHOLD` in `config.py` for detection sensitivity
- Consider GPU acceleration for faster inference
- Optimize image size for better processing speed

## License
This project is for educational purposes.
