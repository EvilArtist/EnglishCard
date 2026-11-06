import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const [source, id, title] = process.argv.slice(2);
if (!source || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || '') || !title) {
  console.error('Usage: npm run add-lesson -- "C:/path/lesson.pdf" lesson-id "Tên bài học"'); process.exit(1);
}
const root = fileURLToPath(new URL('../public/', import.meta.url));
const catalogPath = path.join(root, 'lessons.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const target = path.join(root, 'lessons', id);
if (catalog.some(l => l.id === id) || fs.existsSync(target)) throw new Error('ID đã tồn tại. Dùng ID mới để giữ nguyên bài cũ.');
const pdf = fs.readFileSync(source);
if (!pdf.subarray(0, 1024).includes(Buffer.from('%PDF-'))) throw new Error('File không phải PDF.');
fs.mkdirSync(target);
fs.writeFileSync(path.join(target, 'lesson.pdf'), pdf, { flag: 'wx' });
fs.writeFileSync(path.join(target, 'texts.json'), '{}\n', { flag: 'wx' });
catalog.push({ id, title, pdf: `lessons/${id}/lesson.pdf`, texts: `lessons/${id}/texts.json` });
fs.writeFileSync(catalogPath + '.tmp', JSON.stringify(catalog, null, 2) + '\n');
fs.renameSync(catalogPath + '.tmp', catalogPath);
console.log(`Đã thêm ${title}. Giữ nguyên các bài trước. Chạy npm run check trước khi đăng.`);
