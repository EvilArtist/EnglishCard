import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../public/', import.meta.url));
const lessons = JSON.parse(fs.readFileSync(path.join(root, 'lessons.json'), 'utf8'));
assert(Array.isArray(lessons) && lessons.length, 'Thư viện phải có ít nhất một bài');
const ids = new Set();
function localFile(relative) { assert(typeof relative === 'string' && !path.isAbsolute(relative)); const full = path.resolve(root, relative); assert(full.startsWith(root), 'Đường dẫn phải nằm trong public'); return full; }
for (const lesson of lessons) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lesson.id), 'ID không hợp lệ');
  assert(!ids.has(lesson.id), 'ID bị trùng'); ids.add(lesson.id);
  assert(typeof lesson.title === 'string' && lesson.title.trim(), 'Thiếu tên bài');
  const pdf = fs.readFileSync(localFile(lesson.pdf));
  assert(pdf.subarray(0, 1024).includes(Buffer.from('%PDF-')), 'File PDF không hợp lệ');
  if (lesson.texts) {
    const texts = JSON.parse(fs.readFileSync(localFile(lesson.texts), 'utf8'));
    assert(texts && !Array.isArray(texts) && typeof texts === 'object');
    for (const [page, text] of Object.entries(texts)) assert(/^[1-9]\d*$/.test(page) && typeof text === 'string', 'Lời đọc phải là số trang: chuỗi');
  }
}
for (const file of ['index.html', 'app.js', 'style.css', 'vendor/pdf.mjs', 'vendor/pdf.worker.mjs']) assert(fs.statSync(path.join(root, file)).size > 0);
console.log(`OK: ${lessons.length} bài; PDF, lời đọc và tài nguyên đầy đủ.`);
