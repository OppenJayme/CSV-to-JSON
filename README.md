# CSV to JSON

A small data mapping exercise using HTML, CSS, and JavaScript. Choose a student CSV, convert it, then download the JSON array. Files are read in the browser and are not uploaded or saved by the application.

## Run locally

From the project folder:

```sh
python -m http.server 8000
```

Open http://localhost:8000. Use a local server because the JavaScript files use ES modules.

To run the converter checks with Node.js 18 or later:

```sh
npm test
```

There are no packages to install. Node is only needed for the tests, not for hosting.

## Data map

| CSV column | JSON field | JSON type | Rule |
| --- | --- | --- | --- |
| `student_id` | `studentId` | Integer | Convert to a whole number |
| `first_name` | `firstName` | String | Uppercase the first letter |
| `last_name` | `lastName` | String | Uppercase the first letter |
| `course` | `program` | String | Replace the code with the full program name |
| `year_level` | `yearLevel` | Integer | Convert to a whole number |
| `email` | `emailAddress` | String | Convert to lowercase |
| `tuition_balance` | `outstandingBalance` | Number | Round and write with two decimal places |

Whitespace around values is trimmed. Name capitalization changes only the first character; the remaining characters are preserved. Balances are rounded from the decimal text to the nearest cent, with exact halfway values rounded away from zero: `1.005` becomes `1.01`, and `-1.005` becomes `-1.01`. Values that cannot be represented safely in cents are rejected. The output writes values such as `42.50` as JSON numbers, without quotes. A JSON viewer may display that value as `42.5` after parsing it.

All seven columns and their values are required. Columns can appear in a different order; extra columns are ignored. Blank lines are ignored. Invalid records stop the conversion and show an error rather than producing a partial download. Error record numbers count data records, excluding the header and blank lines.

The parser supports comma-separated fields, quoted commas, escaped double quotes, quoted newlines, UTF-8 BOM, and Windows or Unix line endings. Files must have a `.csv` extension and be no larger than 5 MB. Numeric values should not contain currency symbols or thousands separators.

## Program names

These are the initial mappings in `converter.js`. They need to be checked against the actual class CSV; its contents were not available when this version was made.

| Accepted codes | Program |
| --- | --- |
| `BSIT`, `IT` | Bachelor of Science in Information Technology |
| `BSCS`, `CS` | Bachelor of Science in Computer Science |
| `BSIS`, `IS` | Bachelor of Science in Information Systems |

Codes are matched without case sensitivity. An unknown code shows an error. Add the correct full name to the map if the class file includes other programs.

For a quick local check, use [examples/demo.csv](examples/demo.csv), which can also be downloaded from the page. It contains **made-up test data**, not the instructor's file. A minimal CSV looks like this:

```csv
student_id,first_name,last_name,course,year_level,email,tuition_balance
1001,juan,reyes,BSIT,3,JUAN@EXAMPLE.COM,1250.5
1002,maria,santos,BSCS,2,MARIA@EXAMPLE.COM,0
```

## Before submitting

- Replace `Schedule: To be added` in `index.html` with the actual class days and time. The displayed name is Kyer Ivan Jayme.
- Download `exercise_datamap.csv` from Canvas and check the conversion with that file.
- Confirm every course code and program name against the instructor's expected output.
- Test an invalid CSV, select another file after a successful conversion, and check the downloaded JSON.

## DCISM hosting

1. Sign in at https://admin.dcism.org/ using your DCISM credentials.
2. Enable SSH and SFTP, then create the required subdomain.
3. Connect using an SFTP client:

   | Setting | Value |
   | --- | --- |
   | Host | `web.dcism.org` |
   | Port | `22077` |
   | Protocol | SFTP |
   | Username | Your DCISM username, usually `s` followed by your USC ID |
   | Password | Your DCISM account password |

4. Open the folder named after your subdomain. Upload `index.html`, `styles.css`, `app.js`, and `converter.js` directly into it. Include the `examples` folder so the sample download works.
5. Visit your subdomain and test the upload and download there.

The written assignment uses `lastname` + first two letters of the first name + `dme`. For Kyer Ivan Jayme this gives `jaymekydme.dcism.org`. The assignment's John Doe example uses a different suffix, so confirm the naming if the instructor clarifies it.

References: [DCISM setup](https://tutorial.dcism.org/), [subdomains](https://tutorial.dcism.org/subdomains.html), and [static hosting](https://tutorial.dcism.org/static.html).

## Files

- `index.html`: page structure, name, and schedule.
- `styles.css`: page styling.
- `converter.js`: CSV parser, data map, and JSON formatting.
- `app.js`: file selection, preview, errors, and download.
- `tests/converter.test.js`: converter checks.
- `tests/app.test.js`: file selection, conversion, and download handler checks using a small DOM stub. These do not replace a visual browser check.
- `examples/demo.csv`: made-up records for trying the application.
- `AGENTS.md`: instructions for later changes and Codex review.
