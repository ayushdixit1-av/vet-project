exports.convertDriveLink = (driveUrl) => {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/file\/d\/([^/?#&]+)/,
    /(?:https?:\/\/)?(?:www\.)?drive\.google\.com\/open\?id=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?docs\.google\.com\/document\/d\/([^/?#&]+)/
  ];

  for (const pattern of patterns) {
    const match = driveUrl.match(pattern);
    if (match) {
      const fileId = match[1];
      return {
        fileId,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        directUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}`
      };
    }
  }
  return null;
};

exports.generateToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

exports.validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

exports.sanitizeHtml = (str) => {
  return str.replace(/[&<>"']/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    if (m === '"') return '&quot;';
    if (m === "'") return '&#39;';
    return m;
  });
};
