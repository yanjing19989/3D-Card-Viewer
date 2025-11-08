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

## Detailed Code Structure Analysis

### app.js - Core Application Logic (593 lines)

The main JavaScript file follows a modular organization pattern with clear separation of concerns:

#### 1. **Module Imports & Constants** (Lines 1-16)
- Imports Three.js core and extensions from CDN (unpkg.com)
- Destructures commonly used THREE classes for cleaner code
- Defines utility functions: `getEl()` for DOM access, `setVal()` for text updates

#### 2. **DOM References** (Lines 17-49)
- `canvas`, `canvasContainer`, `leftSidebar`, `rightSidebar` - Core layout elements
- `ui` object - Centralized reference to all control elements organized by category:
  - Card geometry: `thickness`, `cornerRadius`
  - Lighting: `dirIntensity`, `ambIntensity`, `azimuth`, `elevation`
  - Shadows: `shadowOpacity`, `shadowSoft`
  - Materials: `roughness`, `metalness`, `clearcoat`, `clearcoatRoughness`
  - Images: `frontImg`, `backImg`, `frontPreview`, `backPreview`
  - Actions: `resetView`, `exportPng`, `swapFaces`

#### 3. **Scene State Variables** (Lines 51-62)
- Global Three.js objects: `scene`, `camera`, `renderer`, `controls`
- 3D objects: `card`, `ground`, `ambient`, `dirLight`
- Materials: `frontMat`, `backMat`, `sideMat`
- Textures: `frontMap`, `backMap`
- Card parameters: `CARD_W`, `CARD_H`, `BASE_CARD_W`, `cardThickness`, `cornerRadius`

#### 4. **Three.js Initialization** (Lines 64-137)
- `initThreeJS()` - Sets up scene, camera, renderer with:
  - PerspectiveCamera with 35° FOV
  - WebGLRenderer with antialiasing, alpha channel, shadow maps
  - ACES tone mapping for realistic color
  - OrbitControls with touch support (single finger rotate, two finger zoom/pan)
- `initMaterials()` - Creates:
  - Placeholder textures with gradients and grid patterns
  - MeshPhysicalMaterial for front/back with PBR properties
  - Side material with neutral gray color
  - TextureLoader instance

#### 5. **Scene Building** (Lines 139-183)
- `initScene()` - Constructs the 3D scene:
  - Card mesh with RoundedBoxGeometry (6 materials for cube faces)
  - Ground plane with ShadowMaterial for receiving shadows
  - AmbientLight for overall illumination
  - DirectionalLight with shadow casting (2048x2048 shadow map)

#### 6. **Render Loop** (Lines 185-199)
- `resize()` - Handles responsive canvas sizing
- `animate()` - Main render loop using requestAnimationFrame

#### 7. **UI Control Systems** (Lines 201-324)
- `setupSidebarControls()` - Toggle buttons for left/right sidebars, ESC key handling
- `bindRange()` - Generic function to bind range sliders with:
  - Live value display
  - Change callbacks
  - Mobile-specific behavior (hides sidebar during drag)
- `setupControls()` - Binds all UI controls to their respective properties

#### 8. **File & Image Handling** (Lines 326-407)
- `loadTexture()` - Promise-based texture loading with proper configuration
- `setupFileInputs()` - Handles file input changes:
  - Creates object URLs for local files
  - Updates textures and materials
  - Auto-adjusts card dimensions based on front image aspect ratio
- `setupDragAndDrop()` - Drag-and-drop support with visual feedback

#### 9. **Action Buttons** (Lines 409-444)
- `resetView()` - Returns camera to default position
- `exportPng()` - Captures high-res screenshot (2x pixel ratio)
- `swapFaces()` - Swaps front/back textures and updates card dimensions

#### 10. **Touch Enhancement** (Lines 446-463)
- `setupTouchEnhancements()` - Prevents default touch behaviors on canvas to enable OrbitControls

#### 11. **Helper Functions** (Lines 465-563)
- `updateLightDirection()` - Converts azimuth/elevation angles to 3D position
- `makeCardGeometry()` - Creates RoundedBoxGeometry with adaptive corner radius
- `rebuildCard()` - Reconstructs card geometry when parameters change
- `makePlaceholder()` - Generates canvas-based placeholder textures with gradients and text
- `updateCardSizeFromTexture()` - Calculates card dimensions from image aspect ratio
- `shade()` - Utility for color manipulation
- `initPreviews()` - Initializes preview thumbnails

#### 12. **Initialization & Entry Point** (Lines 565-593)
- `init()` - Main initialization sequence:
  1. Initialize Three.js components
  2. Create materials
  3. Build scene
  4. Setup all UI controls
  5. Start render loop
- Event listener on window load triggers initialization

### index.html - Structure and UI (170 lines)

HTML document following semantic structure with embedded UI controls:

