
#!/usr/bin/env bash
set -euo pipefail

UUID="dboard@local"
APP_DIR="$HOME/.local/share/dboard"
EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

echo "Uninstalling dboard..."

if command -v gnome-extensions >/dev/null 2>&1; then
    gnome-extensions disable "$UUID" || true
fi

if [ -d "$EXT_DIR" ]; then
    rm -r -- "$EXT_DIR"
fi

if [ -f "$APP_DIR/backend.py" ]; then
    rm -- "$APP_DIR/backend.py"
fi

echo "dboard uninstalled successfully."
echo "Your personal data remains in: $APP_DIR"
echo "Log out and log back in to finish."
