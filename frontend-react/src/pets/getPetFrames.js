const modules = import.meta.glob('../../pictures/**/*.png', {
  eager: true,
  import: 'default',
});

const entries = Object.entries(modules).map(([path, url]) => [
  path.replace(/\\/g, '/'),
  url,
]);

/** 动作 id -> pictures 目录名（不在这里的就默认用 actionId 当目录名） */
export const ACTION_TO_FOLDER = {
  idle: 'idle',
  happy: 'happy',
  walkLeft: 'walk-left',
  walkRight: 'walk-right',
  rest: 'rest',
  sad: 'sad',
  interact: 'interact',
  avatar: 'avatar',
};

function actionFolder(actionId) {
  return ACTION_TO_FOLDER[actionId] ?? actionId;
}

const EXTRA_ACTION_FOLDER_FALLBACK = {
  '额外动作1': ['额外动作1', '额外动作123_1'],
  '额外动作2': ['额外动作2', '额外动作123_2'],
  '额外动作3': ['额外动作3', '额外动作123_3'],
};

function candidateFolders(actionId) {
  return EXTRA_ACTION_FOLDER_FALLBACK[actionId] ?? [actionFolder(actionId)];
}

/**
 * 返回某 pet 某动作文件夹里的所有 png URL，按文件名“自然数序”排序。
 * 若该动作没有图片，返回 []。
 */
export function getPetFrames(petId, actionId) {
  for (const folder of candidateFolders(actionId)) {
    const needle = `pictures/${petId}/${folder}/`;
    const matched = entries.filter(([path]) => path.includes(needle));
    if (!matched.length) continue;

    return matched
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, url]) => url);
  }

  return [];
}