#### 1. **Document Head** (Lines 1-11)
- UTF-8 charset and viewport meta tags for mobile support
- Chinese language attribute
- CSS stylesheet link

#### 2. **Main Title** (Lines 13)
- Centered page title with Chinese text

#### 3. **Sidebar Toggle Buttons** (Lines 16-17)
- Fixed-position circular buttons for opening left/right sidebars
- Icons: ☰ (materials) and ✦ (parameters)

#### 4. **Left Sidebar - Materials** (Lines 20-59)
- **Card Images Section** (Lines 26-43):
  - File inputs for front and back card faces
  - Preview containers for uploaded images
- **Action Buttons** (Lines 45-57):
  - Reset view, export PNG, swap faces
  - Usage hints for mouse/touch controls

#### 5. **Right Sidebar - Parameters** (Lines 62-152)
Four control groups with range sliders:
- **Card Parameters** (Lines 68-81): thickness, corner radius
- **Lighting** (Lines 84-107): directional intensity, ambient light, azimuth, elevation
- **Shadows** (Lines 110-123): opacity, softness
- **Materials** (Lines 126-149): roughness, metalness, clearcoat, clearcoat roughness

Each slider includes:
- Label with parameter name
- Value display span (updated via JavaScript)
- Range input with min/max/step attributes

#### 6. **Main Canvas Container** (Lines 154-158)
- Responsive container for WebGL canvas
- Canvas element with ID `glCanvas`

#### 7. **Script Configuration** (Lines 160-168)
- Import map for Three.js module (enables clean imports)
- ES6 module script loading app.js

### styles.css - Visual Design System (367 lines)

Modern CSS architecture with CSS custom properties and responsive design:

#### 1. **CSS Custom Properties** (Lines 9-37)
Dark theme color system:
- **Colors**: `--bg`, `--panel`, `--text`, `--subtle`, `--brand`, `--accent`, `--danger`, `--border`
- **Layout**: `--radius-s/m/l` for consistent border radius
- **Typography**: `--font`, `--h1`, `--h3`, `--text-base`
- **Timing**: `--t-fast`, `--t-slow` for transitions
- **Effects**: `--shadow`, `--sidebar-bg` with transparency

#### 2. **Light Theme Support** (Lines 39-53)
- Media query for `prefers-color-scheme: light`
- Overrides color variables for light mode
- Automatic theme switching based on system preference

#### 3. **Global Styles** (Lines 55-69)
- Box-sizing reset
- Full-height body with grid layout
- Radial gradient background with brand colors
- Font smoothing for better text rendering

#### 4. **Layout Components** (Lines 71-107)
- `.main-title` - Page header with shadow
- `.container` - Centered grid container
- `.canvas-container` - Responsive WebGL viewport with rounded corners and shadow
- `#glCanvas` - Full-size canvas with grab cursor

#### 5. **Sidebar System** (Lines 109-171)
- `.sidebar-toggle` - Circular floating buttons with hover effects
- `.sidebar` - Fixed panels with:
  - Backdrop blur effect (glassmorphism)
  - Slide-in animations (translateX)
  - Left/right positioning variants
- `.sidebar-header` - Sticky header with title

#### 6. **Control Panels** (Lines 173-230)
- `.controls` - Grid container with gap spacing
- `.control-group` - Bordered sections for grouping related controls
- `.control-group-header` - Section titles with uppercase styling
- `.help-btn` and `.help-popover` - Tooltip system for help text

#### 7. **Form Controls** (Lines 232-306)
- `.control-item` - Grid layout for label + input pairs
- `label` and `.value-display` - Text styling
- `input[type="file"]` - Styled file inputs with custom button
- `.preview-item` - Image preview containers with border and gradient background

#### 8. **Range Sliders** (Lines 309-338)
Custom-styled range inputs:
- Track with gradient (brand to accent colors)
- Thumb with radial gradient and shadow
- Active state scaling
- Cross-browser support (webkit and moz)

#### 9. **Responsive Design** (Lines 354-367)
Media query for mobile (max-width: 768px):
- Reduced title size
- Wider sidebar (86vw)
- Smaller toggle buttons
- Stacked control layout
- Full-width range inputs
- Adjusted container height

#### 10. **Scrollbar Styling** (Lines 349-351)
- Minimal webkit scrollbar with rounded thumb
- Subtle background for better UX

## Key Features

- Dual-sided card display with image upload
- Real-time material adjustments (roughness, metalness, clearcoat)
- Dynamic lighting controls (intensity, position, shadows)
- Geometry customization (thickness, corner radius)
- Interactive controls (rotate, zoom, pan)
- Touch support for mobile devices
- High-resolution PNG export
- Drag-and-drop image upload

## Architecture & Data Flow

### Application Architecture

The application follows a **single-page, event-driven architecture** with no framework dependencies:

