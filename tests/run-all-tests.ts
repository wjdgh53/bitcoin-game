#!/usr/bin/env tsx
/**
 * Comprehensive test runner for Bitcoin Game application
 * This script runs all Playwright tests and generates a detailed report
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests() {
    console.log('🚀 Starting comprehensive Bitcoin Game test suite...\n');
    this.startTime = Date.now();

    try {
      // Check if development server is running
      await this.checkDevServer();

      // Run different test suites
      await this.runTestSuite('Navigation & UI Tests', 'tests/e2e/navigation.spec.ts tests/e2e/home-page.spec.ts');
      await this.runTestSuite('Agents Functionality Tests', 'tests/e2e/agents-list.spec.ts tests/e2e/agent-detail.spec.ts');
      await this.runTestSuite('Chat Functionality Tests', 'tests/e2e/chat.spec.ts');
      await this.runTestSuite('Dashboard & Reports Tests', 'tests/e2e/dashboard-reports.spec.ts');
      await this.runTestSuite('User Flow Tests', 'tests/e2e/user-flows.spec.ts');
      await this.runTestSuite('API Tests', 'tests/api');

      // Generate comprehensive report
      await this.generateReport();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private async checkDevServer() {
    console.log('🔍 Checking if development server is running...');
    
    try {
      const response = await fetch('http://localhost:3000');
      console.log('✅ Development server is running\n');
    } catch (error) {
      console.log('⚠️  Development server not running. Starting it now...');
      console.log('Please run "npm run dev" in another terminal and then re-run tests.\n');
      
      // Optionally start dev server automatically (uncomment if needed)
      // exec('npm run dev &');
      // await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
  }

  private async runTestSuite(suiteName: string, testPath: string): Promise<void> {
    console.log(`📋 Running ${suiteName}...`);
    
    try {
      const command = `npx playwright test ${testPath} --reporter=json`;
      const { stdout, stderr } = await execAsync(command);
      
      const result = this.parseTestResults(suiteName, stdout);
      this.results.push(result);
      
      this.printSuiteResults(result);
      
    } catch (error) {
      const result: TestResult = {
        suite: suiteName,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        errors: [error.message || 'Unknown error']
      };
      
      this.results.push(result);
      console.log(`❌ ${suiteName} failed to run: ${error.message}\n`);
    }
  }

  private parseTestResults(suiteName: string, jsonOutput: string): TestResult {
    try {
      const data = JSON.parse(jsonOutput);
      
      return {
        suite: suiteName,
        passed: data.suites?.reduce((sum: number, suite: any) => 
          sum + (suite.specs?.filter((spec: any) => spec.tests?.some((test: any) => test.results?.some((result: any) => result.status === 'passed'))).length || 0), 0) || 0,
        failed: data.suites?.reduce((sum: number, suite: any) => 
          sum + (suite.specs?.filter((spec: any) => spec.tests?.some((test: any) => test.results?.some((result: any) => result.status === 'failed'))).length || 0), 0) || 0,
        skipped: data.suites?.reduce((sum: number, suite: any) => 
          sum + (suite.specs?.filter((spec: any) => spec.tests?.some((test: any) => test.results?.some((result: any) => result.status === 'skipped'))).length || 0), 0) || 0,
        duration: data.stats?.duration || 0,
        errors: this.extractErrors(data)
      };
    } catch (error) {
      return {
        suite: suiteName,
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        errors: ['Failed to parse test results']
      };
    }
  }

  private extractErrors(data: any): string[] {
    const errors: string[] = [];
    
    if (data.suites) {
      data.suites.forEach((suite: any) => {
        if (suite.specs) {
          suite.specs.forEach((spec: any) => {
            if (spec.tests) {
              spec.tests.forEach((test: any) => {
                if (test.results) {
                  test.results.forEach((result: any) => {
                    if (result.status === 'failed' && result.error) {
                      errors.push(`${spec.title}: ${result.error.message || 'Unknown error'}`);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
    
    return errors;
  }

  private printSuiteResults(result: TestResult): void {
    const total = result.passed + result.failed + result.skipped;
    const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`  ✅ Passed: ${result.passed}`);
    console.log(`  ❌ Failed: ${result.failed}`);
    console.log(`  ⏭️  Skipped: ${result.skipped}`);
    console.log(`  📊 Pass Rate: ${passRate}%`);
    console.log(`  ⏱️  Duration: ${(result.duration / 1000).toFixed(2)}s`);
    
    if (result.errors.length > 0) {
      console.log(`  🚨 Errors:`);
      result.errors.slice(0, 3).forEach(error => console.log(`     - ${error}`));
      if (result.errors.length > 3) {
        console.log(`     ... and ${result.errors.length - 3} more errors`);
      }
    }
    
    console.log('');
  }

  private async generateReport(): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const totalPassed = this.results.reduce((sum, result) => sum + result.passed, 0);
    const totalFailed = this.results.reduce((sum, result) => sum + result.failed, 0);
    const totalSkipped = this.results.reduce((sum, result) => sum + result.skipped, 0);
    const totalTests = totalPassed + totalFailed + totalSkipped;
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

    console.log('═'.repeat(80));
    console.log('📊 COMPREHENSIVE TEST RESULTS SUMMARY');
    console.log('═'.repeat(80));
    console.log(`🎯 Overall Results:`);
    console.log(`   ✅ Total Passed: ${totalPassed}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    console.log(`   ⏭️  Total Skipped: ${totalSkipped}`);
    console.log(`   📊 Overall Pass Rate: ${overallPassRate}%`);
    console.log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log('');

    console.log('📋 Test Suite Breakdown:');
    this.results.forEach(result => {
      const total = result.passed + result.failed + result.skipped;
      const passRate = total > 0 ? ((result.passed / total) * 100).toFixed(1) : '0.0';
      const status = result.failed > 0 ? '❌' : result.passed > 0 ? '✅' : '⏭️';
      
      console.log(`   ${status} ${result.suite}: ${result.passed}/${total} (${passRate}%)`);
    });

    console.log('');

    // Generate detailed report file
    const reportData = {
      timestamp: new Date().toISOString(),
      totalDuration,
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        totalSkipped,
        overallPassRate: parseFloat(overallPassRate)
      },
      suites: this.results
    };

    const reportPath = path.join(process.cwd(), 'test-results', 'comprehensive-report.json');
    
    // Ensure test-results directory exists
    const testResultsDir = path.join(process.cwd(), 'test-results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    console.log('');

    // Test recommendations
    this.generateRecommendations();

    if (totalFailed > 0) {
      console.log('❌ Some tests failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('🎉 All tests passed successfully!');
    }
  }

  private generateRecommendations(): void {
    console.log('💡 Recommendations:');
    
    const failedSuites = this.results.filter(r => r.failed > 0);
    
    if (failedSuites.length > 0) {
      console.log('   🔧 Fix failing tests in the following suites:');
      failedSuites.forEach(suite => {
        console.log(`      - ${suite.suite} (${suite.failed} failures)`);
      });
    }

    const skippedTests = this.results.reduce((sum, result) => sum + result.skipped, 0);
    if (skippedTests > 0) {
      console.log(`   ⚠️  ${skippedTests} tests were skipped. Consider implementing them.`);
    }

    const slowSuites = this.results.filter(r => r.duration > 30000); // > 30 seconds
    if (slowSuites.length > 0) {
      console.log('   🐌 Consider optimizing these slow test suites:');
      slowSuites.forEach(suite => {
        console.log(`      - ${suite.suite} (${(suite.duration / 1000).toFixed(2)}s)`);
      });
    }

    console.log('   📈 Run "npm run test:report" to view detailed HTML report');
    console.log('   🐛 Use "npm run test:debug" for interactive debugging');
    console.log('');
  }
}

// Main execution
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default TestRunner;