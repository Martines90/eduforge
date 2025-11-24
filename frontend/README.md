# EduForge Frontend

Modern, scalable Next.js 14 frontend application for educational task creation.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: SCSS + MUI Components
- **UI Library**: Material-UI (MUI) v5
- **Testing**: Vitest + React Testing Library
- **Node**: v20+

## Architecture

This project follows **Atomic Design** principles with a mobile-first approach:

```
frontend/
├── app/                    # Next.js 14 app directory
│   ├── layout.tsx         # Root layout with MUI theme
│   ├── page.tsx           # Home page
│   └── task_creator/      # Task creator page
├── components/
│   ├── atoms/             # Basic building blocks (Button, Select)
│   ├── molecules/         # Simple component groups (SelectGroup)
│   ├── organisms/         # Complex components (CascadingSelect)
│   └── templates/         # Page templates (future)
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utility functions
│   └── theme.ts           # MUI theme configuration
├── types/                 # TypeScript type definitions
├── data/                  # Static data (navigation_mapping.json)
├── styles/                # Global SCSS styles and mixins
└── __tests__/             # Vitest test files

```

## Features

### Dynamic Cascading Selects

The core feature is a dynamic cascading select component that:
- Loads hierarchical curriculum data from `navigation_mapping.json`
- Displays select dropdowns that appear based on previous selections
- Supports unlimited nesting levels
- Shows breadcrumb navigation of selections
- Provides visual feedback when selection is complete

### Responsive Design

- Mobile-first approach with SCSS mixins
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Optimized for touch devices
- Accessible keyboard navigation

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

### Build

```bash
npm run build
npm run start
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Linting

```bash
npm run lint
```

## Project Structure Details

### Components

#### Atoms
- **Select**: Reusable MUI-based select dropdown with full accessibility
- **Button**: Customized MUI button with variants (primary, secondary, text)

#### Molecules
- **SelectGroup**: Groups multiple select components with optional title

#### Organisms
- **CascadingSelect**: Main feature component that handles hierarchical topic selection

### Custom Hooks

- **useCascadingSelect**: Manages cascading selection logic, state, and computations

### Types

- **NavigationTopic**: Represents a hierarchical topic with optional sub-topics
- **SelectionPathItem**: Tracks individual selections in the cascade
- **GradeLevel**: Type-safe grade level selection ('grade_9_10' | 'grade_11_12')

### Styling Approach

- Global variables defined in `styles/globals.scss`
- Reusable mixins in `styles/mixins.scss`
- Component-specific styles using CSS Modules (`.module.scss`)
- MUI theme customization in `lib/theme.ts`

## Data Structure

The `navigation_mapping.json` contains curriculum topics organized by grade level:

```typescript
{
  "grade_9_10": NavigationTopic[],
  "grade_11_12": NavigationTopic[]
}
```

Each `NavigationTopic` has:
- `name`: Display name
- `sub_topics?`: Optional array of child topics (recursive structure)

## Best Practices Implemented

1. **Atomic Design**: Clear component hierarchy and reusability
2. **TypeScript**: Full type safety across the application
3. **Accessibility**: ARIA labels, keyboard navigation, focus management
4. **Performance**: Memoization with useMemo/useCallback, code splitting
5. **Testing**: Comprehensive unit tests for components and hooks
6. **Mobile First**: Responsive design starting from smallest screens
7. **Clean Code**: ESLint configuration, consistent formatting
8. **Separation of Concerns**: Logic in hooks, UI in components

## Future Enhancements

- [ ] Add task creation form after topic selection
- [ ] Integrate with backend API
- [ ] Add search/filter functionality for topics
- [ ] Implement favorites/recent selections
- [ ] Add analytics tracking
- [ ] Support for multiple languages
- [ ] Dark mode support
- [ ] Progressive Web App (PWA) features

## Contributing

Follow the existing code patterns and atomic design principles. Ensure all new components:
- Have TypeScript types
- Include unit tests
- Follow mobile-first responsive design
- Use SCSS modules for styling
- Are accessible (WCAG 2.1 AA)

## License

MIT
