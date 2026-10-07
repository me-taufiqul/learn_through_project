import type { Task } from '../types/task'

export function timeToMinutes(time: string) {
  if (time === '24:00') {
    return 24 * 60
  }

  const [hour, minute] =
    time.split(':').map(Number)

  return hour * 60 + minute
}

export function tasksOverlap(
  firstTask: Task,
  secondTask: Task,
) {
  if (
    firstTask.date !== secondTask.date
  ) {
    return false
  }

  const firstStart =
    timeToMinutes(firstTask.startTime)

  const firstEnd =
    timeToMinutes(firstTask.endTime)

  const secondStart =
    timeToMinutes(secondTask.startTime)

  const secondEnd =
    timeToMinutes(secondTask.endTime)

  return (
    firstStart < secondEnd &&
    secondStart < firstEnd
  )
}

export function taskHasConflict(
  task: Task,
  allTasks: Task[],
) {
  return allTasks.some(
    (otherTask) =>
      otherTask.id !== task.id &&
      tasksOverlap(task, otherTask),
  )
}