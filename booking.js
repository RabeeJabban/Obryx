// Booking state transitions are independent of Firebase and used by the tests.
export class BookingError extends Error {
  constructor(code) { super(code); this.code = code; }
}

export function sessionKey(circleId, date, start, end, type, provider) {
  return [circleId, date, start, end, type, provider].map(encodeURIComponent).join('~');
}

export function lockKeys(uid, date, start, end) {
  if (!uid || !date || !Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > 1440 || end <= start) {
    throw new BookingError('invalid-time');
  }
  const keys = [];
  for (let minute = Math.floor(start / 5) * 5; minute < end; minute += 5) keys.push(`${uid}_${date}_${minute}`);
  return keys;
}

export function claimSeat(previous, specification, participant, entryId) {
  const session = previous ? structuredClone(previous) : { ...specification, seats: {} };
  if (previous && ['kreisId', 'datum', 'von', 'bis', 'artName', 'providerUid'].some(key => previous[key] !== specification[key])) {
    throw new BookingError('changed-session');
  }
  if (Object.values(session.seats).includes(participant)) throw new BookingError('already-booked');
  // Lowering capacity cannot make an existing booking disappear.
  const capacity = Math.min(Number(session.capacity), Number(specification.capacity));
  if (!(capacity >= 1) || Object.keys(session.seats).length >= capacity) throw new BookingError('full');
  session.capacity = capacity;
  session.seats[entryId] = participant;
  session.aktionId = entryId;
  return session;
}

export function releaseSeat(previous, entryId, actor, canManage) {
  if (!previous || !previous.seats[entryId]) throw new BookingError('missing-booking');
  if (!canManage && previous.seats[entryId] !== actor) throw new BookingError('permission-denied');
  const session = structuredClone(previous);
  delete session.seats[entryId];
  session.aktionId = entryId;
  return Object.keys(session.seats).length ? session : null;
}

export function overlaps(start, end, otherStart, otherEnd) {
  return start < otherEnd && otherStart < end;
}

export function bookingBlocked(events, date, start, end, people, sessionId, occurs, interval) {
  return events.some(event => {
    if (!occurs(event, date)) return false;
    const attendees = event.teilnehmer || [event.ownerId, ...(event.zugewiesen || [])];
    if (!attendees.some(uid => people.includes(uid))) return false;
    // The provider may teach several people in one shared lesson.
    if (sessionId && event.sessionId === sessionId) {
      return people.some(uid => uid !== event.providerUid && uid === event.participantUid);
    }
    const period = interval(event);
    return !!period && overlaps(start, end, period.von, period.bis);
  });
}
