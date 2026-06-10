if (!requireAuth()) { throw new Error('Not authenticated'); }

let userEmail = '';
let userName = '';

document.addEventListener('DOMContentLoaded', async function() {
  const params = new URLSearchParams(window.location.search);
  const pdfId = params.get('id');
  const title = params.get('title') || 'PDF Document';

  const user = getCurrentUser();
  userEmail = user?.email || 'guest@vetcrack.com';
  userName = user?.name || 'Guest User';

  document.getElementById('pdfViewerTitle').textContent = decodeURIComponent(title);

  if (!pdfId) {
    showError('No PDF specified');
    return;
  }

  document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);

  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('copy', e => e.preventDefault());
  document.addEventListener('cut', e => e.preventDefault());
  document.addEventListener('paste', e => e.preventDefault());
  document.addEventListener('selectstart', e => e.preventDefault());

  document.addEventListener('visibilitychange', () => {
    document.getElementById('pdfViewport').style.filter = document.hidden ? 'blur(20px)' : 'none';
  });

  try {
    const pdfData = await apiRequest(`/pdfs/${pdfId}`);
    const embedUrl = pdfData.pdf.embedUrl;

    if (!embedUrl) {
      showError('PDF source not available');
      return;
    }

    document.getElementById('pdfLoading').style.display = 'none';
    const viewport = document.getElementById('pdfViewport');
    const cleanUrl = embedUrl.includes('?') ? `${embedUrl}&rm=minimal&embedded=true` : `${embedUrl}?rm=minimal&embedded=true`;
    const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const watermarkText = `${userEmail} | VetCrack | ${ts}`;
    viewport.innerHTML = `<div class="pdf-iframe-wrapper"><iframe src="${cleanUrl}" class="pdf-iframe" allow="fullscreen" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe><div class="pdf-watermark"><span id="wmSpan" class="wm-hidden">${watermarkText}</span></div></div>`;
    animateWatermark();
  } catch (err) {
    showError('Failed to load PDF: ' + err.message);
  }
});

function toggleFullscreen() {
  const container = document.querySelector('.pdf-viewer-container');
  if (!document.fullscreenElement) {
    container.requestFullscreen();
    document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-compress"></i>';
  } else {
    document.exitFullscreen();
    document.getElementById('fullscreenBtn').innerHTML = '<i class="fas fa-expand"></i>';
  }
}

function animateWatermark() {
  const el = document.getElementById('wmSpan');
  if (!el) return;
  const positions = [
    { top: '10%', left: '10%' }, { top: '10%', left: '50%' }, { top: '10%', left: '80%' },
    { top: '40%', left: '5%' },  { top: '40%', left: '60%' },
    { top: '65%', left: '15%' }, { top: '65%', left: '70%' },
    { top: '85%', left: '30%' }, { top: '85%', left: '75%' }
  ];
  let idx = 0;
  function step() {
    el.className = 'wm-fade-out';
    setTimeout(() => {
      const pos = positions[idx % positions.length];
      el.style.top = pos.top;
      el.style.left = pos.left;
      el.className = 'wm-fade-in';
      idx++;
      setTimeout(step, 4000);
    }, 1000);
  }
  setTimeout(step, 500);
}

function showError(msg) {
  document.getElementById('pdfLoading').innerHTML = `
    <i class="fas fa-exclamation-circle fa-3x" style="color:var(--danger)"></i>
    <p>${msg}</p>
    <button class="btn btn-primary" onclick="history.back()" style="margin-top:16px;">Go Back</button>
  `;
}