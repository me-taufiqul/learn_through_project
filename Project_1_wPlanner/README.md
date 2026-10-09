# wPlanner

<p align="center">
  <strong>A simple, local-first weekly planner for Web and Android.</strong>
</p>

<p align="center">
  Plan your week in 15-minute intervals, manage recurring tasks, detect schedule conflicts, and decide what takes priority.
</p>

---

## About wPlanner

**wPlanner** is a lightweight weekly scheduling application designed for people who want a clear view of their week without accounts, dashboards, subscriptions, or unnecessary complexity.

The application focuses on one thing:

> **Planning your week efficiently.**

wPlanner is built as a responsive React application and packaged for Android using Capacitor, allowing the same codebase to support both Web and Android.

The current version is designed around the planning period:

**1 October 2026 – 31 March 2027**
**[Winter Semester 2026/27]**

---

## Features

### Weekly Calendar

- Monday–Sunday weekly calendar
- 24-hour timeline
- 15-minute scheduling intervals
- Previous / Today / Next week navigation
- Sticky day and time headers
- Responsive horizontal scrolling on mobile

### Task Management

- Create tasks directly from a calendar slot
- Edit existing tasks
- Delete tasks
- Add descriptions
- Assign task categories
- Select start and end times

### Task Categories

wPlanner currently supports:

- University
- Study
- Work
- Personal
- Exercise
- Appointment
- Other

Each category has its own visual style for faster schedule recognition.

### Recurring Tasks

Create tasks that repeat:

- Daily
- Weekly

Recurring events can be managed either as:

- One individual occurrence
- The entire recurring series

### Schedule Conflict Detection

wPlanner automatically detects overlapping tasks.

Example:

```text
University Lecture
10:00 – 12:00

Machine Learning Study
11:00 – 13:00
