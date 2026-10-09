# Next plan: lossless same-format save

The approved plan (`~/.claude/plans/valiant-purring-gadget.md`) stands. This file changes the order
and the habits, based on the progress review of commits b06d938..ffc6814.

## Status

**Implementation is not complete.** The 2026-10-09 review (below) has remaining Ledger copy-identity
and hygiene work. Design edits now retain unread shapes and stacking order; opaque-frame rotation
is disabled and moves retain member orientations. Modern comment corrections are being verified.
Fixes after `9f18001` also mean Office batches 3–4 no
longer represent the current writer. The measurements below describe `9f18001`; the final Word
correction there clears all 31 failing SDK comparisons in six malformed-formatting fixtures.
**The plan is not signed off:** Excel and PowerPoint Office acceptance remain pending.

- Quire and whole-package preservation: Office batches 1–2 accepted, including the corrected
  comments and all four namespace follow-up copies.
- Ledger pivots, threads, controls/OLE/VML, slicers/timelines, extensions and query tables: implemented
  and measured; [Excel batch 3](/home/john/Downloads/lossless-check/office-batch-3/CHECKLIST.md) pending.
- Lectern sections/shows, comments, opaque frames, designs, tags/actions/effects and timing: implemented
  and measured; [PowerPoint batch 4](/home/john/Downloads/lossless-check/office-batch-4/CHECKLIST.md) pending.
- Conversion notices, edit/history/draft checks, final corpus runs and current documentation are done.
  Failed and excluded inputs remain explicit; the suite does not claim every arbitrary input is lossless.

**Slide-6 repair: fixed** (`60c26b4`), confirmed in PowerPoint. The last batch-preparation defect,
a new layout reusing its structural shape ID, is fixed in `99c9b3a` before handoff.

## Changed habits
1. **Office is the gate.**
   - Before starting a step that adds a new kind of preserved XML, the patterns it builds on must
     have passed an Office batch.
   - A batch has at most 15 files, in `~/Downloads/lossless-check/office-batch-N/`, with a
     `CHECKLIST.md`: file, feature, what to look for, and a result column (✓ / repair prompt /
     looks wrong).
   - A repair prompt blocks the step that produced the file.
2. **Docs describe the current state.**
   - Each `docs/<app>.md` gets one "What a save keeps, converts and drops" section: one table of
     kept / converted / dropped, with the current numbers, plus one edit-behaviour table per feature.
   - No dated increment sections and no superseded tables. History and run details go in
     `~/corpora/results/<run>/README.md` and in commit bodies.
3. **Commit bodies.** Every commit body says three things:
   - what changed for the user;
   - the measured numbers, from a full run or focused;
   - what is still pending.
4. **AGENTS.md stays short.**
   - Move the six preservation rule paragraphs to a "Preservation" section in docs/suite.md, or a
     new docs/preservation.md that holds the opc.js contracts and the per-app edit matrices.
   - Keep one line in AGENTS.md pointing there.
5. **Full runs before features.** After each app's group of steps, run the full corpus, not only
   focused fixtures. Never let the documented corpus numbers predate the code by more than one step.

## Order
1. **Office batch 1** (now, about 15 files):
   - Quire: one content control with a binding edit, one Word 2010 text effect after a bold edit,
     one SmartArt that was resized, one OLE object that was pasted, one `.docm`;
   - Lectern: one `.pptm` with video, one deck with comment authors and a handout master;
   - Ledger: one `.xlsm`, one workbook with custom XML and external links.
   Hand it to the user, then continue with steps 2–3 while waiting.
2. **Full reruns on HEAD:**
   - the Word, Excel and PowerPoint corpora: save/reopen, package/SDK, loss audit, text edit with
     undo/redo, draft recovery;
   - `mdroundtrip.mjs` and `mdspec.js`;
   - LibreOffice on the batch-1 files.
   Update the numbers.
3. **Docs cleanup** as in habit 2, and the AGENTS.md move from habit 4.
4. **Fix what batch 1 finds.**
   - Any repair prompt is fixed, and its pattern re-checked across the corpus, before step 5.
5. **Quire remainder:**
   - merge drawing-property edits instead of converting the whole frame;
   - alternatives around table rows and cells;
   - the watermark path.
   Then a full rerun, then **Office batch 2** (Quire).
6. **Ledger**, in order of harm:
   - (a) Pivot tables. Write the rules table in docs first: shared caches, each source kind (range,
     table, name, external, consolidation), source row/column changes, edits inside the output, and
     sheet or source deletion. Then the code, with undo through `snapSheet`.
   - (b) Threaded comments: all threads, mentions, person ids.
   - (c) Controls, embedded objects and non-comment VML shapes.
   - (d) Slicers and timelines.
   - (e) Data-bar extensions and unknown `extLst` entries.
   - (f) Query tables.
   Then a full rerun, then **Office batch 3** (Excel).
