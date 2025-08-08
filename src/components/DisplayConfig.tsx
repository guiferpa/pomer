const DisplayConfig = ({ config, setConfig, isRunning, onApplyConfig }: any) => {
    return (
      <div className="card">
        <h3 className="text-xl font-bold text-blue-400 mb-6">Configuração do Torneio</h3>
        
        {/* Configurações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duração do Nível (min)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={config.levelDuration}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, levelDuration: Number(e.target.value) }))}
              className="input-field w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              SB Inicial
            </label>
            <input
              type="number"
              min="1"
              value={config.initialSB}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, initialSB: Number(e.target.value) }))}
              className="input-field w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              BB Inicial
            </label>
            <input
              type="number"
              min="1"
              value={config.initialBB}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, initialBB: Number(e.target.value) }))}
              className="input-field w-full"
              disabled={isRunning}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Intervalo (min)
            </label>
            <input
              type="number"
              min="0"
              max="30"
              value={config.breakDuration}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, breakDuration: Number(e.target.value) }))}
              className="input-field w-full"
              disabled={isRunning}
            />
          </div>
        </div>

        {/* Configurações de Limite de Níveis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={config.hasLevelLimit}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, hasLevelLimit: e.target.checked }))}
                className="mr-2"
                disabled={isRunning}
              />
              <span className="text-sm font-medium text-gray-300">Limitar quantidade de níveis</span>
            </label>
          </div>

          {config.hasLevelLimit && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quantidade Máxima de Níveis
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={config.maxLevels}
                onChange={(e) => setConfig((prev: any) => ({ ...prev, maxLevels: Number(e.target.value) }))}
                className="input-field w-full"
                disabled={isRunning}
              />
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.hasBreak}
              onChange={(e) => setConfig((prev: any) => ({ ...prev, hasBreak: e.target.checked }))}
              className="mr-2"
              disabled={isRunning}
            />
            <span className="text-sm font-medium text-gray-300">Habilitar intervalo entre níveis</span>
          </label>
        </div>

        {/* Botão para aplicar configuração */}
        <div className="flex justify-center">
          <button
            onClick={onApplyConfig}
            disabled={isRunning}
            className="btn-primary px-8 py-3 text-lg font-bold"
          >
            Aplicar Configuração e Iniciar Timer
          </button>
        </div>
      </div>
    );
};

export default DisplayConfig;