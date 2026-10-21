
import St from 'gi://St';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const BACKEND = GLib.build_filenamev([
    GLib.get_home_dir(),
    '.local',
    'share',
    'dboard',
    'backend.py',
]);

const SECTION_IDS = [
    'tasks', 'deadlines', 'projects', 'schedule', 'notes',
];

export default class Dboard extends Extension {
    enable() {
        this._data = null;
        this._scroll = null;
        this._settingsOpen = false;
        this._editingTaskId = null;

        // New UI state
        this._compactMode = false;
        this._collapsed = new Set();

        this._stackSource = 0;
        this._monitorSignal = 0;
        this._restackSignal = 0;
        this._windowSignal = 0;

        if (!GLib.file_test(BACKEND, GLib.FileTest.EXISTS)) {
            Main.notify('dboard', 'Python backend not found');
            return;
        }

        this._root = new St.BoxLayout({
            vertical: true,
            reactive: true,
            style_class: 'wb-root',
        });

        // Keep the working DING desktop-icons fix.
        global.window_group.add_child(this._root);

        this._monitorSignal = Main.layoutManager.connect(
            'monitors-changed', () => this._position()
        );

        this._restackSignal = global.display.connect(
            'restacked', () => this._queueRestack()
        );

        this._windowSignal = global.display.connect(
            'window-created', () => this._queueRestack()
        );

        this._reload();
        this._queueRestack();
    }

    disable() {
        if (this._monitorSignal)
            Main.layoutManager.disconnect(this._monitorSignal);

        if (this._restackSignal)
            global.display.disconnect(this._restackSignal);

        if (this._windowSignal)
            global.display.disconnect(this._windowSignal);

        if (this._stackSource)
            GLib.source_remove(this._stackSource);

        this._root?.destroy();
        this._root = null;
        this._scroll = null;
        this._data = null;
        this._collapsed = null;
    }

    // ---------- Desktop stacking ----------

    _isDesktopWindow(window) {
        if (!window)
            return false;

        if (window.get_window_type() === Meta.WindowType.DESKTOP)
            return true;

        const identity = [
            window.get_wm_class() || '',
            window.get_wm_class_instance() || '',
            window.get_title() || '',
        ].join(' ').toLowerCase();

        return /ding|desktop.?icons|rastersoft/.test(identity);
    }

    _queueRestack() {
        if (!this._root || this._stackSource)
            return;

        this._stackSource = GLib.idle_add(
            GLib.PRIORITY_DEFAULT_IDLE,
            () => {
                this._stackSource = 0;
                this._restack();
                return GLib.SOURCE_REMOVE;
            }
        );
    }

    _restack() {
        if (!this._root)
            return;

        const group = global.window_group;
        const children = group.get_children();

        const desktops = children.filter(actor => {
            if (actor === this._root)
                return false;

            if (typeof actor.get_meta_window !== 'function')
                return false;

            return this._isDesktopWindow(actor.get_meta_window());
        });

        if (desktops.length) {
            const desktop = desktops[desktops.length - 1];

            if (
                children.indexOf(this._root) !==
                children.indexOf(desktop) + 1
            ) {
                group.set_child_above_sibling(this._root, desktop);
            }
        } else if (children.indexOf(this._root) !== 0) {
            group.set_child_below_sibling(this._root, null);
        }
    }

    // ---------- Python communication ----------

    _call(args, callback) {
        try {
            const proc = Gio.Subprocess.new(
                ['/usr/bin/python3', BACKEND, ...args],
                Gio.SubprocessFlags.STDOUT_PIPE |
                Gio.SubprocessFlags.STDERR_PIPE
            );

            proc.communicate_utf8_async(
                null, null, (process, result) => {
                    try {
                        const [, output, error] =
                            process.communicate_utf8_finish(result);

                        if (!process.get_successful())
                            throw new Error(error.trim() || 'Backend error');

                        if (this._root)
                            callback?.(output);
                    } catch (e) {
                        console.error('dboard:', e);
                        if (this._root)
                            Main.notify('dboard error', String(e));
                    }
                }
            );
        } catch (e) {
            console.error('dboard:', e);
            if (this._root)
                Main.notify('dboard error', String(e));
        }
    }

