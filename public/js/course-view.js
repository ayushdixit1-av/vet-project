let currentCourse = null;
let userPurchased = false;

document.addEventListener('DOMContentLoaded', function() {
  loadCourse();
});

async function loadCourse() {
  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('id');
  if (!courseId) {
    document.getElementById('courseViewTitle').textContent = 'Course not found';
    return;
  }

  try {
    const data = await apiRequest(`/courses/${courseId}`);
    currentCourse = data.course;
    await checkPurchase(data.course);
    renderCourse(data.course);
  } catch (err) {
    console.error('loadCourse error:', err);
    document.getElementById('courseViewTitle').textContent = 'Failed to load course';
    document.getElementById('courseViewDesc').textContent = err.message || 'Unknown error. Check console for details.';
  }
}

function renderCourse(course) {
  document.getElementById('courseViewTitle').textContent = course.title;
  document.getElementById('courseViewDesc').textContent = course.description;
  document.getElementById('courseSectionCount').textContent = countSections(course.sections);
  document.getElementById('courseDifficulty').textContent = course.difficulty || 'Beginner';
  document.getElementById('courseCategory').textContent = course.category || 'General';

  const isFree = course.isFree || course.price === 0 || course.price === '0';
  document.getElementById('coursePriceDisplay').textContent = isFree ? 'FREE' : `₹${course.price}`;

  if (isFree) {
    document.getElementById('purchaseSection').style.display = 'none';
    document.getElementById('ownedSection').style.display = 'block';
    document.querySelector('#ownedSection .badge').textContent = 'Free Course';
    userPurchased = true;
  }

  const sectionsContainer = document.getElementById('sectionsList');
  if (!course.sections || course.sections.length === 0) {
    sectionsContainer.innerHTML = '<p class="text-muted">No sections available yet.</p>';
  } else {
    sectionsContainer.innerHTML = renderSectionsTree(course.sections, 0);
  }

  renderTests(course);
}

function renderTests(course) {
  const container = document.getElementById('testsList');
  const tests = course.tests || [];
  if (tests.length === 0) {
    container.innerHTML = '<p class="text-muted">No tests for this course.</p>';
    return;
  }
  const hasAccess = userPurchased || course.isFree;
  container.innerHTML = tests.map(t => `
    <div class="test-card glass" style="padding:16px;margin-bottom:12px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <strong>${t.title}</strong>
        <div class="text-muted" style="font-size:13px;">${t.totalQuestions || 0} questions &middot; ${t.durationMinutes} min</div>
        ${t.description ? '<p style="font-size:13px;margin:4px 0 0;">' + t.description + '</p>' : ''}
        <div id="testResult-${t.testId}" style="margin-top:6px;"></div>
      </div>
      <div>
        ${hasAccess
          ? `<button class="btn btn-primary glow" onclick="startTest('${t.testId}')"><i class="fas fa-pencil-alt"></i> Attempt</button>`
          : `<button class="btn btn-secondary btn-sm" disabled><i class="fas fa-lock"></i> Locked</button>`}
      </div>
    </div>
  `).join('');

  if (isLoggedIn() && hasAccess) {
    tests.forEach(t => loadUserTestResult(t.testId));
  }
}

async function loadUserTestResult(testId) {
  try {
    const data = await apiRequest('/test-attempts/user/' + testId);
    if (data.attempt) {
      const el = document.getElementById('testResult-' + testId);
      if (el) {
        const pct = Math.round((data.attempt.score / data.attempt.total_questions) * 100);
        const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
        el.innerHTML = `<span style="font-size:13px;color:${color};"><i class="fas fa-check-circle"></i> Score: ${data.attempt.score}/${data.attempt.total_questions} (${pct}%)</span>`;
      }
    }
  } catch (err) {}
}

function countSections(sections) {
  if (!sections) return 0;
  let count = sections.length;
  sections.forEach(s => { if (s.subsections) count += countSections(s.subsections); });
  return count;
}

