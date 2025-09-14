from fastapi import FastAPI, File, UploadFile, HTTPException, Form, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
from PIL import Image
import io
import base64
from ultralytics import YOLO
import mysql.connector
from mysql.connector import Error
import os
from typing import List, Dict, Optional
import json
from datetime import datetime
import asyncio
import threading
import time
from config import (
    DB_CONFIG, MODEL_PATH, CONFIDENCE_THRESHOLD,
    CLASS_NAMES, DRESS_CODE_REQUIREMENTS, DISPLAY_NAMES
)

app = FastAPI(title="Dress Code Detection API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load YOLOv8 model
model = YOLO(MODEL_PATH)

def get_db_connection():
    """Create database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Warning: Could not connect to MySQL database: {e}")
        print("Application will continue without database logging.")
        return None

def detect_gender_from_items(detected_items: List[str]) -> str:
    """Detect gender based on detected clothing items"""
    female_items = {'blouse', 'skirt', 'doll_shoes'}
    male_items = {'polo_shirt', 'pants', 'shoes'}
    
    female_score = len(set(detected_items) & female_items)
    male_score = len(set(detected_items) & male_items)
    
    if female_score > male_score:
        return 'Female'
    elif male_score > female_score:
        return 'Male'
    else:
        # Default to Male if unclear
        return 'Male'

def check_dress_code_compliance(detected_items: List[str], gender: str) -> Dict:
    """Check dress code compliance based on detected items and gender"""
    required_items = DRESS_CODE_REQUIREMENTS[gender].copy()
    detected_set = set(detected_items)
    
    # For female students, accept either 'shoes' or 'doll_shoes' as valid footwear
    if gender == 'Female':
        if 'doll_shoes' in detected_set:
            detected_set.add('shoes')  # Treat doll_shoes as shoes for compliance check
    
    missing_items = []
    for item in required_items:
        if item not in detected_set:
            missing_items.append(DISPLAY_NAMES[item])
    
    is_compliant = len(missing_items) == 0
    
    return {
        'is_compliant': is_compliant,
        'missing_items': missing_items,
        'detected_items': [DISPLAY_NAMES.get(item, item) for item in detected_items],
        'gender': gender
    }

def draw_bounding_boxes(image: np.ndarray, results) -> np.ndarray:
    """Draw bounding boxes on the image"""
    annotated_image = image.copy()
    
    for result in results:
        boxes = result.boxes
        if boxes is not None:
            for box in boxes:
                # Get coordinates
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                
                # Get class and confidence
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                
                if conf > CONFIDENCE_THRESHOLD:  # Only show detections with confidence > threshold
                    class_name = CLASS_NAMES.get(cls, f'class_{cls}')
                    display_name = DISPLAY_NAMES.get(class_name, class_name)
                    
                    # Draw bounding box
                    cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    
                    # Draw label
                    label = f'{display_name}: {conf:.2f}'
                    (label_width, label_height), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    cv2.rectangle(annotated_image, (x1, y1 - label_height - 10), (x1 + label_width, y1), (0, 255, 0), -1)
                    cv2.putText(annotated_image, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 1)
    
    return annotated_image

def image_to_base64(image: np.ndarray) -> str:
    """Convert numpy image to base64 string"""
    _, buffer = cv2.imencode('.jpg', image)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    return f"data:image/jpeg;base64,{img_base64}"

def log_violation(student_id: Optional[int], missing_items: List[str], location: str = "Web Detection"):
    """Log violation to database"""
    if not missing_items:
        return
    
    connection = get_db_connection()
    if connection:
        try:
            cursor = connection.cursor()
            for item in missing_items:
                query = """
                INSERT INTO violations (student_id, missing_item, location, status)
                VALUES (%s, %s, %s, 'Pending')
                """
                cursor.execute(query, (student_id, item, location))
            
            connection.commit()
            cursor.close()
            print(f"Violation logged: Student {student_id}, Missing: {', '.join(missing_items)}")
        except Error as e:
            print(f"Error logging violation: {e}")
        finally:
            connection.close()
    else:
        print(f"Database not available. Would log violation: Student {student_id}, Missing: {', '.join(missing_items)}")

@app.get("/", response_class=HTMLResponse)
async def read_root():
    """Serve the landing page"""
    try:
        with open("static/landing.html", "r", encoding="utf-8") as file:
            html_content = file.read()
        return HTMLResponse(content=html_content)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Landing page not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading landing page: {str(e)}")

@app.get("/detect", response_class=HTMLResponse)
async def detection_page():
    """Serve the detection system page"""
    try:
        with open("static/index.html", "r", encoding="utf-8") as file:
            html_content = file.read()
        return HTMLResponse(content=html_content)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Detection page not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading detection page: {str(e)}")

@app.post("/detect")
async def detect_dress_code(
    file: UploadFile = File(None),
    student_id: Optional[int] = Form(None)
):
    """Process uploaded image and detect dress code violations"""
    try:
        # Validate that a file was uploaded
        if file is None or file.filename is None or file.filename == "":
            raise HTTPException(status_code=400, detail="No image file provided")
        
        # Validate file type
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Invalid file type. Please upload an image file.")
        
        # Read image
        contents = await file.read()
        
        # Check if file is empty
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="Empty file provided")
        
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Invalid image file or corrupted image")
        
        # Run YOLO inference
        results = model(image)
        
        # Extract detected items
        detected_items = []
        detection_details = []
        
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for box in boxes:
                    cls = int(box.cls[0])
                    conf = float(box.conf[0])
                    
                    if conf > CONFIDENCE_THRESHOLD:  # Only consider detections with confidence > threshold
                        class_name = CLASS_NAMES.get(cls, f'class_{cls}')
                        detected_items.append(class_name)
                        
                        x1, y1, x2, y2 = map(int, box.xyxy[0])
                        detection_details.append({
                            'class': DISPLAY_NAMES.get(class_name, class_name),
                            'confidence': conf,
                            'bbox': [x1, y1, x2, y2]
                        })
        
        # Detect gender based on clothing items
        gender = detect_gender_from_items(detected_items)
        
        # Check dress code compliance
        compliance_result = check_dress_code_compliance(detected_items, gender)
        
        # Draw bounding boxes on image
        annotated_image = draw_bounding_boxes(image, results)
        
        # Convert annotated image to base64
        image_base64 = image_to_base64(annotated_image)
        
        # Log violation if not compliant
        if not compliance_result['is_compliant']:
            log_violation(student_id, compliance_result['missing_items'])
        
        # Prepare response
        response = {
            'success': True,
            'image': image_base64,
            'detections': detection_details,
            'compliance': compliance_result,
            'message': 'Compliant' if compliance_result['is_compliant'] else f"Violation: Missing {', '.join(compliance_result['missing_items'])}"
        }
        
        return JSONResponse(content=response)
        
    except Exception as e:
        print(f"Error processing image: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

# Global variables for camera management
camera_active = False
camera = None
detection_results = {}
violation_alerts = []

class CameraManager:
    def __init__(self):
        self.camera = None
        self.is_active = False
        self.last_detection = None
        self.violation_count = 0
        self.last_violation_time = 0
        
    def start_camera(self, camera_index=0):
        """Start camera capture"""
        try:
            self.camera = cv2.VideoCapture(camera_index)
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.camera.set(cv2.CAP_PROP_FPS, 30)
            self.is_active = True
            return True
        except Exception as e:
            print(f"Error starting camera: {e}")
            return False
    
    def stop_camera(self):
        """Stop camera capture"""
        self.is_active = False
        if self.camera:
            self.camera.release()
            self.camera = None
    
    def get_frame(self):
        """Get current frame from camera"""
        if self.camera and self.is_active:
            ret, frame = self.camera.read()
            if ret:
                return frame
        return None
    
    def process_frame(self, frame, student_id=None):
        """Process frame for dress code detection"""
        try:
            # Run YOLO inference
            results = model(frame)
            
            # Extract detected items
            detected_items = []
            detection_details = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        
                        if conf > CONFIDENCE_THRESHOLD:
                            class_name = CLASS_NAMES.get(cls, f'class_{cls}')
                            detected_items.append(class_name)
                            
                            x1, y1, x2, y2 = map(int, box.xyxy[0])
                            detection_details.append({
                                'class': DISPLAY_NAMES.get(class_name, class_name),
                                'confidence': conf,
                                'bbox': [x1, y1, x2, y2]
                            })
            
            # Detect gender and check compliance
            gender = detect_gender_from_items(detected_items)
            compliance_result = check_dress_code_compliance(detected_items, gender)
            
            # Draw bounding boxes
            annotated_frame = draw_bounding_boxes(frame, results)
            
            # Check for violations and alert
            if not compliance_result['is_compliant']:
                current_time = time.time()
                # Only log violation every 5 seconds to avoid spam
                if current_time - self.last_violation_time > 5:
                    log_violation(student_id, compliance_result['missing_items'], "Live Camera")
                    self.violation_count += 1
                    self.last_violation_time = current_time
            
            # Store results
            self.last_detection = {
                'detections': detection_details,
                'compliance': compliance_result,
                'annotated_frame': annotated_frame,
                'timestamp': datetime.now().isoformat()
            }
            
            return self.last_detection
            
        except Exception as e:
            print(f"Error processing frame: {e}")
            return None

# Global camera manager
camera_manager = CameraManager()

@app.post("/camera/start")
async def start_camera():
    """Start live camera detection"""
    global camera_manager
    
    if camera_manager.start_camera():
        return {"success": True, "message": "Camera started successfully"}
    else:
        raise HTTPException(status_code=500, detail="Failed to start camera")

@app.post("/camera/stop")
async def stop_camera():
    """Stop live camera detection"""
    global camera_manager
    
    camera_manager.stop_camera()
    return {"success": True, "message": "Camera stopped successfully"}

@app.get("/camera/status")
async def camera_status():
    """Get camera status"""
    global camera_manager
    
    return {
        "active": camera_manager.is_active,
        "last_detection": camera_manager.last_detection,
        "violation_count": camera_manager.violation_count
    }

@app.websocket("/ws/camera")
async def websocket_camera(websocket: WebSocket, student_id: Optional[int] = None):
    """WebSocket endpoint for real-time camera feed"""
    await websocket.accept()
    global camera_manager
    
    try:
        while camera_manager.is_active:
            frame = camera_manager.get_frame()
            if frame is not None:
                # Process frame for detection
                detection_result = camera_manager.process_frame(frame, student_id)
                
                if detection_result:
                    # Convert annotated frame to base64
                    _, buffer = cv2.imencode('.jpg', detection_result['annotated_frame'])
                    img_base64 = base64.b64encode(buffer).decode('utf-8')
                    
                    # Send detection results via WebSocket
                    await websocket.send_json({
                        "type": "detection",
                        "image": f"data:image/jpeg;base64,{img_base64}",
                        "detections": detection_result['detections'],
                        "compliance": detection_result['compliance'],
                        "timestamp": detection_result['timestamp']
                    })
                
                # Control frame rate (10 FPS for real-time detection)
                await asyncio.sleep(0.1)
            else:
                await asyncio.sleep(0.1)
                
    except WebSocketDisconnect:
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        # Don't automatically stop camera when one client disconnects
        # camera_manager.stop_camera()
        pass

def generate_camera_stream():
    """Generate camera stream for HTTP streaming"""
    global camera_manager
    
    while camera_manager.is_active:
        frame = camera_manager.get_frame()
        if frame is not None:
            # Process frame for detection
            detection_result = camera_manager.process_frame(frame)
            
            if detection_result:
                annotated_frame = detection_result['annotated_frame']
            else:
                annotated_frame = frame
            
            # Encode frame as JPEG
            _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            frame_bytes = buffer.tobytes()
            
            # Yield frame in multipart format
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
        else:
            time.sleep(0.1)

@app.get("/camera/stream")
async def camera_stream():
    """HTTP streaming endpoint for camera feed"""
    global camera_manager
    
    if not camera_manager.is_active:
        raise HTTPException(status_code=400, detail="Camera is not active")
    
    return StreamingResponse(
        generate_camera_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "model_loaded": model is not None}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
