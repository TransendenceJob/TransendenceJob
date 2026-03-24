import SubPages from './SubPages';
import ButtonLogic from './ButtonLogic';

export default function LobbyPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-24"> 
      <h1 className="text-4xl font-extrabold mb-8 text-slate-800">
        My Dashboard
      </h1>
      
      <SubPages />
      
      <footer className="mt-12 text-slate-800">
        Generated on the server. Interactive on the client.
      </footer>
    </main>
  )
}
