'use client';

import { useState } from 'react';
import SubPages from './SubPages';

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
