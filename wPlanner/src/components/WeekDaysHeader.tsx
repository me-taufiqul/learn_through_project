interface WeekDaysHeaderProps {
  weekStart: Date
}

const START_DATE = new Date(2026, 9, 1)
const END_DATE = new Date(2027, 2, 31)

const dayNames = [
  'MON',
  'TUE',
  'WED',
  'THU',
  'FRI',
  'SAT',
  'SUN',
]

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

function WeekDaysHeader({
  weekStart,
}: WeekDaysHeaderProps) {
  const today = new Date()

  return (
    <div className="week-days-header">
      <div className="time-header"></div>

      {dayNames.map((dayName, index) => {
        const date = addDays(weekStart, index)

        const disabled =
          date < START_DATE || date > END_DATE

        const currentDay = isSameDay(date, today)

        return (
          <div
            key={dayName}
            className={`day-header ${
                disabled ? 'disabled-day' : ''
            }`}
            aria-disabled={disabled}
            title={
                disabled
                  ? 'Scheduling is not available on this date'
                  : undefined
            }
        >
            <span className="day-name">
              {dayName}
            </span>

            <span
              className={`day-date ${
                currentDay && !disabled
                  ? 'current-day'
                  : ''
              }`}
            >
              {date.getDate()}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default WeekDaysHeader