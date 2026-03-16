# AGENTS.md

## Project Overview

Next.js 16 (Pages Router) AI chatbot application using TypeScript (strict mode), Chakra UI v2, and Emotion for styling. Multiple chat modules (general, HR, sales, inventory), cookie-based auth, and meeting management features. UI text is in Thai.

## Build & Run Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build (also serves as type-check; no separate tsc script)
npm run start        # Start production server
```

No linter, formatter, or test framework is configured. `npm run build` is the only validation command available. Always run it after making changes to verify nothing is broken.

## Project Structure

```
src/
  components/      # Reusable UI components (PascalCase .tsx)
  hooks/           # Custom React hooks (camelCase use*.ts)
  pages/           # Next.js pages (kebab-case .tsx)
    api/           # API routes (kebab-case .ts)
    _app.tsx       # App wrapper with ChakraProvider
    _document.tsx  # Document wrapper
  styles/          # CSS files (globals.css, Home.module.css)
  utils/           # Utilities, data, and config (camelCase .ts)
  middleware.ts    # Next.js auth middleware
```

Flat structure within each directory -- no subdirectories or feature-based grouping. Types are co-located in the files that use them (no separate `types/` directory).

## TypeScript Configuration

- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- Target: ES2017, module resolution: bundler
- JSX: react-jsx

## Code Style Guidelines

### File Naming

| Location | Convention | Examples |
|---|---|---|
| `components/` | PascalCase | `NavbarAI.tsx`, `ChatInput.tsx`, `GenericTable.tsx` |
| `pages/` | kebab-case | `ai-chat.tsx`, `schedule-meeting.tsx` |
| `pages/api/` | kebab-case | `chat-sale.ts`, `chat-hr.ts` |
| `utils/` | camelCase | `splitMarkdown.ts`, `tableConfig.ts`, `mockData.ts` |
| `hooks/` | camelCase with `use` prefix | `useTypewriter.ts` |

### Naming Conventions

- **Components**: PascalCase (`NavbarAI`, `ChatInput`, `GenericTable`)
- **Functions/variables**: camelCase (`sendMessage`, `handleSubmit`, `isLoading`)
- **Top-level data constants**: SCREAMING_SNAKE_CASE (`MOCK_ALL_PARTICIPANTS`, `REAL_SCHEDULE_DATA`)
- **Types/interfaces**: PascalCase (`Message`, `ChatInputProps`, `ScheduleItem`, `DayStatus`)

### Component Patterns

All components are functional. Two patterns exist:

1. **Pages and standalone components** -- `function` declaration with inline `export default`:
   ```tsx
   export default function AIChat() { ... }
   export default function GenericTable<T>({ columns, data }: Props<T>) { ... }
   ```

2. **Reusable components** -- arrow function with `React.FC`, default export at bottom:
   ```tsx
   const ChatInput: React.FC<ChatInputProps> = ({ ... }) => { ... };
   export default React.memo(ChatInput);
   ```

Inner/helper components are defined as arrow functions or function declarations within the same file, not exported.

### Types

- Use `interface` for component props and named data shapes (`interface Message`, `interface ChatInputProps`)
- Use `type` for unions, simple shapes, and small prop types (`type DayStatus = 'ALL_AVAILABLE' | ...`, `type Props = { ... }`)
- Props are destructured in function parameters: `function Component({ content }: Props)`
- Catch blocks use `any` for error type: `catch (error: any)`

### Imports

- Use the `@/` path alias for imports from `src/`: `import { splitMarkdown } from "@/utils/splitMarkdown"`
- Relative imports (`../components/Foo`) are also used; both are acceptable
- No enforced import ordering; general pattern is: external libraries first, then local imports

### Exports

- **Pages and components**: `export default` (required by Next.js for pages)
- **Types, interfaces, constants, hooks, utility functions**: named exports (`export type`, `export interface`, `export const`, `export function`)

### Formatting

No ESLint or Prettier is configured. When editing existing files, match the formatting of the file you are modifying:

- **Quotes**: Predominantly double quotes; some files use single quotes
- **Semicolons**: Most files use them; some files omit them entirely
- **Indentation**: Spaces only (no tabs). Some files use 2 spaces, others 4 spaces. Match the existing file
- **Trailing commas**: Used inconsistently. Match the existing file

When creating new files, prefer: double quotes, semicolons, 2-space indentation, trailing commas.

### Error Handling

**API routes** -- try/catch returning JSON error responses:
```tsx
try {
  // ...
} catch (error: any) {
  console.error("API ERROR:", error);
  return res.status(500).json({ error: error.message });
}
```

**Client-side pages** -- try/catch with Chakra `useToast` for user-facing errors:
```tsx
const toast = useToast();
try {
  // ...
} catch (error) {
  toast({ title: "Error", status: "error", description: "..." });
} finally {
  setIsLoading(false);
}
```

**Chat pages** -- errors are displayed inline in the chat message list, not via toast.

### State Management

Local state only via `useState`, `useRef`, `useMemo`, `useCallback`. No global state library (no Redux, Zustand, Context API). Auth token stored in `localStorage` (client) and HTTP-only cookies (server/middleware).

## Key Libraries

| Library | Version | Usage |
|---|---|---|
| `next` | 16.0.7 | Framework (Pages Router, NOT App Router) |
| `@chakra-ui/react` | ^2.10.9 | UI components, layout, theming |
| `@chakra-ui/icons` | ^2.2.4 | Icon components |
| `react-icons` | ^5.5.0 | Additional icons (Fa, Io, Fi, Bi, Ri) |
| `axios` | ^1.13.2 | HTTP client (API routes for server-to-server calls; login page) |
| `react-markdown` | ^10.1.0 | Markdown rendering for AI chat responses |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown (tables) plugin |
| `framer-motion` | ^12.23.25 | Animation (Chakra UI v2 dependency) |

Client-side data fetching in chat pages uses native `fetch` to internal `/api/*` routes. No dedicated data-fetching library (no SWR, React Query).

## Comments

- Comments are frequently written in Thai
- Emoji annotations are common in comments (e.g., a fire emoji for critical, a star for significant)
- Large files use dashed-line section dividers: `// ------------------- Section Name -------------------`
- No JSDoc/TSDoc conventions are used
- Some files begin with a path comment: `// pages/api/chat.ts`

## Authentication Flow

- Login: POST to `/api/login` which proxies to external API, sets HTTP-only cookie
- Middleware (`src/middleware.ts`): Checks `token` cookie; redirects unauthenticated users to `/login`
- Client: Stores token in `localStorage` for API calls via `Authorization: Bearer` header
- Logout: POST to `/api/logout` which clears cookie; client removes `localStorage` token