7. **Lectern:**
   - (a) sections and custom shows;
   - (b) comments;
   - (c) SmartArt, OLE, ink, 3-D and new-chart frames;
   - (d) unused masters and design-edit invalidation;
   - (e) tags, actions, and effects on non-media shapes.
   Then a full rerun, then **Office batch 4** (PowerPoint).
8. **Finish:**
   - every remaining conversion path records its loss in the Compatibility Checker;
   - final full runs for all three apps;
   - the docs give the final numbers and the documented exceptions.

## Done means (per step)
- Unit tests pass (`node --test tools/ooxml/*.test.mjs tools/quire/test/*.test.js
  tools/ledger/test/*.test.js`).
- All four pages load with no console errors.
- No new validator diagnostics against the originals.
- Unchanged opaque parts are byte-identical.
- Edit, undo/redo and draft scenarios pass.
- LibreOffice opens the samples.
- The docs and the commit body carry the numbers.
- Office acceptance is either checked or listed as pending in the next batch, never assumed.

## Budget
About 16–19 steps, roughly 20–30 agent hours, plus the user's Office rounds. If a step runs past
twice its estimate, stop and report rather than widen the scope.

## Office-convention bugs (found 2026-10-08, do before step 5)
Found with `python3 tools/ooxml/conventions.py ORIGINALS SAVED`, which lists markup our saves add that
Office-authored corpus files never contain. Rerun it on every full corpus run; each confirmed finding
becomes a `package.py` rule with a test, per AGENTS.md "Office acceptance".

1. **WordArt fill outside `w14:textFill`** (Quire, 21 files).
   - Fixed in `27e9f73`: `docx-write.js` wraps the fill.
   - The package checker now rejects fills outside `textFill`/`textOutline`, with a regression test.
2. **Inserted-then-deleted text nested `<w:del><w:ins>`** (Quire, 9 files).
   - Fixed in `27e9f73`: `wrapRunGroup` writes `<w:ins><w:del>`, as Word does.
   - The package checker rejects reversed nesting, with a regression test and an authored batch-1 save/reopen sample.
