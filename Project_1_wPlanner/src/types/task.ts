export type RecurrenceType =
  | 'none'
  | 'daily'
  | 'weekly'

export interface Task {
  id: string
  title: string
  description: string
  category: string

  date: string

  startTime: string
  endTime: string

  overrideSleep: boolean

  recurrence: RecurrenceType

  recurrenceEndDate?: string

  recurrenceGroupId?: string
}