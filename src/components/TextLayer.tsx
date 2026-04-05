import React, { useState, useEffect } from 'react';
import { LevelsState } from '../types';

interface Props {
  level: LevelsState;
  showStageName: boolean;
}

const TextLayer: React.FC<Props> = ({ level, showStageName }) => {
  const [isLeaving, setIsLeaving] = useState(false);
  const [text, setText] = useState(level.currentLevel.name);

  useEffect(() => {
    if (!showStageName) {
      setIsLeaving(true);
    } else {
      setText(level.currentLevel.name);
      setIsLeaving(false);
    }
  }, [showStageName, level.currentLevel.name]);

  if (!showStageName && !isLeaving) return null;

  return (
    <div className={`text-layer ${isLeaving ? 'intro-hide' : ''}`} data-testid="stage-name">
      {text.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  );
};

export default TextLayer;
