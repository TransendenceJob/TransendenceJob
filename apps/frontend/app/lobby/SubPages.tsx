"use client";

import { useState } from 'react';
import LobbyPage from '@/src/components/lobby2/LobbyPage';
import LoadingPage from '@/src/components/lobby2/LoadingPage';

export default function SubPages() {
  const [state, setState] = useState('LOBBY');

  if (state === 'LOBBY') {
    return <LobbyPage onNavigate={setState}/>
  }
  else if (state === 'LOADING') {
    return <LoadingPage onNavigate={setState}/>
  }

  // else if (state === 'GAME') {
  //   return <GamePage />
  // }
  // else if (state === 'ENDSCREEN') {
  //   return <EndscreenPage />
  // }
  return null;
}
