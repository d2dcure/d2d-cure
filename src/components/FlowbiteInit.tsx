import { useEffect } from 'react';
import { initFlowbite } from 'flowbite';

export default function FlowbiteInit() {
  useEffect(() => {
    initFlowbite();
  }, []);

  return null;
}