import React from 'react';

/**
 * Footer component that displays the copyright notice.
 * The year is dynamically updated to the current year.
 */
const Footer: React.FC = () => {
  // Get the current year
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ textAlign: 'center', padding: '1em 0', backgroundColor: '#f1f1f1' }}>
      {/* Display a single copyright notice with the current year */}
      <p>&copy; {currentYear} Your Company Name. All rights reserved.</p>
    </footer>
  );
};

export default Footer;
