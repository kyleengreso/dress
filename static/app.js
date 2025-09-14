class DressCodeDetector {
    constructor() {
        this.currentImage = null;
        this.cameraStream = null;
        this.liveWebSocket = null;
        this.liveDetectionActive = false;
        this.violationCount = 0;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Mode switching
        document.getElementById('uploadMode').addEventListener('change', () => {
            this.switchToUploadMode();
        });
        
        document.getElementById('liveMode').addEventListener('change', () => {
            this.switchToLiveMode();
        });

        // Upload mode events
        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        document.getElementById('cameraBtn').addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('captureBtn').addEventListener('click', () => {
            this.captureImage();
        });

        document.getElementById('stopCameraBtn').addEventListener('click', () => {
            this.stopCamera();
        });

        document.getElementById('detectBtn').addEventListener('click', () => {
            this.detectDressCode();
        });

        // Live detection events
        document.getElementById('startLiveBtn').addEventListener('click', () => {
            this.startLiveDetection();
        });

        document.getElementById('stopLiveBtn').addEventListener('click', () => {
            this.stopLiveDetection();
        });

        // Drag and drop functionality
        const uploadSection = document.querySelector('.upload-section');
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#007bff';
        });

        uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#6c757d';
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#6c757d';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }

    switchToUploadMode() {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('liveSection').style.display = 'none';
        this.stopLiveDetection();
        
        // Update header
        document.querySelector('h4').textContent = 'Upload Image or Capture from Webcam';
    }

    switchToLiveMode() {
        document.getElementById('uploadSection').style.display = 'none';
        document.getElementById('liveSection').style.display = 'block';
        this.stopCamera();
        
        // Update header
        document.querySelector('h4').textContent = 'Live Dress Code Detection';
        
        // Reset results
        document.getElementById('initialState').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'none';
    }

    // Upload mode functions (existing functionality)
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        if (!file.type.startsWith('image/')) {
            this.showError('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = file;
            this.showImagePreview(e.target.result);
            document.getElementById('detectBtn').disabled = false;
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageSrc) {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        previewImg.src = imageSrc;
        previewContainer.style.display = 'block';
        
        // Hide camera preview if showing
        document.getElementById('cameraPreview').style.display = 'none';
        document.getElementById('cameraControls').style.display = 'none';
    }

    async startCamera() {
        try {
            this.cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 640 }, 
                    height: { ideal: 480 } 
                } 
            });
            
            const video = document.getElementById('cameraPreview');
            video.srcObject = this.cameraStream;
            video.style.display = 'block';
            document.getElementById('cameraControls').style.display = 'block';
            
            // Hide image preview
            document.getElementById('imagePreview').style.display = 'none';
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showError('Could not access camera. Please make sure you have given permission.');
        }
    }

    captureImage() {
        const video = document.getElementById('cameraPreview');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            this.currentImage = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            const imageSrc = canvas.toDataURL('image/jpeg');
            this.showImagePreview(imageSrc);
            document.getElementById('detectBtn').disabled = false;
            this.stopCamera();
        }, 'image/jpeg', 0.8);
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        document.getElementById('cameraPreview').style.display = 'none';
        document.getElementById('cameraControls').style.display = 'none';
    }

    async detectDressCode() {
        if (!this.currentImage) {
            this.showError('Please select an image first.');
            return;
        }

        // Show loading spinner
        document.getElementById('loadingSpinner').style.display = 'block';
        document.getElementById('detectBtn').disabled = true;

        try {
            const formData = new FormData();
            formData.append('file', this.currentImage);
            
            const studentId = document.getElementById('studentId').value;
            if (studentId) {
                formData.append('student_id', studentId);
            }

            const response = await fetch('/detect', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayResults(result);

        } catch (error) {
            console.error('Error during detection:', error);
            this.showError('Error processing image. Please try again.');
        } finally {
            // Hide loading spinner
            document.getElementById('loadingSpinner').style.display = 'none';
            document.getElementById('detectBtn').disabled = false;
        }
    }

    // Live detection functions (new functionality)
    async startLiveDetection() {
        try {
            // Start camera on backend
            const response = await fetch('/camera/start', {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to start camera');
            }

            // Show status
            const statusDiv = document.getElementById('liveStatus');
            const statusText = document.getElementById('liveStatusText');
            statusDiv.style.display = 'block';
            statusText.textContent = 'Starting live detection...';

            // Start WebSocket connection
            this.connectWebSocket();

            // Update UI
            document.getElementById('startLiveBtn').style.display = 'none';
            document.getElementById('stopLiveBtn').style.display = 'inline-block';
            document.getElementById('liveVideoPlaceholder').style.display = 'none';
            document.getElementById('liveVideoFeed').style.display = 'block';

            this.liveDetectionActive = true;
            this.violationCount = 0;

            // Add live detection visual indicator
            document.querySelector('.main-container').classList.add('live-detection-active');

        } catch (error) {
            console.error('Error starting live detection:', error);
            this.showError('Failed to start live detection. Please check camera permissions.');
        }
    }

    connectWebSocket() {
        const studentId = document.getElementById('studentId').value;
        const wsUrl = `ws://localhost:8000/ws/camera${studentId ? `?student_id=${studentId}` : ''}`;
        
        this.liveWebSocket = new WebSocket(wsUrl);

        this.liveWebSocket.onopen = () => {
            console.log('WebSocket connected');
            document.getElementById('liveStatusText').textContent = 'Live detection active - monitoring in real-time';
            document.getElementById('liveStatus').className = 'alert alert-success';
        };

        this.liveWebSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'detection') {
                this.handleLiveDetection(data);
            }
        };

        this.liveWebSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.showError('Live detection connection error. Retrying...');
            
            // Retry connection after 3 seconds
            setTimeout(() => {
                if (this.liveDetectionActive) {
                    this.connectWebSocket();
                }
            }, 3000);
        };

        this.liveWebSocket.onclose = () => {
            console.log('WebSocket disconnected');
            if (this.liveDetectionActive) {
                // Attempt to reconnect
                setTimeout(() => {
                    if (this.liveDetectionActive) {
                        this.connectWebSocket();
                    }
                }, 2000);
            }
        };
    }

    handleLiveDetection(data) {
        // Update live video feed
        document.getElementById('liveVideoFeed').src = data.image;

        // Update detection results in real-time
        this.displayResults({
            success: true,
            image: data.image,
            detections: data.detections,
            compliance: data.compliance,
            message: data.compliance.is_compliant ? 'Compliant' : `Violation: Missing ${data.compliance.missing_items.join(', ')}`,
            timestamp: data.timestamp
        });

        // Handle violations
        if (!data.compliance.is_compliant) {
            this.handleViolationAlert(data.compliance);
        } else {
            // Remove violation styling if compliant
            document.querySelector('.results-section').classList.remove('violation-alert');
        }
    }

    handleViolationAlert(compliance) {
        this.violationCount++;
        
        // Add visual alert
        document.querySelector('.results-section').classList.add('violation-alert');
        
        // Play notification sound (if browser allows)
        this.playNotificationSound();
        
        // Show browser notification (if permission granted)
        this.showBrowserNotification(compliance);
        
        // Update status with violation count
        document.getElementById('liveStatusText').textContent = 
            `Live detection active - ${this.violationCount} violation(s) detected`;
    }

    playNotificationSound() {
        try {
            // Create a simple beep sound using Web Audio API
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }

    showBrowserNotification(compliance) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Dress Code Violation Detected', {
                body: `Missing: ${compliance.missing_items.join(', ')}`,
                icon: '/static/favicon.ico',
                tag: 'dress-code-violation'
            });
        }
    }

    async stopLiveDetection() {
        this.liveDetectionActive = false;

        // Close WebSocket
        if (this.liveWebSocket) {
            this.liveWebSocket.close();
            this.liveWebSocket = null;
        }

        // Stop camera on backend
        try {
            await fetch('/camera/stop', {
                method: 'POST'
            });
        } catch (error) {
            console.error('Error stopping camera:', error);
        }

        // Update UI
        document.getElementById('startLiveBtn').style.display = 'inline-block';
        document.getElementById('stopLiveBtn').style.display = 'none';
        document.getElementById('liveVideoFeed').style.display = 'none';
        document.getElementById('liveVideoPlaceholder').style.display = 'block';
        document.getElementById('liveStatus').style.display = 'none';

        // Remove live detection styling
        document.querySelector('.main-container').classList.remove('live-detection-active');
        document.querySelector('.results-section').classList.remove('violation-alert');

        // Reset results display
        document.getElementById('initialState').style.display = 'block';
        document.getElementById('resultsContainer').style.display = 'none';
    }

    // Shared display functions
    displayResults(result) {
        // Hide initial state and show results
        document.getElementById('initialState').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'block';

        // Show demo mode notice if applicable
        if (result.demo_mode) {
            const demoNotice = document.createElement('div');
            demoNotice.className = 'alert alert-info alert-dismissible fade show mb-3';
            demoNotice.innerHTML = `
                <i class="fas fa-info-circle me-2"></i>
                <strong>Demo Mode:</strong> ${result.note}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            `;
            document.getElementById('resultsContainer').prepend(demoNotice);
        }

        // Update compliance status
        const statusElement = document.getElementById('complianceStatus');
        if (result.compliance.is_compliant) {
            statusElement.textContent = 'Compliant';
            statusElement.className = 'compliance-badge d-inline-block compliant';
        } else {
            statusElement.textContent = result.message;
            statusElement.className = 'compliance-badge d-inline-block violation';
        }

        // Show result image with bounding boxes
        const resultImage = document.getElementById('resultImage');
        resultImage.src = result.image;
        resultImage.style.display = 'block';

        // Display detected items
        const detectedItemsContainer = document.getElementById('detectedItems');
        detectedItemsContainer.innerHTML = '';
        
        if (result.compliance.detected_items.length > 0) {
            result.compliance.detected_items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'detection-item';
                itemDiv.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>${item}`;
                detectedItemsContainer.appendChild(itemDiv);
            });
        } else {
            detectedItemsContainer.innerHTML = '<p class="text-muted">No items detected</p>';
        }

        // Display missing items
        const missingItemsContainer = document.getElementById('missingItems');
        missingItemsContainer.innerHTML = '';
        
        if (result.compliance.missing_items.length > 0) {
            result.compliance.missing_items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'detection-item bg-danger text-white';
                itemDiv.innerHTML = `<i class="fas fa-times-circle me-2"></i>${item}`;
                missingItemsContainer.appendChild(itemDiv);
            });
        } else {
            missingItemsContainer.innerHTML = '<p class="text-success">No missing items</p>';
        }

        // Display detected gender
        document.getElementById('detectedGender').textContent = result.compliance.gender;

        // Add timestamp if available (for live detection)
        if (result.timestamp) {
            const timestampDiv = document.getElementById('detectedGender').parentElement;
            let timestampElement = document.getElementById('detectionTimestamp');
            if (!timestampElement) {
                timestampElement = document.createElement('div');
                timestampElement.id = 'detectionTimestamp';
                timestampElement.className = 'mt-2 text-muted small';
                timestampDiv.appendChild(timestampElement);
            }
            const time = new Date(result.timestamp).toLocaleTimeString();
            timestampElement.innerHTML = `<i class="fas fa-clock me-2"></i>Last updated: ${time}`;
        }

        // Scroll to results only for upload mode
        if (!this.liveDetectionActive) {
            document.getElementById('resultsContainer').scrollIntoView({ behavior: 'smooth' });
        }
    }

    showError(message) {
        // Create and show error alert
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-danger alert-dismissible fade show mt-3';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        const container = document.querySelector('.upload-section');
        container.appendChild(alertDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Request notification permission on load
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const detector = new DressCodeDetector();
    detector.requestNotificationPermission();
});

// Health check function
async function checkHealth() {
    try {
        const response = await fetch('/health');
        const result = await response.json();
        console.log('Server health:', result);
    } catch (error) {
        console.error('Server health check failed:', error);
    }
}

// Check server health on load
checkHealth();