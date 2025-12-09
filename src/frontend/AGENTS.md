# DEStiny Frontend - Agent Guidelines

React + PixiJS simulation visualization. React handles UI/state; PixiJS renders.

## Tech Stack

Next.js (App Router), React 19, PixiJS 8.x + `@pixi/react`, shadcn/ui, Tailwind CSS, TypeScript

## Project Structure

```
frontend/
├── app/                    # Routes (layout.tsx, page.tsx)
├── components/
│   ├── ui/                 # shadcn/ui components
│   └── common/             # Shared UI components
├── features/simulation/
│   ├── components/          
│   ├── constants.ts
│   ├── types.ts
│   ├── utils.ts
│   └── index.ts            # Public exports
├── hooks/                  # Shared hooks
├── lib/utils.ts            # Generic utilities
└── public/assets/          # Sprites and images
```

## Import Aliases

- `@/*` → `./*`
- `@components/*` → `./components/*`
- `@features/*` → `./features/*`
- `@lib/*` → `./lib/*`

## Import Conventions

Use a **hybrid approach** for imports:

### Use `@` aliases for:

- **UI components**: `@/components/ui/button`
- **Shared utilities**: `@lib/utils`
- **Cross-feature imports**: `@features/simulation`
- **External assets/data**: `@/dummy_data/grid_fleet_recording.json`
- **Shared hooks**: `@/hooks/useFileUpload`

### Use relative imports for:

- **Within the same feature** (e.g., inside `features/simulation/`):
  - Same directory: `./Component`
  - Parent directory: `../types`
  - Feature root: `../../utils`

### Example (from `features/simulation/components/ui/PlaybackControls.tsx`):

```typescript
// External UI components - use @ aliases
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

// Within feature - use relative imports
import { useSimulationController } from "../../hooks/SimulationContext";
import { formatTime } from "../../utils";
import { SPEED_OPTIONS } from "../../constants";
```

**Rationale**: `@` aliases provide stability for cross-boundary imports; relative imports show logical proximity within features.

## Key Rules

1. **Client components**: Any file using PixiJS, hooks, or browser APIs needs `"use client";` at the top
2. **Server components**: Default in `app/`, cannot use hooks or import Pixi
3. **Context pattern**: Features use React Context for state (`SimulationProvider` wraps feature root)
4. **Pixi integration**: Use `extend()` from `@pixi/react`, access app via `useApplication()` hook
5. **Public exports**: Only export through feature's `index.ts`

## Commands

```bash
bun dev           # Dev server at localhost:3000
bun run build     # Production build
bun run lint      # ESLint
bun run format    # Prettier
bunx shadcn@latest add <component>  # Add shadcn component
```

## PixiJS Docs

https://pixijs.com/llms.txt
