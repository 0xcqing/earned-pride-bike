import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "He fixed the bike with the wrong tools and a hairpin, then rang the bell once in the empty garage just to hear it work.";

const MIN_CHARS = 1;
const MAX_CHARS = 240;
const EXPECTED_CHARS = 119;

function fail(message: string): never {
  console.error(`entry.txt not written: ${message}`);
  process.exit(1);
}

if (LINE.trim().length === 0) {
  fail("the line is empty or only white space after trim");
}

if (/[\n\r\u2028\u2029]/.test(LINE)) {
  fail("the line contains a newline or a line separator");
}

const charCount = Array.from(LINE).length;
if (charCount < MIN_CHARS || charCount > MAX_CHARS) {
  fail(
    `the line has ${charCount} characters; expected ${MIN_CHARS}..${MAX_CHARS}`,
  );
}
if (charCount !== EXPECTED_CHARS) {
  fail(
    `the line has ${charCount} characters but the approved entry is ${EXPECTED_CHARS}; change EXPECTED_CHARS only together with the approved line`,
  );
}

const byteCount = Buffer.byteLength(LINE, "utf8");
if (byteCount < MIN_CHARS || byteCount > MAX_CHARS) {
  fail(
    `the line has ${byteCount} UTF-8 bytes; expected ${MIN_CHARS}..${MAX_CHARS}`,
  );
}

const outputDir =
  process.env.MAKEFUN_OUTPUT_DIR && process.env.MAKEFUN_OUTPUT_DIR.length > 0
    ? process.env.MAKEFUN_OUTPUT_DIR
    : "/output";

mkdirSync(outputDir, { recursive: true });

const entryPath = join(outputDir, "entry.txt");
const content = `${LINE}\n`;

writeFileSync(entryPath, content, { encoding: "utf8", mode: 0o644 });

const expectedBytes = Buffer.from(content, "utf8");
const actualBytes = readFileSync(entryPath);

if (
  actualBytes.length !== expectedBytes.length ||
  !actualBytes.equals(expectedBytes)
) {
  fail(
    `read-back mismatch at ${entryPath}: wrote ${expectedBytes.length} bytes but read ${actualBytes.length} bytes`,
  );
}

if (actualBytes[0] === 0xef && actualBytes[1] === 0xbb && actualBytes[2] === 0xbf) {
  fail("the written file starts with a UTF-8 BOM; it must start with the line itself");
}

const newlineCount = actualBytes.filter((b) => b === 0x0a).length;
if (newlineCount !== 1 || actualBytes[actualBytes.length - 1] !== 0x0a) {
  fail(
    `the written file has ${newlineCount} newline byte(s); it must have exactly one, as the final byte`,
  );
}

console.log(`characters: ${charCount}`);
console.log(`utf8 bytes: ${byteCount}`);
console.log(`file bytes: ${actualBytes.length}`);
console.log(`path: ${entryPath}`);
console.log(LINE);
