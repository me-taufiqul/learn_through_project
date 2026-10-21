
# WorkBoard — Your Desktop, Organized

### A minimalist, Python-powered productivity widget for Ubuntu GNOME.

Keep your tasks, deadlines, projects, weekly schedule, and important notes
accessible directly on your desktop — without opening another application.

**Lightweight · Customizable · Local-first · No subscription**

![WorkBoard desktop preview](assets/screenshots/workboard-desktop.png)

---

## Overview

WorkBoard is a desktop productivity widget designed for Ubuntu GNOME.

It combines a Python backend with a GNOME Shell interface, providing
a simple way to organize academic work, personal projects, and daily tasks.

The widget sits on the desktop background, remains accessible when
viewing the desktop, and restores saved information after login.

## Features

| Feature | Description |
|---|---|
| Daily tasks | Create, edit, complete, and remove tasks |
| Deadline tracking | Countdown badges and overdue highlighting |
| Project progress | Track completion with visual progress bars |
| Weekly schedule | Organize recurring activities |
| Important notes | Save and update reminders |
| Compact mode | Hide editing fields for a cleaner display |
| Collapsible sections | Expand or collapse individual sections |
| Customization | Width, position, opacity, font size, and theme |
| Persistent settings | Restore layout preferences after login |
| Desktop integration | GNOME Shell and DING compatibility workaround |

## Technology Stack

| Layer | Technology |
|---|---|
| Backend | Python 3 |
| Desktop interface | GNOME Shell / GJS |
| Frontend logic | JavaScript |
| Interface styling | CSS |
| Persistent data | JSON |
| Development platform | Ubuntu Linux |

### Architecture

```text
             Ubuntu GNOME Desktop
                      |
                      v
              GNOME Shell / GJS
                      |
              Interactive Widget
                      |
                      v
                Python Backend
                      |
                      v
                Local JSON File
```

GNOME Shell handles the graphical interface and desktop positioning.

Python manages tasks, projects, deadlines, schedules, notes, and settings.

## Installation

### Requirements

- Ubuntu 26.04 with GNOME Shell 50
- GNOME Wayland session
- Python 3
- Git

This is the tested development environment. Other GNOME versions
have not yet been verified.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/dboard.git
cd dboard
```

### 2. Install WorkBoard

```bash
chmod +x install.sh
./install.sh
```

No Python virtual environment or additional pip packages are required.

### 3. Activate

Log out of Ubuntu and log back in.

Then run:

```bash
gnome-extensions enable workboard@local
```

Open the desktop using Super + D.

### 4. Verify

```bash
gnome-extensions info workboard@local
```

The extension should report that it is enabled.

## How to Use

### Daily Tasks

Switch to Full mode to reveal the task input.

Create a task using the input field. Use the checkbox to mark it
complete, the pencil icon to change its name, and the delete button
to remove it.

### Deadlines

Enter deadlines in this format:

```text
2026-11-15 | Submit assignment
```

The widget displays a countdown and highlights urgent or overdue dates.

### Project Progress

Add a project and adjust its progress using the plus and minus controls.

### Weekly Schedule

Add an event using:

```text
Monday | 09:00-11:00 | Study Python
```

Activities scheduled for the current day receive visual emphasis.

### Important Notes

Use the note field to store a reminder or short piece of information.

### Appearance

Open the settings icon to customize:

- Widget width
- Font size
- Transparency
- Top offset
- Left or right placement
- Light or dark theme

Use Compact mode and collapsible sections to control visual clutter.

## Privacy and Local Storage

WorkBoard does not require a user account or cloud service.

Application data is stored locally:

```text
~/.local/share/workboard-widget/data.json
```

Your tasks, schedules, and notes are not included in this repository.

## Project Structure

```text
dboard/
├── assets/
│   └── screenshots/
│       └── workboard-desktop.png
├── gnome-extension/
│   ├── extension.js
│   ├── metadata.json
│   └── stylesheet.css
├── backend.py
├── install.sh
├── uninstall.sh
├── README.md
├── CHANGELOG.md
├── LICENSE
├── VERSION
└── .gitignore
```

## Uninstallation

Run:

```bash
./uninstall.sh
```

The widget code is removed, but personal data and backups are preserved.

## Troubleshooting

### Extension does not appear

Check:

```bash
gnome-extensions info workboard@local
```

Log out and back in after installing or updating the GNOME extension.

### Check GNOME logs

```bash
journalctl --user -b -o cat | grep -i workboard | tail -30
```

### Desktop icons interfere with clicking

WorkBoard includes an experimental GNOME window-stacking workaround
for Desktop Icons NG (DING).

This behavior may need adjustments after future GNOME updates.

## Known Limitations

- GNOME Shell compatibility is version-dependent.
- Deadline countdowns update when the widget refreshes.
- Compact mode hides add/edit input fields.
- Not every type of entry supports inline editing yet.
- No cloud synchronization or calendar integration.
- GNOME extension updates require a session reload on Wayland.

## Roadmap

Possible improvements for future releases:

- Desktop notifications
- Task prioritization
- Calendar integration
- Drag-and-drop organization
- Additional themes
- More flexible scheduling

## Contributing

Suggestions, bug reports, and pull requests are welcome.

## License

Licensed under the MIT License. See [LICENSE](LICENSE).

---

**WorkBoard v1.0.0**

Built with Python, JavaScript, and GNOME Shell.
