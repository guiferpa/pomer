const DisplayTimer = ({ 
    tournamentEnded, config, currentLevel, isBreak, breakTimeRemaining, formatTime, openResetModal, closeResetModal, resetTimer, toggleTimer, isRunning, showResetModal, audioRef, calculateBlinds, onBackToConfig}: any) => {
  return (
      <div className="card">
        {/* Botão para voltar à configuração */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onBackToConfig}
            disabled={isRunning}
            className="btn-secondary px-3 py-1 text-sm"
          >
            Voltar à Configuração
          </button>
        </div>

        {/* Display Principal - Destaque Máximo */}
        <div className="text-center mb-8">
          {tournamentEnded ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-red-400">TORNEIO ENCERRADO</h3>
              <div className="text-8xl font-bold text-red-400">
                Nível {config.maxLevels} Finalizado
              </div>
              <div className="text-3xl font-bold text-blue-400">
                SB: {currentLevel.sb} | BB: {currentLevel.bb}
              </div>
            </div>
          ) : isBreak ? (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-yellow-400">INTERVALO</h3>
              <div className="text-8xl font-bold text-yellow-400">
                {formatTime(breakTimeRemaining)}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-green-400">NÍVEL {currentLevel.number}</h3>
              
              {/* Cronômetro em Destaque */}
              <div className="text-8xl font-bold text-green-400 leading-none">
                {formatTime(currentLevel.timeRemaining)}
              </div>
              
              {/* Blinds em Destaque - Lado a Lado */}
              <div className="bg-gray-700 rounded-lg p-6 mx-auto max-w-md">
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400">
                      SB: {currentLevel.sb}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-400">
                      BB: {currentLevel.bb}
                    </div>
                  </div>
                </div>
              </div>
              
              {config.hasLevelLimit && (
                <div className="text-lg text-gray-400">
                  Nível {currentLevel.number} de {config.maxLevels}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles Compactos */}
        <div className="flex justify-center space-x-3 mb-6">
          {!tournamentEnded && (
            <button
              onClick={toggleTimer}
              className={`px-4 py-2 rounded-lg font-medium text-base ${
                isRunning 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? 'PAUSAR' : 'INICIAR'}
            </button>
          )}

          <button
            onClick={openResetModal}
            className="btn-secondary px-4 py-2 text-base"
          >
            RESETAR
          </button>
        </div>

        {/* Próximos Níveis */}
        {!tournamentEnded && (
          <div className="mt-8">
            <h4 className="text-lg font-bold text-gray-300 mb-4">Próximos Níveis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array.from({ length: 6 }, (_, i) => {
                const levelNumber = currentLevel.number + i + 1;
                
                // Não mostrar níveis além do limite
                if (config.hasLevelLimit && levelNumber > config.maxLevels) {
                  return null;
                }
                
                const blinds = calculateBlinds(levelNumber);
                return (
                  <div key={levelNumber} className="card p-3 text-center">
                    <div className="font-bold text-green-400">Nível {levelNumber}</div>
                    <div className="text-sm text-gray-300">
                      SB: {blinds.sb} | BB: {blinds.bb}
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        )}

      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-400 mb-4">Confirmar Reset</h3>
            <p className="text-gray-300 mb-6">
              Tem certeza que deseja resetar o timer? Esta ação irá:
            </p>
            <ul className="text-gray-300 mb-6 space-y-2">
              <li>• Parar o timer atual</li>
              <li>• Voltar para o nível 1</li>
              <li>• Resetar todos os valores SB/BB</li>
              <li>• Perder todo o progresso</li>
            </ul>
            <div className="flex justify-end space-x-4">
              <button
                onClick={closeResetModal}
                className="btn-secondary px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={resetTimer}
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded"
              >
                Confirmar Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audio para alerta */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT" type="audio/wav" />
      </audio>
    </div>
  );
};

export default DisplayTimer;