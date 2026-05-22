#!/bin/bash

# VioletCare Testing Setup Script
# This script helps test the PWA locally before deployment

echo "🎯 VioletCare Testing Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ .env created. Please fill in your Firebase credentials."
    echo ""
    echo "Required values:"
    echo "  - VITE_FIREBASE_API_KEY"
    echo "  - VITE_FIREBASE_AUTH_DOMAIN"
    echo "  - VITE_FIREBASE_PROJECT_ID"
    echo "  - VITE_FIREBASE_STORAGE_BUCKET"
    echo "  - VITE_FIREBASE_MESSAGING_SENDER_ID"
    echo "  - VITE_FIREBASE_APP_ID"
    echo ""
    exit 1
fi

echo "✅ .env file found"
echo ""

# Check if node_modules exists
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Check if firebase is initialized
if [ ! -f firebase.json ]; then
    echo "⚠️  Firebase not initialized!"
    echo "📝 Run: firebase init"
    echo ""
    exit 1
fi

echo "✅ Firebase configured"
echo ""

# Offer to start emulators
echo "🤔 Would you like to start Firebase emulators? (y/n)"
read -r start_emulators

if [ "$start_emulators" = "y" ]; then
    echo "🚀 Starting Firebase emulators..."
    echo ""
    echo "In another terminal, run: npm run dev"
    echo ""
    firebase emulators:start
else
    echo ""
    echo "🚀 Starting development server..."
    echo ""
    echo "📱 Testing Checklist:"
    echo "  [ ] User can sign up with email"
    echo "  [ ] Install prompt appears"
    echo "  [ ] App can be installed"
    echo "  [ ] Offline mode works"
    echo "  [ ] Admin can access admin panel"
    echo "  [ ] Photos can be uploaded"
    echo ""
    npm run dev
fi
