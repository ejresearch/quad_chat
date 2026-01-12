#!/bin/bash

# QuadChat Installer
# Installs the 'quadchat' command globally

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_PATH="/usr/local/bin/quadchat"

echo ""
echo "  QuadChat Installer"
echo "  ==================="
echo ""

# Check for Python 3
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Make the quadchat script executable
chmod +x "$SCRIPT_DIR/quadchat"

# Create symlink in /usr/local/bin (requires sudo)
echo "Installing 'quadchat' command..."

# Create /usr/local/bin if it doesn't exist
if [ ! -d "/usr/local/bin" ]; then
    sudo mkdir -p /usr/local/bin
fi

if [ -L "$INSTALL_PATH" ] || [ -f "$INSTALL_PATH" ]; then
    sudo rm "$INSTALL_PATH"
fi

sudo ln -s "$SCRIPT_DIR/quadchat" "$INSTALL_PATH"

echo ""
echo "  Installation complete!"
echo ""
echo "  Run 'quadchat' from anywhere to start."
echo "  Run 'quadchat --help' for options."
echo ""

# Check if .env exists
if [ ! -f "$SCRIPT_DIR/quadchat_app/backend/.env" ]; then
    echo "  Next: Add your API keys to:"
    echo "  $SCRIPT_DIR/quadchat_app/backend/.env"
    echo ""
fi
