import { asString } from 'date-format'

export function date2str(date: Date) {
  return asString('YYYY-MM-DD HH:mm:ss.SSS', date)
}

export function durationInMillis(start: number, end: number) {
  return end - start
}

export function durationInMicros(start: number, end: number) {
  return (end - start) * 1000
}
