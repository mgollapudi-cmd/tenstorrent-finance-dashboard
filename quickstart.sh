#!/bin/bash

echo "🚀 Tenstorrent AI Lead Detection Platform - Quick Start"
echo "======================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  .env file not found. Creating from template..."
    cp .env.template .env
    echo "✅ .env file created from template"
    echo "📝 Please edit .env and add your OpenAI API key before continuing"
    echo ""
    echo "Press Enter when you've added your API key..."
    read
fi

# Initialize database
echo ""
echo "🗄️  Initializing database..."
npm run setup

if [ $? -ne 0 ]; then
    echo "❌ Database initialization failed"
    exit 1
fi

echo "✅ Database initialized successfully"

# Start the platform
echo ""
echo "🎉 Setup complete! Starting the platform..."
echo "🌐 The dashboard will be available at http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

npm start
