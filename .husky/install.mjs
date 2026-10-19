import { existsSync } from "node:fs";

if (
  process.env.HUSKY === "0" ||
  process.env.CI === "true" ||
  process.env.NODE_ENV === "production"
) {
  process.exit(0);
}

if (!existsSync(new URL("../.git", import.meta.url))) {
  process.exit(0);
}

const { default: husky } = await import("husky");
const error = husky();

if (error) {
  console.error(error);
  process.exit(1);
}
