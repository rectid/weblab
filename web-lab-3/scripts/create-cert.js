import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import selfsigned from "selfsigned";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const certDir = path.join(rootDir, "cert");

if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

const attrs = [{ name: "commonName", value: "localhost" }];
const options = {
  days: 365,
  keySize: 2048,
  algorithm: "sha256",
  extensions: [{ name: "subjectAltName", altNames: [{ type: 2, value: "localhost" }] }]
};

const { cert, private: privateKey } = selfsigned.generate(attrs, options);

const certPath = path.join(certDir, "server.cert");
const keyPath = path.join(certDir, "server.key");

fs.writeFileSync(certPath, cert, "utf-8");
fs.writeFileSync(keyPath, privateKey, "utf-8");

// eslint-disable-next-line no-console
console.log("✅ Самоподписанный сертификат создан в каталоге cert/");
