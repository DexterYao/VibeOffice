# Next plan: lossless same-format save

The approved plan (`~/.claude/plans/valiant-purring-gadget.md`) stands. This file changes the order
and the habits, based on the progress review of commits b06d938..ffc6814.

## Status
**Done:**
- measurement tools;
- the shared preservation core;
- Lectern media;
- whole-file parts in all three apps;
- Quire content controls, text properties, and embedded objects.

**Not done:**
- Ledger and Lectern object-level features.

**Slide-6 repair: fixed** (60c26b4, confirmed in PowerPoint). Read "Office acceptance" in AGENTS.md
first: two bugs in the shared save code passed every automated check (master and layout sharing an
ID; partial preset adjustment lists).

**The preservation batches are not yet Office-accepted.** The slide-6 diagnostic copies passed
PowerPoint, but the larger preservation sample collection still needs review. Office batch 1 now
reduces that collection to 15 files and a checklist.

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
   - Proposed fix:
     - save a file opened as Strict in Transitional;
     - convert its preserved fragments Strict→Transitional (namespaces; DrawingML `N%` → thousandths;
       Transitional also accepts Strict's `start`/`end` and `true`/`false`);
     - record a "saved in the standard format" entry in the Compatibility Checker.
   - True Strict output would need a full vocabulary converter, with no validator to check it (the SDK
     cannot open Strict). **User approved Transitional output with a notice on 2026-10-08; implementation pending.**
4. **Fragments repeat root declarations on inner elements.**
   - Each kept fragment re-declares the namespaces and `mc:Ignorable`: Excel `calcPr`, `phoneticPr`
     and other sheet children in 364 of 935 saves; Word footnote separators in 650 of 2,880.
   - This is allowed by the markup-compatibility rules, but Office never writes it.
   - Proposed fix: when emitting a fragment into a part, drop declarations identical to the
     destination root's; add the missing ones, and the union of `mc:Ignorable`, to the root instead.
   - Office check first: one workbook and one document of each form, in the next Office batch.
5. **Low risk; make them match Office when touching that code:**
   - Lectern `defaultTextStyle` writes `a:ea`/`a:cs typeface="+mn-lt"`; Office writes `+mn-ea`/`+mn-cs`.
   - `p:penClr` uses `a:srgbClr` where Office uses `a:prstClr`.
   - Quire WordArt writes `a:normAutofit` (no Office example to compare).
   - Hyperlinks containing `w:del`/`w:ins` (no Office example either way): include one in an Office
     batch.

## Current execution

- Office batch 1 is ready: `~/Downloads/lossless-check/office-batch-1/CHECKLIST.md` (15 Office files).
  It covers the requested features, namespace forms, the two corrected Word conventions and a tracked
  hyperlink. The video fixture is saved as PPTM from an authored PPTX; a separate authored PPTM tests VBA.
- All 15 batch files save/reopen, introduce no package/SDK diagnostics and open in LibreOffice with
  unchanged page/slide counts. The comparison against writer `ffc6814` has only explained differences.
  57 unit tests pass and all four pages load. Office results remain pending; this is not an acceptance claim.
- Reports and exact inputs: `~/corpora/results/next-plan-head-2026-10-08/`.
- Next: full runs and documentation cleanup while Office batch 1 is reviewed. Do not start step 5
  until the batch result permits it.
