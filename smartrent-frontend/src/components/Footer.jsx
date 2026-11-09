import React from 'react';

const Footer = () => {
  return (
    <footer
      className="text-center py-7 text-sm border-t"
      style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border)', color: 'var(--ink-faint)' }}
    >
      <div className="container mx-auto px-4">
        <p>© {new Date().getFullYear()} SmartRent.AI. Built for renters and owners who want a faster match.</p>
      </div>
    </footer>
  );
};

export default Footer;
