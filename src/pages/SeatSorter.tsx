import { useState, useEffect } from 'react';

interface Player {
  id: number;
  name: string;
  seat: number | null;
}

const SeatSorter = () => {
  const [playerCount, setPlayerCount] = useState<number>(9);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availableSeats, setAvailableSeats] = useState<number[]>([]);
  const [isSorting, setIsSorting] = useState<boolean>(false);
  const [sortingPlayer, setSortingPlayer] = useState<number | null>(null);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);

  // Inicializar jogadores
  useEffect(() => {
    const newPlayers = Array.from({ length: playerCount }, (_, index) => ({
      id: index + 1,
      name: `Jogador ${index + 1}`,
      seat: null
    }));
    setPlayers(newPlayers);
    setAvailableSeats(Array.from({ length: playerCount }, (_, index) => index + 1));
  }, [playerCount]);

  // Função para sortear um seat
  const sortSeat = (playerId: number) => {
    if (availableSeats.length === 0) return;

    setIsSorting(true);
    setSortingPlayer(playerId);

    // Simular animação de sorteio
    const shuffleInterval = setInterval(() => {
      setSortingPlayer(playerId);
    }, 100);

    // Definir seat final após 2 segundos
    setTimeout(() => {
      clearInterval(shuffleInterval);
      const finalSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
      
      setPlayers(prev => prev.map(player => 
        player.id === playerId 
          ? { ...player, seat: finalSeat }
          : player
      ));
      
      setAvailableSeats(prev => prev.filter(seat => seat !== finalSeat));
      setIsSorting(false);
      setSortingPlayer(null);
    }, 2000);
  };

  // Função para resetar sorteio
  const resetSort = () => {
    setPlayers(prev => prev.map(player => ({ ...player, seat: null })));
    setAvailableSeats(Array.from({ length: playerCount }, (_, index) => index + 1));
    setIsSorting(false);
    setSortingPlayer(null);
    setShowResetModal(false);
  };

  // Função para editar nome do jogador
  const editPlayerName = (playerId: number, newName: string) => {
    setPlayers(prev => prev.map(player => 
      player.id === playerId 
        ? { ...player, name: newName }
        : player
    ));
  };

  // Função para iniciar edição
  const startEditing = (playerId: number) => {
    setEditingPlayer(playerId);
  };

  // Função para finalizar edição
  const finishEditing = () => {
    setEditingPlayer(null);
  };

  // Função para salvar nome
  const savePlayerName = (playerId: number, newName: string) => {
    if (newName.trim()) {
      editPlayerName(playerId, newName.trim());
    }
    finishEditing();
  };

  // Abrir modal de confirmação
  const openResetModal = () => {
    setShowResetModal(true);
  };

  // Fechar modal de confirmação
  const closeResetModal = () => {
    setShowResetModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-green-400 mb-4">Sorteio de Seats</h2>
        
        {/* Configuração */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quantidade de Jogadores:
          </label>
          <input
            type="number"
            min="2"
            max="20"
            value={playerCount}
            onChange={(e) => setPlayerCount(Number(e.target.value))}
            className="input-field w-32"
            disabled={isSorting}
          />
        </div>

        {/* Botão Reset */}
        <button
          onClick={openResetModal}
          disabled={isSorting}
          className="btn-secondary mb-6"
        >
          Resetar Sorteio
        </button>

        {/* Grid de Jogadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <div key={player.id} className="card">
              <div className="flex justify-between items-center mb-2">
                <div className="flex-1">
                  {editingPlayer === player.id ? (
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) => editPlayerName(player.id, e.target.value)}
                      onBlur={() => savePlayerName(player.id, player.name)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          savePlayerName(player.id, player.name);
                        }
                      }}
                      className="input-field w-full text-sm"
                      autoFocus
                    />
                  ) : (
                    <div 
                      className="font-medium cursor-pointer hover:text-green-400 transition-colors"
                      onClick={() => startEditing(player.id)}
                      title="Clique para editar o nome"
                    >
                      {player.name}
                    </div>
                  )}
                </div>
                {player.seat && (
                  <span className="text-green-400 font-bold ml-2">Seat {player.seat}</span>
                )}
              </div>
              
              {player.seat ? (
                <div className="text-center py-2 bg-green-600 rounded text-white font-bold">
                  Seat {player.seat}
                </div>
              ) : (
                <button
                  onClick={() => sortSeat(player.id)}
                  disabled={isSorting || availableSeats.length === 0}
                  className={`w-full py-2 rounded font-medium transition-colors ${
                    isSorting && sortingPlayer === player.id
                      ? 'bg-yellow-600 text-white animate-pulse'
                      : 'btn-primary'
                  }`}
                >
                  {isSorting && sortingPlayer === player.id ? 'Sorteando...' : 'Sortear Seat'}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Status */}
        <div className="mt-6 p-4 bg-gray-700 rounded-lg">
          <p className="text-center text-gray-300">
            {availableSeats.length > 0 
              ? `${availableSeats.length} seat(s) disponível(is)`
              : 'Todos os seats foram sorteados!'
            }
          </p>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-400 mb-4">Confirmar Reset</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja resetar o sorteio? Esta ação irá:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2">
              <li>• Limpar todos os seats sorteados</li>
              <li>• Voltar todos os jogadores ao estado inicial</li>
              <li>• Permitir novo sorteio</li>
              <li>• Perder todo o progresso atual</li>
            </ul>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeResetModal}
                className="btn-secondary px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={resetSort}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded"
              >
                Confirmar Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeatSorter;
