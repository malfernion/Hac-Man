import React, { useEffect, useRef } from 'react';
import { GameInfoState } from '../types';
import gameStartUrl from '../assets/game_start.wav';
import sirenUrl from '../assets/siren.wav';
import munch1Url from '../assets/munch_1.wav';
import munch2Url from '../assets/munch_2.wav';

interface Props {
  gameInfo: GameInfoState;
  onIntroFinished: () => void;
}

const GameAudio: React.FC<Props> = ({ gameInfo, onIntroFinished }) => {
  const introRef    = useRef<HTMLAudioElement | null>(null);
  const sirenRef    = useRef<HTMLAudioElement | null>(null);
  const munch1Ref   = useRef<HTMLAudioElement | null>(null);
  const munch2Ref   = useRef<HTMLAudioElement | null>(null);
  const munchToggle = useRef(false);
  const prevScore   = useRef(gameInfo.score);

  useEffect(() => {
    try {
      introRef.current  = new Audio(gameStartUrl);
      sirenRef.current  = new Audio(sirenUrl);
      munch1Ref.current = new Audio(munch1Url);
      munch2Ref.current = new Audio(munch2Url);

      if (sirenRef.current) {
        sirenRef.current.loop = true;
      }
      if (introRef.current) {
        introRef.current.onended = onIntroFinished;
      }
    } catch {
      // Audio may not be available in test environments
    }

    return () => {
      sirenRef.current?.pause();
      introRef.current?.pause();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update intro finished handler when it changes
  useEffect(() => {
    if (introRef.current) {
      introRef.current.onended = onIntroFinished;
    }
  }, [onIntroFinished]);

  // Play intro when game starts; fallback timeout if audio can't play
  useEffect(() => {
    if (!gameInfo.playingIntro) return;
    sirenRef.current?.pause();
    const audio = introRef.current;
    if (audio) {
      audio.play().catch(() => {
        // Audio blocked (e.g., browser autoplay policy) – skip intro
        onIntroFinished();
      });
    } else {
      // No audio available – advance immediately
      const t = setTimeout(onIntroFinished, 100);
      return () => clearTimeout(t);
    }
  }, [gameInfo.playingIntro]); // eslint-disable-line react-hooks/exhaustive-deps

  // Play siren when game is active
  useEffect(() => {
    if (gameInfo.gameStarted) {
      sirenRef.current?.play().catch(() => {});
    } else {
      sirenRef.current?.pause();
    }
  }, [gameInfo.gameStarted]);

  // Munch sounds on score change
  useEffect(() => {
    if (gameInfo.score > prevScore.current) {
      prevScore.current = gameInfo.score;
      munchToggle.current = !munchToggle.current;
      const munch = munchToggle.current ? munch1Ref.current : munch2Ref.current;
      if (munch) {
        munch.currentTime = 0;
        munch.play().catch(() => {});
      }
    }
  }, [gameInfo.score]);

  return null;
};

export default GameAudio;
