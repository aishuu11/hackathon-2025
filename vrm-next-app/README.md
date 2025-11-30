# VRM Nutrition Bot - Next.js Application

A modern Next.js application featuring a 3D VRM avatar viewer and nutrition chatbot, built with Three.js and Node.js while preserving the original UI design.

## Features

- **3D VRM Avatar Viewer**: Interactive 3D avatar display using Three.js and @pixiv/three-vrm
- **Nutrition Chatbot**: AI-powered chatbot that debunks nutrition myths with science
- **Futuristic UI**: Glassmorphism design with neon accents and animated backgrounds
- **Full-Stack**: Built with Next.js 14 (React + Node.js)

## Technology Stack

- **Frontend Framework**: Next.js 14 (React 18)
- **3D Graphics**: Three.js + three-stdlib
- **VRM Support**: @pixiv/three-vrm
- **Styling**: Custom CSS with glassmorphism effects
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

```bash
cd vrm-next-app
npm install
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
vrm-next-app/
├── app/
│   ├── layout.tsx          # Root layout with metadata
│   └── page.tsx             # Main page with VRM avatar and chat panels
├── components/
│   ├── VRMAvatar.tsx        # Three.js VRM avatar viewer component
│   └── ChatBot.tsx          # Nutrition chatbot component
├── public/
│   ├── avaturn_avatar.vrm   # VRM 3D avatar file
│   ├── foods.json           # Food nutrition database
│   ├── myths.json           # Nutrition myths database
│   ├── supportive_messages.json
│   └── config.json
├── styles/
│   └── globals.css          # Global styles (preserved from original design)
├── package.json
├── next.config.js
└── tsconfig.json
```

## UI Design

The application maintains the original theme and color scheme:

- **Background**: Radial gradient from deep purple (#1a0033) to black
- **Glass Panels**: Frosted glass effect with backdrop blur
- **Dual-tone Lighting**: 
  - Left panel (VRM Avatar): Cyan/blue glow (#0096ff)
  - Right panel (Chat): Purple/magenta glow (#8a2be2)
- **Animated Elements**: Floating rings and rotating cubes in background
- **Typography**: 
  - Headers: Orbitron (futuristic monospace)
  - Body: Rajdhani (modern sans-serif)
- **Accent Colors**: Cyan (#00ffff) and Magenta (#ff00ff) gradient

## VRM Avatar

The VRM avatar is loaded from `/public/avaturn_avatar.vrm` and rendered using:

- **Three.js Scene**: 3D rendering engine
- **GLTFLoader**: Loads VRM files (extended GLTF format)
- **VRMLoaderPlugin**: Parses VRM-specific data
- **OrbitControls**: Interactive camera controls (rotate, zoom, pan)
- **Lighting**: Ambient + directional lights for proper illumination
- **Animation Loop**: 60 FPS rendering with delta time updates

### VRM Features

- Automatic vertex/joint optimization
- Support for VRM expressions
- Animation support (if present in VRM file)
- Responsive canvas sizing
- Loading states with visual feedback

## Chatbot

The nutrition chatbot processes user queries about:

- **Food Information**: Benefits and nutritional facts
- **Myth Debunking**: Science-based corrections to common nutrition myths
- **Interactive Chat**: Real-time message processing with typing indicators

### Data Files

- `foods.json`: Database of foods with nutritional information
- `myths.json`: Collection of nutrition myths with factual corrections
- `supportive_messages.json`: Greeting and supportive responses
- `config.json`: Bot configuration settings

## Building for Production

```bash
npm run build
npm start
```

This creates an optimized production build and starts the production server.

## Development Notes

### Three.js Integration

- Uses `three-stdlib` for GLTFLoader and OrbitControls (Next.js compatible)
- VRM avatar loads client-side only (using 'use client' directive)
- Type declarations suppressed for three-stdlib imports (minor type mismatch with @types/three)

### Next.js App Router

- Uses the new App Router (app/ directory)
- Client-side components marked with 'use client'
- Global styles imported in layout.tsx
- Static assets served from public/ directory

## Browser Compatibility

- Modern browsers with WebGL support required
- Tested on Chrome, Firefox, Safari, Edge

## License

This project was created for the hackathon-2025 event.

## Credits

- VRM Specification: [VRM Consortium](https://vrm.dev/)
- Three.js: [Three.js](https://threejs.org/)
- @pixiv/three-vrm: [Pixiv](https://github.com/pixiv/three-vrm)
