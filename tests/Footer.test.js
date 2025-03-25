import React from 'react';
import { render } from '@testing-library/react';
import Footer from '../components/Footer';

test('renders footer with current year', () => {
  const { getByText } = render(<Footer />);
  const currentYear = new Date().getFullYear();
  const copyrightText = `© ${currentYear} Your Company Name. All rights reserved.`;
  expect(getByText(copyrightText)).toBeInTheDocument();
});
