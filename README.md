# Waypoint Demo

A 3D interactive demonstration of waypoint navigation with off-screen indicator clamping. This project showcases how to handle waypoints that go off-screen in 3D space by projecting them back to the screen edges with directional arrows.

## 🚀 Live Demo

The main application is a Next.js web app that provides an interactive 3D environment where you can navigate around a waypoint and see how off-screen indicators work.

## 📁 Project Structure

```text
waypoint-demo/
├── src/                    # Next.js application
│   ├── app/               # Next.js app router
│   ├── components/        # React components
│   │   ├── ThreeScene.tsx           # Main 3D scene
│   │   ├── CameraController.tsx     # Camera movement controls
│   │   ├── IntroOverlay.tsx         # Instructions overlay
│   │   └── WaypointIndicator.tsx    # Off-screen arrow indicator
│   └── utils/
│       └── math.ts        # Mathematical utilities for projection
├── Manim/                 # Animation and visualization
│   └── waypoint_clamp_3d.py  # 3D animation explaining the concept
└── public/                # Static assets
```

## 🎮 Main Application

### Features

- **Interactive 3D Environment**: Navigate through a starfield with a waypoint
- **Off-Screen Detection**: Automatically detects when waypoints go off-screen
- **Edge Clamping**: Projects off-screen waypoints to screen edges
- **Directional Arrows**: Shows arrows pointing toward the actual waypoint location
- **Smooth Controls**: WASD movement and mouse look controls

### Controls

- **W/A/S/D** - Move forward/left/back/right
- **Mouse Drag** - Look around
- **Click Canvas** - Focus controls

### Technical Implementation

The application uses:

- **Next.js 15** with React 19
- **Three.js** via `@react-three/fiber` for 3D rendering
- **TypeScript** for type safety
- **Tailwind CSS** for styling

#### Key Components

1. **ThreeScene.tsx**: Main 3D scene with starfield and waypoint
2. **WaypointIndicator.tsx**: Renders directional arrows when waypoint is off-screen
3. **CameraController.tsx**: Handles camera movement and controls
4. **math.ts**: Contains projection and clamping algorithms

#### Core Algorithm

The waypoint clamping system:

1. Projects the 3D waypoint position to 2D screen coordinates
2. Checks if the projection is off-screen
3. If off-screen, clamps the position to the screen edges
4. Calculates the direction angle to point toward the actual waypoint
5. Renders a directional arrow at the clamped position

## 🎬 Manim Animation

The `Manim/` folder contains a 3D animation that visually explains the waypoint clamping concept.

### Animation Content

The `waypoint_clamp_3d.py` animation demonstrates:

1. **Camera Setup**: Shows the camera at the origin
2. **Screen Plane**: Displays the screen plane at a fixed distance
3. **Frustum Visualization**: Shows the view frustum edges
4. **Waypoint Placement**: Places a waypoint in 3D space
5. **Raw Projection**: Projects the waypoint directly to the screen
6. **Clamping Process**: Shows how the projection gets clamped to screen bounds
7. **Directional Arrow**: Adds an arrow pointing toward the actual waypoint
8. **Camera Orbit**: Demonstrates the system working from different angles

### Running the Animation

```bash
cd Manim
manim waypoint_clamp_3d.py WaypointClamp3DScene -pql
```

**Options:**

- `-p`: Preview the animation
- `-q`: Quality (l=low, m=medium, h=high)
- `-l`: Use a lower quality for faster rendering

### Output

The animation generates:

- Video files in `Manim/media/videos/waypoint_clamp_3d/`
- Multiple quality versions (2160p15, 2160p60)
- Partial movie files for each scene segment

## 🛠️ Development

### Prerequisites

- Node.js 18+ (for the main app)
- Python 3.8+ with Manim (for animations)

### Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Install Manim (optional, for animations):**

   ```bash
   pip install manim
   ```

3. **Run the development server:**

   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## 🎯 Use Cases

This demonstration is useful for:

- **Game Development**: HUD systems that need to show off-screen objectives
- **Navigation Apps**: GPS applications with 3D waypoint visualization
- **VR/AR Applications**: Spatial interfaces that need directional indicators
- **Educational Content**: Teaching 3D-to-2D projection concepts

## 🔧 Technical Details

### Mathematical Concepts

The project implements several key mathematical concepts:

1. **World-to-Screen Projection**: Converts 3D world coordinates to 2D screen coordinates
2. **View Frustum Clipping**: Determines when objects are outside the viewable area
3. **Edge Clamping**: Projects off-screen points to the nearest screen edge
4. **Directional Calculation**: Computes the angle to point toward the actual target

### Performance Considerations

- Uses `useMemo` for expensive calculations
- Implements efficient frame-based updates
- Minimizes DOM updates for smooth 60fps performance

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Feel free to submit issues and enhancement requests!
