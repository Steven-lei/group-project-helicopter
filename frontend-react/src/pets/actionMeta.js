export const FULL_ACTION_BUTTON_ORDER = [
  'idle',
  'happy',
  'walkLeft',
  'walkRight',
  'rest',
  'sad',
  'interact',
];

export const ACTION_DISPLAY_NAME = {
  idle: '待机',
  happy: '开心',
  walkLeft: '向左走',
  walkRight: '向右走',
  rest: '休息',
  sad: '伤心',
  interact: '交互',
  '额外动作1': '额外动作1',
  '额外动作2': '额外动作2',
  '额外动作3': '额外动作3',
};

/** 全局默认：所有宠物该动作共用（可被 PET_ACTION_TIMING 覆盖） */
export const ACTION_TIMING = {
  rest: { frameIntervalMs: 700 },
};

// 按宠物覆盖：只写需要与全局默认不同的项
export const PET_ACTION_TIMING = {
  pet3: {
    idle: { frameIntervalMs: 700 },
    happy: { frameIntervalMs: 500 },
  },
};
