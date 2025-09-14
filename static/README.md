# File Organization - Dress Code Detection System

## 📁 Directory Structure

```
static/
├── css/
│   ├── shared.css          # Common styles and variables
│   ├── landing.css         # Landing page specific styles
│   └── detection.css       # Detection page specific styles
├── js/
│   ├── shared.js           # Common utilities and functions
│   ├── landing.js          # Landing page functionality
│   └── detection.js        # Detection system functionality
├── landing.html            # Landing page (clean, minimal)
├── index.html              # Detection system page
└── README.md               # This file
```

## 🎨 CSS Organization

### `shared.css`
- **CSS Variables**: Color palette, spacing, typography
- **Base Styles**: Reset, typography, common elements
- **Utility Classes**: Buttons, cards, icons, animations
- **Responsive Design**: Mobile-first approach
- **Common Components**: Alerts, loading spinners, etc.

### `landing.css`
- **Landing Page Specific**: Hero, features, stats, CTA sections
- **Navigation**: Fixed navbar with scroll effects
- **Animations**: Fade-in, hover effects, transitions
- **Color Scheme**: Dark background with orange accents

### `detection.css`
- **Detection Page Specific**: Upload, camera, results sections
- **Live Detection**: Real-time monitoring styles
- **Mode Switching**: Upload vs Live detection modes
- **Compliance Display**: Status badges, violation alerts

## 🚀 JavaScript Organization

### `shared.js`
- **Global Configuration**: API endpoints, WebSocket URLs
- **Utility Functions**: Error handling, notifications, animations
- **API Helpers**: HTTP requests, health checks
- **Common Features**: Scroll observer, smooth scrolling

### `landing.js`
- **Landing Page Class**: Main functionality
- **Navigation**: Smooth scrolling, navbar effects
- **Animations**: Scroll-triggered animations
- **Interactive Elements**: CTA tracking, demo modal

### `detection.js`
- **Detection System Class**: Main detection functionality
- **Mode Management**: Upload vs Live detection switching
- **Camera Handling**: WebRTC, capture, streaming
- **Live Detection**: WebSocket connection, real-time updates
- **Results Display**: Dynamic UI updates, violation alerts

## 🔧 Benefits of This Organization

### **Modularity**
- **Separation of Concerns**: Each file has a specific purpose
- **Reusability**: Shared styles and functions across pages
- **Maintainability**: Easy to find and update specific features

### **Performance**
- **Cached Resources**: CSS and JS files can be cached by browsers
- **Selective Loading**: Only load what's needed for each page
- **Minification Ready**: Easy to minify for production

### **Development**
- **Clean HTML**: No inline styles or scripts
- **Easy Debugging**: Clear file structure for troubleshooting
- **Team Collaboration**: Multiple developers can work on different files

### **Scalability**
- **Easy Extensions**: Add new pages without affecting existing ones
- **Component-Based**: Reusable CSS classes and JS functions
- **Future-Proof**: Easy to add new features or modify existing ones

## 📋 Usage

### **Landing Page**
```html
<link href="css/shared.css" rel="stylesheet">
<link href="css/landing.css" rel="stylesheet">
<script src="js/shared.js"></script>
<script src="js/landing.js"></script>
```

### **Detection Page**
```html
<link href="css/shared.css" rel="stylesheet">
<link href="css/detection.css" rel="stylesheet">
<script src="js/shared.js"></script>
<script src="js/detection.js"></script>
```

## 🎯 Key Features

- **CSS Variables**: Consistent theming across all pages
- **Responsive Design**: Mobile-first approach with breakpoints
- **Modern JavaScript**: ES6+ features with proper error handling
- **WebSocket Support**: Real-time communication for live detection
- **Animation System**: Smooth transitions and scroll effects
- **Notification System**: Browser notifications and audio alerts

This modular structure makes your codebase more professional, maintainable, and scalable! 🚀
