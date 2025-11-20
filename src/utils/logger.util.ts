export class Logger {
  private context: string;
  constructor(context: string) {
    this.context = context;
  }
  info(message: string, data?: any) {
    console.log(`[${this.context}] ℹ️ ${message}`, data ? data : "");
  }
  error(message: string, error?: any) {
    console.error(`[${this.context}] ❌ ${message}`, error ? error : "");
  }
  warn(message: string, data?: any) {
    console.warn(`[${this.context}] ⚠️ ${message}`, data ? data : "");
  }
  debug(message: string, data?: any) {
    console.debug(`[${this.context}] 🔍 ${message}`, data ? data : "");
  }
}

export default Logger;
