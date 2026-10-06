import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import App from './App';
import { describe, it, expect } from 'vitest';

describe('App Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<App />);
    // @ts-expect-error - vitest types conflict
    expect(container).toBeInTheDocument();
  });
});
