class PDFWatermark {
  constructor(userEmail, userName) {
    this.userEmail = userEmail || 'guest@vetcrack.com';
    this.userName = userName || 'Guest User';
    this.platform = 'VetCrack';
    this.timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  }

  applyToCanvas(canvas, pageWidth, pageHeight) {
    const ctx = canvas.getContext('2d');
    const watermarkText = `${this.userEmail} | ${this.platform} | ${this.timestamp}`;

    ctx.save();
    ctx.translate(pageWidth / 2, pageHeight / 2);
    ctx.rotate(-Math.PI / 4);

    ctx.font = `${Math.min(pageWidth, pageHeight) * 0.025}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = -2; i <= 2; i++) {
      for (let j = -1; j <= 1; j++) {
        const x = i * 300;
        const y = j * 200;
        ctx.fillText(watermarkText, x, y);
      }
    }

    ctx.restore();

    const footerText = `${this.userName} | ${this.userEmail}`;
    ctx.save();
    ctx.font = `${Math.min(pageWidth, pageHeight) * 0.015}px Arial`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(footerText, pageWidth - 20, pageHeight - 10);

    ctx.textAlign = 'left';
    ctx.fillText(this.platform, 20, pageHeight - 10);
    ctx.restore();

    return canvas;
  }

  getWatermarkConfig() {
    return {
      text: `${this.userEmail} | ${this.platform} | ${this.timestamp}`,
      opacity: 0.08,
      rotation: -45,
      fontSize: 14,
      fontFamily: 'Arial',
      color: '#ffffff'
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PDFWatermark;
}
