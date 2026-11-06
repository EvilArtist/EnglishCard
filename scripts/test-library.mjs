import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const project = fileURLToPath(new URL('../', import.meta.url));
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'english-cards-test-'));
try {
  fs.cpSync(path.join(project, 'scripts'), path.join(temp, 'scripts'), { recursive: true });
  fs.cpSync(path.join(project, 'public'), path.join(temp, 'public'), { recursive: true });
  const original = fs.readFileSync(path.join(temp, 'public/lessons/bub/bub.pdf'));
  const script = path.join(temp, 'scripts/add-lesson.mjs');
  const args = [script, path.join(temp, 'public/lessons/bub/bub.pdf'), 'test-new', 'Test lesson'];
  const added = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.equal(added.status, 0, added.stderr);
  const manifest = fs.readFileSync(path.join(temp, 'public/lessons.json'), 'utf8');
  const lessons = JSON.parse(manifest);
  assert.equal(lessons.length, 2);
  assert.equal(lessons[0].id, 'bub');
  assert.equal(lessons[1].id, 'test-new');
  assert.deepEqual(fs.readFileSync(path.join(temp, 'public/lessons/bub/bub.pdf')), original);
  assert.deepEqual(fs.readFileSync(path.join(temp, 'public/lessons/test-new/lesson.pdf')), original);
  const duplicate = spawnSync(process.execPath, args, { encoding: 'utf8' });
  assert.notEqual(duplicate.status, 0);
  assert.equal(fs.readFileSync(path.join(temp, 'public/lessons.json'), 'utf8'), manifest);
  const check = spawnSync(process.execPath, [path.join(temp, 'scripts/check.mjs')], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  fs.writeFileSync(path.join(temp, 'public/lessons/test-new/texts.json'), '{"0": 4}');
  assert.notEqual(spawnSync(process.execPath, [path.join(temp, 'scripts/check.mjs')]).status, 0);
  console.log('PASS: thêm bài giữ nguyên PDF cũ; từ chối ghi đè ID; phát hiện lời đọc không hợp lệ.');
} finally {
  // Only the unique directory created by this test is removed.
  assert(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
  assert(path.basename(temp).startsWith('english-cards-test-'));
  fs.rmSync(temp, { recursive: true, force: true });
}
