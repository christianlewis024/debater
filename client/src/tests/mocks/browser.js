import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * MSW Worker for browser environment (E2E tests, development)
 */
export const worker = setupWorker(...handlers);
