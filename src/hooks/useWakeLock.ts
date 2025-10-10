import { useEffect, useRef, useCallback } from 'react';
import type { WakeLockSentinel } from '@/types';

interface UseWakeLockOptions {
  enabled: boolean;
  onError?: (error: Error) => void;
  onRelease?: () => void;
}

interface UseWakeLockReturn {
  isSupported: boolean;
  isActive: boolean;
  request: () => Promise<void>;
  release: () => void;
}

export const useWakeLock = ({
  enabled,
  onError,
  onRelease,
}: UseWakeLockOptions): UseWakeLockReturn => {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hiddenVideoRef = useRef<HTMLVideoElement | null>(null);
  const isSupported = 'wakeLock' in navigator;

  // Criar vídeo invisível para manter a tela ativa (fallback universal)
  const createHiddenVideo = useCallback(() => {
    if (hiddenVideoRef.current) return hiddenVideoRef.current;

    const video = document.createElement('video');
    video.style.position = 'absolute';
    video.style.top = '-9999px';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    video.style.opacity = '0';
    video.style.pointerEvents = 'none';
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    
    // Criar um vídeo de 1 segundo com frame branco
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 1, 1);
    }
    
    const stream = canvas.captureStream(1); // 1 FPS
    video.srcObject = stream;
    
    document.body.appendChild(video);
    hiddenVideoRef.current = video;
    
    return video;
  }, []);

  // Remover vídeo invisível
  const removeHiddenVideo = useCallback(() => {
    if (hiddenVideoRef.current) {
      hiddenVideoRef.current.pause();
      hiddenVideoRef.current.srcObject = null;
      document.body.removeChild(hiddenVideoRef.current);
      hiddenVideoRef.current = null;
    }
  }, []);

  // Fallback usando vídeo invisível
  const startFallback = useCallback(async () => {
    try {
      const video = createHiddenVideo();
      await video.play();
      
      // Fallback adicional: mover mouse virtualmente (muito sutil)
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
      
      fallbackIntervalRef.current = setInterval(() => {
        // Simular movimento mínimo do mouse para manter a tela ativa
        const event = new MouseEvent('mousemove', {
          clientX: 0,
          clientY: 0,
          bubbles: false,
        });
        document.dispatchEvent(event);
      }, 30000); // A cada 30 segundos
      
    } catch (error) {
      console.warn('Fallback de vídeo não funcionou:', error);
    }
  }, [createHiddenVideo]);

  // Parar fallback
  const stopFallback = useCallback(() => {
    removeHiddenVideo();
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
    }
  }, [removeHiddenVideo]);

  const request = useCallback(async () => {
    if (wakeLockRef.current) {
      return;
    }

    // Tentar usar Wake Lock API primeiro
    if (isSupported) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        
        if (wakeLockRef.current) {
          wakeLockRef.current.addEventListener('release', () => {
            wakeLockRef.current = null;
            onRelease?.();
          });
        }
        
        return; // Sucesso com Wake Lock API
      } catch (error) {
        console.warn('Wake Lock API falhou, usando fallback:', error);
        onError?.(error as Error);
      }
    }

    // Fallback para navegadores que não suportam Wake Lock API
    await startFallback();
  }, [isSupported, onError, onRelease, startFallback]);

  const release = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    } else {
      // Parar fallback se estiver usando
      stopFallback();
    }
  }, [stopFallback]);

  // Gerenciar wake lock baseado no estado enabled
  useEffect(() => {
    if (enabled) {
      request();
    } else {
      release();
    }

    // Cleanup ao desmontar
    return () => {
      release();
    };
  }, [enabled, request, release]);

  // Liberar wake lock quando a página for ocultada
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        release();
      } else if (enabled) {
        // Reativar quando a página voltar a ser visível
        request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, request, release]);

  return {
    isSupported: true, // Sempre "suportado" com fallback
    isActive: wakeLockRef.current !== null || fallbackIntervalRef.current !== null,
    request,
    release,
  };
};
