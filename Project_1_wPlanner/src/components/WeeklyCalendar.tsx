import {
  useEffect,
  useState,
} from 'react'

import CalendarHeader
  from './CalendarHeader'

import WeekDaysHeader
  from './WeekDaysHeader'

import TimeGrid
  from './TimeGrid'

import CreateTaskModal, {
  type RecurringEditScope,
} from './CreateTaskModal'

import type {
  Task,
} from '../types/task'

import {
  tasksOverlap,
  taskHasConflict,
} from '../utils/conflicts'

import db
  from '../database'

interface SelectedSlot {
  date: Date
  time: string
  isSleep: boolean
}

const START_DATE =
  new Date(
    2026,
    9,
    1,
  )

const END_DATE =
  new Date(
    2027,
    2,
    31,
  )

function getMonday(
  date: Date,
) {
  const result =
    new Date(date)

  const day =
    result.getDay()

  const difference =
    day === 0
      ? -6
      : 1 - day

  result.setDate(
    result.getDate() +
      difference,
  )

  result.setHours(
    0,
    0,
    0,
    0,
  )

  return result
}

function addDays(
  date: Date,
  days: number,
) {
  const result =
    new Date(date)

  result.setDate(
    result.getDate() +
      days,
  )

  return result
}

function addWeeks(
  date: Date,
  weeks: number,
) {
  return addDays(
    date,
    weeks * 7,
  )
}

function isSameDay(
  date1: Date,
  date2: Date,
) {
  return (
    date1.getFullYear() ===
      date2.getFullYear() &&
    date1.getMonth() ===
      date2.getMonth() &&
    date1.getDate() ===
      date2.getDate()
  )
}

