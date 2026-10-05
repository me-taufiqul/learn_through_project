import {
  useState,
} from 'react'

import CalendarHeader
  from './CalendarHeader'

import WeekDaysHeader
  from './WeekDaysHeader'

import TimeGrid
  from './TimeGrid'

import CreateTaskModal
  from './CreateTaskModal'

import type {
  Task,
} from '../types/task'

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
    ).padStart(
      2,
      '0',
    )

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      '0',
    )

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
    startYear === endYear
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

  function handleCreateTask(
    task: Task,
  ) {
    if (
      task.recurrence !==
        'daily' ||
      !task.recurrenceEndDate
    ) {
      setTasks(
        (
          currentTasks,
        ) => [
          ...currentTasks,
          task,
        ],
      )

      return
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
      })

      currentDate =
        addDays(
          currentDate,
          1,
        )
    }

    setTasks(
      (
        currentTasks,
      ) => [
        ...currentTasks,
        ...recurringTasks,
      ],
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
  ) {
    setTasks(
      (
        currentTasks,
      ) =>
        currentTasks.map(
          (
            task,
          ) =>
            task.id ===
            updatedTask.id
              ? updatedTask
              : task,
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
    taskId: string,
  ) {
    setTasks(
      (
        currentTasks,
      ) =>
        currentTasks.filter(
          (
            task,
          ) =>
            task.id !==
            taskId,
        ),
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