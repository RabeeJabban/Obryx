const { test } = require('node:test');
const assert = require('node:assert/strict');
const booking = import('../booking.js');
const spec = { kreisId: 'driving', datum: '2026-10-05', von: 540, bis: 600, artName: 'Theorie', providerUid: 'teacher', capacity: 2 };
test('last seat rejects another booking without mutating the previous snapshot', async () => {
  const { claimSeat } = await booking;
  const first = claimSeat(null, spec, 'anna', 'a'), full = claimSeat(first, spec, 'ben', 'b');
  assert.throws(() => claimSeat(full, spec, 'clara', 'c'), { code: 'full' });
  assert.deepEqual(full.seats, { a: 'anna', b: 'ben' }); assert.deepEqual(first.seats, { a: 'anna' });
});
test('one pupil cannot take two places in the same session', async () => {
  const { claimSeat } = await booking;
  assert.throws(() => claimSeat(claimSeat(null, spec, 'anna', 'a'), spec, 'anna', 'b'), { code: 'already-booked' });
});
test('a pupil cancels only their own place, while planners can release the last seat', async () => {
  const { claimSeat, releaseSeat } = await booking;
  const full = claimSeat(claimSeat(null, spec, 'anna', 'a'), spec, 'ben', 'b');
  assert.throws(() => releaseSeat(full, 'b', 'anna', false), { code: 'permission-denied' });
  const remaining = releaseSeat(full, 'a', 'anna', false);
  assert.deepEqual(remaining.seats, { b: 'ben' }); assert.equal(releaseSeat(remaining, 'b', 'teacher', true), null);
});
test('reduced capacity prevents more bookings', async () => {
  const { claimSeat } = await booking;
  assert.throws(() => claimSeat(claimSeat(null, spec, 'anna', 'a'), { ...spec, capacity: 1 }, 'ben', 'b'), { code: 'full' });
});
test('locks permit adjacent appointments and cover partial five-minute intervals', async () => {
  const { lockKeys } = await booking;
  const first = lockKeys('anna', spec.datum, 540, 600), after = lockKeys('anna', spec.datum, 600, 660);
  assert.equal(first.length, 12); assert.equal(first.some(key => after.includes(key)), false);
  assert.equal(lockKeys('anna', spec.datum, 599, 601).length, 2);
  assert.throws(() => lockKeys('anna', spec.datum, 600, 600), { code: 'invalid-time' });
});
test('private calendars block actual participants, not every orbit member', async () => {
  const { bookingBlocked } = await booking;
  const events = [{ ownerId: 'student', teilnehmer: ['student', 'wife'], datum: spec.datum, von: 540, bis: 600 }];
  const occurs = (e, d) => e.datum === d, interval = e => e;
  assert.equal(bookingBlocked(events, spec.datum, 550, 570, ['wife'], '', occurs, interval), true);
  assert.equal(bookingBlocked(events, spec.datum, 550, 570, ['sister'], '', occurs, interval), false);
  assert.equal(bookingBlocked(events, spec.datum, 600, 660, ['student'], '', occurs, interval), false);
});
test('one lesson permits another pupil but blocks another lesson for the teacher', async () => {
  const { bookingBlocked } = await booking;
  const e = { sessionId: 'lesson', providerUid: 'teacher', participantUid: 'anna', teilnehmer: ['teacher', 'anna'], datum: spec.datum, von: 540, bis: 600 };
  const occurs = (e, d) => e.datum === d, interval = e => e;
  assert.equal(bookingBlocked([e], spec.datum, 540, 600, ['teacher', 'ben'], 'lesson', occurs, interval), false);
  assert.equal(bookingBlocked([e], spec.datum, 540, 600, ['teacher', 'anna'], 'lesson', occurs, interval), true);
  assert.equal(bookingBlocked([e], spec.datum, 540, 600, ['teacher', 'ben'], 'other', occurs, interval), true);
});
