# Project instructions

This is a small CSV-to-JSON exercise for USC. Keep the code easy to read and explain in class.

## Scope

- Use plain HTML, CSS, and JavaScript. No framework, database, or build step is needed.
- Let the user choose a CSV, preview the converted JSON, and download it.
- Process files in the browser. Do not send student records to a server or keep them in local storage.
- Show Kyer Ivan Jayme's full name and class schedule in `index.html`. The schedule is still missing; do not invent it.
- Follow the data map in `README.md`. Keep JSON field names and types exactly as assigned.
- The instructor's CSV has not been checked yet. Confirm the course codes and full program names before submission.

## Code

- Use descriptive names, small functions, and consistent two-space indentation.
- Keep CSV parsing and transformations in `converter.js`, separate from DOM events in `app.js`.
- Handle quoted commas, escaped quotes, line endings, and blank lines. Do not parse CSV with just `split(',')`.
- Report missing columns and invalid numbers with useful row and field details. Do not silently skip bad records.
- Insert uploaded content with `textContent`, not `innerHTML`.
- Keep comments short and explain decisions that are not obvious from the code.
- Keep the interface simple: readable labels, ordinary buttons, a useful error message, and a JSON preview. Avoid decorative dashboards and unnecessary features.
- Add a dependency only if there is a clear need, and explain it in the change description.

## Checks

- Run `npm test` after changing parsing or transformations.
- Serve the folder locally and check upload, errors, preview, and download in a browser.
- Check the downloaded file with `JSON.parse`; balances must be numbers, not quoted strings.
- Clear old results when a different file is selected or conversion fails.
- Update the README when behavior or deployment steps change.

## Commits

- Make each commit about one related change. Do not manufacture a commit history or split changes just to make the history look busy.
- Write short, concrete messages, such as `Add CSV upload and JSON download` or `Fix quoted commas in CSV rows`.
- Avoid filler descriptions, claims about authorship, and claims about checks that were not run.
- Keep changes on a branch for review. Do not merge or deploy to DCISM unless asked.

## Deployment

Upload the static application files to the subdomain folder using DCISM SFTP. See the README for connection details. Keep credentials out of the repository.
