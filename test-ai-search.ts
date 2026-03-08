import { findExpertPublicationsAction } from "./lib/actions/pdf-actions";

// Mock auth
import { mock } from "bun:test";
mock.module("./auth", () => ({
  auth: () => Promise.resolve({ user: { name: "Test User" } })
}));

async function main() {
    const result = await findExpertPublicationsAction("Eckart Boege Schmidt");
    console.log(result);
    process.exit(0);
}
main();