import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class ApiErrorService {
  handle(error: HttpErrorResponse): string {
    if (error.error && typeof error.error === 'object' && 'message' in error.error) {
      const message = (error.error as { message?: string }).message;
      if (message) {
        return message;
      }
    }

    if (error.status === 0) {
      return 'Network error. Please check your connection.';
    }

    if (error.status >= 500) {
      return 'Server error. Please try again later.';
    }

    return error.message || 'Request failed.';
  }
}
