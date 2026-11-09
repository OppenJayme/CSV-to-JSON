import { convertCSV, formatJSON } from './converter.js';

const form = document.querySelector('#upload-form');
const fileInput = document.querySelector('#csv-file');
const convertButton = document.querySelector('#convert-button');
const downloadButton = document.querySelector('#download-button');
const output = document.querySelector('#json-output');
const status = document.querySelector('#status');
let json = '';
let outputName = '';
let selection = 0;

function clearOutput() {
  json = '';
  outputName = '';
  output.textContent = 'Your converted records will appear here.';
  downloadButton.disabled = true;
}

function setStatus(message, error = false) {
  status.textContent = message;
  status.classList.toggle('error', error);
}

fileInput.addEventListener('change', () => {
  selection++;
  clearOutput();
  convertButton.disabled = false;
  setStatus(fileInput.files.length ? 'File selected. Click Convert to JSON.' : 'Choose a file to get started.');
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const file = fileInput.files[0];
  const currentSelection = ++selection;
  clearOutput();
  if (!file) return setStatus('Choose a CSV file first.', true);
  if (!/\.csv$/i.test(file.name)) return setStatus('Choose a file with the .csv extension.', true);
  if (file.size > 5 * 1024 * 1024) return setStatus('This file is too large. Choose a CSV under 5 MB.', true);

  convertButton.disabled = true;
  setStatus('Reading and converting the CSV…');
  try {
    const text = await file.text();
    // Ignore results if the user chose a different file while this one was reading.
    if (currentSelection !== selection) return;
    const students = convertCSV(text);
    json = formatJSON(students);
    outputName = file.name.replace(/\.csv$/i, '') + '.json';
    output.textContent = json;
    downloadButton.disabled = false;
    setStatus(`Converted ${students.length} student record${students.length === 1 ? '' : 's'}. Ready to download.`);
  } catch (error) {
    if (currentSelection !== selection) return;
    clearOutput();
    setStatus(error.message || 'The file could not be read.', true);
  } finally {
    if (currentSelection === selection) convertButton.disabled = false;
  }
});

downloadButton.addEventListener('click', () => {
  if (!json) return;
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = outputName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
