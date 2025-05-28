export class ErrorHandler {
  static getErrorMessage(err: unknown): string {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'string') {
      return err;
    }
    return 'Unknown error occurred';
  }

  static async handleError(err: unknown, context: string): Promise<void> {
    const message = this.getErrorMessage(err);
    console.error(`${context} error:`, err);
    return Promise.reject(new Error(`${context}: ${message}`));
  }
}