3. **Strict files written with Transitional vocabulary** (67 Word files; also some Excel and PowerPoint).
   - The cause: `K.strictXML` swaps only namespace URIs, so `w:ind w:right`, tab `left`, `0`/`1`
     on/off values and the like are left in Strict files.
   - Implemented:
     - save a file opened as Strict in Transitional;
     - convert its preserved fragments Strict→Transitional (namespaces; DrawingML `N%` → thousandths;
       Transitional also accepts Strict's `start`/`end` and `true`/`false`);
     - record a "saved in the standard format" entry in the Compatibility Checker.
   - Includes conditional table flags, tab measures and relative drawing percentages. The 175 Strict
     inputs save/reopen; 700 saved/draft states introduce no package/SDK diagnostics. The SDK does open
     these Strict originals; malformed/unopenable originals elsewhere remain failures, not passes.
     **User approved Transitional output with a notice on 2026-10-08.** The conversion samples
     passed Office batch 2.
4. **Fragments repeat root declarations on inner elements.**
   - Each kept fragment re-declares the namespaces and `mc:Ignorable`: Excel `calcPr`, `phoneticPr`
     and other sheet children in 364 of 935 saves; Word footnote separators in 650 of 2,880.
   - This is allowed by the markup-compatibility rules, but Office never writes it.
   - Proposed fix: when emitting a fragment into a part, drop declarations identical to the
     destination root's; add the missing ones, and the union of `mc:Ignorable`, to the root instead.
   - Batch 1 accepted repeated declarations and inner `mc:Ignorable` in Word. Its Excel sample
     repeated declarations only; the Excel `calcPr` form was not checked in that batch.
   - Implemented in shared `opc.js`: rewritten parts hoist namespaces and `mc:Ignorable` to the
     root, retaining real local prefix rebindings. Opaque parts retain their original bytes.
     On the same 400-document subset, main XML falls from 22,183,474 to 4,770,570 bytes, compared
     with 5,373,347 original bytes. All 1,845 changed XML parts preserve expanded XML content;
     package checks add no issues and conventions report no inner `mc:Ignorable` signatures.
     All four batch-2 follow-up samples pass Office: the original Excel form and compact Excel,
     Word and PowerPoint saves.
5. **Low risk; make them match Office when touching that code:**
   - Lectern `defaultTextStyle` writes `a:ea`/`a:cs typeface="+mn-lt"`; Office writes `+mn-ea`/`+mn-cs`.
   - `p:penClr` uses `a:srgbClr` where Office uses `a:prstClr`.
   - Quire WordArt writes `a:normAutofit` (no Office example to compare).
   - Hyperlinks containing `w:del`/`w:ins` (no Office example either way): include one in an Office
     batch.

## Current execution

- Final suite: **14,091 driver attempts** and **30,919 package/SDK rows** across the pinned sets.
  With the final focused Word correction, 29,341 validation rows pass, 670 fail and 908 are excluded.
  There are no added package issues or SDK diagnostics. The original reports retain the 31 Word
  regression states; their corrections are recorded separately, alongside failed and excluded inputs.
- Quire: save/draft each 2,880 OK and 22 failed; text 2,281 OK, 22 failed, 599 excluded. Its 19,028
  validation rows have 18,056 OK, 373 failed and 599 excluded. Feature counts remain at the documented
  final levels; the independent inventory retains 776,207/776,869 counted words. The formatting repair
  passes 36 regression states and the 74-file affected subset without new diagnostics. Stale bound
  values, orphan stories and unsupported/malformed content remain explicit exceptions.
- Ledger: save/draft each 935 OK, 11 failed, 5 excluded; text 933 OK, 11 failed, 7 excluded. Its 6,589
  validation rows have 6,371 OK, 201 failed and 17 excluded. Independent comparison covers 889 saves
  and 887 edits; one timed-out large workbook reuses its earlier passing checks after all 18 current
  output parts match byte for byte. Existing cell/formula exceptions remain documented.
- Lectern: save/draft each 837 OK, 6 failed, 1 excluded; text 548 OK, 6 failed, 290 excluded. Its 5,302
  validation rows have 4,914 OK, 96 failed and 292 excluded. All 827 readable unchanged pairs retain
  every inventoried feature and all 58,022 counted words. The script converts 67 selected SmartArt
  previews with notices; other inventoried features remain.
- Each app's full run has a convention scan. Word: 192 signatures, no additions over its preceding
  run. Excel: 185; three additional signatures come from a recovered fuzzer omitted by the old scan,
  whose corrected/current parts differ only by the save timestamp. PowerPoint: 169, including retained
  and Strict-converted vocabulary, scoped MC, frame transforms and content-type forms. Reports
  distinguish convention differences from confirmed defects.
- All 124 unit tests pass; all four pages load with no console errors (known font requests remain).
  Markdown stays at 652/652 CommonMark, 22/22 GFM and 24/24 exact saves with confined edits.
  The three-app Compatibility Checker has 21 passing save/cancel/draft/acknowledgement checks;
  five public conversion cases produce nine passing SDK/LibreOffice states.
- Shared namespace cleanup now assembles XML slices once. All 98,574 old/new patch comparisons are
  byte-identical; time within patch calls fell from 52,301.5 to 243.2 ms on the large-deck comparison.
  This is a patch benchmark, not total save time. No passing corpus files were rerun for that optimization.
- Every final file in Office batches 3 and 4 passes package/SDK and LibreOffice with expected counts.
  Previous-writer differences are reviewed. The batches contain 15 files each; Office acceptance is
  pending, not inferred from those checks. Full-corpus LibreOffice rendering has not been completed.

Current reports: `~/corpora/results/final-suite-2026-10-09/` and
`~/corpora/results/lectern-group-2026-10-09/`; the final Word correction and combined report are in
`~/corpora/results/quire-property-repair-2026-10-09/`. Exact inputs, frozen writer revisions, initial failures,
correction overlays, hashes and older progress notes stay with those reports. The next action is to
record the two Office results, fix any reported repair and only then sign off the plan.

## Review of 6d24c43..275406e (2026-10-08)
Followed well: bounded Office batches with previous-writer comparison, checker rules for the WordArt
and nesting fixes, Strict→Transitional (verified: no Strict namespaces left except a custom-XML
schema reference, which is data), consolidated docs, commit bodies with numbers, paragraph-order fix
(the frozen run's 143 files with `w:pPr` after a run in comments/headers/footnotes: 25 of 25 correct
at HEAD). Corrections:

1. **Excel inner `mc:Ignorable` is not Office-checked.**
   - "Office batch 1 accepted both forms" holds for Word: the batch files carry `mc:Ignorable` on
     `w:rPr`, `w:pPr` and `w:footnote`.
   - It does not hold for Excel: `12-sheet-namespaces.xlsx` repeats only `xmlns` declarations.
   - `calcPr mc:Ignorable="…"` is still written at HEAD, in 364 of 935 saved workbooks.
   - Put one such workbook in Office batch 2, or remove the pattern (item 2).
2. **Hoist fragment declarations; the trade-off is wrong.**
   - Every retained `rPr`/`pPr` now re-declares about 30 namespaces plus `mc:Ignorable`: 2,009 and
     1,998 of 2,873 saves.
   - On 400 documents, `document.xml` grows from 5.3 MB (originals) to 21.9 MB (saves); zipped
     11.1 → 9.9 MB, compared with 8.7 MB before property preservation. Word parses 4× the XML.
   - Fix in `common/opc.js` emit:
     - drop a fragment declaration identical to one in scope at its destination;
     - declare missing prefixes, and the union of `mc:Ignorable`, on the part root;
     - keep a local declaration only for a real prefix conflict.
   - Gate: byte size back near the originals, `conventions.py` shows no inner `mc:Ignorable`, no new
     package/SDK diagnostics, and one Word and one Excel sample in Office batch 2.
3. **(Resolved: batch 2 was finished and accepted.) The Office gate is being skipped.** The working tree has uncommitted Ledger pivot code
   (`pivots.js`, changes to `xlsx-read/write`, `ops.js`, `preserve.js`) while Office batch 2 is
   pending and this plan says no Ledger feature code before it. Finish batch 2 (with items 1–2) first,
   or record why the gate was changed.
4. **Run `tools/ooxml/conventions.py` on every full run** and list its new signatures in the commit
   body; the property-preservation step would have shown item 2.
5. **(Resolved.) Minor:** `public/index.html` still says "placeholder address" above the Feedback link, which now
   has the real address.

## Review of 3b92fe9..9f18001 (2026-10-09)
The approach is right; the weak spot is identity allocation (local max+1 or `_Copy<hex>` instead of
what Office writes and what the whole file uses). Five items are fixed in `1a33733`, with tests and
the package rules `duplicate-vml-id`, `shared-vml-preview`, `duplicate-vml-block` and
`animation-part-target`. They cover copied OLE previews, SmartArt part animations, reused query
column IDs, note VML blocks, and slicer copy names and workbook names.

**First:** batches 3 and 4 were built before `1a33733`. Rebuild them from the current writer and
diff against the old batch files before the user opens them.

Also fixed afterwards:
- namespace processing cost: a fast path in `K.hoistNamespaces` with identical output on 11,595
  corpus parts. On a 30 MB sheet, namespace processing alone went from 2,956 ms to 3 ms; total save
  time was not measured.
- whole-column and whole-row pivot sources: they keep their extent, and field bookkeeping still runs;
- pivot outputs reshaped by inserted or deleted lines: refresh plus a notice;
- sheets needing more than one VML id block: every needed block is reserved, and `duplicate-vml-id`
  is workbook-wide for spreadsheets.

Remaining, in order:
1. **Lectern rotation (fixed).** Rotation and flip commands, handles and the size dialog disable
   unsupported transforms on retained frames and groups containing them. Moving/resizing a
   multi-member wrapper keeps each original rotation and flip. Three focused scenarios and their
   nine saved/undo/redo states pass package/SDK comparison; the edit matrix describes the limitation.
2. **Lectern designs (fixed).** Retained master/layout shapes are tied to their displayed models.
   Edits replace only those shapes, retaining unread siblings and their stacking positions. Sixteen
   scenarios / 50 saved states pass package/SDK comparison, including interleaved unread frames,
   deletion, explicit reorder, addition, style edits, undo/redo and drafts.
3. **Lectern comments.** A comment re-anchored to its slide gets `<pc:sldMk>` without `cId`
   (`comments.js:128`). Reuse the slide's creation ID, as Office does; the test must require it.
4. **Ledger copies, smaller.**
   - Controls/OLE on a copied sheet still take shape IDs from `X.begin`'s drawing counter, not the
     sheet's new VML block (`objects.js:96`).
   - Copied query tables and objects still get `_Copy<hex>` names (`tables.js:166`, `objects.js:155`);
     use Excel's naming.
5. **Hygiene.**
   - Fresh-uid remapping is written four times (tables, extensions, slicers, threads); use `K.duplicate`.
   - `'xl/worksheets/sheet'+(i+1)` is hardcoded at `pivots.js:279` and `threads.js:134`.
   - Pivot source-kind tests read fixtures from a dated results folder, so they skip on a fresh machine.
   - docs/ledger.md quotes stale per-feature test counts.
   - `namespace-size.mjs` fails on the deliberate local `Ignorable` kept beside `PreserveAttributes`.
   - The former `designs.mjs` `style` failure is fixed: paragraph preservation now writes an edited
     default run property while retaining its unknown siblings.
   - Converting one SmartArt adds five generic "no remaining reference" notices beside the specific one.


Leave SmartArt to the parallel SmartArt work: it replaces the "edited preview → plain group" path
in `frames.js` and the diagram parts' read/write. Don't change those.
