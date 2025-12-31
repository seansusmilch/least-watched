import { test as base } from "@playwright/test";
import { execSync } from "child_process";

export const test = base.extend<{ seedDatabase: void }>({
  seedDatabase: [
    async ({}, use) => {
      execSync("bun run db:seed", { stdio: "inherit" });
      await use();
    },
    { auto: false },
  ],
});

export { expect } from "@playwright/test";
