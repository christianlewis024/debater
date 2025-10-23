import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server for Node.js environment (Vitest tests)
 */
export const server = setupServer(...handlers);
