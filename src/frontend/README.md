# DEStiny

A React-based frontend application with PixiJS visualization layer for running simulations. The application follows a clear separation of concerns: all user interactions and UI elements are built in React, while PixiJS serves purely as a high-performance visualization layer.

## Architecture

### Core Principles

- **React for UI**: All user interactions, controls, forms, and UI components are built using React
- **PixiJS for Visualization**: PixiJS is used exclusively as a rendering engine for the simulation visualization
- **UI Components**: shadcn/ui components with Tailwind CSS for all UI elements
- **Separation of Concerns**: Clear boundary between React state management and PixiJS rendering

### Tech Stack

- **Frontend Framework**: React 19
- **Visualization**: PixiJS 8.x with [@pixi/react](https://pixijs.com/8.x/guides/getting-started/ecosystem.md)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **TypeScript**: Full type safety throughout

## Project Structure

```
src/frontend/
├── src/
│   ├── App.tsx          # Main React application component
│   ├── main.tsx         # React entry point
│   └── vite-env.d.ts    # Vite type definitions
├── public/
│   ├── assets/          # Static assets (images, textures)
│   └── style.css        # Global styles
├── index.html           # HTML entry point
├── package.json         # Dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## Getting Started

### Prerequisites

- Bun (recommended) or Node.js 18+

### Installation

```bash
cd src/frontend
bun install
```

### Development

```bash
bun dev
```

The application will be available at `http://localhost:5173` (or the port Vite assigns).

### Build

```bash
bun run build
```

### Linting

```bash
bun run lint
```

## Development Guidelines

### Adding UI Components

1. **Use shadcn/ui**: All UI elements should use shadcn/ui components
2. **Style with Tailwind**: Use Tailwind CSS utility classes for styling
3. **React State**: Manage all application state in React (useState, useReducer, Context, etc.)

### Working with PixiJS

1. **Visualization Only**: PixiJS components should only handle rendering
2. **React Integration**: Use `@pixi/react` hooks and components to integrate PixiJS with React
3. **State Flow**: React state → Props → PixiJS components
4. **No Direct Manipulation**: Avoid directly manipulating PixiJS objects from React; use props and refs

### Example Pattern

```tsx
// ✅ Good: React manages state, PixiJS renders
function SimulationView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  return (
    <div>
      {/* React UI Controls */}
      <Button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </Button>
      <Slider value={speed} onValueChange={setSpeed} />
      
      {/* PixiJS Visualization */}
      <Application>
        <SimulationObject isPlaying={isPlaying} speed={speed} />
      </Application>
    </div>
  );
}
```

## PixiJS Documentation

For detailed PixiJS documentation, refer to:
- **Main Documentation**: https://pixijs.com/llms.txt
- **Quick Start**: https://pixijs.com/8.x/guides/getting-started/quick-start.md
- **Architecture Guide**: https://pixijs.com/8.x/guides/concepts/architecture.md
- **Components**: https://pixijs.com/8.x/guides/components.md
