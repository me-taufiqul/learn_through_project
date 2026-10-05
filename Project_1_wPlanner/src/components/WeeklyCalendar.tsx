import CreateTaskModal from './CreateTaskModal'
import type { Task } from '../types/task'
import TimeGrid from './TimeGrid'
import { useState } from 'react'
import CalendarHeader from './CalendarHeader'
import WeekDaysHeader from './WeekDaysHeader'

interface SelectedSlot {
  date: Date
  time: string
  isSleep: boolean
}

const START_DATE = new Date(2026, 9, 1)
const END_DATE = new Date(2027, 2, 31)

function getMonday(date: Date) {
  const result = new Date(date)

  const day = result.getDay()

  const difference =
    day === 0 ? -6 : 1 - day

  result.setDate(result.getDate() + difference)

  result.setHours(0, 0, 0, 0)

  return result
}

function addDays(date: Date, days: number) {
  const result = new Date(date)

  result.setDate(result.getDate() + days)

  return result
}

function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7)
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function formatWeekTitle(weekStart: Date) {
  const weekEnd = addDays(weekStart, 6)

  const startDay = weekStart.getDate()
  const endDay = weekEnd.getDate()

  const startMonth = weekStart.toLocaleString(
    'en-GB',
    {
      month: 'short',
    },
  )

  const endMonth = weekEnd.toLocaleString(
    'en-GB',
    {
      month: 'short',
    },
  )

  const startYear = weekStart.getFullYear()
  const endYear = weekEnd.getFullYear()

  if (
    weekStart.getMonth() === weekEnd.getMonth() &&
    startYear === endYear
  ) {
    return `${startDay} – ${endDay} ${endMonth} ${endYear}`
  }

  if (startYear === endYear) {
    return `${startDay} ${startMonth} – ${endDay} ${endMonth} ${endYear}`
  }

  return `${startDay} ${startMonth} ${startYear} – ${endDay} ${endMonth} ${endYear}`
}

function getInitialWeek() {
  const today = new Date()

  if (today < START_DATE) {
    return getMonday(START_DATE)
  }

  if (today > END_DATE) {
    return getMonday(END_DATE)
  }

  return getMonday(today)
}

function WeeklyCalendar() {
  const [tasks, setTasks] = useState<Task[]>([])
  console.log('TASKS:', tasks)
  const firstWeek = getMonday(START_DATE)
  const lastWeek = getMonday(END_DATE)

  const [currentWeek, setCurrentWeek] =
    useState<Date>(getInitialWeek)

  const [selectedSlot, setSelectedSlot] =
  useState<SelectedSlot | null>(null)


  function handleCreateTask(task: Task) {
    setTasks((currentTasks) => [
      ...currentTasks,
      task,
    ])
  }

  function handleSlotClick(
  date: Date,
  time: string,
  isSleep: boolean,
) {
  setSelectedSlot({
    date,
    time,
    isSleep,
  })
}

  function handlePreviousWeek() {
    setCurrentWeek((previousWeek) => {
      const newWeek = addWeeks(previousWeek, -1)

      if (newWeek < firstWeek) {
        return previousWeek
      }

      return newWeek
    })
  }

  function handleNextWeek() {
    setCurrentWeek((previousWeek) => {
      const newWeek = addWeeks(previousWeek, 1)

      if (newWeek > lastWeek) {
        return previousWeek
      }

      return newWeek
    })
  }

  function handleToday() {
    const today = new Date()

    if (today < START_DATE) {
      setCurrentWeek(firstWeek)
      return
    }

    if (today > END_DATE) {
      setCurrentWeek(lastWeek)
      return
    }

    setCurrentWeek(getMonday(today))
  }

  const previousDisabled =
    isSameDay(currentWeek, firstWeek)

  const nextDisabled =
    isSameDay(currentWeek, lastWeek)

  return (
    <main className="weekly-calendar">
      <CalendarHeader
        weekTitle={formatWeekTitle(currentWeek)}
        onPreviousWeek={handlePreviousWeek}
        onNextWeek={handleNextWeek}
        onToday={handleToday}
        previousDisabled={previousDisabled}
        nextDisabled={nextDisabled}
      />
        <div style={{ padding: '6px 20px', fontSize: '12px' }}>
          Tasks created: {tasks.length}
        </div>

        <div className="calendar-scroll-area">
        <div className="calendar-content">
            <div className="calendar-scroll-area">
              <div className="calendar-content">
                <div className="week-days-sticky">
                  <WeekDaysHeader weekStart={currentWeek} />
                </div>

                <TimeGrid
                  weekStart={currentWeek}
                  onSlotClick={handleSlotClick}
                  tasks={tasks}
                />
              </div>
            </div>
        </div>
        </div>
        <CreateTaskModal
          selectedSlot={selectedSlot}
          onClose={() => setSelectedSlot(null)}
          onCreateTask={handleCreateTask}
        />
    </main>
  )
}

export default WeeklyCalendar