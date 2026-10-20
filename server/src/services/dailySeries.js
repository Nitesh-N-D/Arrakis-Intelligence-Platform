export const fillDailySeries = (rows, days = 7, referenceDate = new Date()) => {
  const byDate = new Map((rows || []).map((row) => [row._id, row]));
  const today = new Date(referenceDate);
  today.setUTCHours(0, 0, 0, 0);
  const result = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - offset);
    const key = day.toISOString().slice(0, 10);
    result.push(byDate.get(key) || {
      _id: key, totalMinutes: 0, totalSpice: 0, averageProductivity: 0, sessions: 0, events: 0
    });
  }
  return result;
};
