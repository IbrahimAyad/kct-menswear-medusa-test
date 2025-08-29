#!/bin/bash

# Setup script for automated weekly AI testing
# Run this once to configure automatic weekly test execution

echo "🚀 KCT AI Test Automation Setup"
echo "================================"
echo ""

# Check if running on macOS or Linux
if [[ "$OSTYPE" == "darwin"* ]]; then
    CRON_CMD="crontab"
    OS_TYPE="macOS"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    CRON_CMD="crontab"
    OS_TYPE="Linux"
else
    echo "❌ Unsupported OS: $OSTYPE"
    echo "This script supports macOS and Linux only."
    exit 1
fi

echo "✅ Detected OS: $OS_TYPE"
echo ""

# Get the current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Project directory: $SCRIPT_DIR"
echo ""

# Create test results directory
mkdir -p "$SCRIPT_DIR/test-results"
mkdir -p "$SCRIPT_DIR/test-history"
echo "✅ Created test directories"

# Create the test runner wrapper script
cat > "$SCRIPT_DIR/run-tests-cron.sh" << 'EOF'
#!/bin/bash

# Cron job wrapper for weekly tests
# This ensures proper environment setup

# Set up environment
export NODE_ENV=production
export PATH=/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin

# Change to project directory
cd "$(dirname "$0")"

# Log start time
echo "Starting weekly tests at $(date)" >> test-results/cron.log

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Node.js not found!" >> test-results/cron.log
    exit 1
fi

# Run the weekly tests
node run-weekly-tests.js >> test-results/cron.log 2>&1

# Check exit code
if [ $? -eq 0 ]; then
    echo "Tests completed successfully at $(date)" >> test-results/cron.log
else
    echo "Tests failed at $(date)" >> test-results/cron.log
    
    # Send alert (customize this for your notification method)
    # Example: send email
    # echo "AI tests failed. Check logs at $PWD/test-results/cron.log" | mail -s "AI Test Alert" team@kct-menswear.com
fi

# Rotate logs if they get too large (keep last 10MB)
if [ -f test-results/cron.log ]; then
    LOG_SIZE=$(du -k test-results/cron.log | cut -f1)
    if [ $LOG_SIZE -gt 10240 ]; then
        mv test-results/cron.log test-results/cron.log.old
        tail -n 1000 test-results/cron.log.old > test-results/cron.log
        rm test-results/cron.log.old
    fi
fi

echo "----------------------------------------" >> test-results/cron.log
EOF

# Make the wrapper script executable
chmod +x "$SCRIPT_DIR/run-tests-cron.sh"
echo "✅ Created test runner wrapper script"
echo ""

# Offer scheduling options
echo "📅 Choose test schedule:"
echo "  1) Weekly (Every Monday at 3 AM)"
echo "  2) Daily (Every day at 2 AM)"
echo "  3) Twice weekly (Monday and Thursday at 3 AM)"
echo "  4) Custom schedule"
echo "  5) Skip scheduling (manual run only)"
echo ""
read -p "Enter choice (1-5): " SCHEDULE_CHOICE

case $SCHEDULE_CHOICE in
    1)
        CRON_SCHEDULE="0 3 * * 1"
        SCHEDULE_DESC="Every Monday at 3 AM"
        ;;
    2)
        CRON_SCHEDULE="0 2 * * *"
        SCHEDULE_DESC="Every day at 2 AM"
        ;;
    3)
        CRON_SCHEDULE="0 3 * * 1,4"
        SCHEDULE_DESC="Monday and Thursday at 3 AM"
        ;;
    4)
        echo "Enter custom cron schedule (e.g., '0 3 * * 1' for Monday 3 AM):"
        read CRON_SCHEDULE
        SCHEDULE_DESC="Custom: $CRON_SCHEDULE"
        ;;
    5)
        echo "✅ Skipping cron scheduling. You can run tests manually with:"
        echo "   node run-weekly-tests.js"
        echo ""
        echo "Setup complete!"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

