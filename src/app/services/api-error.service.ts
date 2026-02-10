import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  handle(error: HttpErrorResponse): string {
    const responseMessage = this.extractMessage(error);
    if (responseMessage) {
      const sanitized = this.stripUrls(responseMessage);
      if (sanitized) {
        return sanitized;
      }
    }

    if (error.status === 0) {
      return 'Network error. Please check your connection.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    if (error.statusText) {
      return error.statusText;
    }

    if (error.status) {
      return `Request failed (${error.status}).`;
    }

    return 'Request failed.';
  }

  private stripUrls(text: string): string {
    return text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractMessage(error: HttpErrorResponse): string | null {
    if (typeof error.error === 'string') {
      return error.error;
    }

    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = (error.error as { message?: string }).message;
      if (message) {
        return message;
      }
    }

    return null;
  }
}
