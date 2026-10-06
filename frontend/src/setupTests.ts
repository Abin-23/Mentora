import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock react-pdf to avoid pdf.js DOMMatrix issues in jsdom
vi.mock('react-pdf', () => ({
  Document: ({ children }: any) => children,
  Page: () => null,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));
