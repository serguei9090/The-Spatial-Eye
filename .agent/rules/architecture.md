---
trigger: always_on
---
# Architecture & Design Rules

## 1. Atomic Design Hierarchy
All UI components **MUST** be placed in the following directory structure:

- **src/components/atoms/**: Basic building blocks (Buttons, Icons, Avatars). No business logic.
- **src/components/molecules/**: Simple groups of atoms (Search bars, Cards). Local state only.
- **src/components/organisms/**: Complex UI sections (Headers, Dashboards). Can access global state.
- **src/components/templates/**: Page layouts combining organisms.
- **src/app/[route]/**: Next.js pages that hydrate templates.

### Strict Dependency Rules
- **Atoms** CANNOT import from molecules or organisms.
- **Molecules** CANNOT import from organisms.
- **Logic** must be extracted to `lib/hooks` or `lib/utils` if shared.

## 2. Technology Stack
- **UI Framework**: Tailwind CSS + `shadcn/ui`.
- **Icons**: `lucide-react` ONLY.
- **Animation**: `framer-motion` for complex interactions; CSS for simple transitions.
- **State Management**: React Context or Zustand.

## 3. Styling Standards
- Use `oklch` colors defined in `globals.css`.
- Support Dark/Light mode natively using CSS variables.
- Use `cn()` utility for class merging.
