'use client';

import { useState } from 'react';
import Lobby from '@/src/components/lobby2/Lobby';
import Loading from '@/src/components/lobby2/Loading';

export default function Page() {
  const [state, setState] = useState('LOBBY');

  if (state === 'LOBBY') {
    return <Lobby onStart={() => setState('LOADING')} />
  }

  if (state === 'LOADING') {
    return <Loading onStart={() => setState('LOBBY')} />
  }
  return null;
}
