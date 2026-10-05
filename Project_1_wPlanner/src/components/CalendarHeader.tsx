interface CalendarHeaderProps {
  weekTitle: string
  onPreviousWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  previousDisabled: boolean
  nextDisabled: boolean
}

function CalendarHeader({
  weekTitle,
  onPreviousWeek,
  onNextWeek,
  onToday,
  previousDisabled,
  nextDisabled,
}: CalendarHeaderProps) {
  return (
    <header className="calendar-header">
      <div className="week-info">
        <span className="week-label">WEEK</span>
        <h2>{weekTitle}</h2>
      </div>

      <div className="calendar-navigation">
        <button
          type="button"
          className="nav-button"
          onClick={onPreviousWeek}
          disabled={previousDisabled}
        >
          ‹
        </button>

        <button
          type="button"
          className="today-button"
          onClick={onToday}
        >
          Today
        </button>

        <button
          type="button"
          className="nav-button"
          onClick={onNextWeek}
          disabled={nextDisabled}
        >
          ›
        </button>
      </div>
    </header>
  )
}

export default CalendarHeader