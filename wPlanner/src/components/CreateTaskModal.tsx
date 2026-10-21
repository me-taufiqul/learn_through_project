import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'

import type {
  Task,
  RecurrenceType,
} from '../types/task'

export type RecurringEditScope =
  | 'single'
  | 'series'

interface SelectedSlot {
  date: Date
  time: string
  isSleep: boolean
}

interface CreateTaskModalProps {
  selectedSlot: SelectedSlot | null
  editingTask: Task | null
  editingTaskHasConflict: boolean

  onClose: () => void

  onCreateTask: (
    task: Task,
  ) => void

  onUpdateTask: (
    task: Task,
    scope: RecurringEditScope,
  ) => void

  onDeleteTask: (
    task: Task,
    scope: RecurringEditScope,
  ) => void
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

function formatDate(
  date: Date,
) {
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

function timeToMinutes(
  time: string,
) {
  if (time === '24:00') {
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

function isSleepTime(
  time: string,
) {
  return (
    timeToMinutes(time) <
    7 * 60
  )
}

function createStartTimeOptions() {
  return Array.from(
    { length: 96 },
    (_, index) => {
      const minutes =
        index * 15

      const hour =
        Math.floor(
          minutes / 60,
        )

      const minute =
        minutes % 60

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
    },
  )
}

function createEndTimeOptions(
  startTime: string,
) {
  const startMinutes =
    timeToMinutes(
      startTime,
    )

  const options:
    string[] = []

  for (
    let minutes =
      startMinutes + 15;
    minutes <= 1440;
    minutes += 15
  ) {
    if (
      minutes === 1440
    ) {
      options.push(
        '24:00',
      )

      break
    }

    const hour =
      Math.floor(
        minutes / 60,
      )

    const minute =
      minutes % 60

    options.push(
      `${String(
        hour,
      ).padStart(
        2,
        '0',
      )}:${String(
        minute,
      ).padStart(
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
  editingTaskHasConflict,
  onClose,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
}: CreateTaskModalProps) {
  const [
    title,
    setTitle,
  ] = useState('')

  const [
    category,
    setCategory,
  ] = useState('Study')

  const [
    description,
    setDescription,
  ] = useState('')

  const [
    startTime,
    setStartTime,
  ] = useState('')

  const [
    endTime,
    setEndTime,
  ] = useState('')

  const [
    overrideSleep,
    setOverrideSleep,
  ] = useState(false)

  const [
    recurrence,
    setRecurrence,
  ] =
    useState<RecurrenceType>(
      'none',
    )

  const [
    recurrenceEndDate,
    setRecurrenceEndDate,
  ] = useState('')

  const [
    isPriority,
    setIsPriority,
  ] = useState(false)

  const [
    editScope,
    setEditScope,
  ] =
    useState<RecurringEditScope>(
      'single',
    )

  useEffect(() => {
    if (editingTask) {
      setTitle(
        editingTask.title,
      )

      setCategory(
        editingTask.category,
      )

      setDescription(
        editingTask.description,
      )

      setStartTime(
        editingTask.startTime,
      )

      setEndTime(
        editingTask.endTime,
      )

      setOverrideSleep(
        editingTask.overrideSleep,
      )

      setRecurrence(
        editingTask.recurrence,
      )

      setRecurrenceEndDate(
        editingTask
          .recurrenceEndDate ??
          '',
      )

      setIsPriority(
        editingTask.isPriority ??
          false,
      )

      setEditScope(
        'single',
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

      setRecurrence('none')

      setRecurrenceEndDate('')

      setIsPriority(false)

      setEditScope(
        'single',
      )
    }
  }, [
    selectedSlot,
    editingTask,
  ])

  if (
    !selectedSlot &&
    !editingTask
  ) {
    return null
  }

  const isEditing =
    editingTask !== null

  const isRecurringTask =
    Boolean(
      editingTask
        ?.recurrenceGroupId,
    )

  const currentDate =
    editingTask
      ? parseDateKey(
          editingTask.date,
        )
      : selectedSlot!.date

  const currentDateKey =
    editingTask?.date ??
    formatDateKey(
      selectedSlot!.date,
    )

  const sleepBlocked =
    isSleepTime(
      startTime,
    )

  const endTimeOptions =
    createEndTimeOptions(
      startTime,
    )

  function handleStartChange(
    newStartTime: string,
  ) {
    setStartTime(
      newStartTime,
    )

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
      setOverrideSleep(
        false,
      )
    }
  }

  function handleSubmit(
    event: FormEvent,
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

    if (
      !isEditing &&
      recurrence !==
        'none' &&
      !recurrenceEndDate
    ) {
      return
    }

    const task: Task = {
      id:
        editingTask?.id ??
        crypto.randomUUID(),

      title:
        title.trim(),

      description:
        description.trim(),

      category,

      date:
        currentDateKey,

      startTime,

      endTime,

      overrideSleep,

      recurrence,

      recurrenceEndDate:
        recurrence ===
        'none'
          ? undefined
          : recurrenceEndDate,

      recurrenceGroupId:
        editingTask
          ?.recurrenceGroupId ??
        (
          recurrence !==
          'none'
            ? crypto.randomUUID()
            : undefined
        ),

      isPriority,
    }

    if (isEditing) {
      onUpdateTask(
        task,
        isRecurringTask
          ? editScope
          : 'single',
      )
    } else {
      onCreateTask(
        task,
      )
    }

    onClose()
  }

  function handleDelete() {
    if (!editingTask) {
      return
    }

    const deletingSeries =
      isRecurringTask &&
      editScope === 'series'

    const confirmed =
      window.confirm(
        deletingSeries
          ? `Delete the entire "${editingTask.title}" series?`
          : `Delete "${editingTask.title}"?`,
      )

    if (!confirmed) {
      return
    }

    onDeleteTask(
      editingTask,
      deletingSeries
        ? 'series'
        : 'single',
    )

    onClose()
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={
        onClose
      }
    >
      <div
        className="task-modal"
        onMouseDown={(
          event,
        ) =>
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
            onClick={
              onClose
            }
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <div className="selected-slot-info">
            <strong>
              {formatDate(
                currentDate,
              )}
            </strong>
          </div>

          {isEditing &&
            isRecurringTask && (
              <div className="priority-option">
                <strong>
                  Recurring task
                </strong>

                <label>
                  <input
                    type="radio"
                    name="edit-scope"
                    checked={
                      editScope ===
                      'single'
                    }
                    onChange={() =>
                      setEditScope(
                        'single',
                      )
                    }
                  />

                  <span>
                    This occurrence
                    only
                  </span>
                </label>

                <label>
                  <input
                    type="radio"
                    name="edit-scope"
                    checked={
                      editScope ===
                      'series'
                    }
                    onChange={() =>
                      setEditScope(
                        'series',
                      )
                    }
                  />

                  <span>
                    Entire series
                  </span>
                </label>
              </div>
            )}

          {sleepBlocked && (
            <div className="sleep-warning">
              <strong>
                Sleep time
              </strong>

              <p>
                This time is
                normally reserved
                for sleep.
              </p>

              <label className="override-row">
                <input
                  type="checkbox"
                  checked={
                    overrideSleep
                  }
                  onChange={(
                    event,
                  ) =>
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
            <label>
              Task title
            </label>

            <input
              type="text"
              value={
                title
              }
              onChange={(
                event,
              ) =>
                setTitle(
                  event.target
                    .value,
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

              <select
                value={
                  startTime
                }
                onChange={(
                  event,
                ) =>
                  handleStartChange(
                    event.target
                      .value,
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
            </div>

            <div className="form-field">
              <label>
                End
              </label>

              <select
                value={
                  endTime
                }
                onChange={(
                  event,
                ) =>
                  setEndTime(
                    event.target
                      .value,
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
              value={
                category
              }
              onChange={(
                event,
              ) =>
                setCategory(
                  event.target
                    .value,
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

          {!isEditing && (
            <>
              <div className="form-field">
                <label>
                  Repeat
                </label>

                <select
                  value={
                    recurrence
                  }
                  onChange={(
                    event,
                  ) => {
                    const value =
                      event.target
                        .value as RecurrenceType

                    setRecurrence(
                      value,
                    )

                    if (
                      value ===
                      'none'
                    ) {
                      setRecurrenceEndDate(
                        '',
                      )
                    }
                  }}
                >
                  <option value="none">
                    Does not repeat
                  </option>

                  <option value="daily">
                    Daily
                  </option>

                  <option value="weekly">
                    Weekly
                  </option>
                </select>
              </div>

              {recurrence !==
                'none' && (
                  <div className="form-field">
                    <label>
                      Repeat until
                    </label>

                    <input
                      type="date"
                      value={
                        recurrenceEndDate
                      }
                      min={
                        currentDateKey
                      }
                      max="2027-03-31"
                      onChange={(
                        event,
                      ) =>
                        setRecurrenceEndDate(
                          event.target
                            .value,
                        )
                      }
                      required
                    />
                  </div>
                )}
            </>
          )}

          {isEditing &&
            editingTaskHasConflict &&
            (
              !isRecurringTask ||
              editScope ===
                'single'
            ) && (
              <div className="priority-option">
                <label>
                  <input
                    type="checkbox"
                    checked={
                      isPriority
                    }
                    onChange={(
                      event,
                    ) =>
                      setIsPriority(
                        event.target
                          .checked,
                      )
                    }
                  />

                  <span>
                    Make this the
                    priority task
                  </span>
                </label>
              </div>
            )}

          <div className="form-field">
            <label>
              Description
            </label>

            <textarea
              value={
                description
              }
              onChange={(
                event,
              ) =>
                setDescription(
                  event.target
                    .value,
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
                {isRecurringTask &&
                editScope ===
                  'series'
                  ? 'Delete Series'
                  : 'Delete'}
              </button>
            )}

            <button
              type="button"
              className="secondary-button"
              onClick={
                onClose
              }
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
                ? isRecurringTask &&
                  editScope ===
                    'series'
                  ? 'Save Series'
                  : 'Save Changes'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal