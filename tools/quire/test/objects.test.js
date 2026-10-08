const test = require('node:test');
const assert = require('node:assert/strict');
globalThis.window = globalThis;
require('../../../public/common/core.js');
require('../../../public/common/xml.js');
require('../../../public/common/opc.js');
require('../../../public/quire/js/dmodel.js');
require('../../../public/quire/js/preserve.js');
const { D, preserve: P, opc: K } = L;
const part = 'word/document.xml';
const xml = '<w:drawing xmlns:w="' + K.NS.w + '" xmlns:wp="' + K.KNOWN_NS.wp + '" xmlns:a="' + K.NS.a + '"><wp:inline><wp:extent cx="1270000" cy="635000"/><wp:docPr id="42" name="Diagram"/><a:graphic><a:graphicData/></a:graphic></wp:inline></w:drawing>';
function fixture() {
  const doc = D.newDoc(); doc.keep = {}; D.doc = doc;
  const object = P.keepObject({ t: 'group', w: 100, h: 50, kids: [{ t: 'shape', x: 10, y: 5, w: 20, h: 10, fill: { t: 'solid', c: '#123456' } }] }, K.parse(xml), { part }, doc, 'SmartArt');
  doc.main.blocks = [D.para([object])]; P.finishObjects(doc);
  return { doc, object };
}
function write(doc, object, name = 'opaque') {
  const writer = new K.Writer(null, { doc }), ctx = { writer, part, objects: P.prepareObjects(doc, writer) };
  return P.objectXML(object, name, ctx);
}

test('opaque group resize supports both editor scaling and an extent edit without replacing its payload', () => {
  for (const scaleChildren of [false, true]) {
    const { doc, object } = fixture(); object.w = 200;
    if (scaleChildren) { object.kids[0].x *= 2; object.kids[0].w *= 2; }
    assert.match(write(doc, object), /cx="2540000"/);
    assert.equal(doc.losses?.length || 0, 0);
    object.kids[0].fill.c = '#ABCDEF';
    assert.equal(write(doc, object), null); assert.equal(doc.losses[0].action, 'conversion');
  }
});

test('several items from one choice emit once, and deleting one never resurrects its old content', () => {
  const doc = D.newDoc(); doc.keep = {};
  const tree = K.parse(`<w:p xmlns:w="${K.NS.w}" xmlns:mc="${K.NS.mc}"><mc:AlternateContent><mc:Choice Requires="w"><w:r><w:t>A</w:t></w:r><w:r><w:t>B</w:t></w:r></mc:Choice><mc:Fallback/></mc:AlternateContent></w:p>`);
  K.captureAC(tree);
  const p = D.para(), choice = tree.children[0].children[0], ac = P.readAlternates(tree, p.runs, { part }, doc, 'inline');
  for (const [i, el] of [...choice.children].entries()) { p.runs.push(D.text(i ? 'B' : 'A')); ac.add(el, i); }
  ac.finish(); doc.main.blocks = [p]; P.finishObjects(doc);
  const writer = new K.Writer(null, { doc }), ctx = { writer, part, objects: P.prepareObjects(doc, writer) };
  assert.match(P.objectXML(p.runs[0], 'ac', ctx), /AlternateContent/);
  assert.equal(P.objectXML(p.runs[1], 'ac', ctx), '');
  p.runs.pop(); assert.equal(write(doc, p.runs[0], 'ac'), null);
  assert.ok(doc.losses.some(e => e.action === 'conversion'));
});

test('copying VML remaps shape, OLE target and shape-type references together', () => {
  const source = K.fragment(K.parse(`<w:object xmlns:w="${K.NS.w}" xmlns:v="${K.KNOWN_NS.v}" xmlns:o="${K.KNOWN_NS.o}"><v:shapetype id="_x0000_t75"/><v:shape id="_x0000_i1025" type="#_x0000_t75" style="width:100pt;height:50pt"/><o:OLEObject ShapeID="_x0000_i1025"/><w:control w:name="TextBox1" w:shapeid="_x0000_i1025"/></w:object>`), { part });
  const copied = K.duplicate(source), writer = new K.Writer(null);
  const a = writer.emit(source, part), b = writer.emit(copied, part);
  const shape = x => /<v:shape id="([^"]+)"/.exec(x)[1];
  assert.notEqual(shape(a), shape(b)); assert.ok(b.includes(`ShapeID="${shape(b)}"`));
  const type = /<v:shapetype id="([^"]+)"/.exec(b)[1];
  assert.ok(b.includes(`type="#${type}"`)); assert.notEqual(type, '_x0000_t75');
  assert.match(a, /w:name="TextBox1"/); assert.match(b, /w:name="TextBox2"/);
});
