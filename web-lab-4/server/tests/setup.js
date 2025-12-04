import fs from "fs";
import os from "os";
import path from "path";

let tempDir;

beforeAll(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "social-user-app-"));
  process.env.DATA_DIR = tempDir;
});

afterAll(() => {
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
