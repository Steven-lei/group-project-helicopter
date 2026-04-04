import { pet1, pet2, pet3 } from './pets.js';

export const PET_LIST = [pet1, pet2, pet3];

const PETS = Object.fromEntries(PET_LIST.map((p) => [p.id, p]));

export const DEFAULT_PET_ID = 'pet1';

export function getPet(petId) {
  const pet = PETS[petId];
  if (!pet) {
    throw new Error(`未注册的宠物: ${petId}`);
  }
  return pet;
}

export function getPetAction(petId, actionId) {
  const pet = getPet(petId);
  const action = pet.actions[actionId];
  if (!action) {
    throw new Error(`宠物 "${petId}" 未定义动作 "${actionId}"`);
  }
  return action;
}
