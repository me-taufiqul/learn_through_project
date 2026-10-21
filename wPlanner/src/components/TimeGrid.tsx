import type {
  Task,
} from '../types/task'

import {
  taskHasConflict,
} from '../utils/conflicts'

interface TimeGridProps {
  weekStart: Date

  onSlotClick: (
    date: Date,
    time: string,
    isSleep: boolean,
  ) => void

  onTaskClick: (
    task: Task,
  ) => void

  tasks: Task[]
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

const SLOT_COUNT = 96

const SLEEP_END_SLOT = 28

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

function getSlotTime(
  hour: number,
  minute: number,
) {
  return `${String(
    hour,
  ).padStart(
    2,
    '0',
  )}:${String(
    minute,
  ).padStart(
    2,
    '0',
  )}`
}

function createTimeSlots() {
  return Array.from(
    {
      length:
        SLOT_COUNT,
    },
    (
      _,
      index,
    ) => {
      const hour =
        Math.floor(
          index / 4,
        )

      const minute =
        (index % 4) *
        15

      const label =
        index % 4 ===
        0
          ? `${String(
              hour,
            ).padStart(
              2,
              '0',
            )}:00`
          : ''

      let lineType =
        'quarter'

      if (
        index % 4 ===
        0
      ) {
        lineType =
          'hour'
      } else if (
        index % 2 ===
        0
      ) {
        lineType =
          'half'
      }

      return {
        index,
        hour,
        minute,
        label,
        lineType,
      }
    },
  )
}

const timeSlots =
  createTimeSlots()

function formatDateKey(
  date: Date,
) {
  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() +
        1,
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

function timeToMinutes(
  time: string,
) {
  if (
    time === '24:00'
  ) {
    return 1440
  }

  const [
    hour,
    minute,
  ] =
    time
      .split(':')
      .map(Number)

  return (
    hour * 60 +
    minute
  )
}

function getCategoryClass(
  category: string,
) {
  return `category-${category
    .toLowerCase()
    .replace(
      /\s+/g,
      '-',
    )}`
}

function TimeGrid({
  weekStart,
  onSlotClick,
  onTaskClick,
  tasks,
}: TimeGridProps) {
  return (
    <div className="time-grid">
      <div className="time-label-column">
        {timeSlots.map(
          (slot) => (
            <div
              key={
                slot.index
              }
              className={`time-label-slot ${slot.lineType} ${
                slot.index ===
                SLEEP_END_SLOT
                  ? 'sleep-end'
                  : ''
              }`}
            >
              {slot.label && (
                <span className="time-label">
                  {
                    slot.label
                  }
                </span>
              )}
            </div>
          ),
        )}
      </div>

      {Array.from(
        {
          length: 7,
        },
        (
          _,
          dayIndex,
        ) => {
          const date =
            addDays(
              weekStart,
              dayIndex,
            )

          const disabled =
            date <
              START_DATE ||
            date >
              END_DATE

          const dateKey =
            formatDateKey(
              date,
            )

          const dayTasks =
            tasks.filter(
              (task) =>
                task.date ===
                dateKey,
            )

          return (
            <div
              key={
                dayIndex
              }
              className={`calendar-day-column ${
                disabled
                  ? 'disabled-calendar-day'
                  : ''
              }`}
              aria-disabled={
                disabled
              }
              data-date={
                dateKey
              }
            >
              {timeSlots.map(
                (slot) => {
                  const isSleep =
                    slot.index <
                    SLEEP_END_SLOT

                  const isSleepEnd =
                    slot.index ===
                    SLEEP_END_SLOT

                  return (
                    <div
                      key={
                        slot.index
                      }
                      className={`time-slot ${slot.lineType} ${
                        isSleep &&
                        !disabled
                          ? 'sleep-slot'
                          : ''
                      } ${
                        isSleepEnd
                          ? 'sleep-end'
                          : ''
                      }`}
                      onClick={() => {
                        if (
                          disabled
                        ) {
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
                      {slot.index ===
                        0 &&
                        !disabled && (
                          <span className="sleep-label">
                            SLEEP
                          </span>
                        )}
                    </div>
                  )
                },
              )}

              <div className="task-layer">
                {dayTasks.map(
                  (task) => {
                    const startMinutes =
                      timeToMinutes(
                        task.startTime,
                      )

                    const endMinutes =
                      timeToMinutes(
                        task.endTime,
                      )

                    const top =
                      (
                        startMinutes /
                        15
                      ) *
                      18

                    const height =
                      (
                        (
                          endMinutes -
                          startMinutes
                        ) /
                        15
                      ) *
                      18

                    const hasConflict =
                      taskHasConflict(
                        task,
                        tasks,
                      )

                    const isPriority =
                      hasConflict &&
                      task.isPriority

                    return (
                      <div
                        key={
                          task.id
                        }
                        className={`calendar-task ${getCategoryClass(
                          task.category,
                        )} ${
                          hasConflict
                            ? 'conflicting-task'
                            : ''
                        } ${
                          isPriority
                            ? 'priority-task'
                            : hasConflict
                              ? 'secondary-conflict-task'
                              : ''
                        }`}
                        style={{
                          top: `${top}px`,
                          height: `${Math.max(
                            height,
                            18,
                          )}px`,
                        }}
                        onClick={(
                          event,
                        ) => {
                          event.stopPropagation()

                          onTaskClick(
                            task,
                          )
                        }}
                        title={
                          isPriority
                            ? 'Priority task — click to edit'
                            : hasConflict
                              ? 'Conflicting task — click to edit'
                              : 'Click to edit task'
                        }
                      >
                        <strong>
                          {
                            task.title
                          }
                        </strong>

                        <span>
                          {
                            task.startTime
                          }{' '}
                          –{' '}
                          {
                            task.endTime
                          }
                        </span>

                        <span className="task-category">
                          {
                            task.category
                          }
                        </span>

                        {isPriority ? (
                          <span className="priority-badge">
                            ★ PRIORITY
                          </span>
                        ) : (
                          hasConflict && (
                            <span className="conflict-badge">
                              ⚠ CONFLICT
                            </span>
                          )
                        )}
                      </div>
                    )
                  },
                )}
              </div>
            </div>
          )
        },
      )}
    </div>
  )
}

export default TimeGrid