function formatDateKey(
  date: Date,
) {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1,
    ).padStart(2, '0')

  const day =
    String(
      date.getDate(),
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateKey(
  dateKey: string,
) {
  const [
    year,
    month,
    day,
  ] =
    dateKey
      .split('-')
      .map(Number)

  return new Date(
    year,
    month - 1,
    day,
  )
}

function formatWeekTitle(
  weekStart: Date,
) {
  const weekEnd =
    addDays(
      weekStart,
      6,
    )

  const startDay =
    weekStart.getDate()

  const endDay =
    weekEnd.getDate()

  const startMonth =
    weekStart.toLocaleString(
      'en-GB',
      {
        month: 'short',
      },
    )

  const endMonth =
    weekEnd.toLocaleString(
      'en-GB',
      {
        month: 'short',
      },
    )

  const startYear =
    weekStart.getFullYear()

  const endYear =
    weekEnd.getFullYear()

  if (
    weekStart.getMonth() ===
      weekEnd.getMonth() &&
    startYear ===
      endYear
  ) {
    return `${startDay} – ${endDay} ${endMonth} ${endYear}`
  }

  if (
    startYear ===
    endYear
  ) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`
  }

  return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`
}

function getInitialWeek() {
  const today =
    new Date()

  if (
    today <
    START_DATE
  ) {
    return getMonday(
      START_DATE,
    )
  }

  if (
    today >
    END_DATE
  ) {
    return getMonday(
      END_DATE,
    )
  }

  return getMonday(
    today,
  )
}

function WeeklyCalendar() {
  const [
    tasks,
    setTasks,
  ] =
    useState<Task[]>([])

  const [
    databaseLoaded,
    setDatabaseLoaded,
  ] =
    useState(false)

  const [
    currentWeek,
    setCurrentWeek,
  ] =
    useState<Date>(
      getInitialWeek,
    )

  const [
    selectedSlot,
    setSelectedSlot,
  ] =
    useState<
      SelectedSlot | null
    >(null)

  const [
    selectedTask,
    setSelectedTask,
  ] =
    useState<
      Task | null
    >(null)

  const firstWeek =
    getMonday(
      START_DATE,
    )

  const lastWeek =
    getMonday(
      END_DATE,
    )

  /*
   * Load tasks from IndexedDB.
   */
  useEffect(() => {
    async function loadTasks() {
      try {
        const savedTasks =
          await db.tasks.toArray()

        setTasks(
          savedTasks,
        )
      } catch (
        error
      ) {
        console.error(
          'Could not load tasks:',
          error,
        )
      } finally {
        setDatabaseLoaded(
          true,
        )
      }
    }

    loadTasks()
  }, [])

  /*
   * Save tasks whenever
   * the task list changes.
   */
  useEffect(() => {
    if (
      !databaseLoaded
    ) {
      return
    }

    async function saveTasks() {
      try {
        await db.transaction(
          'rw',
          db.tasks,
          async () => {
            await db.tasks.clear()

            if (
              tasks.length >
              0
            ) {
              await db.tasks.bulkPut(
                tasks,
              )
            }
          },
        )
      } catch (
        error
      ) {
        console.error(
          'Could not save tasks:',
          error,
        )
      }
    }

    saveTasks()
  }, [
    tasks,
    databaseLoaded,
  ])

  function createOccurrences(
    task: Task,
  ) {
    if (
      task.recurrence ===
        'none' ||
      !task.recurrenceEndDate
    ) {
      return [
        {
          ...task,

          isPriority:
            task.isPriority ??
            false,
        },
      ]
    }

    const startDate =
      parseDateKey(
        task.date,
      )

    const requestedEndDate =
      parseDateKey(
        task.recurrenceEndDate,
      )

    const finalEndDate =
      requestedEndDate >
      END_DATE
        ? END_DATE
        : requestedEndDate

    const groupId =
      task.recurrenceGroupId ??
      crypto.randomUUID()

    const recurringTasks:
      Task[] = []

    let currentDate =
      new Date(
        startDate,
      )

    const intervalDays =
      task.recurrence ===
      'weekly'
        ? 7
        : 1

    while (
      currentDate <=
      finalEndDate
    ) {
      recurringTasks.push({
        ...task,

        id:
          crypto.randomUUID(),

        date:
          formatDateKey(
            currentDate,
          ),

        recurrenceGroupId:
          groupId,

        isPriority:
          false,
      })

      currentDate =
        addDays(
          currentDate,
          intervalDays,
        )
    }

    return recurringTasks
  }

  function handleCreateTask(
    task: Task,
  ) {
    const newTasks =
      createOccurrences(
        task,
      )

    const conflictingNewTasks =
      newTasks.filter(
        (
          newTask,
        ) =>
          tasks.some(
            (
              existingTask,
            ) =>
              tasksOverlap(
                newTask,
                existingTask,
              ),
          ),
      )

    if (
      conflictingNewTasks.length ===
      0
    ) {
      setTasks(
        (
          currentTasks,
        ) => [
          ...currentTasks,
          ...newTasks,
        ],
      )

      return
    }

    const confirmed =
      window.confirm(
        `Conflict detected.\n\n${conflictingNewTasks.length} new task occurrence(s) overlap with an existing task.\n\nCreate anyway?`,
      )

    if (!confirmed) {
      return
    }

    const makePriority =
      window.confirm(
        'Do you want the new conflicting task to be the PRIORITY task?\n\nOK = Make new task priority\nCancel = Keep existing priority.',
      )

    const preparedTasks =
      newTasks.map(
        (
          newTask,
        ) => {
          const hasConflict =
            tasks.some(
              (
                existingTask,
              ) =>
                tasksOverlap(
                  newTask,
                  existingTask,
                ),
            )

          return {
            ...newTask,

            isPriority:
              makePriority &&
              hasConflict,
          }
        },
      )

    setTasks(
      (
        currentTasks,
      ) => {
        let updatedExisting =
          currentTasks

        if (
          makePriority
        ) {
          updatedExisting =
            currentTasks.map(
              (
                existingTask,
              ) => {
                const overlapsPriorityTask =
                  preparedTasks.some(
                    (
                      newTask,
                    ) =>
                      newTask.isPriority &&
                      tasksOverlap(
                        newTask,
                        existingTask,
                      ),
                  )

                if (
                  overlapsPriorityTask
                ) {
                  return {
                    ...existingTask,

                    isPriority:
                      false,
                  }
                }

                return existingTask
              },
            )
        }

        return [
          ...updatedExisting,
          ...preparedTasks,
        ]
      },
    )
  }

  function handleSlotClick(
    date: Date,
    time: string,
    isSleep: boolean,
  ) {
    setSelectedTask(
      null,
    )

    setSelectedSlot({
      date,
      time,
      isSleep,
    })
  }

  function handleTaskClick(
    task: Task,
  ) {
    setSelectedSlot(
      null,
    )

    setSelectedTask(
      task,
    )
  }

  function handleUpdateTask(
    updatedTask: Task,
    scope:
      RecurringEditScope,
  ) {
    /*
     * Update the entire
     * recurring series.
     */
    if (
      scope === 'series' &&
      updatedTask
        .recurrenceGroupId
    ) {
      const groupId =
        updatedTask
          .recurrenceGroupId

      const candidateSeries =
        tasks
          .filter(
            (task) =>
              task.recurrenceGroupId ===
              groupId,
          )
          .map(
            (task) => ({
              ...task,

              title:
                updatedTask.title,

              description:
                updatedTask.description,

              category:
                updatedTask.category,

              startTime:
                updatedTask.startTime,

              endTime:
                updatedTask.endTime,

              overrideSleep:
                updatedTask.overrideSleep,
            }),
          )

      const outsideTasks =
        tasks.filter(
          (task) =>
            task.recurrenceGroupId !==
            groupId,
        )

      const conflictCount =
        candidateSeries.filter(
          (
            candidate,
          ) =>
            outsideTasks.some(
              (
                otherTask,
              ) =>
                tasksOverlap(
                  candidate,
                  otherTask,
                ),
            ),
        ).length

      if (
        conflictCount > 0
      ) {
        const confirmed =
          window.confirm(
            `${conflictCount} occurrence(s) in this series will conflict with another task.\n\nSave the series anyway?`,
          )

        if (!confirmed) {
          return
        }
      }

      setTasks(
        (
          currentTasks,
        ) =>
          currentTasks.map(
            (task) => {
              if (
                task.recurrenceGroupId !==
                groupId
              ) {
                return task
              }

              const updatedOccurrence = {
                ...task,

                title:
                  updatedTask.title,

                description:
                  updatedTask.description,

                category:
                  updatedTask.category,

                startTime:
                  updatedTask.startTime,

                endTime:
                  updatedTask.endTime,

                overrideSleep:
                  updatedTask.overrideSleep,
              }

              const stillConflicts =
                outsideTasks.some(
                  (
                    otherTask,
                  ) =>
                    tasksOverlap(
                      updatedOccurrence,
                      otherTask,
                    ),
                )

              return {
                ...updatedOccurrence,

                isPriority:
                  stillConflicts
                    ? task.isPriority
                    : false,
              }
            },
          ),
      )

      setSelectedTask(
        null,
      )

      setSelectedSlot(
        null,
      )

      return
    }

    /*
     * Update one occurrence
     * or one normal task.
     */
    const conflicts =
      tasks.filter(
        (task) =>
          task.id !==
            updatedTask.id &&
          tasksOverlap(
            updatedTask,
            task,
          ),
      )

    if (
      conflicts.length >
      0
    ) {
      const confirmed =
        window.confirm(
          `This task overlaps with ${conflicts.length} other task(s).\n\nSave changes anyway?`,
        )

      if (!confirmed) {
        return
      }
    }

    const taskToSave:
      Task = {
      ...updatedTask,

      isPriority:
        conflicts.length >
        0
          ? updatedTask
              .isPriority
          : false,
    }

    setTasks(
      (
        currentTasks,
      ) =>
        currentTasks.map(
          (task) => {
            if (
              task.id ===
              taskToSave.id
            ) {
              return taskToSave
            }

            if (
              taskToSave
                .isPriority &&
              tasksOverlap(
                taskToSave,
                task,
              )
            ) {
              return {
                ...task,

                isPriority:
                  false,
              }
            }

            return task
          },
        ),
    )

    setSelectedTask(
      null,
    )

    setSelectedSlot(
      null,
    )
  }

  function handleDeleteTask(
    taskToDelete: Task,
    scope:
      RecurringEditScope,
  ) {
    setTasks(
      (
        currentTasks,
      ) => {
        if (
          scope ===
            'series' &&
          taskToDelete
            .recurrenceGroupId
        ) {
          return currentTasks.filter(
            (task) =>
              task.recurrenceGroupId !==
              taskToDelete
                .recurrenceGroupId,
          )
        }

        return currentTasks.filter(
          (task) =>
            task.id !==
            taskToDelete.id,
        )
      },
    )

    setSelectedTask(
      null,
    )

    setSelectedSlot(
      null,
    )
  }

  function closeTaskModal() {
    setSelectedSlot(
      null,
    )

    setSelectedTask(
      null,
    )
  }

  function handlePreviousWeek() {
    setCurrentWeek(
      (
        previousWeek,
      ) => {
        const newWeek =
          addWeeks(
            previousWeek,
            -1,
          )

        if (
          newWeek <
          firstWeek
        ) {
          return previousWeek
        }

        return newWeek
      },
    )
  }

  function handleNextWeek() {
    setCurrentWeek(
      (
        previousWeek,
      ) => {
        const newWeek =
          addWeeks(
            previousWeek,
            1,
          )

        if (
          newWeek >
          lastWeek
        ) {
          return previousWeek
        }

        return newWeek
      },
    )
  }

  function handleToday() {
    const today =
      new Date()

    if (
      today <
      START_DATE
    ) {
      setCurrentWeek(
        firstWeek,
      )

      return
    }

    if (
      today >
      END_DATE
    ) {
      setCurrentWeek(
        lastWeek,
      )

      return
    }

    setCurrentWeek(
      getMonday(
        today,
      ),
    )
  }

  const previousDisabled =
    isSameDay(
      currentWeek,
      firstWeek,
    )

  const nextDisabled =
    isSameDay(
      currentWeek,
      lastWeek,
    )

  const editingTaskHasConflict =
    selectedTask
      ? taskHasConflict(
          selectedTask,
          tasks,
        )
      : false

  return (
    <main className="weekly-calendar">
      <CalendarHeader
        weekTitle={
          formatWeekTitle(
            currentWeek,
          )
        }
        onPreviousWeek={
          handlePreviousWeek
        }
        onNextWeek={
          handleNextWeek
        }
        onToday={
          handleToday
        }
        previousDisabled={
          previousDisabled
        }
        nextDisabled={
          nextDisabled
        }
      />

      <div className="calendar-scroll-area">
        <div className="calendar-content">
          <div className="week-days-sticky">
            <WeekDaysHeader
              weekStart={
                currentWeek
              }
            />
          </div>

          <TimeGrid
            weekStart={
              currentWeek
            }
            onSlotClick={
              handleSlotClick
            }
            onTaskClick={
              handleTaskClick
            }
            tasks={
              tasks
            }
          />
        </div>
      </div>

      <CreateTaskModal
        selectedSlot={
          selectedSlot
        }
        editingTask={
          selectedTask
        }
        editingTaskHasConflict={
          editingTaskHasConflict
        }
        onClose={
          closeTaskModal
        }
        onCreateTask={
          handleCreateTask
        }
        onUpdateTask={
          handleUpdateTask
        }
        onDeleteTask={
          handleDeleteTask
        }
      />
    </main>
  )
}

export default WeeklyCalendar