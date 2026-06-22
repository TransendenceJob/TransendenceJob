import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extends Vitest with custom DOM matchers (toBeInTheDocument, etc.)
expect.extend(matchers);

// Automatically unmounts React trees after each test
afterEach(() => {
    cleanup();
});