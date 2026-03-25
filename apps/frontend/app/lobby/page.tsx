import SubPages from './SubPages';

export default function LobbyPage() {
  return (
    <main className="min-h-screen bg-[#2a2a2e] flex flex-col items-center justify-center p-24"> 
    {/* ^ Background ^ */}

      {/* Content of each specific page */}
      <SubPages />

    </main>
  )
}