    _reload() {
        this._call(['get'], output => {
            this._data = JSON.parse(output);

            const settings = this._data.settings;

            this._compactMode =
                this._data.settings.compact_mode === true;

            this._collapsed = new Set(
                Array.isArray(settings.collapsed_sections)
                    ? settings.collapsed_sections
                    : []
            );

            this._render();
        });
    }

    _change(...args) {
        this._call(args, () => this._reload());
    }

    // ---------- UI components ----------

    _icon(name, size = 15, css = '') {
        return new St.Icon({
            icon_name: name,
            fallback_icon_name: 'dialog-information-symbolic',
            icon_size: size,
            style_class: css,
        });
    }

    _label(text, css = 'wb-text', expand = true) {
        const label = new St.Label({
            text: String(text),
            style_class: css,
            x_expand: expand,
        });

        label.clutter_text.set_line_wrap(true);
        return label;
    }

    _button(text, callback) {
        const button = new St.Button({
            label: text,
            style_class: 'wb-button',
            reactive: true,
            can_focus: true,
        });

        button.connect('clicked', callback);
        return button;
    }

    _iconButton(iconName, callback, css = '') {
        const button = new St.Button({
            child: this._icon(iconName),
            style_class: `wb-icon-button ${css}`,
            reactive: true,
            can_focus: true,
        });

        button.connect('clicked', callback);
        return button;
    }

    _row(parent, ...children) {
        const row = new St.BoxLayout({
            style_class: 'wb-row',
            x_expand: true,
        });

        children.forEach(child => row.add_child(child));
        parent.add_child(row);
        return row;
    }

    // ---------- Collapsible sections ----------

    _toggleSection(id) {
        const next = new Set(this._collapsed);

        if (next.has(id))
            next.delete(id);
        else
            next.add(id);

        this._change(
            'setting',
            'collapsed_sections',
            [...next].join(',')
        );
    }

    _toggleAll() {
        const allClosed = SECTION_IDS.every(
            id => this._collapsed.has(id)
        );

        const next = allClosed ? [] : SECTION_IDS;

        this._change(
            'setting',
            'collapsed_sections',
            next.join(',')
        );
    }

    _section(id, title, iconName, count = '') {
        const collapsed = this._collapsed.has(id);

        const card = new St.BoxLayout({
            vertical: true,
            style_class: 'wb-card',
            x_expand: true,
        });

        if (this._compactMode) {
            card.set_style(
                'padding: 8px 10px; spacing: 5px;'
            );
        }

        const heading = new St.BoxLayout({
            style_class: 'wb-section-header',
            x_expand: true,
        });

        heading.add_child(
            this._icon(iconName, 16, 'wb-section-icon')
        );

        heading.add_child(
            this._label(title, 'wb-section-title')
        );

        if (count !== '') {
            heading.add_child(
                this._label(count, 'wb-count', false)
            );
        }

        heading.add_child(
            this._icon(
                collapsed ? 'go-next-symbolic' : 'go-down-symbolic',
                13,
                'wb-muted'
            )
        );

        const toggle = new St.Button({
            child: heading,
            reactive: true,
            can_focus: true,
            x_expand: true,
            style: 'background-color: transparent; padding: 0px;',
        });

        toggle.connect('clicked', () => this._toggleSection(id));

        card.add_child(toggle);
        this._body.add_child(card);

        // Null means section is collapsed.
        return collapsed ? null : card;
    }

    _input(parent, placeholder, callback,
           initial = '', allowEmpty = false) {
        // Compact mode hides editing fields.
        if (this._compactMode)
            return;

        const entry = new St.Entry({
            hint_text: placeholder,
            text: initial,
            style_class: 'wb-input',
            x_expand: true,
            can_focus: true,
        });

        const save = () => {
            const value = entry.get_text().trim();

            if (value || allowEmpty)
                callback(value);
        };

        entry.clutter_text.connect('activate', save);

        this._row(
            parent,
            entry,
            this._iconButton(
                'list-add-symbolic',
                save,
                'wb-add'
            )
        );
    }

    // ---------- Settings ----------

    _numberSetting(parent, title, key, step, unit = '') {
        const value = Number(this._data.settings[key]);

        this._row(
            parent,
            this._label(`${title}: ${value}${unit}`),
            this._button('−', () =>
                this._change('setting', key, String(value - step))
            ),
            this._button('+', () =>
                this._change('setting', key, String(value + step))
            )
        );
    }

    _settingsPanel() {
        const s = this._data.settings;

        const panel = new St.BoxLayout({
            vertical: true,
            style_class: 'wb-card',
        });

        panel.add_child(
            this._label('Appearance Settings', 'wb-section-title')
        );

        this._numberSetting(panel, 'Width', 'width', 20, ' px');
        this._numberSetting(panel, 'Font', 'font_size', 1, ' px');
        this._numberSetting(panel, 'Opacity', 'opacity', 5, '%');
        this._numberSetting(panel, 'Top', 'top', 15, ' px');

        this._row(
            panel,
            this._label(`Theme: ${s.theme}`),
            this._button('Switch', () =>
                this._change(
                    'setting', 'theme',
                    s.theme === 'light' ? 'dark' : 'light'
                )
            )
        );

        this._row(
            panel,
            this._label(`Side: ${s.side}`),
            this._button('Switch', () =>
                this._change(
                    'setting', 'side',
                    s.side === 'right' ? 'left' : 'right'
                )
            )
        );

        this._body.add_child(panel);
    }

    // ---------- Position and height ----------

    _position() {
        if (!this._root || !this._data || !this._scroll)
            return;

        const monitor = Main.layoutManager.primaryMonitor;
        if (!monitor)
            return;

        const s = this._data.settings;

        const width = Math.min(
            Number(s.width) || 360,
            monitor.width - 48
        );

        const top = Number(s.top) || 50;

        const x = s.side === 'left'
            ? monitor.x + 24
            : monitor.x + monitor.width - width - 24;

        this._root.set_width(width);
        this._root.set_position(x, monitor.y + top);

        const [, naturalHeight] =
            this._body.get_preferred_height(width - 40);

        const available = Math.max(
            120,
            monitor.height - top - 70
        );

        this._scroll.set_height(
            Math.max(
                80,
                Math.min(naturalHeight + 16, available, 700)
            )
        );

        this._queueRestack();
    }


    _deadlineStatus(value) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

        if (!match)
            return {text: value, css: 'wb-date'};

        const year = Number(match[1]);
        const month = Number(match[2]);
        const day = Number(match[3]);

        const now = new Date();

        const todayUTC = Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        const deadlineUTC = Date.UTC(year, month - 1, day);

        const days = Math.round(
            (deadlineUTC - todayUTC) / 86400000
        );

        const months = [
            'Jan', 'Feb', 'Mar', 'Apr',
            'May', 'Jun', 'Jul', 'Aug',
            'Sep', 'Oct', 'Nov', 'Dec'
        ];

        const dateText = `${day} ${months[month - 1]}`;

        if (days < 0) {
            return {
                text: `${dateText} · ${Math.abs(days)}d overdue`,
                css: 'wb-date wb-overdue'
            };
        }

        if (days === 0) {
            return {
                text: `${dateText} · Today`,
                css: 'wb-date wb-today'
            };
        }

        if (days <= 3) {
            return {
                text: `${dateText} · ${days}d left`,
                css: 'wb-date wb-soon'
            };
        }

        return {
            text: `${dateText} · ${days}d left`,
            css: 'wb-date'
        };
    }

    _isToday(dayName) {
        const names = [
            'Sunday', 'Monday', 'Tuesday',
            'Wednesday', 'Thursday', 'Friday',
            'Saturday'
        ];

        const today = names[new Date().getDay()];

        return dayName.trim().toLowerCase().slice(0, 3) ===
            today.toLowerCase().slice(0, 3);
    }

    // ---------- Main rendering ----------

    _render() {
        if (!this._root || !this._data)
            return;

        const d = this._data;
        const s = d.settings;

        this._root.destroy_all_children();

        const dark = s.theme === 'dark';

        const opacity = Math.max(
            40, Math.min(100, Number(s.opacity))
        ) / 100;

        this._root.set_style(
            `background-color: rgba(${
                dark ? '29,34,45' : '252,253,255'
            },${opacity});` +
            `color: ${dark ? '#ffffff' : '#263447'};` +
            `font-size: ${Number(s.font_size) || 13}px;`
        );

        if (dark)
            this._root.add_style_class_name('wb-dark');
        else
            this._root.remove_style_class_name('wb-dark');

        // Header
        const header = new St.BoxLayout({
            style_class: 'wb-header',
            x_expand: true,
        });

        const brand = new St.BoxLayout({
            style_class: 'wb-brand',
            x_expand: true,
        });

        const badge = new St.BoxLayout({
            style_class: 'wb-brand-badge',
        });

        badge.add_child(
            this._icon('view-grid-symbolic', 18, 'wb-brand-icon')
        );

        brand.add_child(badge);

        const titles = new St.BoxLayout({
            vertical: true,
            x_expand: true,
        });

        titles.add_child(
            this._label('dboard', 'wb-brand-title')
        );

        titles.add_child(
            this._label(
                'Your day, at a glance',
                'wb-brand-subtitle'
            )
        );

        brand.add_child(titles);
        header.add_child(brand);

        // Compact / Full switch
        header.add_child(
            this._button(
                this._compactMode ? 'Full' : 'Compact',
                () => this._change(
                    'setting',
                    'compact_mode',
                    String(!this._compactMode)
                )
            )
        );

        header.add_child(
            this._iconButton(
                'preferences-system-symbolic',
                () => {
                    this._settingsOpen = !this._settingsOpen;
                    this._render();
                }
            )
        );

        header.add_child(
            this._iconButton(
                'view-refresh-symbolic',
                () => this._reload()
            )
        );

        this._root.add_child(header);

        // Collapse / Expand all
        const toolbar = new St.BoxLayout({
            style_class: 'wb-row wb-toolbar',
        });

        const allCollapsed = SECTION_IDS.every(
            id => this._collapsed.has(id)
        );

        toolbar.add_child(
            this._button(
                allCollapsed ? 'Expand All' : 'Collapse All',
                () => this._toggleAll()
            )
        );

        this._root.add_child(toolbar);

        // Scrollable content
        this._scroll = new St.ScrollView({
            style_class: 'wb-scroll',
            overlay_scrollbars: true,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            hscrollbar_policy: St.PolicyType.NEVER,
        });

        this._body = new St.BoxLayout({
            vertical: true,
            style_class: 'wb-body',
        });

        this._scroll.set_child(this._body);
        this._root.add_child(this._scroll);

        if (this._settingsOpen)
            this._settingsPanel();

        // 1. TASKS
        const completed = d.tasks.filter(t => t.done).length;

        let section = this._section(
            'tasks',
            'Today’s Tasks',
            'view-list-symbolic',
            `${completed}/${d.tasks.length}`
        );

        if (section) {
            for (const item of d.tasks) {
                if (this._editingTaskId === item.id) {
                    const entry = new St.Entry({
                        text: item.title,
                        hint_text: 'Edit task name',
                        style_class: 'wb-input',
                        x_expand: true,
                        can_focus: true,
                    });

                    const cancel = () => {
                        this._editingTaskId = null;
                        this._render();
                    };

                    const save = () => {
                        const title = entry.get_text().trim();

                        if (!title) {
                            Main.notify(
                                'dboard',
                                'Task name cannot be empty'
                            );
                            return;
                        }

                        this._editingTaskId = null;

                        if (title !== item.title)
                            this._change('edit-task', item.id, title);
                        else
                            this._render();
                    };

                    entry.clutter_text.connect('activate', save);

                    this._row(
                        section,
                        entry,
                        this._iconButton(
                            'emblem-ok-symbolic',
                            save,
                            'wb-add'
                        ),
                        this._iconButton(
                            'window-close-symbolic',
                            cancel,
                            'wb-remove'
                        )
                    );

                } else {
                    const checkbox = new St.Button({
                        style_class:
                            `wb-checkbox ${item.done ? 'wb-checked' : ''}`,
                        child: item.done
                            ? this._icon('emblem-ok-symbolic', 14)
                            : new St.Widget({
                                width: 14,
                                height: 14,
                            }),
                        reactive: true,
                        can_focus: true,
                    });

                    checkbox.connect('clicked', () =>
                        this._change('toggle-task', item.id)
                    );

                    this._row(
                        section,
                        checkbox,
                        this._label(
                            item.title,
                            item.done ? 'wb-completed' : 'wb-text'
                        ),
                        this._iconButton(
                            'document-edit-symbolic',
                            () => {
                                this._editingTaskId = item.id;
                                this._render();
                            }
                        ),
                        this._iconButton(
                            'window-close-symbolic',
                            () => this._change(
                                'remove-task', item.id
                            ),
                            'wb-remove'
                        )
                    );
                }
            }

            this._input(
                section, 'Add a task…',
                value => this._change('add-task', value)
            );
        }

        // 2. DEADLINES
        section = this._section(
            'deadlines',
            'Upcoming Deadlines',
            'alarm-symbolic',
            String(d.deadlines.length)
        );

        if (section) {
            for (const item of d.deadlines) {
                this._row(
                    section,
                    this._label(item.title),
                    this._label(
                        this._deadlineStatus(item.date).text,
                        this._deadlineStatus(item.date).css,
                        false
                    ),
                    this._iconButton(
                        'window-close-symbolic',
                        () => this._change(
                            'remove-deadline', item.id
                        ),
                        'wb-remove'
                    )
                );
            }

            this._input(
                section,
                'YYYY-MM-DD | Deadline',
                value => {
                    const [date, ...rest] = value
                        .split('|')
                        .map(x => x.trim());

                    const title = rest.join('|').trim();

                    if (!date || !title) {
                        Main.notify(
                            'dboard',
                            'Use YYYY-MM-DD | Title'
                        );
                        return;
                    }

                    this._change('add-deadline', date, title);
                }
            );
        }

        // 3. PROJECTS
        section = this._section(
            'projects',
            'Project Progress',
            'folder-symbolic',
            String(d.projects.length)
        );

        if (section) {
            for (const item of d.projects) {
                this._row(
                    section,
                    this._label(item.title),
                    this._label(
                        `${item.progress}%`,
                        'wb-muted',
                        false
                    ),
                    this._button('−', () =>
                        this._change(
                            'progress', item.id, '-10'
                        )
                    ),
                    this._button('+', () =>
                        this._change(
                            'progress', item.id, '10'
                        )
                    ),
                    this._iconButton(
                        'window-close-symbolic',
                        () => this._change(
                            'remove-project', item.id
                        ),
                        'wb-remove'
                    )
                );

                const track = new St.Widget({
                    style_class: 'wb-progress-track',
                    height: 6,
                    x_expand: true,
                });

                const bar = new St.Widget({
                    style_class: 'wb-progress-bar',
                    height: 6,
                    width: 1,
                });

                track.add_child(bar);

                track.connect('notify::width', () => {
                    bar.set_width(Math.max(
                        1,
                        Math.round(
                            track.width *
                            Number(item.progress) / 100
                        )
                    ));
                });

                section.add_child(track);
            }

            this._input(
                section,
                'Add project…',
                value => this._change('add-project', value)
            );
        }

        // 4. WEEKLY SCHEDULE
        section = this._section(
            'schedule',
            'Weekly Schedule',
            'x-office-calendar-symbolic',
            String(d.events.length)
        );

        if (section) {
            for (const item of d.events) {
                this._row(
                    section,
                    this._label(
                        `${item.day} ${item.time} · ${item.title}`,
                        this._isToday(item.day)
                            ? 'wb-today-event'
                            : 'wb-text'
                    ),
                    this._iconButton(
                        'window-close-symbolic',
                        () => this._change(
                            'remove-event', item.id
                        ),
                        'wb-remove'
                    )
                );
            }

            this._input(
                section,
                'Day | Time | Activity',
                value => {
                    const parts = value
                        .split('|')
                        .map(x => x.trim());

                    if (
                        parts.length !== 3 ||
                        parts.some(x => !x)
                    ) {
                        Main.notify(
                            'dboard',
                            'Use Day | Time | Activity'
                        );
                        return;
                    }

                    this._change('add-event', ...parts);
                }
            );
        }

        // 5. IMPORTANT NOTE
        section = this._section(
            'notes',
            'Important Note',
            'document-edit-symbolic'
        );

        if (section) {
            if (this._compactMode) {
                section.add_child(
                    this._label(
                        d.note || 'No note added yet',
                        'wb-text'
                    )
                );
            } else {
                this._input(
                    section,
                    'Write a note…',
                    value => this._change('note', value),
                    d.note || '',
                    true
                );
            }
        }

        this._position();
    }
}
