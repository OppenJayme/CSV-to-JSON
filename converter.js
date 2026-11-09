const requiredHeaders = [
  'student_id', 'first_name', 'last_name', 'course',
  'year_level', 'email', 'tuition_balance'
];

const programs = new Map([
  ['BSIT', 'Bachelor of Science in Information Technology'],
  ['IT', 'Bachelor of Science in Information Technology'],
  ['BSCS', 'Bachelor of Science in Computer Science'],
  ['CS', 'Bachelor of Science in Computer Science'],
  ['BSIS', 'Bachelor of Science in Information Systems'],
  ['IS', 'Bachelor of Science in Information Systems']
]);

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let closedQuote = false;

  function finishRow() {
    row.push(field);
    if (row.length > 1 || row[0].trim() !== '') rows.push(row);
    row = [];
    field = '';
    closedQuote = false;
  }

  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
        closedQuote = true;
      } else {
        field += char;
      }
    } else if (char === ',') {
      row.push(field);
      field = '';
      closedQuote = false;
    } else if (char === '\n' || char === '\r') {
      finishRow();
      if (char === '\r' && text[i + 1] === '\n') i++;
    } else if (char === '"') {
      if (field !== '' || closedQuote) throw new Error('Unexpected quote in CSV field.');
      quoted = true;
    } else {
      if (closedQuote) throw new Error('Unexpected text after a closing CSV quote.');
      field += char;
    }
  }
  if (quoted) throw new Error('A quoted CSV field was not closed.');
  finishRow();
  return rows;
}

function integer(value, field, row) {
  if (!/^[+-]?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error(`Record ${row}: ${field} must be a whole number.`);
  }
  return Number(value);
}

function balance(value, row) {
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
    throw new Error(`Record ${row}: tuition_balance must be a decimal number without currency symbols or separators.`);
  }
  const [whole, fraction = ''] = value.replace(/^[+-]/, '').split('.');
  let cents = BigInt(whole || '0') * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
  if (fraction[2] >= '5') cents++;
  const sign = value.startsWith('-') ? -1 : 1;
  const rounded = sign * Number(cents) / 100;
  if (cents > BigInt(Number.MAX_SAFE_INTEGER) || BigInt(Math.round(Math.abs(rounded) * 100)) !== cents) {
    throw new Error(`Record ${row}: tuition_balance is too large to represent accurately.`);
  }
  return rounded;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function convertCSV(text) {
  const [headerRow, ...rows] = parseCSV(text);
  if (!headerRow) throw new Error('The CSV is empty.');
  const headers = headerRow.map(header => header.trim());
  if (new Set(headers).size !== headers.length) throw new Error('The CSV has duplicate column names.');
  const missing = requiredHeaders.filter(header => !headers.includes(header));
  if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}.`);
  if (!rows.length) throw new Error('The CSV has a header but no student records.');

  return rows.map((values, index) => {
    const record = index + 1;
    if (values.length !== headers.length) throw new Error(`Record ${record}: column count does not match the header.`);
    const source = Object.fromEntries(headers.map((header, i) => [header, values[i].trim()]));
    for (const field of requiredHeaders) {
      if (source[field] === '') throw new Error(`Record ${record}: ${field} is empty.`);
    }
    const program = programs.get(source.course.toUpperCase());
    if (!program) throw new Error(`Record ${record}: unknown course code "${source.course}". Check the course column and supported program codes.`);

    return {
      studentId: integer(source.student_id, 'student_id', record),
      firstName: capitalize(source.first_name),
      lastName: capitalize(source.last_name),
      program,
      yearLevel: integer(source.year_level, 'year_level', record),
      emailAddress: source.email.toLowerCase(),
      outstandingBalance: balance(source.tuition_balance, record)
    };
  });
}

export function formatJSON(students) {
  const records = students.map(student => {
    const fields = Object.entries(student).map(([key, value]) => {
      const formatted = key === 'outstandingBalance' ? value.toFixed(2) : JSON.stringify(value);
      return `    ${JSON.stringify(key)}: ${formatted}`;
    });
    return `  {\n${fields.join(',\n')}\n  }`;
  });
  return `[\n${records.join(',\n')}\n]`;
}
