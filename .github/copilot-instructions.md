# GitHub Copilot Instructions for 3D Card Viewer

## Project Overview

This is a web-based 3D card viewer application built with Three.js that allows users to display and interact with 3D card models with customizable materials, lighting, and geometry.

## Technology Stack

- **Three.js** (v0.160.0) - 3D rendering engine
- **OrbitControls** - Camera orbit controls for user interaction
- **RoundedBoxGeometry** - Rounded box geometry for card models
- **PBR Materials** - Physics-based rendering materials
- **Pure HTML/CSS/JavaScript** - No build system or framework dependencies

## Project Structure

```
3D-Card-Viewer/
├── index.html      # Main HTML file with UI controls
├── app.js          # Core Three.js scene setup and logic
├── styles.css      # Styling with dark/light theme support
├── LICENSE         # MIT License
└── README.md       # Project documentation (Chinese)
```

## Key Features

- Dual-sided card display with image upload
- Real-time material adjustments (roughness, metalness, clearcoat)
- Dynamic lighting controls (intensity, position, shadows)
- Geometry customization (thickness, corner radius)
- Interactive controls (rotate, zoom, pan)
- Touch support for mobile devices
- High-resolution PNG export
- Drag-and-drop image upload

## Development Guidelines

### Code Style

- Use ES6+ JavaScript features (modules, arrow functions, destructuring)
- Chinese comments are preferred for consistency with existing codebase
- Use descriptive variable names in English for code, Chinese for UI text
- Follow the existing code structure and naming conventions

### Module System

- Uses ES6 modules loaded directly from CDN (unpkg.com)
- No build step required - runs directly in modern browsers
- Load Three.js and its modules from: `https://unpkg.com/three@0.160.0/`

### Three.js Conventions

- Scene setup follows standard Three.js patterns
- Use PBR (Physical Based Rendering) materials for realistic appearance
- Maintain consistent lighting setup (directional + ambient)
- Update controls and renderer on window resize

### UI/UX Patterns

- Sidebar panels for controls (left: materials, right: parameters)
- Range sliders for numeric parameters with live preview
- File inputs for image upload with preview thumbnails
- Responsive design supporting both desktop and mobile

### Testing

- Test in modern browsers (Chrome, Firefox, Safari, Edge)
- Verify mobile touch interactions work correctly
- Test drag-and-drop functionality
- Ensure proper CORS handling when loading from file:// protocol (use local server)

## Common Tasks

### Adding New Material Parameters

1. Add UI control in `index.html` (slider/input)
2. Reference the control in the `ui` object in `app.js`
3. Add event listener to update material property
4. Update the material in the scene
5. Update display value in the UI

### Adding New Features

1. Maintain the existing architecture (scene, camera, renderer, controls)
2. Keep UI controls in sidebars
3. Ensure mobile compatibility
4. Update README.md with new feature documentation

### Debugging

- Use browser DevTools console for Three.js warnings/errors
- Check texture loading with Network tab
- Verify WebGL support in target browsers
- Use `console.log()` for debugging (existing pattern in codebase)

## Important Notes

- This is a client-side only application (no backend)
- All processing happens in the browser
- Images are loaded as data URLs (not uploaded to server)
- Requires a local server for development to avoid CORS issues
- Documentation and UI text is primarily in Chinese

## Browser Compatibility

- Requires ES6 module support
- Requires WebGL support
- Target: Modern browsers (Chrome 61+, Firefox 60+, Safari 11+, Edge 79+)
