#!/bin/bash

# Error handling
set -e
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
trap 'echo "\"${last_command}\" command failed with exit code $?."' EXIT

# Function to check if a command exists
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: $1 is required but not installed."
        exit 1
    fi
}

# Check prerequisites
echo "Checking prerequisites..."
check_command python3
check_command git
check_command pip3

# Check Python version
python_version=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if (( $(echo "$python_version < 3.10" | bc -l) )); then
    echo "Error: Python 3.10 or higher is required (found $python_version)"
    exit 1
fi

# Create and activate virtual environment
echo "Setting up virtual environment..."
python3 -m venv comfyui-env
source comfyui-env/bin/activate

# Create ComfyUI directory if it doesn't exist
echo "Creating ComfyUI directory..."
mkdir -p comfyui
cd comfyui

# Clone or update ComfyUI repository
if [ ! -d "ComfyUI" ]; then
    echo "Cloning ComfyUI repository..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
    cd ComfyUI
else
    echo "Updating existing ComfyUI repository..."
    cd ComfyUI
    git pull
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# Create models directory and download required model
echo "Setting up models..."
mkdir -p models/checkpoints
if [ ! -f "models/checkpoints/v2-1_768-ema-pruned.ckpt" ]; then
    echo "Downloading Stable Diffusion v2.1 model..."
    wget -P models/checkpoints/ https://huggingface.co/stabilityai/stable-diffusion-2-1/resolve/main/v2-1_768-ema-pruned.ckpt
fi

# Create a startup script
echo "Creating startup script..."
cat > ../../start-comfyui.sh << 'EOL'
#!/bin/bash
cd "$(dirname "$0")/comfyui/ComfyUI"
source ../../comfyui-env/bin/activate
python main.py --listen 0.0.0.0 --port 8188
EOL

chmod +x ../../start-comfyui.sh

echo "ComfyUI setup complete!"
echo "To start ComfyUI, run: ./start-comfyui.sh"
echo "Then visit http://localhost:8188 in your browser"

# Clean up error handling
trap - EXIT
