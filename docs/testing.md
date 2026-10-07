# Testing

## Serving

    python3 tools/serve.py          # http://127.0.0.1:8760/, no caching

Every response carries `Cache-Control: no-store`, so edited HTML and scripts are always re-fetched. Serve rather than open from disk: a `file://` page cannot fetch the proofing dictionaries, and password-protected files need WebCrypto, which wants https or localhost.

## Screenshots and console errors: tools/shot.mjs

Drives a page in the Chromium listening on CDP 127.0.0.1:9222 (start one with `chromium --remote-debugging-port=9222 --remote-allow-origins=*`, or `--headless=new` on a machine without a display). It starts `tools/serve.py` if nothing listens on :8760.

    node tools/shot.mjs ledger/ '[{"wait":1000,"shot":"ledger.png"}]'
    node tools/shot.mjs quire/ steps.json --w 1440 --h 900 --out /tmp/shots

Each step is `{ "js": "...", "wait": ms, "shot": "name.png|jpg" }`; `js` is an async function body run in the page, and its return value is printed. The app's namespace is `window.L`. At the end the tool lists console errors, exceptions and every request that left 127.0.0.1 (today: the Google Fonts requests). It opens and closes its own tab; never close the browser's other tabs.

The install screenshots in the manifest (`public/<app>/preview.jpg`) are 1280×720:

    node tools/shot.mjs quire/ '[{"wait":1500,"shot":"preview.jpg"}]' --h 720 --out public/quire

The PWA icons are drawn from `public/icons/icon.svg` and `icon-maskable.svg` (see docs/suite.md).

## The Start Center and app launch

The browser profile keeps IndexedDB between runs of `shot.mjs`, so a test can hand a file to an app and then look at the Start Center:

    node tools/shot.mjs quire/ '[{"js":"const b = await L.docx.write(L.D.doc, { stats: L.app.docStats() }); setTimeout(() => VO.handoff(new File([b], \"t.docx\")), 50)"},{"wait":3500,"js":"return document.title"}]'
    node tools/shot.mjs "" '[{"wait":800,"shot":"start.png"}]'

Check after a change to `suite.js` or to an app's start, open or save code: `<app>/?new` starts blank; a handed-over file opens in place of the blank document (one window); the file and a thumbnail appear under Recent Files; clicking it reopens it. Clear the list with `await VO.recent.clear()`.

Templates: `node tools/templates.mjs` opens every template (`<app>/?template=<id>`) and fails on a script error or a missing preview; look at the new previews in the Create File view.

## Quire: tools/quire/test/