# Add to crontab
echo ""
echo "📝 Adding to crontab..."
echo "Schedule: $SCHEDULE_DESC"

# Check if cron job already exists
if $CRON_CMD -l 2>/dev/null | grep -q "run-tests-cron.sh"; then
    echo "⚠️  Cron job already exists. Updating..."
    # Remove old entry
    $CRON_CMD -l 2>/dev/null | grep -v "run-tests-cron.sh" | $CRON_CMD -
fi

# Add new cron job
($CRON_CMD -l 2>/dev/null; echo "$CRON_SCHEDULE $SCRIPT_DIR/run-tests-cron.sh") | $CRON_CMD -

if [ $? -eq 0 ]; then
    echo "✅ Cron job added successfully!"
else
    echo "❌ Failed to add cron job"
    exit 1
fi

echo ""
echo "📋 Current cron jobs:"
$CRON_CMD -l | grep "run-tests-cron.sh"

echo ""
echo "🔧 Additional Setup Options:"
echo ""
echo "Would you like to set up email notifications? (y/n)"
read -p "> " SETUP_EMAIL

if [[ "$SETUP_EMAIL" == "y" ]] || [[ "$SETUP_EMAIL" == "Y" ]]; then
    echo "Enter email address for test notifications:"
    read -p "> " EMAIL_ADDRESS
    
    # Add email configuration to wrapper script
    sed -i.bak "s/team@kct-menswear.com/$EMAIL_ADDRESS/g" "$SCRIPT_DIR/run-tests-cron.sh"
    echo "✅ Email notifications configured for: $EMAIL_ADDRESS"
fi

echo ""
echo "Would you like to set up Slack notifications? (y/n)"
read -p "> " SETUP_SLACK

if [[ "$SETUP_SLACK" == "y" ]] || [[ "$SETUP_SLACK" == "Y" ]]; then
    echo "Enter Slack webhook URL:"
    read -p "> " SLACK_WEBHOOK
    
    # Create Slack notification script
    cat > "$SCRIPT_DIR/notify-slack.sh" << EOF
#!/bin/bash
# Slack notification for test results

WEBHOOK_URL="$SLACK_WEBHOOK"
SUCCESS_RATE=\$(grep "Success Rate:" test-results/cron.log | tail -1 | grep -oE '[0-9]+\.[0-9]+')

if [ -z "\$SUCCESS_RATE" ]; then
    SUCCESS_RATE="Unknown"
fi

curl -X POST \$WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d "{
    \"text\": \"Weekly AI Test Results\",
    \"attachments\": [{
      \"color\": \"\$([ \"\$SUCCESS_RATE\" -ge 85 ] && echo \"good\" || echo \"danger\")\",
      \"fields\": [{
        \"title\": \"Success Rate\",
        \"value\": \"\${SUCCESS_RATE}%\",
        \"short\": true
      }]
    }]
  }"
EOF
    
    chmod +x "$SCRIPT_DIR/notify-slack.sh"
    echo "✅ Slack notifications configured"
fi

echo ""
echo "================================"
echo "✅ SETUP COMPLETE!"
echo "================================"
echo ""
echo "📊 Test Schedule: $SCHEDULE_DESC"
echo "📁 Test Results: $SCRIPT_DIR/test-results/"
echo "📜 Logs: $SCRIPT_DIR/test-results/cron.log"
echo ""
echo "🎯 Next Steps:"
echo "  1. Tests will run automatically according to schedule"
echo "  2. Check test-results/cron.log for execution logs"
echo "  3. Run manually anytime: node run-weekly-tests.js"
echo "  4. View cron jobs: crontab -l"
echo "  5. Remove automation: crontab -l | grep -v 'run-tests-cron.sh' | crontab -"
echo ""
echo "💡 Tips:"
echo "  - Monitor test-results/ directory for reports"
echo "  - Set up monitoring alerts for failures"
echo "  - Review weekly trends in test-history/"
echo "  - Keep test scenarios updated with new use cases"
echo ""
echo "Happy Testing! 🚀"