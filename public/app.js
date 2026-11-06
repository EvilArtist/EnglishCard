import * as pdfjs from './vendor/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
let lessons = [], current, doc, cards = [], index = 0, renderTask, renderQueue = Promise.resolve(), revision = 0, busy = false, voices = [], speechVersion = 0;
const synth = window.speechSynthesis;
const key = () => `english-cards:${current.id}:${current.pdf}`;
const readLocal = () => { try { return JSON.parse(localStorage.getItem(key()) || '{}'); } catch { return {}; } };
function stop() { speechVersion++; synth?.cancel(); $('speak').querySelector('span').textContent = 'Nghe phát âm'; }
function controls() {
  $('prev').disabled = busy || !doc || index === 0;
  $('next').disabled = busy || !doc || index === cards.length - 1;
  $('speak').disabled = busy || !synth || !cards[index]?.trim();
  $('text').disabled = busy || !doc;
  $('export').disabled = busy || !doc;
  $('library').disabled = busy;
  $('retry').disabled = busy;
}
async function show() {
  stop(); const token = ++revision;
  $('counter').textContent = `THẺ ${index + 1} / ${cards.length}`;
  $('dots').textContent = `${index + 1} / ${cards.length}`;
  $('progress').style.width = `${(index + 1) / cards.length * 100}%`;
  $('text').value = cards[index] || '';
  $('status').textContent = cards[index]?.trim() ? 'Bấm nút loa và cùng đọc theo nhé.' : 'Chữ nằm trong ảnh? Mở tùy chỉnh và nhập lời đọc cho thẻ này.';
  controls(); $('canvas').hidden = true; renderTask?.cancel();
  renderQueue = renderQueue.catch(() => {}).then(async () => {
    if (token !== revision) return;
    try {
      const page = await doc.getPage(index + 1);
      if (token !== revision) return;
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(2, 1500 / Math.max(base.width, base.height)) });
      const canvas = $('canvas'); canvas.width = viewport.width; canvas.height = viewport.height;
      renderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
      await renderTask.promise;
      if (token === revision) { canvas.hidden = false; renderTask = null; }
    } catch (error) {
      if (token === revision && error.name !== 'RenderingCancelledException') $('status').textContent = 'Không hiển thị được trang. Bấm Tải lại bài để thử lại.';
    }
  });
  await renderQueue;
}
async function openLesson(id) {
  if (busy) return;
  busy = true; stop(); revision++; renderTask?.cancel(); await renderQueue.catch(() => {});
  current = lessons.find(item => item.id === id); $('library').value = id;
  controls(); $('canvas').hidden = true; $('status').textContent = 'Đang mở bài học…';
  let pending;
  try {
    pending = await pdfjs.getDocument({ url: new URL(current.pdf, document.baseURI).href }).promise;
    if (pending.numPages > 300) throw new Error('too-many');
    let overrides = {};
    if (current.texts) {
      const response = await fetch(current.texts, { cache: 'no-cache' });
      if (!response.ok) throw new Error('texts');
      overrides = await response.json();
      if (!overrides || Array.isArray(overrides) || typeof overrides !== 'object' || Object.values(overrides).some(v => typeof v !== 'string')) throw new Error('texts');
    }
    const local = readLocal(), next = [];
    for (let pageNo = 1; pageNo <= pending.numPages; pageNo++) {
      const page = await pending.getPage(pageNo);
      const text = await page.getTextContent();
      next.push(typeof local?.[pageNo] === 'string' ? local[pageNo] : overrides[pageNo] ?? text.items.map(item => item.str).join(' ').trim());
    }
    await doc?.destroy(); doc = pending; pending = null; cards = next; index = 0;
    $('filename').textContent = current.title; $('pdf-link').href = current.pdf; $('pdf-link').hidden = false;
    busy = false; await show();
  } catch (error) {
    await pending?.destroy(); await doc?.destroy(); doc = null; cards = [];
    $('counter').textContent = ''; $('dots').textContent = ''; $('progress').style.width = '0%'; $('text').value = ''; $('pdf-link').hidden = true;
    $('status').textContent = error.name === 'PasswordException' ? 'PDF có mật khẩu. Hãy dùng bản không có mật khẩu.' : error.message === 'texts' ? 'Không đọc được file lời đọc. Kiểm tra đường dẫn và nội dung JSON.' : error.message === 'too-many' ? 'Hãy chia bài thành PDF tối đa 300 trang.' : 'Không mở được bài. Kiểm tra PDF trong thư mục bài học rồi bấm Tải lại bài.';
  } finally { busy = false; controls(); }
}
function loadVoices() {
  const selected = $('voice').value;
  voices = synth ? synth.getVoices().filter(v => /^en/i.test(v.lang)) : [];
  $('voice').replaceChildren();
  if (!voices.length) $('voice').add(new Option('Tiếng Anh mặc định', ''));
  voices.forEach(v => $('voice').add(new Option(`${v.name} (${v.lang})`, v.voiceURI)));
  if (voices.some(v => v.voiceURI === selected)) $('voice').value = selected;
}
function speak() {
  if (!synth || busy || !cards[index]?.trim()) return;
  stop(); const token = speechVersion;
  const utterance = new SpeechSynthesisUtterance(cards[index]); utterance.lang = 'en-US'; utterance.rate = Number($('rate').value);
  const voice = voices.find(v => v.voiceURI === $('voice').value); if (voice) utterance.voice = voice;
  utterance.onstart = () => { if (token === speechVersion) $('speak').querySelector('span').textContent = 'Đang đọc…'; };
  utterance.onend = () => { if (token === speechVersion) $('speak').querySelector('span').textContent = 'Nghe lại'; };
  utterance.onerror = e => { if (token === speechVersion && !['interrupted', 'canceled'].includes(e.error)) { stop(); $('status').textContent = 'Chưa phát được âm thanh. Hãy chọn giọng khác hoặc thử trình duyệt khác.'; } };
  synth.speak(utterance);
}
function move(delta) { if (!busy && doc) { index = Math.max(0, Math.min(cards.length - 1, index + delta)); show(); } }
$('library').onchange = e => openLesson(e.target.value);
$('retry').onclick = () => current && openLesson(current.id);
$('prev').onclick = () => move(-1); $('next').onclick = () => move(1); $('speak').onclick = speak;
$('text').oninput = () => {
  cards[index] = $('text').value; controls();
  try { const edits = readLocal() || {}; edits[index + 1] = cards[index]; localStorage.setItem(key(), JSON.stringify(edits)); $('status').textContent = 'Đã lưu lời đọc trên trình duyệt này. Tải lời đọc để lưu vào project.'; }
  catch { $('status').textContent = 'Trình duyệt không lưu được. Hãy tải lời đọc trước khi đóng trang.'; }
};
$('export').onclick = () => {
  const blob = new Blob([JSON.stringify(Object.fromEntries(cards.map((text, i) => [i + 1, text])), null, 2) + '\n'], { type: 'application/json' });
  const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `${current.id}-texts.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
};
document.addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA|BUTTON|SUMMARY|A/.test(e.target.tagName)) return;
  if (e.key === 'ArrowLeft') move(-1); if (e.key === 'ArrowRight') move(1);
  if (e.code === 'Space') { e.preventDefault(); speak(); }
});
window.addEventListener('pagehide', stop); synth?.addEventListener('voiceschanged', loadVoices); loadVoices(); controls();
try {
  const response = await fetch('./lessons.json', { cache: 'no-cache' });
  if (!response.ok) throw new Error('catalog');
  lessons = await response.json();
  if (!Array.isArray(lessons) || !lessons.length || lessons.some(l => !l.id || !l.title || !l.pdf) || new Set(lessons.map(l => l.id)).size !== lessons.length) throw new Error('catalog');
  lessons.forEach(l => $('library').add(new Option(l.title, l.id)));
  await openLesson(lessons[0].id);
} catch { $('status').textContent = 'Không đọc được thư viện. Kiểm tra lessons.json và mở trang qua web server.'; }