| | |
|---|---|
| `node tools/quire/test/mdspec.js DIR` | The Markdown reader against the CommonMark spec examples and the GFM extension examples (in Node). DIR holds `spec.json` (https://spec.commonmark.org/0.31.2/spec.json), cmark-gfm's `test/spec.txt` saved as `gfm-spec.txt`, and the WHATWG `entities.json` |
| `node tools/quire/test/mdroundtrip.mjs DIR` | Markdown round trips in Quire (through `shot.mjs`): every `.md` in DIR saved unchanged (must be byte for byte the same), with one paragraph edited (only that block may change), and fully rewritten (same HTML). `--spec spec.json` runs the rewrite check on the spec examples |
| `python3 tools/quire/test/loss-audit.py originals/ saved/ out.json` | What a save loses: each original `.docx` against Quire's saved copy, feature by feature and word by word (standard library only); results in docs/quire.md |

Run both after a change to `markdown.js` or `mdio.js`; the numbers are in docs/quire.md.

## Ledger: tools/ledger/test/

The engine and the file readers and writers load in Node through `load.js` (the shared ones from `public/common/`; a missing file is an error), so most checks run without a browser.

| | |
|---|---|
| `node --test tools/ledger/test/*.test.js` | Unit tests: calculation, formula parser, number formats, SHA |
| `roundtrip.js file.xlsx [outdir]` | read → write → read, compare every cell's value, formula and style and the sheet settings |
| `xmlss-rt.js file.xlsx [outdir]` | the same through XML Spreadsheet 2003 |
| `recalc1.js file.xlsx` | recalculate every formula and compare with the value stored in the file |
| `csvtest.js file.csv` | parse, compare with Python's `csv` module (`csvref.py`), write back, re-read |
| `lo-compare.js ourDir loDir` | compare our saved files with LibreOffice's re-saved copies cell by cell |
| `loss-audit.py originals/ saved/ out.json` | what a save loses: features per workbook, and every cell's value, formula and style read with openpyxl from both files (Python) |
| `pool.js script.js dir out.jsonl`, `recalc-all.js`, `summ.js` | run a per-file script over a corpus with a process pool, summarise the results |
| `ui/*.js` | Playwright checks in Chromium against http://127.0.0.1:8760/ledger/: `smoke`, `flows` (44 end-to-end flows), `allcmds` (every menu and toolbar command), `password`, `perf`, `shots`. Need Playwright (`npm install --no-save playwright`) |

## Lectern: tools/lectern/test/

`corpus.js` opens real decks in Chromium (open, render every slide, save, reopen, compare), `summarize.js` sums up its results, `ui-features.js` drives the password dialog, Tools ▸ Options ▸ Security and the chart dialog, `chartedit.js` writes every chart for validation, `decrypt.py` checks encrypted saves independently, `loss-audit.py` counts what a save loses (features and words, original against saved copy; standard-library Python), `viscompare.py` / `triptych.py` / `stack.py` compare renderings. They need Playwright; how to run them is in docs/lectern.md.

## Corpora

The compatibility numbers in each app's doc come from public test corpora (LibreOffice, Apache POI, Open XML SDK, XlsxWriter, ClosedXML and others; see the app docs for the list). They are not checked in; download them outside the repo and point the per-file scripts at the folder.

## Lossless same-format save: reproducible baseline

`sh tools/corpora.sh ~/corpora` fetches the pinned LibreOffice, Apache POI and Open XML SDK revisions
listed in `tools/ooxml/corpora.py`. It resumes interrupted fetches, refuses dirty or unrelated checkouts,
and never deletes an existing corpus. `manifest.json` records source, commit, original path, size and
SHA-256. `word/`, `excel/` and `powerpoint/` contain collision-resistant symlinks. Fixtures stay outside
the repository. A source name after the directory selects just that source.

The corpus drivers record every file and scenario as `ok`, `failed` or `excluded`, with the input hash
and an error/reason. Here, `ok` means the requested operation and reread completed; it does **not** mean
the file was lossless. Independent comparisons and Office acceptance are separate checks.

```sh
node tools/quire/test/corpus.mjs ~/corpora/word /tmp/quire.jsonl --save /tmp/lossless/quire
node tools/ledger/test/corpus.js ~/corpora/excel /tmp/ledger.jsonl --save /tmp/lossless/ledger
node tools/lectern/test/corpus.js ~/corpora/powerpoint /tmp/lectern.jsonl --lossless --save /tmp/lossless/lectern
```

Default scenarios are `save` and `repeat` (save, reopen, save again). `--edit` selects separate text,
formatting, geometry, duplicate and delete-object scenarios, plus row/column/sheet operations in Ledger
or slide insertion/deletion in Lectern. Each successful mutation also saves its undo and redo states.
`--scenarios text` runs just text editing; `--scenarios draft` in the browser drivers exercises the app's
actual snapshot and recovery hooks. For Ledger drafts, use `node tools/ledger/test/browser-corpus.mjs`
with the same arguments; the Node engine driver rejects that scenario. `--limit N` limits files; `--resume` skips recorded input hashes and
scenarios. A single Office file or a file list can replace the directory. Saved artifacts go into
`save/`, `repeat/`, `repeat-second/`, `text/`, `text-undo/`, etc. Files retain their source extensions so
variant errors remain observable. The browser drivers use the existing CDP browser and close only their
own tabs. Ledger uses isolated Node workers with a per-file timeout. The older Lectern rendering driver
without these switches remains available and still requires Playwright.

Quire history regressions run with `node --test tools/quire/test/history.test.js`. The real-file check
`node tools/quire/test/history.mjs ~/corpora/word/libreoffice__9b899b6707be__chart-size.docx`
checks original chart bytes after editing, undo, redo, copying and whole-document snapshot restore.

`tools/ooxml/check.mjs FILE...` uses an independent strict Python XML/ZIP reader to check content types,
relationship targets and relationship attributes, scoped drawing/slide/timing IDs, connector and timing
references, bookmark/permission endpoints, and pivot cache references. AlternateContent branches are
checked without falsely counting mutually exclusive IDs as duplicates. Output is JSONL; a failure exits
nonzero. `node --test tools/ooxml/*.test.mjs` exercises malformed packages, cycles, shared dependencies,
alternate branches, target swaps and ordered text.

`tools/ooxml/compare.mjs ORIGINAL SAVED [--policy policy.json]` defaults to exact part-byte preservation.
A policy can designate individual parts as `merged` or `regenerated`, map their target names, allow
specific ElementTree paths/attributes to change, and specify removed parts and expected slide count.
Merged XML compares expanded namespace names and QName-valued compatibility attributes. Regenerated
content compares ordered text, run/paragraph properties, cells, drawing properties and feature counts;
adjacent runs with identical properties may be split. Relationships compare their resolved targets,
including the case where unchanged XML's rIds were redirected. This is a deliberately conservative
comparison, not a complete Word layout or Excel calculation oracle. The separate loss audits retain
their historical feature inventories; their new `accounting` field exposes missing saved files and
failed comparisons rather than silently excluding them.

Build the SDK validator and install the independent workbook reader in a test environment:

```sh
dotnet build tools/ooxml/oxval -c Release
python3 -m venv /tmp/vo-ooxml-venv
/tmp/vo-ooxml-venv/bin/python -m pip install -r tools/ooxml/requirements.txt
dotnet tools/ooxml/oxval/bin/Release/net8.0/oxval.dll --baseline original.docm saved.docm
```

The validator is pinned to SDK 3.1.1, targets Office 2019, handles all document/macro/template/slideshow
extensions and reports uncapped diagnostics by part, XPath and diagnostic ID. `--baseline` reports new
diagnostic identities, not merely a change in count. `--stdin-pairs` accepts JSON lines containing
`original` and `saved` paths for a warm batch process.

`python3 tools/ooxml/validate.py RESULTS.jsonl ORIGINALS SAVED_ROOT OUT.jsonl --sdk PATH_TO_DLL`
combines package checks and SDK comparison, accounting for unsuccessful driver attempts as well.
`--dotnet PATH` selects the SDK runtime. `--lo PDF_DIRECTORY` additionally converts original and saved
files using LibreOffice with its own temporary profile, checks conversion success and extracts page
counts with `pdfinfo`. Unedited saves must keep the page count; edit scenarios can record
`expectedPages`. LibreOffice and the validator cannot certify acceptance by Office itself.

`python3 tools/ooxml/samples.py ~/corpora /tmp/lossless ~/Downloads/lossless-check/baseline`
selects small independently authored files for each carried-feature test, copies original/saved/edited
variants where available, and writes a manifest. It refuses to replace differing handoff files.
Use a new destination for each implementation stage. Record actual Word/Excel/PowerPoint repair
results; an unperformed Office check remains pending.

`node tools/lectern/test/timing-repair.mjs OUTDIR --sdk PATH_TO_DLL` reproduces the six slide-6
diagnostic copies from the current sample. `--source SAVED_SAMPLE.pptx` instead uses the exact bytes
of a reported failure; `--dotnet PATH` selects the runtime. The output directory must be empty.
The variants isolate removal of slide-6 timing, its build list, its teeter effect, and ordering of
timing IDs; the LibreOffice resave is a separate control. The script asserts build-pair identity and
text targets, validates each package, and writes hashes and a pending PowerPoint result per copy.
Only slide6.xml changes in the four isolated variants. PowerPoint results are a manual gate:
schema validity and LibreOffice opening do not prove that the repair problem has been fixed.
