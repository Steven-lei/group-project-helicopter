import {
  ACTION_DISPLAY_NAME,
  ACTION_TIMING,
  PET_ACTION_TIMING,
} from './actionMeta.js';
import { getPetFrames } from './getPetFrames.js';

function timingFor(petId, actionId) {
  return {
    ...(ACTION_TIMING[actionId] ?? {}),
    ...(PET_ACTION_TIMING[petId]?.[actionId] ?? {}),
  };
}

/**
 * 构建某个宠物对象：
 * - 根据 actionButtonOrder 自动读取该 pet/action 目录下所有 png
 * - 按文件名排序生成 frames
 * - 挂上按宠物覆盖的 frameIntervalMs（如 rest）
 */
export function buildPet({ id, displayName, actionButtonOrder }) {
  const actions = {};

  for (const actionId of actionButtonOrder) {
    const frames = getPetFrames(id, actionId);
    actions[actionId] = {
      id: actionId,
      displayName: ACTION_DISPLAY_NAME[actionId] ?? actionId,
      frames,
      ...timingFor(id, actionId),
    };
  }

  // 头像优先读取 pictures/{petId}/avatar/ 里的 png（按文件名顺序取第一张）。
  let avatarFrames = getPetFrames(id, 'avatar');
  if (!avatarFrames.length) {
    for (const actionId of actionButtonOrder) {
      const frames = getPetFrames(id, actionId);
      if (frames.length) {
        avatarFrames = frames;
        break;
      }
    }
  }

  return {
    id,
    displayName,
    avatarUrl: avatarFrames[0] ?? '',
    actionButtonOrder,
    actions,
  };
}
