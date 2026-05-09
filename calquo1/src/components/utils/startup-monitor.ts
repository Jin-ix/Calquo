// Simple startup performance monitor
class StartupMonitor {
  private startTime: number;
  private milestones: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
    this.milestone('app-start');
  }

  milestone(name: string): void {
    const time = performance.now();
    this.milestones.set(name, time);
    console.log(`[Startup] ${name}: ${Math.round(time - this.startTime)}ms`);
  }

  getMilestone(name: string): number | undefined {
    const time = this.milestones.get(name);
    return time ? time - this.startTime : undefined;
  }

  getTotalTime(): number {
    return performance.now() - this.startTime;
  }

  getReport(): string {
    const total = this.getTotalTime();
    let report = `\n=== Startup Performance Report ===\n`;
    report += `Total startup time: ${Math.round(total)}ms\n`;
    report += `Milestones:\n`;
    
    const sortedMilestones = Array.from(this.milestones.entries())
      .sort(([, a], [, b]) => a - b);
    
    for (const [name, time] of sortedMilestones) {
      report += `  ${name}: ${Math.round(time - this.startTime)}ms\n`;
    }
    
    report += `================================\n`;
    return report;
  }

  // Static instance for global use
  static instance: StartupMonitor | null = null;

  static getInstance(): StartupMonitor {
    if (!StartupMonitor.instance) {
      StartupMonitor.instance = new StartupMonitor();
    }
    return StartupMonitor.instance;
  }
}

// Export singleton instance
export const startupMonitor = StartupMonitor.getInstance();

// Helper functions
export const milestone = (name: string) => startupMonitor.milestone(name);
export const getStartupReport = () => startupMonitor.getReport();

export default startupMonitor;