function renderSectionsTree(sections, depth) {
  return sections.map((section, idx) => `
    <div class="section-card" style="${depth > 0 ? 'margin-left:24px;border-left:2px solid var(--accent-primary);' : ''}">
      <div class="section-header" onclick="toggleSection(this)">
        <h4>${depth > 0 ? '<i class="fas fa-level-down-alt" style="font-size:12px;color:var(--accent-primary);margin-right:6px;"></i>' : '<i class="fas fa-folder"></i>'} ${section.sectionTitle}</h4>
        <i class="fas fa-chevron-down"></i>
      </div>
      <div class="section-body" id="section-${section.sectionId}">
        ${renderContentItems(section)}
        ${section.subsections && section.subsections.length ? renderSectionsTree(section.subsections, depth + 1) : ''}
      </div>
    </div>
  `).join('');
}

function renderContentItems(section) {
  const hasAccess = userPurchased || currentCourse?.isFree;
  let html = '';
  if (section.contents && section.contents.length > 0) {
    html += section.contents.map(c => {
      const locked = !hasAccess;
      if (c.type === 'video') {
        return `
          <div class="content-item ${locked ? 'locked-overlay' : ''}">
            <i class="fas fa-video"></i>
            <span>${c.title}</span>
            ${locked
              ? '<button class="btn btn-secondary btn-sm" disabled><i class="fas fa-lock"></i> Locked</button>'
              : `<button class="btn btn-primary btn-sm" onclick="openContent('${c.contentId}','${encodeURIComponent(c.title)}','${c.type}','${c.fileUrl || ''}','${c.embedUrl || ''}','${c.driveLink || ''}')"><i class="fas fa-play"></i> Play</button>`}
          </div>`;
      } else if (c.type === 'pdf') {
        return `
          <div class="content-item ${locked ? 'locked-overlay' : ''}" onclick="${locked ? '' : `openContent('${c.contentId}','${encodeURIComponent(c.title)}','${c.type}','${c.fileUrl || ''}','${c.embedUrl || ''}','${c.driveLink || ''}')`}">
            <i class="fas fa-file-pdf"></i>
            <span>${c.title}</span>
            ${locked
              ? '<button class="btn btn-secondary btn-sm" disabled><i class="fas fa-lock"></i> Locked</button>'
              : '<button class="btn btn-primary btn-sm"><i class="fas fa-eye"></i> View</button>'}
          </div>`;
      } else if (c.type === 'embed') {
        return `
          <div class="content-item ${locked ? 'locked-overlay' : ''}">
            <i class="fas fa-code"></i>
            <span>${c.title}</span>
            ${locked
              ? '<button class="btn btn-secondary btn-sm" disabled><i class="fas fa-lock"></i> Locked</button>'
              : `<button class="btn btn-primary btn-sm" onclick="openContent('${c.contentId}','${encodeURIComponent(c.title)}','${c.type}','${c.fileUrl || ''}','${c.embedUrl || ''}','${c.driveLink || ''}')"><i class="fas fa-eye"></i> View</button>`}
          </div>`;
      }
      return '';
    }).join('');
  }
  if (section.pdfs && section.pdfs.length > 0) {
    html += section.pdfs.map(pdf => `
      <div class="pdf-item ${!hasAccess ? 'locked-overlay' : ''}" onclick="${!hasAccess ? '' : `openPdf('${pdf.pdfId}','${encodeURIComponent(pdf.title)}')`}">
        <i class="fas fa-file-pdf"></i>
        <span>${pdf.title} ${hasAccess ? '' : '<span style="font-size:11px;color:var(--warning);margin-left:8px;">(locked)</span>'}</span>
        ${hasAccess
          ? '<button class="btn btn-primary btn-sm"><i class="fas fa-eye"></i> View</button>'
          : '<button class="btn btn-secondary btn-sm" disabled><i class="fas fa-lock"></i> Locked</button>'}
      </div>
    `).join('');
  }
  if (!html) {
    html = '<p class="text-muted" style="padding:12px;">No content in this section.</p>';
  }
  return html;
}

function toggleSection(header) {
  const body = header.nextElementSibling;
  const icon = header.querySelector('.fa-chevron-down, .fa-chevron-up');
  if (body.classList.contains('open')) {
    body.classList.remove('open');
    if (icon) icon.className = 'fas fa-chevron-down';
  } else {
    body.classList.add('open');
    if (icon) icon.className = 'fas fa-chevron-up';
  }
}

