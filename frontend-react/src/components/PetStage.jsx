import { useEffect, useMemo, useState } from 'react';
import PixelPet from './PixelPet.jsx';
import { DEFAULT_FRAME_MS } from '../pets/playbackConfig.js';
import {
  DEFAULT_PET_ID,
  getPet,
  getPetAction,
  PET_LIST,
} from '../pets/registry.js';
import './PetStage.css';

export default function PetStage() {
  const [petId, setPetId] = useState(DEFAULT_PET_ID);
  const [actionId, setActionId] = useState('idle');

  useEffect(() => {
    const p = getPet(petId);
    if (p.actions.idle?.frames?.length) {
      setActionId('idle');
      return;
    }
    const first =
      p.actionButtonOrder.find((aid) => p.actions[aid]?.frames?.length) ??
      'idle';
    setActionId(first);
  }, [petId]);

  const pet = useMemo(() => getPet(petId), [petId]);
  const action = useMemo(
    () => getPetAction(petId, actionId),
    [petId, actionId]
  );
  const frameMs = action.frameIntervalMs ?? DEFAULT_FRAME_MS;

  return (
    <>
      <div className="pet-stage">
        <div className="pet-stage__pet">
          <PixelPet frames={action.frames} frameMs={frameMs} />
        </div>
        <div
          className="pet-stage__actions"
          role="toolbar"
          aria-label="切换宝可梦动作"
        >
          {pet.actionButtonOrder.map((id) => {
            const a = pet.actions[id];
            const hasFrames = (a.frames?.length ?? 0) > 0;
            return (
              <button
                key={id}
                type="button"
                disabled={!hasFrames}
                className={
                  actionId === id
                    ? 'pet-stage__btn pet-stage__btn--active'
                    : 'pet-stage__btn'
                }
                onClick={() => setActionId(id)}
                aria-pressed={actionId === id}
              >
                {a.displayName}
              </button>
            );
          })}
        </div>
      </div>

      <div className="pet-stage__picker">
        {pet.avatarUrl ? (
          <img
            className="pet-stage__avatar"
            src={pet.avatarUrl}
            alt=""
            draggable={false}
          />
        ) : (
          <span
            className="pet-stage__avatar pet-stage__avatar--placeholder"
            aria-hidden
          />
        )}
        <label className="pet-stage__picker-label">
          <span className="pet-stage__picker-text">宝可梦</span>
          <select
            className="pet-stage__select"
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            aria-label="选择宝可梦"
          >
            {PET_LIST.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}
