import { useEffect, useState } from 'react'
import type { Task } from '../types/task'

interface SelectedSlot {
  date: Date
  time: string
  isSleep: boolean
}

interface CreateTaskModalProps {
  selectedSlot: SelectedSlot | null
  editingTask: Task | null
  onClose: () => void
  onCreateTask: (task: Task) => void
  onUpdateTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
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

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, '0')
  const day = String(
    date.getDate(),
  ).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function parseDateKey(dateKey: string) {
  const [year, month, day] =
    dateKey.split('-').map(Number)

  return new Date(
    year,
    month - 1,
    day,
  )
}

function formatDate(date: Date) {
  return date.toLocaleDateString(
    'en-GB',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    },
  )
}

function timeToMinutes(time: string) {
  if (time === '24:00') {
    return 1440
  }

  const [hour, minute] =
    time.split(':').map(Number)

  return hour * 60 + minute
}

function isSleepTime(time: string) {
  return timeToMinutes(time) < 7 * 60
}

function createStartTimeOptions() {
  return Array.from(
    { length: 96 },
    (_, index) => {
      const minutes = index * 15
      const hour = Math.floor(
        minutes / 60,
      )
      const minute = minutes % 60

      return `${String(hour).padStart(
        2,
        '0',
      )}:${String(minute).padStart(
        2,
        '0',
      )}`
    },
  )
}

function createEndTimeOptions(
  startTime: string,
) {
  const startMinutes =
    timeToMinutes(startTime)

  const options: string[] = []

  for (
    let minutes = startMinutes + 15;
    minutes <= 1440;
    minutes += 15
  ) {
    if (minutes === 1440) {
      options.push('24:00')
      break
    }

    const hour =
      Math.floor(minutes / 60)

    const minute =
      minutes % 60

    options.push(
      `${String(hour).padStart(
        2,
        '0',
      )}:${String(minute).padStart(
        2,
        '0',
      )}`,
    )
  }

  return options
}

const startTimeOptions =
  createStartTimeOptions()

function CreateTaskModal({
  selectedSlot,
  editingTask,
  onClose,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: CreateTaskModalProps) {
  const [title, setTitle] =
    useState('')

  const [category, setCategory] =
    useState('Study')

  const [description, setDescription] =
    useState('')

  const [startTime, setStartTime] =
    useState('')

  const [endTime, setEndTime] =
    useState('')

  const [
    overrideSleep,
    setOverrideSleep,
  ] = useState(false)

  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title)
      setCategory(editingTask.category)
      setDescription(
        editingTask.description,
      )
      setStartTime(
        editingTask.startTime,
      )
      setEndTime(editingTask.endTime)
      setOverrideSleep(
        editingTask.overrideSleep,
      )

      return
    }

    if (selectedSlot) {
      const options =
        createEndTimeOptions(
          selectedSlot.time,
        )

      setTitle('')
      setCategory('Study')
      setDescription('')
      setStartTime(
        selectedSlot.time,
      )
      setEndTime(
        options[0] ?? '',
      )
      setOverrideSleep(false)
    }
  }, [selectedSlot, editingTask])

  if (!selectedSlot && !editingTask) {
    return null
  }

  const isEditing =
    editingTask !== null

  const currentDate =
    editingTask
      ? parseDateKey(
          editingTask.date,
        )
      : selectedSlot!.date

  const sleepBlocked =
    isSleepTime(startTime)

  const endTimeOptions =
    createEndTimeOptions(startTime)

  function handleStartChange(
    newStartTime: string,
  ) {
    setStartTime(newStartTime)

    const options =
      createEndTimeOptions(
        newStartTime,
      )

    setEndTime(
      options[0] ?? '',
    )

    if (
      !isSleepTime(
        newStartTime,
      )
    ) {
      setOverrideSleep(false)
    }
  }

  function handleSubmit(
    event: React.FormEvent,
  ) {
    event.preventDefault()

    if (!title.trim()) {
      return
    }

    if (
      sleepBlocked &&
      !overrideSleep
    ) {
      return
    }

    const task: Task = {
      id:
        editingTask?.id ??
        crypto.randomUUID(),

      title: title.trim(),

      description:
        description.trim(),

      category,

      date:
        editingTask?.date ??
        formatDateKey(
          selectedSlot!.date,
        ),

      startTime,
      endTime,
      overrideSleep,
    }

    if (isEditing) {
      onUpdateTask(task)
    } else {
      onCreateTask(task)
    }

    onClose()
  }

  function handleDelete() {
    if (!editingTask) {
      return
    }

    const confirmed =
      window.confirm(
        `Delete "${editingTask.title}"?`,
      )

    if (!confirmed) {
      return
    }

    onDeleteTask(
      editingTask.id,
    )

    onClose()
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="task-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="task-modal-header">
          <div>
            <span className="modal-label">
              {isEditing
                ? 'EDIT TASK'
                : 'NEW TASK'}
            </span>

            <h2>
              {isEditing
                ? 'Edit Task'
                : 'Create Task'}
            </h2>
          </div>

          <button
            type="button"
            className="modal-close-button"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="selected-slot-info">
            <strong>
              {formatDate(
                currentDate,
              )}
            </strong>
          </div>

          {sleepBlocked && (
            <div className="sleep-warning">
              <strong>
                Sleep time
              </strong>

              <p>
                This time is normally
                reserved for sleep.
              </p>

              <label className="override-row">
                <input
                  type="checkbox"
                  checked={
                    overrideSleep
                  }
                  onChange={(event) =>
                    setOverrideSleep(
                      event.target
                        .checked,
                    )
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
                setTitle(
                  event.target.value,
                )
              }
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label>
                Start
              </label>

              {isEditing ? (
                <select
                  value={startTime}
                  onChange={(event) =>
                    handleStartChange(
                      event.target.value,
                    )
                  }
                >
                  {startTimeOptions.map(
                    (time) => (
                      <option
                        key={time}
                        value={time}
                      >
                        {time}
                      </option>
                    ),
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={startTime}
                  readOnly
                />
              )}
            </div>

            <div className="form-field">
              <label>
                End
              </label>

              <select
                value={endTime}
                onChange={(event) =>
                  setEndTime(
                    event.target.value,
                  )
                }
              >
                {endTimeOptions.map(
                  (time) => (
                    <option
                      key={time}
                      value={time}
                    >
                      {time}
                    </option>
                  ),
                )}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>
              Category
            </label>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value,
                )
              }
            >
              {categories.map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}
            </select>
          </div>

          <div className="form-field">
            <label>
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              rows={3}
            />
          </div>

          <div className="modal-actions">
            {isEditing && (
              <button
                type="button"
                className="danger-button"
                onClick={
                  handleDelete
                }
              >
                Delete
              </button>
            )}

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
                sleepBlocked &&
                !overrideSleep
              }
            >
              {isEditing
                ? 'Save Changes'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal