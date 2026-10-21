
#!/usr/bin/env python3
"""dboard: Python backend for the GNOME desktop widget."""

import argparse
import copy
import json
import os
import sys
import tempfile
import uuid
from datetime import date
from pathlib import Path

DATA_FILE = Path.home() / ".local/share/dboard/data.json"

DEFAULT = {
    "tasks": [],
    "deadlines": [],
    "projects": [],
    "events": [],
    "note": "",
    "settings": {
        "opacity": 85,
        "width": 360,
        "theme": "light",
        "side": "right",
        "font_size": 13,
        "top": 50,
        "compact_mode": False,
        "collapsed_sections": [],
    },
}


def load():
    if not DATA_FILE.exists():
        return copy.deepcopy(DEFAULT)

    with DATA_FILE.open(encoding="utf-8") as file:
        stored = json.load(file)

    if not isinstance(stored, dict):
        raise ValueError("Invalid data file")

    data = copy.deepcopy(DEFAULT)

    for key in data:
        if key in stored:
            data[key] = stored[key]

    data["settings"] = {
        **DEFAULT["settings"],
        **stored.get("settings", {}),
    }

    return data


def save(data):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    fd, temporary = tempfile.mkstemp(
        prefix=".workboard-",
        suffix=".json",
        dir=DATA_FILE.parent,
    )

    try:
        with os.fdopen(fd, "w", encoding="utf-8") as file:
            json.dump(data, file, indent=2, ensure_ascii=False)
            file.write("\n")
            file.flush()
            os.fsync(file.fileno())

        os.replace(temporary, DATA_FILE)

    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def find(items, item_id):
    for item in items:
        if item["id"] == item_id:
            return item

    raise ValueError("Item not found")


def new_item(**fields):
    return {"id": uuid.uuid4().hex[:12], **fields}


def main():
    parser = argparse.ArgumentParser(
        description="dboard data manager"
    )

    commands = parser.add_subparsers(
        dest="command",
        required=True,
    )

    commands.add_parser("get")

    p = commands.add_parser("add-task")
    p.add_argument("title")

    p = commands.add_parser("edit-task")
    p.add_argument("id")
    p.add_argument("title")

    p = commands.add_parser("toggle-task")
    p.add_argument("id")

    p = commands.add_parser("remove-task")
    p.add_argument("id")

    p = commands.add_parser("add-deadline")
    p.add_argument("date")
    p.add_argument("title")

    p = commands.add_parser("remove-deadline")
    p.add_argument("id")

    p = commands.add_parser("add-project")
    p.add_argument("title")

    p = commands.add_parser("progress")
    p.add_argument("id")
    p.add_argument("delta", type=int)

    p = commands.add_parser("remove-project")
    p.add_argument("id")

    p = commands.add_parser("add-event")
    p.add_argument("day")
    p.add_argument("time")
    p.add_argument("title")

    p = commands.add_parser("remove-event")
    p.add_argument("id")

    p = commands.add_parser("note")
    p.add_argument("text")

    p = commands.add_parser("setting")
    p.add_argument("key")
    p.add_argument("value")

    args = parser.parse_args()
    data = load()

    if args.command == "get":
        print(json.dumps(data, indent=2, ensure_ascii=False))
        return

    if args.command == "add-task":
        title = args.title.strip()
        if not title:
            raise ValueError("Task cannot be empty")

        data["tasks"].append(
            new_item(title=title, done=False)
        )

    elif args.command == "toggle-task":
        item = find(data["tasks"], args.id)
        item["done"] = not item["done"]

    elif args.command == "edit-task":
        title = args.title.strip()

        if not title:
            raise ValueError("Task title cannot be empty")

        item = find(data["tasks"], args.id)
        item["title"] = title

    elif args.command == "remove-task":
        find(data["tasks"], args.id)
        data["tasks"] = [
            x for x in data["tasks"] if x["id"] != args.id
        ]

    elif args.command == "add-deadline":
        date.fromisoformat(args.date)
        title = args.title.strip()

        if not title:
            raise ValueError("Deadline title cannot be empty")

        data["deadlines"].append(
            new_item(date=args.date, title=title)
        )
        data["deadlines"].sort(key=lambda x: x["date"])

    elif args.command == "remove-deadline":
        find(data["deadlines"], args.id)
        data["deadlines"] = [
            x for x in data["deadlines"] if x["id"] != args.id
        ]

    elif args.command == "add-project":
        title = args.title.strip()

        if not title:
            raise ValueError("Project title cannot be empty")

        data["projects"].append(
            new_item(title=title, progress=0)
        )

    elif args.command == "progress":
        item = find(data["projects"], args.id)
        item["progress"] = max(
            0,
            min(100, int(item["progress"]) + args.delta),
        )

    elif args.command == "remove-project":
        find(data["projects"], args.id)
        data["projects"] = [
            x for x in data["projects"] if x["id"] != args.id
        ]

    elif args.command == "add-event":
        if not all([
            args.day.strip(),
            args.time.strip(),
            args.title.strip(),
        ]):
            raise ValueError("Day, time and title required")

        data["events"].append(
            new_item(
                day=args.day.strip(),
                time=args.time.strip(),
                title=args.title.strip(),
            )
        )

    elif args.command == "remove-event":
        find(data["events"], args.id)
        data["events"] = [
            x for x in data["events"] if x["id"] != args.id
        ]

    elif args.command == "note":
        data["note"] = args.text.strip()

    elif args.command == "setting":
        key = args.key
        value = args.value

        if key == "opacity":
            value = max(40, min(100, int(value)))
        elif key == "width":
            value = max(300, min(500, int(value)))
        elif key == "font_size":
            value = max(11, min(18, int(value)))
        elif key == "top":
            value = max(36, min(200, int(value)))
        elif key == "theme":
            if value not in ("light", "dark"):
                raise ValueError("Invalid theme")
        elif key == "side":
            if value not in ("left", "right"):
                raise ValueError("Invalid side")
        elif key == "compact_mode":
            if value not in ("true", "false"):
                raise ValueError("Compact mode must be true or false")
            value = value == "true"

        elif key == "collapsed_sections":
            allowed = {
                "tasks",
                "deadlines",
                "projects",
                "schedule",
                "notes",
            }

            sections = [
                x.strip()
                for x in value.split(",")
                if x.strip()
            ]

            if any(x not in allowed for x in sections):
                raise ValueError("Invalid section name")

            value = list(dict.fromkeys(sections))

        else:
            raise ValueError("Unknown setting")

        data["settings"][key] = value

    save(data)
    print(json.dumps({"ok": True}))


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        sys.exit(1)
