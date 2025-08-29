#!/usr/bin/env node

// Live Training Runner - Tests against actual Railway API
// This script runs real tests against your deployed chat API

const config = require('./training-config');
const https = require('https');
const http = require('http');

console.log('\n🚀 LIVE AI CHAT TRAINING SYSTEM');
console.log('=' .repeat(70));
console.log(`Testing against: ${config.CHAT_API_URL}`);
console.log(`Date: ${new Date().toLocaleString()}\n`);

class LiveTrainingRunner {
  constructor() {
    this.startTime = Date.now();
    this.results = {
      conversations: [],
      performance: {},
      frameworks: {},
      errors: []
    };
  }

  async makeApiRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(config.CHAT_API_URL + endpoint);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.CHAT_API_KEY
        },
        timeout: config.TEST_TIMEOUT
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const lib = url.protocol === 'https:' ? https : http;
      const req = lib.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({
              statusCode: res.statusCode,
              data: parsed,
              headers: res.headers
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              data: responseData,
              headers: res.headers
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async testApiHealth() {
    console.log('🔍 Testing API Health...');
    try {
      const response = await this.makeApiRequest(config.endpoints.health);
      if (response.statusCode === 200) {
        console.log('✅ API is healthy and responding');
        return true;
      } else {
        console.log(`❌ API health check failed: ${response.statusCode}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ API health check error: ${error.message}`);
      return false;
    }
  }

  async testConversationFlow(scenario) {
    const startTime = Date.now();
    
    try {
      // 1. Start conversation
      const startResponse = await this.makeApiRequest(
        config.endpoints.startConversation, 
        'POST',
        {
          customer_id: `test_${Date.now()}`,
          context: scenario.context
        }
      );

      if (startResponse.statusCode !== 200) {
        throw new Error(`Failed to start conversation: ${startResponse.statusCode}`);
      }

      const sessionId = startResponse.data.data?.session_id || startResponse.data.data?.sessionId || startResponse.data.session_id || startResponse.data.sessionId;
      if (!sessionId) {
        console.log('Debug - Start response:', JSON.stringify(startResponse.data, null, 2));
        throw new Error('No session ID returned');
      }

      // 2. Send test message
      const messageResponse = await this.makeApiRequest(
        config.endpoints.sendMessage,
        'POST',
        {
          session_id: sessionId,
          message: scenario.message,
          role: 'user'
        }
      );

      if (messageResponse.statusCode !== 200) {
        throw new Error(`Failed to send message: ${messageResponse.statusCode}`);
      }

      const responseTime = Date.now() - startTime;
      const framework = messageResponse.data.framework || 'unknown';
      
      // 3. End conversation
      await this.makeApiRequest(
        config.endpoints.endConversation,
        'POST',
        { session_id: sessionId }
      );

      return {
        success: true,
        sessionId,
        framework,
        responseTime,
        response: messageResponse.data.reply || messageResponse.data.message,
        scenario: scenario.name
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        scenario: scenario.name,
        responseTime: Date.now() - startTime
      };
    }
  }

  async runLiveTests() {
    console.log('📊 Starting live API tests...\n');
    
    // Check API health first
    const isHealthy = await this.testApiHealth();
    if (!isHealthy) {
      console.log('❌ API is not healthy. Aborting tests.');
      return;
    }

    // Test scenarios for each framework
    const testScenarios = [
      {
        name: 'PRECISION - Wedding Planning',
        context: { intent: 'wedding', budget: 'premium' },
        message: 'I need a tuxedo for my wedding in June. What do you recommend?'
      },
      {
        name: 'RESTORE - Size Issue',
        context: { intent: 'problem', issue_type: 'sizing' },
        message: 'The suit I ordered is too small. Can you help me with an exchange?'
      },
      {
        name: 'ATELIER - Luxury Consultation', 
        context: { intent: 'style', tier: 'luxury' },
        message: 'I want the finest formal wear for a black-tie gala. Show me your best.'
      },
      {
        name: 'PRECISION - Business Professional',
        context: { intent: 'career', industry: 'finance' },
        message: 'I need a professional suit for job interviews in investment banking.'
      },
      {
        name: 'RESTORE - Delivery Problem',
        context: { intent: 'problem', issue_type: 'shipping' },
        message: 'My order is late and I need it for an event tomorrow. What can you do?'
      }
    ];

    console.log(`🧪 Running ${testScenarios.length} test scenarios...\n`);

    let successCount = 0;
    let totalResponseTime = 0;
    const frameworkCounts = {};

    for (const scenario of testScenarios) {
      console.log(`Testing: ${scenario.name}`);
      const result = await this.testConversationFlow(scenario);
      
      if (result.success) {
        console.log(`  ✅ Success - ${result.framework} framework (${result.responseTime}ms)`);
        successCount++;
        totalResponseTime += result.responseTime;
        frameworkCounts[result.framework] = (frameworkCounts[result.framework] || 0) + 1;
      } else {
        console.log(`  ❌ Failed - ${result.error}`);
        this.results.errors.push(result);
      }
      
      this.results.conversations.push(result);
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate metrics
    const successRate = (successCount / testScenarios.length) * 100;
    const avgResponseTime = totalResponseTime / successCount;
    
    this.results.performance = {
      successRate,
      avgResponseTime,
      totalTests: testScenarios.length,
      successfulTests: successCount,
      failedTests: testScenarios.length - successCount
    };
    
    this.results.frameworks = frameworkCounts;
    
    this.generateReport();
  }

  generateReport() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 LIVE TRAINING REPORT');
    console.log('='.repeat(70));
    console.log(`Duration: ${duration}s`);
    console.log(`API Endpoint: ${config.CHAT_API_URL}`);
    
    const perf = this.results.performance;
    console.log(`\n📈 PERFORMANCE METRICS:`);
    console.log(`  Success Rate: ${perf.successRate?.toFixed(1)}%`);
    console.log(`  Average Response Time: ${perf.avgResponseTime?.toFixed(0)}ms`);
    console.log(`  Total Tests: ${perf.totalTests}`);
    console.log(`  Successful: ${perf.successfulTests}`);
    console.log(`  Failed: ${perf.failedTests}`);
    
    console.log(`\n🧠 FRAMEWORK DISTRIBUTION:`);
    Object.entries(this.results.frameworks).forEach(([framework, count]) => {
      console.log(`  ${framework}: ${count} conversations`);
    });
    
    if (this.results.errors.length > 0) {
      console.log(`\n❌ ERRORS (${this.results.errors.length}):`);
      this.results.errors.forEach(error => {
        console.log(`  ${error.scenario}: ${error.error}`);
      });
    }
    
    // Performance assessment
    console.log(`\n🎯 ASSESSMENT:`);
    if (perf.successRate >= config.MIN_SUCCESS_RATE) {
      console.log(`  ✅ Success rate meets target (${config.MIN_SUCCESS_RATE}%)`);
    } else {
      console.log(`  ❌ Success rate below target (${config.MIN_SUCCESS_RATE}%)`);
    }
    
    if (perf.avgResponseTime <= config.MAX_RESPONSE_TIME) {
      console.log(`  ✅ Response time meets target (${config.MAX_RESPONSE_TIME}ms)`);
    } else {
      console.log(`  ❌ Response time above target (${config.MAX_RESPONSE_TIME}ms)`);
    }
    
    console.log('\n📋 NEXT STEPS:');
    if (perf.successRate < config.MIN_SUCCESS_RATE) {
      console.log('  • Investigate failed test scenarios');
      console.log('  • Check API error logs');
      console.log('  • Verify framework routing logic');
    }
    if (perf.avgResponseTime > config.MAX_RESPONSE_TIME) {
      console.log('  • Optimize response generation');
      console.log('  • Check database query performance');
      console.log('  • Review framework selection speed');
    }
    if (perf.successRate >= config.MIN_SUCCESS_RATE && perf.avgResponseTime <= config.MAX_RESPONSE_TIME) {
      console.log('  ✅ All metrics meeting targets - system performing well!');
    }
  }
}

// Run the training
if (require.main === module) {
  const runner = new LiveTrainingRunner();
  runner.runLiveTests().catch(error => {
    console.error('❌ Training failed:', error);
    process.exit(1);
  });
}

module.exports = LiveTrainingRunner;
