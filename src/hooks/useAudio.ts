// Tipos de sons disponíveis
export type SoundType = 'level_change' | 'break_start' | 'break_end' | 'tournament_start' | 'tournament_end';

// Arquivo de áudio único
const AUDIO_FILE = '/pomer/audio/ringtone.mp3';

export const useAudio = () => {

  // Função para tocar som
  const playSound = (_soundType: SoundType) => {
      const audio = new Audio();
      audio.volume = 1;
      audio.preload = 'auto';
      
      // Definir a fonte e carregar
      audio.src = AUDIO_FILE;
      audio.load();
      
      // Aguardar um pouco e tentar tocar
      setTimeout(() => {
        audio.play().catch(() => {
          // Silenciosamente ignora erros de reprodução
        });
      }, 100);
  };

  // Função para testar som
  const testSound = () => {
    playSound("level_change");
  };

  return {
    playSound,
    testSound,
  };
};