async function checkPurchase(course) {
  if (!isLoggedIn()) {
    document.getElementById('buyNowBtn').onclick = () => {
      localStorage.setItem('redirectAfterLogin', window.location.href);
      window.location.href = '/pages/login.html';
    };
    return;
  }

  const isFree = course.isFree || course.price === 0 || course.price === '0';
  if (isFree) return;

  try {
    const data = await apiRequest('/payment/user-purchases');
    const purchases = data.purchases || [];
    const purchased = purchases.some(p => p.courseId === course.courseId);
    userPurchased = purchased;

    if (purchased) {
      document.getElementById('purchaseSection').style.display = 'none';
      document.getElementById('ownedSection').style.display = 'block';
    } else {
      document.getElementById('buyNowBtn').onclick = handleBuyNow;
    }
  } catch (err) {
    document.getElementById('buyNowBtn').onclick = handleBuyNow;
  }
}

async function handleBuyNow() {
  if (!isLoggedIn()) {
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '/pages/login.html';
    return;
  }

  const user = getCurrentUser();
  const amount = currentCourse.price;

  try {
    const orderData = await apiRequest('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ courseId: currentCourse.courseId, amount })
    });

    const options = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'VetCrack',
      description: currentCourse.title,
      order_id: orderData.orderId,
      prefill: { email: user.email, name: user.name },
      handler: async function(response) {
        try {
          const verifyData = await apiRequest('/payment/verify', {
            method: 'POST',
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              courseId: currentCourse.courseId,
              userId: user.uid,
              userEmail: user.email,
              amount
            })
          });

          if (verifyData.success) {
            alert('Payment successful! Course unlocked.');
            document.getElementById('purchaseSection').style.display = 'none';
            document.getElementById('ownedSection').style.display = 'block';
            userPurchased = true;
            location.reload();
          }
        } catch (err) {
          alert('Payment verification failed: ' + err.message);
        }
      },
      modal: {
        ondismiss: function() {
          alert('Payment cancelled');
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  } catch (err) {
    alert('Payment failed: ' + err.message);
  }
}

function openPdf(pdfId, title) {
  if (!userPurchased && !currentCourse?.isFree) {
    alert('Please purchase this course to access PDFs');
    return;
  }
  window.location.href = `pdf-viewer.html?id=${pdfId}&title=${title || 'PDF'}`;
}

