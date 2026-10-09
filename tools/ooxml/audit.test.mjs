import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('cell audit distinguishes a timeout during style access from an unreadable style', () => {
  const script = fileURLToPath(new URL('../ledger/test/loss-audit.py', import.meta.url));
  // Raise the real alarm in the reader's style accessor, without waiting for the
  // large-workbook timeout or depending on an openpyxl installation.
  const probe = `
import contextlib, io, json, runpy, signal, sys, tempfile, zipfile
from pathlib import Path
from types import SimpleNamespace
script, mode = sys.argv[1:]
class Cell:
    value, coordinate = 'text', 'A1'
    @property
    def font(self):
        if mode == 'timeout': signal.raise_signal(signal.SIGALRM)
        raise ValueError('Invalid style reference')
with tempfile.TemporaryDirectory() as tmp:
    root = Path(tmp)
    for folder in ('originals', 'saved'):
        (root / folder).mkdir()
        with zipfile.ZipFile(root / folder / 'sample.xlsx', 'w') as z:
            z.writestr('[Content_Types].xml', '<Types/>')
    def load(path, **kwargs):
        sheets = [] if Path(path).parent.name == 'originals' else [SimpleNamespace(title='Sheet1', _cells={(1, 1): Cell()})]
        return SimpleNamespace(worksheets=sheets)
    sys.modules['openpyxl'] = SimpleNamespace(load_workbook=load)
    output = root / 'report.json'
    sys.argv = [script, str(root / 'originals'), str(root / 'saved'), str(output)]
    with contextlib.redirect_stdout(io.StringIO()):
        try: runpy.run_path(script, run_name='__main__')
        except SystemExit as error:
            assert error.code == 1
    print(output.read_text())
`;
  for (const mode of ['timeout', 'invalid']) {
    const result = spawnSync('python3', ['-c', probe, script, mode], {
      encoding: 'utf8', timeout: 10000,
      env: { ...process.env, CELLS: '1', TIMEOUT: '40', MAXMB: '1e9', SCENARIO: '' }
    });
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.accounting.attempted, 1);
    assert.equal(report.accounting.failed, 1);
    assert.equal(report.cells.books, 0);
    assert.equal(report.cells.unreadable, mode === 'timeout' ? 0 : 1);
    assert.deepEqual(report.cells.timeouts || [], mode === 'timeout' ? ['sample'] : []);
    assert.equal(report.accounting.errors[0].error,
      mode === 'timeout' ? 'Cell comparison timeout' : 'Cannot compare cell style at A1');
  }
});
