import React from 'react';
import BglBPage from './bglbpage';

function bglbComponent() {
  let id: string | null = null;

  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    id = urlParams.get('id');
  }
  return (
    <div>
      <BglBPage id = {id}  />
    </div>
  );
};

export default bglbComponent;