const jwt = require('jsonwebtoken');
const { hasPermission } = require('../utils/permissions');

const JWT_SECRET = process.env.JWT_SECRET || '';

function requireJwtSecret(res) {
  if (JWT_SECRET) return true;
  res.status(500).json({ error: 'JWT_SECRET غير مضبوط في Environment Variables على Vercel.' });
  return false;
}

function requireAuth(req, res, next) {
  if (!requireJwtSecret(res)) return;
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'مطلوب تسجيل الدخول' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (_) {
    return res.status(401).json({ error: 'الجلسة منتهية، من فضلك سجل الدخول مرة أخرى' });
  }
}

const isCreator = req => req.user?.role === 'system_creator';
const isAdmin = req => req.user?.role === 'admin' || isCreator(req);
const isSupervisor = req => isAdmin(req) || req.user?.role === 'supervisor';

function requireSystemCreator(req, res, next) {
  if (!requireJwtSecret(res)) return;
  if (!isCreator(req)) return res.status(403).json({ error: 'هذه الصفحة متاحة لمنشئ النظام فقط.' });
  next();
}

function requireAdmin(req, res, next) {
  if (!requireJwtSecret(res)) return;
  if (!isAdmin(req)) return res.status(403).json({ error: 'هذا الإجراء متاح لمدير النظام أو منشئ النظام فقط.' });
  next();
}

function requireSupervisor(req, res, next) {
  if (!requireJwtSecret(res)) return;
  if (!isSupervisor(req)) return res.status(403).json({ error: 'هذا الإجراء متاح لمدير النظام أو المشرف فقط.' });
  next();
}

function requireAdminOrSupervisor(req, res, next) { return requireSupervisor(req, res, next); }
const requireUploader = requireSupervisor;

// Customizable-permission gate. system_creator always passes. For 'admin'
// and 'supervisor' this checks the editable matrix in utils/permissions.js
// (managed on the Permissions page); other roles are always denied. Falls
// back to requireSupervisor's error message so existing UI error handling
// keeps working unchanged.
function requirePermission(key) {
  return async function (req, res, next) {
    if (!requireJwtSecret(res)) return;
    if (isCreator(req)) return next();
    const role = req.user?.role;
    if (role !== 'admin' && role !== 'supervisor') {
      return res.status(403).json({ error: 'هذا الإجراء متاح لمدير النظام أو المشرف فقط.' });
    }
    try {
      const allowed = await hasPermission(role, key);
      if (!allowed) return res.status(403).json({ error: 'ليس لديك صلاحية لتنفيذ هذا الإجراء. تواصل مع منشئ النظام.' });
      return next();
    } catch (err) {
      return res.status(500).json({ error: 'تعذّر التحقق من الصلاحيات.' });
    }
  };
}

module.exports = {
  requireAuth, requireAdmin, requireSupervisor, requireAdminOrSupervisor,
  requireUploader, requireSystemCreator, requirePermission,
  isCreator, isAdmin, isSupervisor, JWT_SECRET
};
