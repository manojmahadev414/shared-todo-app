import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { SMTPServer } from "smtp-server";

const capturePath = new URL("../test-results/e2e-emails.jsonl", import.meta.url);
await mkdir(new URL("../test-results/", import.meta.url), { recursive: true });
await writeFile(capturePath, "");

const smtp = new SMTPServer({
  authOptional: false,
  disabledCommands: ["STARTTLS"],
  onAuth(auth, _session, callback) {
    if (auth.username === "e2e" && auth.password === "e2e") callback(null, { user: "e2e" });
    else callback(new Error("Invalid E2E SMTP credentials"));
  },
  onData(stream, session, callback) {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", async () => {
      try {
        const message = {
          recipients: session.envelope.rcptTo.map((recipient) => recipient.address.toLowerCase()),
          raw: Buffer.concat(chunks).toString("utf8"),
        };
        await appendFile(capturePath, `${JSON.stringify(message)}\n`);
        callback(null, "Message captured by E2E mail server");
      } catch (error) {
        callback(error instanceof Error ? error : new Error("Could not capture E2E email"));
      }
    });
  },
});

await new Promise((resolve, reject) => {
  smtp.once("error", reject);
  smtp.listen(2525, "127.0.0.1", resolve);
});

const next = spawn("npm", ["run", "dev", "--", "--port", "3100"], { stdio: "inherit", env: process.env });
let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  smtp.close();
  if (next.exitCode === null) next.kill("SIGTERM");
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
next.on("exit", async (code) => {
  await shutdown();
  process.exitCode = code ?? 1;
});
