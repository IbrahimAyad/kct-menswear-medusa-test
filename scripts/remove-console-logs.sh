#!/bin/bash
echo "Removing console.log statements from src directory..."
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) -exec sed -i '' '/console\.log/d' {} \;
echo "Console.log statements removed!"
