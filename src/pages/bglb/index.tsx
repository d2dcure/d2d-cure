import React from 'react';
import KineticTable from './kinetictable';

interface KineticTableProps {
  id: string|null;
}

function bglbComponent() {
  let id: string | null = null;

  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    id = urlParams.get('id');
  }
  return (
    <div>
      <KineticTable id = {id}/>
    </div>
  );
};

export default bglbComponent;