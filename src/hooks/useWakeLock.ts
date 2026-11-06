import { useEffect, useRef } from 'react';
import type { WakeLockSentinel } from '@/types';

const FALLBACK_NUDGE_MS = 30000;

const createHiddenVideo = (): HTMLVideoElement => {
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

  // Um frame branco de 1x1 a 1 FPS basta para o navegador considerar a mídia ativa.
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 1, 1);
  }
  video.srcObject = canvas.captureStream(1);

  document.body.appendChild(video);
  return video;
};

/**
 * Mantém a tela ligada enquanto `keepAwake` for verdadeiro.
 * Usa a Wake Lock API e, sem ela, um vídeo invisível com um movimento de mouse periódico.
 */
export const useWakeLock = (keepAwake: boolean): void => {
  const wantedRef = useRef(keepAwake);
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  const pendingRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const nudgeRef = useRef<ReturnType<typeof setInterval> | null>(null);

  wantedRef.current = keepAwake;

  useEffect(() => {
    const shouldHold = () => wantedRef.current && !document.hidden;

    const stopFallback = () => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.remove();
        videoRef.current = null;
      }
      if (nudgeRef.current) {
        clearInterval(nudgeRef.current);
        nudgeRef.current = null;
      }
    };

    const startFallback = async () => {
      if (videoRef.current) return;
      const video = createHiddenVideo();
      videoRef.current = video;
      nudgeRef.current = setInterval(() => {
        document.dispatchEvent(
          new MouseEvent('mousemove', { clientX: 0, clientY: 0, bubbles: false }),
        );
      }, FALLBACK_NUDGE_MS);
      await video.play();
    };

    const release = () => {
      const sentinel = sentinelRef.current;
      sentinelRef.current = null;
      sentinel?.release();
      stopFallback();
    };

    const acquire = async () => {
      if (sentinelRef.current || pendingRef.current || videoRef.current) return;
      pendingRef.current = true;
      let failure: unknown = null;
      try {
        if ('wakeLock' in navigator) {
          try {
            const sentinel = await navigator.wakeLock.request('screen');
            if (!shouldHold()) {
              sentinel.release();
              return;
            }
            sentinelRef.current = sentinel;
            sentinel.addEventListener('release', () => {
              if (sentinelRef.current === sentinel) sentinelRef.current = null;
            });
            return;
          } catch (error) {
            failure = error;
            if (!shouldHold()) return;
          }
        }
        await startFallback();
        if (!shouldHold()) stopFallback();
      } catch (error) {
        stopFallback();
        failure ??= error;
      } finally {
        pendingRef.current = false;
        if (failure) console.warn('Wake lock indisponível:', failure);
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) release();
      else if (wantedRef.current) void acquire();
    };

    if (keepAwake) void acquire();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      release();
    };
  }, [keepAwake]);
};
