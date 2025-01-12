#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if a process is running on a port
check_port() {
    local port=$1
    lsof -i :$port > /dev/null 2>&1
    return $?
}

# Function to get PID of process running on a port
get_pid_on_port() {
    local port=$1
    lsof -ti :$port 2>/dev/null
}

# Start all services
start_all() {
    print_message $YELLOW "Starting ChromaLink services..."
    
    # Check if Next.js is already running
    if check_port 3000; then
        print_message $RED "Next.js is already running on port 3000"
    else
        print_message $GREEN "Starting Next.js development server..."
        npm run dev &
        sleep 2
        if check_port 3000; then
            print_message $GREEN "✓ Next.js development server started successfully"
        else
            print_message $RED "✗ Failed to start Next.js development server"
        fi
    fi

    # Add more services here as needed
    # For example: ComfyUI server, etc.

    print_message $GREEN "All services started!"
}

# Stop all services
stop_all() {
    print_message $YELLOW "Stopping ChromaLink services..."
    
    # Stop Next.js server
    local next_pid=$(get_pid_on_port 3000)
    if [ ! -z "$next_pid" ]; then
        print_message $YELLOW "Stopping Next.js development server..."
        kill $next_pid
        print_message $GREEN "✓ Next.js development server stopped"
    else
        print_message $GREEN "Next.js development server is not running"
    fi

    # Add more service stopping commands here
    # For example: ComfyUI server, etc.

    print_message $GREEN "All services stopped!"
}

# Restart all services
restart_all() {
    print_message $YELLOW "Restarting ChromaLink services..."
    stop_all
    sleep 2
    start_all
}

# Check if script is being run with sudo
if [ "$EUID" -eq 0 ]; then
    print_message $RED "Please do not run this script with sudo"
    exit 1
fi

# Command line argument handling
case "$1" in
    "start")
        start_all
        ;;
    "stop")
        stop_all
        ;;
    "restart")
        restart_all
        ;;
    *)
        print_message $YELLOW "Usage: $0 {start|stop|restart}"
        exit 1
        ;;
esac

exit 0
