import { ok } from '../utils/response.js';

export function getHealth(req, res) {
  return ok(res, { status: 'ok', service: 'moodpal-backend' });
}
