# Quick Start Guide

## Installation

```bash
cd /Users/martonhorvath/Documents/EduForger/app/frontend
npm install
```

## Development

```bash
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001)

## Pages

- **Home**: `/` - Landing page with link to task creator
- **Task Creator**: `/task_creator` - Main application page with cascading selects

## Features Implemented

### Dynamic Cascading Selects

The task creator page includes:
1. Grade level tabs (Grade 9-10, Grade 11-12)
2. Dynamic cascading select dropdowns that:
   - Display topics from `navigation_mapping.json`
   - Show sub-topics based on previous selections
   - Support unlimited nesting levels
   - Display breadcrumb trail of selections
   - Show completion indicator when leaf node reached

### Mobile-First Responsive Design

- Breakpoints: 640px, 768px, 1024px, 1280px
- Touch-friendly UI elements
- Responsive layouts and typography
- Optimized for all screen sizes

### Accessibility

- ARIA labels and roles
- Keyboard navigation support
- Focus indicators
- Screen reader friendly

## Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/                    # Next.js 14 pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── task_creator/      # Task creator page
├── components/            # Atomic design components
│   ├── atoms/            # Button, Select
│   ├── molecules/        # SelectGroup
│   └── organisms/        # CascadingSelect
├── lib/
│   ├── hooks/            # useCascadingSelect
│   └── theme.ts          # MUI theme
├── types/                # TypeScript definitions
├── data/                 # navigation_mapping.json
└── styles/               # Global SCSS
```

## Key Components

### CascadingSelect Organism
Location: `components/organisms/CascadingSelect/`

Main feature component that handles hierarchical topic selection with:
- Dynamic select generation
- Breadcrumb navigation
- Selection completion detection
- Reset functionality

### useCascadingSelect Hook
Location: `lib/hooks/useCascadingSelect.ts`

Custom hook managing:
- Selection path state
- Available options computation
- Selection and reset operations
- Completion detection

## Next Steps

To extend this application:

1. **Add Task Creation Form**: After topic selection, show form to create tasks
2. **Backend Integration**: Connect to API for saving tasks
3. **Search Functionality**: Add search/filter for topics
4. **User Authentication**: Add login/register
5. **Task Management**: View, edit, delete created tasks

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
npm run lint
npm test
```

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Material-UI (MUI)
- SCSS Modules
- Vitest + React Testing Library
- Node.js 20+
