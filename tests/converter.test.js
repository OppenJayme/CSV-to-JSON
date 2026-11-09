import test from 'node:test';
import assert from 'node:assert/strict';
import { convertCSV, formatJSON, parseCSV } from '../converter.js';

const header = 'student_id,first_name,last_name,course,year_level,email,tuition_balance';
const record = '1001,juan,dela cruz,BSIT,3,JUAN@EXAMPLE.COM,1234.567';

test('applies all seven mappings and preserves numeric JSON types', () => {
  const students = convertCSV(`${header}\n${record}`);
  assert.deepEqual(students, [{
    studentId: 1001,
    firstName: 'Juan',
    lastName: 'Dela cruz',
    program: 'Bachelor of Science in Information Technology',
    yearLevel: 3,
    emailAddress: 'juan@example.com',
    outstandingBalance: 1234.57
  }]);
  assert.deepEqual(JSON.parse(formatJSON(students)), students);
});

test('reads quoted commas, escaped quotes, embedded newlines, BOM, and CRLF', () => {
  assert.deepEqual(parseCSV('\uFEFFa,b\r\n"one,two","say ""hello""\nagain"\r\n'), [
    ['a', 'b'], ['one,two', 'say "hello"\nagain']
  ]);
});

test('ignores blank lines and accepts reordered headers and extra columns', () => {
  const students = convertCSV(`\nemail,course,last_name,first_name,student_id,year_level,tuition_balance,note\n\n A@EXAMPLE.COM , cs , reyes , ana , 2 , 1 , 0 ,demo\n`);
  assert.equal(students.length, 1);
  assert.equal(students[0].program, 'Bachelor of Science in Computer Science');
  assert.equal(students[0].firstName, 'Ana');
  assert.equal(students[0].emailAddress, 'a@example.com');
});

test('supports Information Systems and numeric zero balances', () => {
  const students = convertCSV(`${header}\n3,ana,reyes,BSIS,1,ANA@EXAMPLE.COM,0`);
  const output = formatJSON(students);
  assert.match(output, /"outstandingBalance": 0\.00/);
  assert.equal(typeof JSON.parse(output)[0].outstandingBalance, 'number');
  assert.equal(students[0].program, 'Bachelor of Science in Information Systems');
});

test('keeps quotes and HTML-like content safely escaped in valid JSON', () => {
  const students = convertCSV(`${header}\n4,"jo""an",<img src=x>,IT,2,A@EXAMPLE.COM,42.5`);
  const output = formatJSON(students);
  assert.match(output, /"outstandingBalance": 42\.50/);
  assert.equal(JSON.parse(output)[0].firstName, 'Jo"an');
  assert.equal(JSON.parse(output)[0].lastName, '<img src=x>');
});

test('rejects empty input, a header-only CSV, and missing or duplicate headers', () => {
  assert.throws(() => convertCSV(' \n'), /empty/);
  assert.throws(() => convertCSV(header), /no student records/);
  assert.throws(() => convertCSV('student_id\n1'), /Missing columns/);
  assert.throws(() => convertCSV(`${header},email\n${record},x`), /duplicate/);
});

test('rejects malformed quoting and mismatched column counts', () => {
  for (const text of ['a\n"unclosed', 'a\n"closed"oops', 'a\nstray"quote']) {
    assert.throws(() => parseCSV(text), /quote|CSV field/);
  }
  assert.throws(() => convertCSV(`${header}\n${record},extra`), /Record 1: column count/);
  assert.throws(() => convertCSV(`${header}\n,,,,,,`), /Record 1: student_id is empty/);
});

test('rejects invalid integers instead of silently truncating them', () => {
  for (const value of ['1001x', '1.5', '9007199254740992']) {
    assert.throws(() => convertCSV(`${header}\n${record.replace('1001', value)}`), /student_id must be a whole number/);
  }
  assert.throws(() => convertCSV(`${header}\n${record.replace(',3,', ',3.5,')}`), /year_level must be a whole number/);
});

test('rejects unknown courses, invalid balances, and missing values', () => {
  assert.throws(() => convertCSV(`${header}\n${record.replace('BSIT', 'UNKNOWN')}`), /unknown course/);
  for (const value of ['NaN', 'Infinity', 'PHP 200', '12abc']) {
    assert.throws(() => convertCSV(`${header}\n${record.replace('1234.567', value)}`), /tuition_balance must be a decimal/);
  }
  assert.throws(() => convertCSV(`${header}\n${record.replace('juan,', ',')}`), /first_name is empty/);
});

test('reports the failing record without returning a partial conversion', () => {
  assert.throws(() => convertCSV(`${header}\n${record}\n${record.replace('BSIT', 'UNKNOWN')}`), /Record 2: unknown course/);
});
