# GEMINI.md

## Project Overview

This project, **my-link**, is a workspace containing a Next.js application called **my-profile**. It is designed as a personal profile or portfolio site, leveraging modern web technologies for performance and developer experience.

### Main Technologies

- **Framework:** Next.js 16 (App Router)
- **Library:** React 19
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **Package Manager:** pnpm (inferred from `pnpm-lock.yaml` and `pnpm-workspace.yaml`)

### Architecture

The core application logic is located within the `my-profile/` directory:
- `app/`: Contains the Next.js App Router files, including layouts, pages, and global styles.
- `public/`: Static assets such as images and SVGs.
- `next.config.ts`: Next.js configuration.
- `tsconfig.json`: TypeScript configuration.
- `tailwind.config.ts`: (Note: Tailwind 4 uses `@theme` in CSS, but config files may exist for advanced overrides).

---

## Building and Running

Commands should be executed within the `my-profile/` directory.

| Command | Description |
| :--- | :--- |
| `pnpm dev` | Starts the development server with Turbopack. |
| `pnpm build` | Builds the application for production. |
| `pnpm start` | Starts the production server after building. |
| `pnpm lint` | Runs ESLint to check for code quality issues. |

---

## Development Conventions

### Coding Style
- **TypeScript:** Strict typing is encouraged. Use `next.config.ts` for configuration.
- **Components:** Functional components with React 19 features (e.g., Server Components by default).
- **Styling:** Use Tailwind CSS 4 utility classes. Prefer CSS variables for theme management in `app/globals.css`.

### Directory Structure
- Follow the Next.js App Router conventions:
  - `app/layout.tsx` for shared layouts.
  - `app/page.tsx` for route pages.
  - `app/globals.css` for global styles and Tailwind theme definitions.

### Testing
*No explicit testing framework (like Jest or Vitest) was found in the initial analysis. Adding tests is recommended as the project grows.*

---

## Workspace Strategy

The root directory `my-link` acts as a container. Future sub-projects or services should be added as separate directories, potentially leveraging pnpm workspaces for dependency management.