1. **Initialization Flow**:
   ```
   window.load → init() → initThreeJS() → initMaterials() → initScene() 
                       → setupSidebarControls() → setupControls() 
                       → setupFileInputs() → setupButtons() 
                       → setupTouchEnhancements() → resize() → animate()
   ```

2. **State Management**:
   - **Global variables** for scene objects (scene, camera, renderer, controls)
   - **Direct DOM manipulation** via event listeners
   - **Immediate updates** to Three.js objects when UI changes
   - No state management library - changes trigger direct updates

3. **Rendering Pipeline**:
   ```
   User Input → Event Handler → Update Three.js Objects → render() in animate loop
   ```

4. **Material System**:
   - **Three materials** for card: frontMat (front face), backMat (back face), sideMat (edges)
   - **Material arrays** indexed for RoundedBoxGeometry faces: [+X, -X, +Y, -Y, +Z (front), -Z (back)]
   - **Shared properties** between front/back materials (roughness, metalness, clearcoat)
   - **Independent textures** for front and back faces

5. **Geometry Updates**:
   - Card dimensions dynamically adjust based on front image aspect ratio
   - `rebuildCard()` disposes old geometry and creates new when thickness/radius changes
   - Ground plane position updates to match card height

6. **Image Loading Pipeline**:
   ```
   File Input/Drop → URL.createObjectURL() → TextureLoader 
                  → texOpts() → Update Material → needsUpdate = true
                  → updateCardSizeFromTexture() → rebuildCard() (if needed)
   ```

7. **Touch/Mouse Interaction**:
   - **OrbitControls** handles all camera manipulation
   - **Canvas touch events** prevented to avoid page scrolling
   - **Sidebar interactions** use standard DOM events
   - **Mobile optimization**: sidebar temporarily hidden during slider drag

### Key Design Patterns

1. **Module Pattern**: ES6 modules with explicit imports from CDN
2. **Event-Driven**: UI controls directly bound to update functions
3. **Factory Functions**: `makeCardGeometry()`, `makePlaceholder()` for object creation
4. **Promise-Based Loading**: Async texture loading with proper cleanup
5. **Responsive Design**: CSS media queries + JavaScript resize handler
6. **Progressive Enhancement**: Touch events layered on top of mouse controls

## Development Guidelines

### Code Style

- Use ES6+ JavaScript features (modules, arrow functions, destructuring)
- Chinese comments are preferred for consistency with existing codebase
- Use descriptive variable names in English for code, Chinese for UI text
- Follow the existing code structure and naming conventions

### Code Conventions Observed

#### Naming Patterns
- **Functions**: camelCase with descriptive verb prefixes (`init`, `setup`, `update`, `rebuild`, `make`)
- **Constants**: SCREAMING_SNAKE_CASE for immutable values (e.g., `BASE_CARD_W`)
- **Variables**: camelCase with clear context (e.g., `cardThickness`, `frontMat`)
- **DOM IDs**: camelCase matching their purpose (e.g., `frontImg`, `dirIntensity`)
- **CSS Classes**: kebab-case with BEM-like patterns (e.g., `.sidebar-toggle`, `.control-group-header`)

#### Function Organization
- **Utility functions** at the top (getEl, setVal)
- **Init functions** grouped by responsibility (initThreeJS, initMaterials, initScene)
- **Setup functions** for binding UI (setupControls, setupFileInputs)
- **Helper functions** at the bottom (updateLightDirection, makeCardGeometry)

#### Comment Style
- **Section headers**: Chinese text with equals signs separator (e.g., `// ========== 工具函数 ==========`)
- **Inline comments**: Brief Chinese explanations for complex logic
- **Code clarity**: Prefer self-documenting code over excessive comments

#### Error Handling
- **Minimal explicit handling**: Relies on browser's default behavior
- **Optional chaining**: Uses `?.` for safe property access (e.g., `e.target.files?.[0]`)
- **Try-catch**: Only in specific cases like `toDataURL()` in `initPreviews()`

#### Performance Patterns
- **RequestAnimationFrame**: Standard game loop for smooth rendering
- **Event throttling**: Mobile sidebar hide/show during slider drag
- **Geometry disposal**: Proper cleanup with `geometry.dispose()` before rebuilding
- **URL cleanup**: `URL.revokeObjectURL()` after texture loading
- **Pixel ratio capping**: `Math.min(window.devicePixelRatio, 2)` to avoid excessive resolution

#### CSS Patterns
- **Custom properties**: All colors, sizes, and timing in `:root`
- **Consistent units**: `px` for absolute, `vh/vw` for viewport-relative
- **Transitions**: Only on `transform` and `opacity` (GPU-accelerated properties)
- **Box-sizing**: Universal `border-box` reset
- **Flexbox/Grid**: Modern layout (no floats or positioning hacks)

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
