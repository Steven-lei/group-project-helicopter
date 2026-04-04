import { useEffect, useState } from 'react';
import { DEFAULT_FRAME_MS, PET_DISPLAY_SCALE } from '../pets/playbackConfig.js';
import './PixelPet.css';

export default function PixelPet({ frames, frameMs = DEFAULT_FRAME_MS }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const list = frames ?? [];
  const len = list.length;

  useEffect(() => {
    setFrameIndex(0);
  }, [frames]);

  useEffect(() => {
    if (len < 1) return undefined;

    const id = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % len);
    }, frameMs);

    return () => window.clearInterval(id);
  }, [len, frameMs]);

  if (len < 1) {
    return (
      <div
        className="pixel-pet pixel-pet--empty"
        style={{ '--pet-scale': PET_DISPLAY_SCALE }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className="pixel-pet"
      style={{ '--pet-scale': PET_DISPLAY_SCALE }}
      aria-hidden
    >
      <span className="pixel-pet__scale">
        <span className="pixel-pet__hover">
          <img
            className="pixel-pet__img"
            src={list[frameIndex]}
            alt=""
            draggable={false}
          />
        </span>
      </span>
    </div>
  );
}
