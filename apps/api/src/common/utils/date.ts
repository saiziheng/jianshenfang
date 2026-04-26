import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export const APP_TZ = process.env.APP_TZ ?? 'Asia/Shanghai';

export function asDate(value: string | Date, field = 'date'): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} is invalid`);
  }
  return date;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfToday(): Date {
  return dayjs().tz(APP_TZ).startOf('day').toDate();
}

export function endOfToday(): Date {
  return dayjs().tz(APP_TZ).endOf('day').toDate();
}
