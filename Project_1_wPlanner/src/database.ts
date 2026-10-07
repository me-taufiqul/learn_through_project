import Dexie, {
  type EntityTable,
} from 'dexie'

import type {
  Task,
} from './types/task'

const db = new Dexie(
  'WeeklyPlannerDatabase',
) as Dexie & {
  tasks: EntityTable<
    Task,
    'id'
  >
}

db.version(1).stores({
  tasks:
    'id, date, category, recurrence, recurrenceGroupId, isPriority',
})

export default db