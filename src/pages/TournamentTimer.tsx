import { useState, useEffect, useRef } from 'react';
import DisplayTimer from '../components/DisplayTimer';
import DisplayConfig from '../components/DisplayConfig';

interface TournamentConfig {
  levelDuration: number; // em minutos
  initialSB: number;
  initialBB: number;
  breakDuration: number; // em minutos
  hasBreak: boolean;
  maxLevels: number; // quantidade máxima de níveis
  hasLevelLimit: boolean; // se deve limitar os níveis
}

interface Level {
  number: number;
  sb: number;
  bb: number;
  timeRemaining: number; // em segundos
}

const TournamentTimer = () => {
  const [config, setConfig] = useState<TournamentConfig>({
    levelDuration: 20,
    initialSB: 25,
    initialBB: 50,
    breakDuration: 5,
    hasBreak: false,
    maxLevels: 10,
    hasLevelLimit: false
  });

  const [currentLevel, setCurrentLevel] = useState<Level>({
    number: 1,
    sb: config.initialSB,
    bb: config.initialBB,
    timeRemaining: config.levelDuration * 60
  });

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState<number>(0);
  const [tournamentEnded, setTournamentEnded] = useState<boolean>(false);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [applyConfig, setApplyConfig] = useState<boolean>(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Calcular valores SB/BB para um nível
  const calculateBlinds = (level: number): { sb: number; bb: number } => {
    const multiplier = Math.pow(2, level - 1);
    return {
      sb: config.initialSB * multiplier,
      bb: config.initialBB * multiplier
    };
  };

  // Verificar se chegou ao limite de níveis
  const shouldEndTournament = (levelNumber: number): boolean => {
    return config.hasLevelLimit && levelNumber >= config.maxLevels;
  };

  // Avançar para próximo nível
  const nextLevel = () => {
    const newLevelNumber = currentLevel.number + 1;
    
    // Verificar se deve encerrar o torneio
    if (shouldEndTournament(newLevelNumber)) {
      setTournamentEnded(true);
      setIsRunning(false);
      return;
    }
    
    const blinds = calculateBlinds(newLevelNumber);
    
    setCurrentLevel({
      number: newLevelNumber,
      sb: blinds.sb,
      bb: blinds.bb,
      timeRemaining: config.levelDuration * 60
    });
  };

  // Iniciar intervalo
  const startBreak = () => {
    setIsBreak(true);
    setBreakTimeRemaining(config.breakDuration * 60);
  };

  // Finalizar intervalo
  const endBreak = () => {
    setIsBreak(false);
    setBreakTimeRemaining(0);
    nextLevel();
  };

  // Formatar tempo
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer principal
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      if (isBreak) {
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            endBreak();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setCurrentLevel(prev => {
          if (prev.timeRemaining <= 1) {
            // Tocar som de alerta
            if (audioRef.current) {
              audioRef.current.play().catch(console.error);
            }
            
            // Iniciar intervalo se configurado
            if (config.hasBreak) {
              startBreak();
              return prev;
            } else {
              // Avançar para próximo nível
              setTimeout(() => nextLevel(), 1000);
              return prev;
            }
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isBreak, config.hasBreak, config.breakDuration, config.hasLevelLimit, config.maxLevels]);

  // Resetar timer
  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setBreakTimeRemaining(0);
    setTournamentEnded(false);
    setCurrentLevel({
      number: 1,
      sb: config.initialSB,
      bb: config.initialBB,
      timeRemaining: config.levelDuration * 60
    });
    setShowResetModal(false);
  };

  // Pausar/Retomar
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Abrir modal de confirmação
  const openResetModal = () => {
    setShowResetModal(true);
  };

  // Fechar modal de confirmação
  const closeResetModal = () => {
    setShowResetModal(false);
  };

  // Aplicar configuração
  const handleApplyConfig = () => {
    setApplyConfig(true);
    // Resetar o timer com as novas configurações
    setCurrentLevel({
      number: 1,
      sb: config.initialSB,
      bb: config.initialBB,
      timeRemaining: config.levelDuration * 60
    });
    setIsRunning(false);
    setIsBreak(false);
    setBreakTimeRemaining(0);
    setTournamentEnded(false);
  };

  // Voltar à configuração
  const handleBackToConfig = () => {
    setApplyConfig(false);
    setIsRunning(false);
    setIsBreak(false);
    setBreakTimeRemaining(0);
    setTournamentEnded(false);
    setCurrentLevel({
      number: 1,
      sb: config.initialSB,
      bb: config.initialBB,
      timeRemaining: config.levelDuration * 60
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-green-400 mb-6">Timer do Torneio</h2>
      {!applyConfig 
        ? <DisplayConfig 
            config={config} 
            setConfig={setConfig} 
            isRunning={isRunning} 
            onApplyConfig={handleApplyConfig}
          /> 
        : <DisplayTimer 
            tournamentEnded={tournamentEnded} 
            config={config} 
            currentLevel={currentLevel} 
            isBreak={isBreak} 
            breakTimeRemaining={breakTimeRemaining} 
            formatTime={formatTime} 
            openResetModal={openResetModal} 
            closeResetModal={closeResetModal} 
            resetTimer={resetTimer} 
            toggleTimer={toggleTimer} 
            isRunning={isRunning} 
            showResetModal={showResetModal} 
            audioRef={audioRef} 
            calculateBlinds={calculateBlinds}
            onBackToConfig={handleBackToConfig}
          />
      }
    </div>
  );
};

export default TournamentTimer;
