import React from 'react';
import KineticTable from './kinetictable';

function bglbComponent() {
  let id: string | null = null;
  let wt_id: string | null = null;

  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    id = urlParams.get('id');
    wt_id = urlParams.get('wt_id');
    console.log(id);

  }
  return (
    <div>
      <KineticTable id = {id}  />
    </div>
  );
};

export default bglbComponent;