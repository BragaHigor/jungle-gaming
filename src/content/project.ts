export const projectRepository = "https://github.com/BragaHigor/jungle-gaming";
export const projectSections = [
  "purpose",
  "stack",
  "flow",
  "architecture",
  "decisions",
  "quality",
  "limits",
  "repository",
] as const;
export const projectStack = [
  { id: "pages", name: "Next.js · React · TypeScript" },
  { id: "routing", name: "TanStack Router" },
  { id: "data", name: "TanStack Query · Axios" },
  { id: "events", name: "Socket.IO" },
  { id: "database", name: "PostgreSQL · Neon" },
  { id: "interface", name: "Tailwind CSS · shadcn/ui" },
  { id: "validation", name: "Zod" },
  { id: "language", name: "i18next · react-i18next" },
  { id: "delivery", name: "Vitest · Husky · GitHub Actions" },
] as const;
export const roundFlow = [
  "intent",
  "request",
  "transaction",
  "confirmation",
  "presentation",
] as const;
export const projectArchitecture = [
  {
    id: "composition",
    files: [
      "src/features/game/components/game-board.tsx",
      "src/features/game/components/reels.tsx",
    ],
  },
  {
    id: "service",
    files: ["src/server/game/game-service.ts", "src/server/game/rules.ts"],
  },
  {
    id: "repository",
    files: ["src/server/game/game-repository.ts", "src/server/game/storage.ts"],
  },
  {
    id: "dependencies",
    files: ["src/server/game/runtime.ts", "tests/game/service.test.ts"],
  },
] as const;
export const sourceHref = (path: string) =>
  `${projectRepository}/blob/develop/${path}`;
