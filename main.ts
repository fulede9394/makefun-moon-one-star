// The Moon Gets One Star — a one-star review of the Moon, 120 chars max.
// The review is assembled from three parts so each beat earns its place:
// a rating, a grievance about the Moon itself, and a closing complaint.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

// House limits for this bounty: entry.txt must be 1-120 UTF-8 chars,
// not only whitespace, and read like a real one-star review.
const REVIEW_LIMITS = Object.freeze({
  minChars: 1,
  maxChars: 120,
  fileName: "entry.txt",
});

// The three beats of the review, kept separate so the punchline lands last.
const REVIEW = Object.freeze({
  rating: "★ One star.",
  grievance: "Up there 4.5 billion years and still hasn't fixed the lighting.",
  closing: "Vanishes for days without telling anyone.",
});

function composeReview(parts: typeof REVIEW): string {
  // One space between beats, no trailing newline in the entry itself.
  return [parts.rating, parts.grievance, parts.closing].join(" ");
}

function checkReview(text: string): void {
  // Guard the gate before anything is written: length, whitespace, one line.
  if (text.length < REVIEW_LIMITS.minChars || text.length > REVIEW_LIMITS.maxChars) {
    throw new Error(
      `review is ${text.length} chars, outside ${REVIEW_LIMITS.minChars}-${REVIEW_LIMITS.maxChars}`,
    );
  }
  if (text.trim().length === 0) {
    throw new Error("review must not be only whitespace");
  }
  if (text.includes("\n")) {
    throw new Error("review must be a single line");
  }
  if (!text.includes("★")) {
    throw new Error("review must carry its one-star rating");
  }
  if (/[\u0000-\u001F]/.test(text)) {
    throw new Error("review must not contain control characters");
  }
}

function fingerprint(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function resolveOutDir(): string {
  // The grader sets MAKEFUN_OUTPUT_DIR; default to /output like the rules say.
  return resolve(process.env.MAKEFUN_OUTPUT_DIR ?? "/output");
}

async function publish(): Promise<void> {
  const text = composeReview(REVIEW);
  checkReview(text);
  const outDir = resolveOutDir();
  await mkdir(outDir, { recursive: true });
  const target = join(outDir, REVIEW_LIMITS.fileName);
  await writeFile(target, text, "utf8");
  // Round-trip: read it back and confirm the file is byte-identical.
  const back = await readFile(target, "utf8");
  if (back !== text) {
    throw new Error("entry.txt round-trip mismatch");
  }
  console.log(`wrote ${target} (${text.length} chars, sha256 ${fingerprint(text)})`);
  console.log(text);
}

await publish();
