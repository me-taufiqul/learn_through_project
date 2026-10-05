import { useEffect, useState } from 'react'
import type { Task } from '../types/task'

interface SelectedSlot {
  date: Date
  time: string
  isSleep: boolean
}

interface CreateTaskModalProps {
  selectedSlot: SelectedSlot | null
  onClose: () => void
}

interface CreateTaskModalProps {
  selectedSlot: SelectedSlot | null
  onClose: () => void
  onCreateTask: (task: Task) => void
}

const categories = [
  'University',
  'Study',
  'Work',
  'Personal',
  'Exercise',
  'Appointment',
  'Other',
]

function createEndTimeOptions(startTime: string) {
  const [hour, minute] = startTime.split(':').map(Number)

  const startMinutes = hour * 60 + minute
  const options: string[] = []

  for (
    let minutes = startMinutes + 15;
    minutes <= 24 * 60;
    minutes += 15
  ) {
    if (minutes === 24 * 60) {
      options.push('24:00')
      break
    }

    const optionHour = Math.floor(minutes / 60)
    const optionMinute = minutes % 60

    options.push(
      `${String(optionHour).padStart(2, '0')}:${String(
        optionMinute,
      ).padStart(2, '0')}`,
    )
  }

  return options
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function CreateTaskModal({
  selectedSlot,
  onClose,
  onCreateTask,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Study')
  const [description, setDescription] = useState('')
  const [endTime, setEndTime] = useState('')
  const [overrideSleep, setOverrideSleep] = useState(false)

  useEffect(() => {
    if (!selectedSlot) {
      return
    }

    const options = createEndTimeOptions(selectedSlot.time)

    setTitle('')
    setCategory('Study')
    setDescription('')
    setEndTime(options[0] ?? '')
    setOverrideSleep(false)
  }, [selectedSlot])

  if (!selectedSlot) {
    return null
  }

  const endTimeOptions =
    createEndTimeOptions(selectedSlot.time)

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        
        if (!title.trim()) {
            return
        }

        if (selectedSlot.isSleep && !overrideSleep) {
            return
        }

        const newTask: Task = {
            id: crypto.randomUUID(),
            title: title.trim(),
            category,
            description: description.trim(),
            date: formatDateKey(selectedSlot.date),
            startTime: selectedSlot.time,
            endTime,
            overrideSleep,
        }

        onCreateTask(newTask)
        onClose()
    }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="task-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="task-modal-header">
          <div>
            <span className="modal-label">NEW TASK</span>

            <h2>Create Task</h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="selected-slot-info">
            <strong>
              {formatDate(selectedSlot.date)}
            </strong>

            <span>
              Starts at {selectedSlot.time}
            </span>
          </div>

          {selectedSlot.isSleep && (
            <div className="sleep-warning">
              <strong>Sleep time</strong>

              <p>
                This time is normally reserved for sleep.
                You can schedule here only by explicitly
                overriding the sleep block.
              </p>

              <label className="override-row">
                <input
                  type="checkbox"
                  checked={overrideSleep}
                  onChange={(event) =>
                    setOverrideSleep(event.target.checked)
                  }
                />

                Override sleep time
              </label>
            </div>
          )}

          <div className="form-field">
            <label htmlFor="task-title">
              Task title
            </label>

            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="e.g. Machine Learning Study"
              autoFocus
              required
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>Start</label>

              <input
                type="text"
                value={selectedSlot.time}
                readOnly
              />
            </div>

            <div className="form-field">
              <label htmlFor="end-time">
                End
              </label>

              <select
                id="end-time"
                value={endTime}
                onChange={(event) =>
                  setEndTime(event.target.value)
                }
                required
              >
                {endTimeOptions.map((time) => (
                  <option
                    key={time}
                    value={time}
                  >
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="category">
              Category
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              {categories.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              placeholder="Optional notes"
              rows={3}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={
                selectedSlot.isSleep &&
                !overrideSleep
              }
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal