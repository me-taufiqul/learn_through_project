import type { Task } from '../types/task'

interface TimeGridProps {
  weekStart: Date
  
  onSlotClick: (
    date: Date,
    time: string,
    isSleep: boolean,
  ) => void

  onTaskClick: (task: Task) => void
  tasks: Task[]
}

const START_DATE = new Date(2026, 9, 1)
const END_DATE = new Date(2027, 2, 31)

const SLOT_COUNT = 96

// 07:00 = 7 hours × 4 slots per hour
const SLEEP_END_SLOT = 28

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getSlotTime(
  hour: number,
  minute: number,
) {
  return `${String(hour).padStart(2, '0')}:${String(
    minute,
  ).padStart(2, '0')}`
}

function createTimeSlots() {
  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const hour = Math.floor(index / 4)
    const minute = (index % 4) * 15

    const label =
      index % 4 === 0
        ? `${String(hour).padStart(2, '0')}:00`
        : ''

    let lineType = 'quarter'

    if (index % 4 === 0) {
      lineType = 'hour'
    } else if (index % 2 === 0) {
      lineType = 'half'
    }

    return {
      index,
      hour,
      minute,
      label,
      lineType,
    }
  })
}

const timeSlots = createTimeSlots()

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function timeToMinutes(time: string) {
  if (time === '24:00') {
    return 24 * 60
  }

  const [hour, minute] = time.split(':').map(Number)

  return hour * 60 + minute
}

function getCategoryClass(category: string) {
  return `category-${category
    .toLowerCase()
    .replace(/\s+/g, '-')}`
}

function TimeGrid({
  weekStart,
  onSlotClick,
  onTaskClick,
  tasks,
}: TimeGridProps) {
  return (
    <div className="time-grid">

      {/* Time labels */}
      <div className="time-label-column">
        {timeSlots.map((slot) => (
          <div
            key={slot.index}
            className={`time-label-slot ${slot.lineType} ${
              slot.index === SLEEP_END_SLOT
                ? 'sleep-end'
                : ''
            }`}
          >
            {slot.label && (
              <span className="time-label">
                {slot.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Seven day columns */}
      {Array.from({ length: 7 }, (_, dayIndex) => {
        const date = addDays(weekStart, dayIndex)

        const disabled =
          date < START_DATE || date > END_DATE

        const dateKey = formatDateKey(date)

        const dayTasks = tasks.filter(
          (task) => task.date === dateKey,
        )

        return (
          <div
            key={dayIndex}
            className={`calendar-day-column ${
              disabled
                ? 'disabled-calendar-day'
                : ''
            }`}
            aria-disabled={disabled}
            data-date={dateKey}
          >

            {/* 96 calendar slots */}
            {timeSlots.map((slot) => {
              const isSleep =
                slot.index < SLEEP_END_SLOT

              const isSleepEnd =
                slot.index === SLEEP_END_SLOT

              return (
                <div
                  key={slot.index}
                  className={`time-slot ${slot.lineType} ${
                    isSleep && !disabled
                      ? 'sleep-slot'
                      : ''
                  } ${
                    isSleepEnd
                      ? 'sleep-end'
                      : ''
                  }`}
                  onClick={() => {
                    if (disabled) {
                      return
                    }

                    onSlotClick(
                      date,
                      getSlotTime(
                        slot.hour,
                        slot.minute,
                      ),
                      isSleep,
                    )
                  }}
                >
                  {slot.index === 0 &&
                    !disabled && (
                      <span className="sleep-label">
                        SLEEP
                      </span>
                    )}
                </div>
              )
            })}

            {/* Tasks are rendered ABOVE the slots */}
            <div className="task-layer">
              {dayTasks.map((task) => {
                const startMinutes =
                  timeToMinutes(task.startTime)

                const endMinutes =
                  timeToMinutes(task.endTime)

                const top =
                  (startMinutes / 15) * 18

                const height =
                  ((endMinutes - startMinutes) /
                    15) *
                  18

                return (
                  <div
                    key={task.id}
                    className={`calendar-task ${getCategoryClass(
                      task.category,
                    )}`}
                    style={{
                      top: `${top}px`,
                      height: `${Math.max(height, 18)}px`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      onTaskClick(task)
                    }}
                    title="Click to edit task"
                  >
                    <strong>
                      {task.title}
                    </strong>

                    <span>
                      {task.startTime} –{' '}
                      {task.endTime}
                    </span>

                    <span className="task-category">
                      {task.category}
                    </span>
                  </div>
                )
              })}
            </div>

          </div>
        )
      })}
    </div>
  )
}

export default TimeGrid