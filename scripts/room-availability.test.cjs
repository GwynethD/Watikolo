const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadUtility(name) {
  const source = fs.readFileSync(path.join(__dirname, '../src/utils', `${name}.ts`), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const result = { exports: {} };
  new Function('require', 'module', 'exports', compiled)((id) => loadUtility(id.replace('./', '')), result, result.exports);
  return result.exports;
}
const { unavailableRooms } = loadUtility('roomAvailability');
const names = ['Luxe', 'Grand Room', 'Family'];
const booking = { date: '2026-10-10', status: 'pending', bookingMode: 'room', packageName: 'Luxe', roomAddOns: ['Luxe', 'Family'], notes: 'Room stay: check-out 2026-10-13 at 12:00 NN.' };

test('multi-room reservation blocks all selected rooms over every occupied night', () => {
  assert.deepEqual([...unavailableRooms([booking], names, '2026-10-11', '2026-10-12')], ['Luxe', 'Family']);
  assert.deepEqual([...unavailableRooms([booking], names, '2026-10-09', '2026-10-11')], ['Luxe', 'Family']);
});
test('checkout and check-in boundaries allow back-to-back stays', () => {
  assert.equal(unavailableRooms([booking], names, '2026-10-13', '2026-10-14').size, 0);
  assert.equal(unavailableRooms([booking], names, '2026-10-09', '2026-10-10').size, 0);
});
test('cancelled/rejected bookings release rooms; approved bookings keep them occupied', () => {
  for (const status of ['cancelled', 'rejected']) assert.equal(unavailableRooms([{ ...booking, status }], names, '2026-10-10', '2026-10-11').size, 0);
  assert.equal(unavailableRooms([{ ...booking, status: 'approved' }], names, '2026-10-10', '2026-10-11').size, 2);
});
test('whole-property packages block every room, room add-ons block only their rooms', () => {
  assert.equal(unavailableRooms([{ ...booking, bookingMode: 'package', packageName: 'Deluxe', roomAddOns: [] }], names, '2026-10-10', '2026-10-11').size, 3);
  assert.deepEqual([...unavailableRooms([{ ...booking, bookingMode: 'package', packageName: 'Basic', roomAddOns: ['Family'] }], names, '2026-10-10', '2026-10-11')], ['Family']);
});
test('explicit checkout takes priority over legacy notes', () => {
  assert.equal(unavailableRooms([{ ...booking, checkOutDate: '2026-10-15' }], names, '2026-10-14', '2026-10-15').size, 2);
});
