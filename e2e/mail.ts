import { readFile } from "node:fs/promises";
import { expect } from "@playwright/test";

const mailLog = "test-results/e2e-emails.jsonl";

function normalize(raw: string) {
  return raw.replace(/=\r?\n/g, "").replace(/=3D/gi, "=").replace(/=26/gi, "&");
}

async function messagesFor(recipient: string) {
  const contents = await readFile(mailLog, "utf8").catch(() => "");
  const messages = contents.split("\n").filter(Boolean).map((line) => JSON.parse(line) as { recipients: string[]; raw: string });
  return messages.filter((message) => message.recipients.includes(recipient.toLowerCase()));
}

export async function capturedMailCount(recipient: string) {
  return (await messagesFor(recipient)).length;
}

export async function waitForAuthLink(recipient: string, path: string, afterCount = 0) {
  let rawMessage = "";
  await expect.poll(async () => {
    const messages = await messagesFor(recipient);
    rawMessage = messages.slice(afterCount).find((message) => normalize(message.raw).includes(path))?.raw ?? "";
    return rawMessage.length > 0;
  }, { timeout: 10_000 }).toBe(true);

  const normalized = normalize(rawMessage);
  const link = normalized.match(/https?:\/\/[^\s<>"']+/)?.[0]?.replace(/[),.]$/, "");
  if (!link) throw new Error(`No ${path} link was captured for ${recipient}`);
  return link;
}
