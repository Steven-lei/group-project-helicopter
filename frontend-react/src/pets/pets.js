import { buildPet } from './buildPet.js';
import { FULL_ACTION_BUTTON_ORDER } from './actionMeta.js';

export const pet1 = buildPet({
  id: 'pet1',
  displayName: '宝可梦 1',
  actionButtonOrder: [
    ...FULL_ACTION_BUTTON_ORDER,
    '额外动作1',
    '额外动作2',
    '额外动作3',
  ],
});

export const pet2 = buildPet({
  id: 'pet2',
  displayName: '宝可梦 2',
  actionButtonOrder: FULL_ACTION_BUTTON_ORDER,
});

export const pet3 = buildPet({
  id: 'pet3',
  displayName: '宝可梦 3',
  actionButtonOrder: FULL_ACTION_BUTTON_ORDER,
});
