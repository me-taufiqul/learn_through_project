
#!/usr/bin/env bash

set -euo pipefail

# ==========================================
# dboard v1.0.0 Installer
# Ubuntu GNOME Desktop Widget
# ==========================================

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

UUID="dboard@local"

APP_DIR="$HOME/.local/share/dboard"

EXT_DIR="$HOME/.local/share/gnome-shell/extensions/$UUID"

OLD_DATA="$HOME/.local/share/workboard-widget/data.json"

echo "=================================="
echo "       Installing dboard"
echo "=================================="

# 1. Check Python
if ! command -v python3 >/dev/null 2>&1; then
    echo "ERROR: Python 3 is not installed."
    exit 1
fi

# 2. Check GNOME extension tools
if ! command -v gnome-extensions >/dev/null 2>&1; then
    echo "ERROR: GNOME extension tools not found."
    exit 1
fi

# 3. Check required files
FILES=(
    "backend.py"
    "gnome-extension/extension.js"
    "gnome-extension/metadata.json"
    "gnome-extension/stylesheet.css"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$ROOT/$file" ]; then
        echo "ERROR: Missing file: $file"
        exit 1
    fi
done

echo "All required files found."

# 4. Check Python syntax
python3 -m py_compile "$ROOT/backend.py"

echo "Python backend verified."

# 5. Create application directories
mkdir -p "$APP_DIR"
mkdir -p "$EXT_DIR"

# 6. Back up existing installation
if [ -f "$APP_DIR/backend.py" ]; then

    STAMP="$(date +%Y%m%d-%H%M%S)"

    BACKUP_DIR="$APP_DIR/backups/$STAMP"

    mkdir -p "$BACKUP_DIR"

    cp "$APP_DIR/backend.py" "$BACKUP_DIR/backend.py"

    if [ -f "$EXT_DIR/extension.js" ]; then
        cp "$EXT_DIR/extension.js" \
           "$BACKUP_DIR/extension.js"
    fi

    echo "Previous application code backed up."
fi

# 7. Migrate old data if needed
if [ ! -f "$APP_DIR/data.json" ]; then

    if [ -f "$OLD_DATA" ]; then

        cp "$OLD_DATA" "$APP_DIR/data.json"

        chmod 600 "$APP_DIR/data.json"

        echo "Previous WorkBoard data migrated."

    fi
fi

# 8. Install Python backend
install -m 644 \
    "$ROOT/backend.py" \
    "$APP_DIR/backend.py"

echo "Python backend installed."

# 9. Install GNOME extension
install -m 644 \
    "$ROOT/gnome-extension/extension.js" \
    "$EXT_DIR/extension.js"

install -m 644 \
    "$ROOT/gnome-extension/metadata.json" \
    "$EXT_DIR/metadata.json"

install -m 644 \
    "$ROOT/gnome-extension/stylesheet.css" \
    "$EXT_DIR/stylesheet.css"

echo "GNOME extension files installed."

# 10. Verify backend
python3 "$APP_DIR/backend.py" get >/dev/null

echo ""
echo "=================================="
echo "   dboard Installation Complete"
echo "=================================="
echo ""
echo "Installation location:"
echo "$EXT_DIR"
echo ""
echo "Data location:"
echo "$APP_DIR"
echo ""
echo "NEXT STEPS:"
echo "1. Log out of Ubuntu."
echo "2. Log back in."
echo "3. Run:"
echo "   gnome-extensions enable dboard@local"
echo ""
echo "Installation successful!"
