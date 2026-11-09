import test from 'node:test';
import assert from 'node:assert/strict';

const header = 'student_id,first_name,last_name,course,year_level,email,tuition_balance';
const csv = `${header}\n1,juan,reyes,BSIT,3,JUAN@EXAMPLE.COM,1.005`;
let instance = 0;

// Only model the DOM methods the page uses; layout still needs a browser check.
async function setup(t) {
  const elements = new Map();
  for (const id of ['upload-form', 'csv-file', 'convert-button', 'download-button', 'json-output', 'status']) {
    elements.set(id, {
      textContent: '',
      disabled: id === 'download-button',
      files: [],
      events: {},
      classList: { toggle() {} },
      addEventListener(name, callback) { this.events[name] = callback; }
    });
  }
  const downloads = [];
  const blobs = [];
  const originalDocument = globalThis.document;
  globalThis.document = {
    querySelector: selector => elements.get(selector.slice(1)),
    body: { append() {} },
    createElement: () => ({
      click() { downloads.push({ name: this.download, url: this.href }); },
      remove() {}
    })
  };
  t.after(() => {
    if (originalDocument === undefined) delete globalThis.document;
    else globalThis.document = originalDocument;
  });
  t.mock.method(URL, 'createObjectURL', blob => {
    blobs.push(blob);
    return 'blob:download';
  });
  await import(`../app.js?test=${++instance}`);

  return {
    elements, downloads, blobs,
    choose(name, text, size = 100) {
      elements.get('csv-file').files = [{ name, size, text: async () => text }];
      elements.get('csv-file').events.change();
    },
    submit: () => elements.get('upload-form').events.submit({ preventDefault() {} }),
    download: () => elements.get('download-button').events.click(),
    status: () => elements.get('status').textContent,
    output: () => elements.get('json-output').textContent,
    canDownload: () => !elements.get('download-button').disabled
  };
}

test('downloads the converted preview with a matching JSON filename', async t => {
  const app = await setup(t);
  app.choose('students.CSV', csv);
  await app.submit();
  assert.match(app.status(), /Converted 1 student record/);
  assert.equal(app.canDownload(), true);
  assert.equal(JSON.parse(app.output())[0].outstandingBalance, 1.01);
  app.download();
  assert.equal(app.downloads[0].name, 'students.json');
  assert.equal(app.blobs[0].type, 'application/json');
  assert.equal(await app.blobs[0].text(), app.output());
});

test('clears a previous result when another file is chosen or conversion fails', async t => {
  const app = await setup(t);
  app.choose('valid.csv', csv);
  await app.submit();
  app.choose('invalid.csv', csv.replace('BSIT', 'UNKNOWN'));
  assert.equal(app.canDownload(), false);
  assert.doesNotMatch(app.output(), /studentId/);
  await app.submit();
  assert.match(app.status(), /unknown course code/);
  app.download();
  assert.equal(app.downloads.length, 0);
});

test('rejects a missing file, the wrong extension, and an oversized file', async t => {
  const app = await setup(t);
  await app.submit();
  assert.match(app.status(), /Choose a CSV file first/);
  app.choose('students.txt', csv);
  await app.submit();
  assert.match(app.status(), /\.csv extension/);
  app.choose('students.csv', csv, 5 * 1024 * 1024 + 1);
  await app.submit();
  assert.match(app.status(), /too large/);
  assert.equal(app.canDownload(), false);
});

test('recovers after a file read error', async t => {
  const app = await setup(t);
  app.choose('unreadable.csv', csv);
  app.elements.get('csv-file').files[0].text = async () => { throw new Error('File access failed.'); };
  await app.submit();
  assert.match(app.status(), /File access failed/);
  assert.equal(app.canDownload(), false);
  assert.equal(app.elements.get('convert-button').disabled, false);
  app.choose('valid.csv', csv);
  await app.submit();
  assert.equal(app.canDownload(), true);
});

test('ignores a late file read after another file has been selected', async t => {
  const app = await setup(t);
  let finishOldRead;
  app.choose('old.csv', csv);
  app.elements.get('csv-file').files[0].text = () => new Promise(resolve => { finishOldRead = resolve; });
  const pending = app.submit();
  app.choose('new.csv', csv.replace('juan', 'maria'));
  await app.submit();
  finishOldRead(csv);
  await pending;
  assert.equal(JSON.parse(app.output())[0].firstName, 'Maria');
  app.download();
  assert.equal(app.downloads[0].name, 'new.json');
});
