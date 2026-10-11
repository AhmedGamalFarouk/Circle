import { resetEmulators, PROJECT_ID } from "./emulator.js";

export default async function globalSetup() {
  try {
    await fetch("http://127.0.0.1:8080/");
  } catch {
    throw new Error(
      "Firebase emulators are not running. Use `npm run test:e2e`, which starts them.",
    );
  }
  await resetEmulators();
  console.log(`Emulators for ${PROJECT_ID} reset.`);
}