function openContent(contentId, title, type, fileUrl, embedUrl, driveLink) {
  if (!userPurchased && !currentCourse?.isFree) {
    alert('Please purchase this course to access content');
    return;
  }
  const titleDecoded = decodeURIComponent(title);
  if (type === 'embed' && embedUrl) {
    const width = screen.width * 0.9;
    const height = screen.height * 0.85;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open('', '_blank', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`)
      .document.write(`
        <html><head><title>${titleDecoded}</title>
        <style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;}
        iframe{width:100%;height:100%;border:none;}</style>
        </head><body>
        <iframe src="${embedUrl}" allowfullscreen loading="lazy"></iframe>
        </body></html>
      `);
    return;
  }
  if (type === 'video') {
    const width = screen.width * 0.9;
    const height = screen.height * 0.85;
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    window.open('', '_blank', `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`)
      .document.write(`
        <html><head><title>${titleDecoded}</title>
        <style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;}
        video{width:100%;height:100%;object-fit:contain;}</style>
        </head><body>
        <video src="${fileUrl}" controls autoplay style="width:100%;height:100%;"></video>
        </body></html>
      `);
    return;
  }
  if (type === 'pdf') {
    if (driveLink) {
      window.open(`pdf-viewer.html?id=${contentId}&title=${title}&source=content`, '_blank');
    } else if (fileUrl) {
      window.open(fileUrl, '_blank');
    }
    return;
  }
  alert('Content type not supported for viewing');
}

let currentTest = null;
let testTimer = null;

async function startTest(testId) {
  if (!requireAuth()) return;
  try {
    const data = await apiRequest('/tests/' + testId);
    const test = data.test;
    const questions = data.questions || [];

    if (!test || questions.length === 0) {
      alert('This test has no questions yet.');
      return;
    }

    currentTest = { test, questions };
    const modal = document.getElementById('testModal');
    const body = document.getElementById('testModalBody');

    body.innerHTML = `
      <h2 style="margin-bottom:8px;">${test.title}</h2>
      <p class="text-muted" style="margin-bottom:16px;">${test.description || ''}</p>
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap;">
        <span style="font-size:13px;color:var(--text-secondary);"><i class="fas fa-clock"></i> ${test.duration_minutes} min</span>
        <span style="font-size:13px;color:var(--text-secondary);"><i class="fas fa-question-circle"></i> ${questions.length} questions</span>
        <span id="testTimer" style="font-size:13px;color:var(--accent-primary);font-weight:600;"></span>
      </div>
      <div id="testQuestions">
        ${questions.map((q, i) => `
          <div class="test-question" style="background:rgba(255,255,255,0.04);border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.08);">
            <p style="font-weight:500;margin-bottom:12px;">${i + 1}. ${q.question_text}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
              ${['A','B','C','D'].map(opt => `
                <label class="test-option" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);cursor:pointer;transition:all 0.2s;">
                  <input type="radio" name="q-${q.question_id}" value="${opt}" style="accent-color:var(--accent-primary);">
                  <span><strong>${opt}.</strong> ${q[`option_${opt.toLowerCase()}`]}</span>
                </label>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn btn-primary glow btn-large" onclick="submitTest()" style="width:100%;margin-top:12px;"><i class="fas fa-paper-plane"></i> Submit Test</button>
    `;

    modal.style.display = 'block';

    // Start timer
    let remaining = test.duration_minutes * 60;
    const timerEl = document.getElementById('testTimer');
    function tick() {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      timerEl.textContent = `⏱ ${mins}:${secs.toString().padStart(2, '0')}`;
      if (remaining <= 0) {
        clearInterval(testTimer);
        submitTest();
      }
      remaining--;
    }
    tick();
    testTimer = setInterval(tick, 1000);
  } catch (err) {
    alert('Failed to load test: ' + err.message);
  }
}

function closeTestModal() {
  document.getElementById('testModal').style.display = 'none';
  if (testTimer) { clearInterval(testTimer); testTimer = null; }
  currentTest = null;
}

async function submitTest() {
  if (testTimer) { clearInterval(testTimer); testTimer = null; }

  const questions = currentTest.questions;
  const answers = questions.map(q => {
    const selected = document.querySelector(`input[name="q-${q.question_id}"]:checked`);
    return selected ? selected.value : '';
  });

  const unanswered = answers.filter(a => !a).length;
  if (unanswered > 0 && !confirm(`${unanswered} question(s) unanswered. Submit anyway?`)) return;

  try {
    const data = await apiRequest('/test-attempts/submit', {
      method: 'POST',
      body: JSON.stringify({ testId: currentTest.test.test_id, answers })
    });

    const body = document.getElementById('testModalBody');
    const pct = Math.round((data.score / data.totalQuestions) * 100);
    const grade = pct >= 70 ? 'Passed' : pct >= 40 ? 'Needs Improvement' : 'Failed';
    const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';

    body.innerHTML = `
      <div style="text-align:center;padding:20px 0;">
        <i class="fas fa-check-circle" style="font-size:48px;color:${color};margin-bottom:16px;"></i>
        <h2 style="margin-bottom:8px;">Test Complete!</h2>
        <div style="font-size:48px;font-weight:800;color:${color};margin:20px 0;">${data.score}/${data.totalQuestions}</div>
        <div style="font-size:20px;color:${color};margin-bottom:20px;">${pct}% - ${grade}</div>
        <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:16px;text-align:left;margin-bottom:20px;">
          <h4 style="margin-bottom:12px;">Review Answers</h4>
          ${data.answers.map((a, i) => `
            <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="font-size:14px;margin-bottom:4px;"><strong>Q${i + 1}:</strong> ${questions[i].question_text}</p>
              <p style="font-size:13px;">Your answer: <strong style="color:${a.isCorrect ? 'var(--success)' : 'var(--danger)'};">${a.userAnswer || '(none)'}</strong> ${a.isCorrect ? '<i class="fas fa-check" style="color:var(--success);"></i>' : `<span style="color:var(--text-secondary);">| Correct: <strong style="color:var(--success);">${a.correctOption}</strong></span>`}</p>
            </div>
          `).join('')}
        </div>
        <button class="btn btn-primary glow" onclick="closeTestModal();location.reload();"><i class="fas fa-redo"></i> Close</button>
      </div>
    `;
  } catch (err) {
    alert('Failed to submit: ' + err.message);
    closeTestModal();
  }
}
