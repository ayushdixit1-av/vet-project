const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const adminEmails = () => {
  const emails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [];
  return (req, res, next) => {
    if (!req.user || !emails.includes(req.user.email)) {
      return res.status(403).json({ error: 'Admin email access required' });
    }
    req.user.role = 'admin';
    next();
  };
};

module.exports = { isAdmin, adminEmails };
