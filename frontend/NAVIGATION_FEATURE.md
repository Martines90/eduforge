# Navigation Feature Documentation

## Overview

A responsive hamburger menu navigation system has been added to the application with mobile-first design principles.

## Components Created

### Atoms

#### 1. Logo (`components/atoms/Logo/`)
- Brand logo that links to home page
- Styled with primary color
- Includes hover effects
- Fully accessible

#### 2. NavLink (`components/atoms/NavLink/`)
- Navigation link with active state detection
- Uses Next.js `usePathname` to detect current page
- Visual indicator for active page (left border on mobile, bottom border on desktop)
- Smooth transitions and hover effects
- ARIA attributes for accessibility

### Molecules

#### 3. MobileMenu (`components/molecules/MobileMenu/`)
- Drawer-based mobile navigation
- Slides in from the left
- Includes logo and close button
- Semi-transparent backdrop
- Width: 280px (max 85vw)

### Organisms

#### 4. Header (`components/organisms/Header/`)
- Main navigation header component
- Sticky positioning
- Responsive layout:
  - **Mobile**: Shows hamburger menu button + logo
  - **Desktop (≥768px)**: Shows logo + horizontal navigation links
- White background with subtle shadow

## Features

### Mobile Navigation (< 768px)
- Hamburger menu icon in top-left
- Clicking opens slide-out drawer from left
- Menu items stack vertically
- Active page highlighted with left border
- Close button in drawer header

### Desktop Navigation (≥ 768px)
- Hamburger menu hidden
- Navigation links displayed horizontally next to logo
- Active page highlighted with bottom border
- Links aligned to the right

### Navigation Items
Currently configured:
- **Home** (`/`)
- **Task Creator** (`/task_creator`)

To add more items, edit the `navigationItems` array in `components/organisms/Header/Header.tsx`:

```typescript
const navigationItems = [
  { href: '/', label: 'Home' },
  { href: '/task_creator', label: 'Task Creator' },
  // Add new items here
  { href: '/about', label: 'About' },
];
```

## Styling

### Theme Integration
- Uses MUI AppBar component
- Customized to match app color scheme
- Consistent with global SCSS variables
- Mobile-first responsive design

### Key Styles
- **Background**: White (`var(--background-color)`)
- **Text**: Dark gray (`var(--text-primary)`)
- **Active Color**: Primary blue (`var(--primary-color)`)
- **Shadow**: Subtle 1px shadow
- **Height**: ~64px

## Accessibility

- Semantic HTML (`<nav>`, `<header>`)
- ARIA labels on interactive elements
- `aria-current="page"` on active links
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Layout Integration

The Header is integrated at the root layout level (`app/layout.tsx`):

```typescript
<Header />
<main>{children}</main>
```

Pages automatically account for header height:
- Main content area: `calc(100vh - 64px)`

## Testing

Tests added for NavLink component:
- Renders correctly
- Has correct href
- Shows active state
- Sets aria-current when active

All tests passing: **20/20**

## Responsive Breakpoints

- **Mobile**: 0 - 767px (Hamburger menu)
- **Desktop**: 768px+ (Horizontal navigation)

## File Structure

```
components/
├── atoms/
│   ├── Logo/
│   │   ├── Logo.tsx
│   │   ├── Logo.module.scss
│   │   └── index.ts
│   └── NavLink/
│       ├── NavLink.tsx
│       ├── NavLink.module.scss
│       └── index.ts
├── molecules/
│   └── MobileMenu/
│       ├── MobileMenu.tsx
│       ├── MobileMenu.module.scss
│       └── index.ts
└── organisms/
    └── Header/
        ├── Header.tsx
        ├── Header.module.scss
        └── index.ts
```

## Usage Example

The Header is automatically included on all pages. To add it manually:

```typescript
import { Header } from '@/components/organisms/Header';

export default function Layout() {
  return (
    <>
      <Header />
      <main>
        {/* Your content */}
      </main>
    </>
  );
}
```

## Future Enhancements

Potential improvements:
- [ ] User profile menu
- [ ] Search functionality in header
- [ ] Notifications badge
- [ ] Dark mode toggle
- [ ] Language selector
- [ ] Breadcrumbs for deep navigation
- [ ] Mega menu for complex navigation structures
