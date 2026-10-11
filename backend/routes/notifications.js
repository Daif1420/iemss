const express = require('express');
const db = require('../database/init');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Express 4 does not forward rejected promises from async handlers to the error
// middleware, which would leave the request hanging. Wrap every handler.
['get', 'post'].forEach(m => {
  const orig = router[m].bind(router);
  router[m] = (path, ...handlers) => orig(path, ...handlers.map(fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)));
});

// Create notifications for a list of users. Never throws: a failed
// notification must not break the action that triggered it.
async function notifyUsers(userIds, { type, title, body = null, link = null }) {
  try {
    const ids = [...new Set((userIds || []).map(Number).filter(Number.isInteger))];
    if (!ids.length) return 0;
    await db.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       SELECT uid, $2, $3, $4, $5 FROM unnest($1::int[]) AS uid`,
      [ids, type, title, body, link]
    );
    return ids.length;
  } catch (e) {
    console.error('notifyUsers failed:', e);
    return 0;
  }
}

router.get('/', requireAuth, async (req, res) => {
  const uid = Number(req.user.id);
  const items = (await db.prepare(
    `SELECT id, type, title, body, link, is_read, created_at
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 30`
  ).all(uid));
  const row = await db.prepare('SELECT COUNT(*)::int AS c FROM notifications WHERE user_id = ? AND is_read = FALSE').get(uid);
  res.json({ items, unread: row ? row.c : 0 });
});

router.post('/read-all', requireAuth, async (req, res) => {
  await db.prepare('UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE').run(Number(req.user.id));
  res.json({ ok: true });
});

router.post('/:id/read', requireAuth, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'إشعار غير صالح.' });
  await db.prepare('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?').run(id, Number(req.user.id));
  res.json({ ok: true });
});

module.exports = router;
module.exports.notifyUsers = notifyUsers;
