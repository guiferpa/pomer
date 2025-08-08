import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import SeatSorter from './pages/SeatSorter';
import TournamentTimer from './pages/TournamentTimer';

function App() {
  const basename = import.meta.env.BASE_URL;
  
  return (
    <Router basename={basename}>
      <div className="min-h-screen bg-gray-900">
        <header className="bg-gray-800 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-2xl font-bold text-green-400">Poker Club</h1>
              <nav className="flex space-x-4">
                <Link 
                  to="/" 
                  className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Sorteio de Seats
                </Link>
                <Link 
                  to="/timer" 
                  className="text-gray-300 hover:text-green-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Timer do Torneio
                </Link>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<SeatSorter />} />
            <Route path="/timer" element={<TournamentTimer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
