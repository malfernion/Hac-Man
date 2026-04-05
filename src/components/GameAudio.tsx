import React, { useEffect, useRef } from 'react';
import { GameInfoState } from '../types';

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
  const prevPowered = useRef(gameInfo.poweredUp);

  useEffect(() => {
    try {
      introRef.current  = new Audio(require('../assets/game_start.wav'));
      sirenRef.current  = new Audio(require('../assets/siren.wav'));
      munch1Ref.current = new Audio(require('../assets/munch_1.wav'));
      munch2Ref.current = new Audio(require('../assets/munch_2.wav'));

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

  // Play intro when game starts
  useEffect(() => {
    if (gameInfo.playingIntro) {
      sirenRef.current?.pause();
      introRef.current?.play().catch(() => {});
    }
  }, [gameInfo.playingIntro]);

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
