# DEStiny

A React-based frontend application with a PixiJS visualization layer for running simulations. The application follows a clear separation of concerns: all user interactions and UI elements are built in React, while PixiJS serves purely as a high-performance visualization layer.

DEStiny uses **Next.js App Router** for routing and application structure.

---

## Architecture

### Core Principles

- **React for UI**: All user interactions, controls, forms, and UI components are built using React.
- **Next.js for Routing**: Next.js App Router (`app/` directory) is used for file-based routing, layouts, and server/client components.
- **PixiJS for Visualization**: PixiJS is used exclusively as a high-performance rendering engine.
- **UI Components**: shadcn/ui components styled with Tailwind CSS.
- **Separation of Concerns**: React manages state and UI; Pixi manages rendering.

### Tech Stack

- **Framework**: Next.js (App Router) on React 19
- **Routing**: File-based routing in `app/`
- **Visualization**: PixiJS 8.x with `@pixi/react`
- **Component System**: shadcn/ui
- **Styling**: Tailwind CSS
- **Runtime**: Bun (recommended) or Node.js 18+
- **Language**: TypeScript (full type safety)

---

## Project Structure

```txt
frontend/
├── app/
│   ├── favicon.ico        # App router favicon
│   ├── globals.css        # Global styles for the entire app
│   ├── layout.tsx         # Root layout (global providers, shell)
│   └── page.tsx           # Home page route
│
├── components/            # Reusable React components
│   ├── ui/                # shadcn/ui generated components
│   └── common/            # Shared non-shadcn UI components
│
├── features/              # Domain-specific modules
│   └── simulation/
│       ├── components/    # Feature-specific UI
│       └── engine/        # Pixi features, should export a React component App that can be run as a client component
│
├── layouts/               # Additional React layouts (imported into app/)
│   └── (empty for now)
│
├── lib/
│   ├── pixi/              # Shared Pixi helpers and factories
│   └── utils.ts           # Generic utilities
│
├── public/                # Static assets served directly by Next.js
│
├── types/                 # Global/shared TypeScript types
│   └── index.ts
│
├── node_modules/
├── .gitignore
├── bun.lockb
├── components.json        # shadcn generator config
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

---

## Notes for the Coding Agent

### Routing & Layout Rules

- All routes live inside **`src/frontend/app/`**.
- To create a new route:
  ```
  app/<route>/page.tsx
  ```
- To create a route-specific layout:
  ```
  app/<route>/layout.tsx
  ```
- The **global layout** is `app/layout.tsx`. Do not modify without reason.

### Client vs Server Components

- **Any PixiJS or hook-using component must include:**
  ```ts
  "use client";
  ```

- Server components:
  - Are default in `app/`
  - Cannot use hooks
  - Cannot import Pixi

### Where to Put New Code

- Shared UI → `components/common/`
- shadcn/ui → `components/ui/`
- Simulation UI → `features/simulation/components/`
- Pixi rendering logic → `features/simulation/pixi/`
- Generic utilities → `lib/`
- Shared types → `types/`
- Textures → `assets/` (importable) or `public/` (static files)

### Shadcn UI

To add a new shadcn/ui component, run:

```bash
bunx shadcn@latest add <component-name>
```

List of available components: https://ui.shadcn.com/components

### PixiJS Integration Rules

- Pixi components must be **client components**.
- Architecture flow:
  ```
  React state → Props → Pixi components
  ```
- Do NOT mutate Pixi objects outside Pixi components.

---

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

The application will run at `http://localhost:3000`.

### Build

```bash
bun run build
```

### Linting

```bash
bun run lint
```

---

## Example Pattern (Client Component with Pixi)

```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
// import { Stage } from "@pixi/react"; // Placeholder

export default function SimulationView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  return (
    <div>
      <Button onClick={() => setIsPlaying(p => !p)}>
        {isPlaying ? "Pause" : "Play"}
      </Button>

      <Slider
        value={[speed]}
        onValueChange={([v]) => setSpeed(v)}
      />

      {/* <Stage>
        <SimulationObject isPlaying={isPlaying} speed={speed} />
      </Stage> */}
    </div>
  );
}
```

---

## PixiJS Documentation

- Main Docs: https://pixijs.com/llms.txt  
- Quick Start: https://pixijs.com/8.x/guides/getting-started/quick-start.md  
- Architecture Guide: https://pixijs.com/8.x/guides/concepts/architecture.md  
- Components: https://pixijs.com/8.x/guides/components.md  
