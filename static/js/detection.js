/* ========================================
   DETECTION PAGE JAVASCRIPT - DRESS CODE DETECTION SYSTEM
   ======================================== */

// Main detection system class
class DressCodeDetector {
    constructor() {
        this.currentImage = null;
        this.cameraStream = null;
        this.liveWebSocket = null;
        this.liveDetectionActive = false;
        this.violationCount = 0;
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.setupModeSwitching();
        this.setupDragAndDrop();
        
        // Ensure detect button is disabled on page load
        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn) {
            detectBtn.disabled = true;
        }
        
        // Reset current image state
        this.currentImage = null;
    }

    initializeEventListeners() {
        // Mode switching
        document.getElementById('uploadMode')?.addEventListener('change', () => {
            this.switchToUploadMode();
        });
        
        document.getElementById('liveMode')?.addEventListener('change', () => {
            this.switchToLiveMode();
        });

        // Upload mode events
        document.getElementById('imageInput')?.addEventListener('change', (e) => {
            this.handleFileSelect(e);
        });

        document.getElementById('cameraBtn')?.addEventListener('click', () => {
            this.startCamera();
        });

        document.getElementById('captureBtn')?.addEventListener('click', () => {
            this.captureImage();
        });

        document.getElementById('stopCameraBtn')?.addEventListener('click', () => {
            this.stopCamera();
        });

        document.getElementById('detectBtn')?.addEventListener('click', (e) => {
            if (e.target.disabled) {
                e.preventDefault();
                return;
            }
            this.detectDressCode();
        });

        // Live detection events
        document.getElementById('startLiveBtn')?.addEventListener('click', () => {
            this.startLiveDetection();
        });

        document.getElementById('stopLiveBtn')?.addEventListener('click', () => {
            this.stopLiveDetection();
        });
    }

    setupModeSwitching() {
        // Initialize with upload mode
        this.switchToUploadMode();
    }

    setupDragAndDrop() {
        const uploadSection = document.querySelector('.upload-section');
        if (!uploadSection) return;

        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = 'var(--primary-orange)';
            uploadSection.style.background = 'linear-gradient(45deg, #e3f2fd, #bbdefb)';
        });

        uploadSection.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#6c757d';
            uploadSection.style.background = 'linear-gradient(45deg, #f8f9fa, #e9ecef)';
        });

        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.style.borderColor = '#6c757d';
            uploadSection.style.background = 'linear-gradient(45deg, #f8f9fa, #e9ecef)';
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }

    switchToUploadMode() {
        const uploadSection = document.getElementById('uploadSection');
        const liveSection = document.getElementById('liveSection');
        const header = document.querySelector('h4');
        
        if (uploadSection) uploadSection.style.display = 'block';
        if (liveSection) liveSection.style.display = 'none';
        if (header) header.textContent = 'Upload Image or Capture from Webcam';
        
        this.stopLiveDetection();
        
        // Ensure detect button is disabled when switching modes
        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn) {
            detectBtn.disabled = !this.currentImage || !this.currentImage.size || this.currentImage.size === 0;
        }
    }

    switchToLiveMode() {
        const uploadSection = document.getElementById('uploadSection');
        const liveSection = document.getElementById('liveSection');
        const header = document.querySelector('h4');
        
        if (uploadSection) uploadSection.style.display = 'none';
        if (liveSection) liveSection.style.display = 'block';
        if (header) header.textContent = 'Live Dress Code Detection';
        
        this.stopCamera();
        this.resetResults();
    }

    // Upload mode functions
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        // Validate file exists and has proper properties
        if (!file || !file.name || file.size === 0) {
            Utils.showError('Please select a valid image file.');
            return;
        }

        if (!file.type.startsWith('image/')) {
            Utils.showError('Please select a valid image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = file;
            this.showImagePreview(e.target.result);
            const detectBtn = document.getElementById('detectBtn');
            if (detectBtn && this.currentImage && this.currentImage.size > 0) {
                detectBtn.disabled = false;
            }
        };
        reader.onerror = () => {
            Utils.showError('Error reading the selected file.');
        };
        reader.readAsDataURL(file);
    }

    showImagePreview(imageSrc) {
        const previewContainer = document.getElementById('imagePreview');
        const previewImg = document.getElementById('previewImg');
        
        if (previewImg) previewImg.src = imageSrc;
        if (previewContainer) previewContainer.style.display = 'block';
        
        // Hide camera preview if showing
        const cameraPreview = document.getElementById('cameraPreview');
        const cameraControls = document.getElementById('cameraControls');
        if (cameraPreview) cameraPreview.style.display = 'none';
        if (cameraControls) cameraControls.style.display = 'none';
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
            const controls = document.getElementById('cameraControls');
            
            if (video) {
                video.srcObject = this.cameraStream;
                video.style.display = 'block';
            }
            if (controls) controls.style.display = 'block';
            
            // Hide image preview
            const imagePreview = document.getElementById('imagePreview');
            if (imagePreview) imagePreview.style.display = 'none';
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            Utils.showError('Could not access camera. Please make sure you have given permission.');
        }
    }

    captureImage() {
        const video = document.getElementById('cameraPreview');
        if (!video) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            this.currentImage = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
            const imageSrc = canvas.toDataURL('image/jpeg');
            this.showImagePreview(imageSrc);
            const detectBtn = document.getElementById('detectBtn');
            if (detectBtn && this.currentImage && this.currentImage.size > 0) {
                detectBtn.disabled = false;
            }
            this.stopCamera();
        }, 'image/jpeg', 0.8);
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
        
        const cameraPreview = document.getElementById('cameraPreview');
        const cameraControls = document.getElementById('cameraControls');
        if (cameraPreview) cameraPreview.style.display = 'none';
        if (cameraControls) cameraControls.style.display = 'none';
    }

    async detectDressCode() {
        if (!this.currentImage) {
            Utils.showError('Please select an image first.');
            return;
        }

        // Additional validation
        if (!this.currentImage.name || this.currentImage.size === 0) {
            Utils.showError('Invalid image file. Please select a valid image.');
            return;
        }

        this.showLoading(true);

        try {
            const formData = new FormData();
            formData.append('file', this.currentImage);
            
            const studentId = document.getElementById('studentId')?.value;
            if (studentId) {
                formData.append('student_id', studentId);
            }

            const response = await fetch(CONFIG.DETECTION_ENDPOINT, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                // Try to get the error message from the response
                try {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
                } catch (parseError) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const result = await response.json();
            this.displayResults(result);

        } catch (error) {
            console.error('Error during detection:', error);
            Utils.showError(error.message || 'Error processing image. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    // Live detection functions
    async startLiveDetection() {
        try {
            await API.startCamera();

            this.updateLiveStatus('Starting live detection...', 'info');
            this.connectWebSocket();

            this.updateLiveUI(true);
            this.liveDetectionActive = true;
            this.violationCount = 0;

            // Add live detection visual indicator
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) mainContainer.classList.add('live-detection-active');

        } catch (error) {
            console.error('Error starting live detection:', error);
            Utils.showError('Failed to start live detection. Please check camera permissions.');
        }
    }

    connectWebSocket() {
        const studentId = document.getElementById('studentId')?.value;
        const wsUrl = `${CONFIG.WEBSOCKET_URL}${studentId ? `?student_id=${studentId}` : ''}`;
        
        this.liveWebSocket = new WebSocket(wsUrl);

        this.liveWebSocket.onopen = () => {
            console.log('WebSocket connected');
            this.updateLiveStatus('Live detection active - monitoring in real-time', 'success');
        };

        this.liveWebSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'detection') {
                this.handleLiveDetection(data);
            }
        };

        this.liveWebSocket.onerror = (error) => {
            console.error('WebSocket error:', error);
            Utils.showError('Live detection connection error. Retrying...');
            
            setTimeout(() => {
                if (this.liveDetectionActive) {
                    this.connectWebSocket();
                }
            }, 3000);
        };

        this.liveWebSocket.onclose = () => {
            console.log('WebSocket disconnected');
            if (this.liveDetectionActive) {
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
        const liveFeed = document.getElementById('liveVideoFeed');
        if (liveFeed) {
            liveFeed.src = data.image;
            liveFeed.style.display = 'block';
        }

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
            this.clearViolationAlert();
        }
    }

    handleViolationAlert(compliance) {
        this.violationCount++;
        
        // Add visual alert
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) resultsSection.classList.add('violation-alert');
        
        // Play notification sound
        Utils.playNotificationSound();
        
        // Show browser notification
        Utils.showBrowserNotification('Dress Code Violation Detected', {
            body: `Missing: ${compliance.missing_items.join(', ')}`,
            tag: 'dress-code-violation'
        });
        
        // Update status with violation count
        this.updateLiveStatus(`Live detection active - ${this.violationCount} violation(s) detected`, 'warning');
    }

    clearViolationAlert() {
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) resultsSection.classList.remove('violation-alert');
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
            await API.stopCamera();
        } catch (error) {
            console.error('Error stopping camera:', error);
        }

        this.updateLiveUI(false);
        this.clearViolationAlert();
        this.resetResults();
    }

    updateLiveUI(isActive) {
        const startBtn = document.getElementById('startLiveBtn');
        const stopBtn = document.getElementById('stopLiveBtn');
        const liveFeed = document.getElementById('liveVideoFeed');
        const placeholder = document.getElementById('liveVideoPlaceholder');
        const status = document.getElementById('liveStatus');
        const mainContainer = document.querySelector('.main-container');

        if (isActive) {
            if (startBtn) startBtn.style.display = 'none';
            if (stopBtn) stopBtn.style.display = 'inline-block';
            if (liveFeed) liveFeed.style.display = 'block';
            if (placeholder) placeholder.style.display = 'none';
            if (status) status.style.display = 'block';
            if (mainContainer) mainContainer.classList.add('live-detection-active');
        } else {
            if (startBtn) startBtn.style.display = 'inline-block';
            if (stopBtn) stopBtn.style.display = 'none';
            if (liveFeed) liveFeed.style.display = 'none';
            if (placeholder) placeholder.style.display = 'block';
            if (status) status.style.display = 'none';
            if (mainContainer) mainContainer.classList.remove('live-detection-active');
        }
    }

    updateLiveStatus(message, type = 'info') {
        const statusDiv = document.getElementById('liveStatus');
        const statusText = document.getElementById('liveStatusText');
        
        if (statusDiv && statusText) {
            statusText.textContent = message;
            statusDiv.className = `alert alert-${type}`;
        }
    }

    // Shared display functions
    displayResults(result) {
        // Hide initial state and show results
        const initialState = document.getElementById('initialState');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (initialState) initialState.style.display = 'none';
        if (resultsContainer) resultsContainer.style.display = 'block';

        // Show demo mode notice if applicable
        if (result.demo_mode) {
            this.showDemoNotice(result.note);
        }

        this.updateComplianceStatus(result);
        this.updateResultImage(result);
        this.updateDetectedItems(result);
        this.updateMissingItems(result);
        this.updateGenderDetection(result);
        this.updateTimestamp(result);

        // Scroll to results only for upload mode
        if (!this.liveDetectionActive && resultsContainer) {
            Utils.smoothScrollTo(resultsContainer);
        }
    }

    showDemoNotice(note) {
        const resultsContainer = document.getElementById('resultsContainer');
        if (!resultsContainer) return;

        const demoNotice = document.createElement('div');
        demoNotice.className = 'alert alert-info alert-dismissible fade show mb-3';
        demoNotice.innerHTML = `
            <i class="fas fa-info-circle me-2"></i>
            <strong>Demo Mode:</strong> ${note}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        resultsContainer.prepend(demoNotice);
    }

    updateComplianceStatus(result) {
        const statusElement = document.getElementById('complianceStatus');
        if (!statusElement) return;

        if (result.compliance.is_compliant) {
            statusElement.textContent = 'Compliant';
            statusElement.className = 'compliance-badge d-inline-block compliant';
        } else {
            statusElement.textContent = result.message;
            statusElement.className = 'compliance-badge d-inline-block violation';
        }
    }

    updateResultImage(result) {
        const resultImage = document.getElementById('resultImage');
        if (resultImage) {
            resultImage.src = result.image;
            resultImage.style.display = 'block';
        }
    }

    updateDetectedItems(result) {
        const container = document.getElementById('detectedItems');
        if (!container) return;

        container.innerHTML = '';
        
        if (result.compliance.detected_items.length > 0) {
            result.compliance.detected_items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'detection-item';
                itemDiv.innerHTML = `<i class="fas fa-check-circle text-success me-2"></i>${item}`;
                container.appendChild(itemDiv);
            });
        } else {
            container.innerHTML = '<p class="text-muted">No items detected</p>';
        }
    }

    updateMissingItems(result) {
        const container = document.getElementById('missingItems');
        if (!container) return;

        container.innerHTML = '';
        
        if (result.compliance.missing_items.length > 0) {
            result.compliance.missing_items.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'detection-item bg-danger text-white';
                itemDiv.innerHTML = `<i class="fas fa-times-circle me-2"></i>${item}`;
                container.appendChild(itemDiv);
            });
        } else {
            container.innerHTML = '<p class="text-success">No missing items</p>';
        }
    }

    updateGenderDetection(result) {
        const genderElement = document.getElementById('detectedGender');
        if (genderElement) {
            genderElement.textContent = result.compliance.gender;
        }
    }

    updateTimestamp(result) {
        if (!result.timestamp) return;

        const genderContainer = document.getElementById('detectedGender')?.parentElement;
        if (!genderContainer) return;

        let timestampElement = document.getElementById('detectionTimestamp');
        if (!timestampElement) {
            timestampElement = document.createElement('div');
            timestampElement.id = 'detectionTimestamp';
            timestampElement.className = 'mt-2 text-muted small';
            genderContainer.appendChild(timestampElement);
        }
        
        const time = Utils.formatTimestamp(result.timestamp);
        timestampElement.innerHTML = `<i class="fas fa-clock me-2"></i>Last updated: ${time}`;
    }

    resetResults() {
        const initialState = document.getElementById('initialState');
        const resultsContainer = document.getElementById('resultsContainer');
        
        if (initialState) initialState.style.display = 'block';
        if (resultsContainer) resultsContainer.style.display = 'none';
        
        // Reset current image and disable detect button
        this.currentImage = null;
        const detectBtn = document.getElementById('detectBtn');
        if (detectBtn) detectBtn.disabled = true;
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        const detectBtn = document.getElementById('detectBtn');
        
        if (spinner) spinner.style.display = show ? 'block' : 'none';
        if (detectBtn) detectBtn.disabled = show;
    }
}

// Initialize the detection system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DressCodeDetector();
});
