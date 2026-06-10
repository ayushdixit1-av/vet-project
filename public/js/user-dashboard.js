if (!requireAuth()) { throw new Error('Not authenticated'); }

document.addEventListener('DOMContentLoaded', function() {
  loadDashboard();

  const stars = document.getElementById('reviewStars');
  if (stars) {
    stars.querySelectorAll('i').forEach(star => {
      star.addEventListener('mouseenter', function() {
        const val = parseInt(this.dataset.star);
        stars.querySelectorAll('i').forEach(s => {
          s.style.color = parseInt(s.dataset.star) <= val ? 'var(--warning)' : 'var(--text-secondary)';
        });
      });
      star.addEventListener('mouseleave', function() {
        const saved = parseInt(stars.dataset.value) || 0;
        stars.querySelectorAll('i').forEach(s => {
          s.style.color = parseInt(s.dataset.star) <= saved ? 'var(--warning)' : 'var(--text-secondary)';
        });
      });
      star.addEventListener('click', function() {
        const val = parseInt(this.dataset.star);
        stars.dataset.value = val;
        stars.querySelectorAll('i').forEach(s => {
          s.style.color = parseInt(s.dataset.star) <= val ? 'var(--warning)' : 'var(--text-secondary)';
        });
      });
    });
  }

  document.getElementById('reviewForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg = document.getElementById('reviewMsg');
    msg.className = 'form-message';
    const btn = this.querySelector('button');
    btn.disabled = true;

    const rating = parseInt(document.getElementById('reviewStars').dataset.value) || 0;
    const reviewText = document.getElementById('reviewText').value.trim();
    const qualification = document.getElementById('reviewQualification').value.trim();

    if (rating < 1) {
      msg.textContent = 'Please select a star rating';
      msg.className = 'form-message error';
      btn.disabled = false;
      return;
    }
    if (!reviewText) {
      msg.textContent = 'Please write a review';
      msg.className = 'form-message error';
      btn.disabled = false;
      return;
    }

    try {
      await apiRequest('/reviews/submit', {
        method: 'POST',
        body: JSON.stringify({ rating, reviewText, qualification })
      });
      msg.textContent = 'Review submitted! Thank you for your feedback.';
      msg.className = 'form-message success';
      btn.textContent = 'Update Review';
    } catch (err) {
      msg.textContent = err.message;
      msg.className = 'form-message error';
    }
    btn.disabled = false;
  });
});

async function loadDashboard() {
  try {
    const user = getCurrentUser();
    if (!user) return;

    const [purchaseData, coursesData, reviewData, testData] = await Promise.all([
      apiRequest('/payment/user-purchases').catch(() => ({ purchases: [] })),
      apiRequest('/courses').catch(() => ({ courses: [] })),
      apiRequest('/reviews/user').catch(() => ({ review: null })),
      apiRequest('/test-attempts/user').catch(() => ({ attempts: [] }))
    ]);

    renderCourses(user, purchaseData, coursesData);
    renderReview(reviewData);
    renderTestResults(testData);
  } catch (err) {
    console.error('Dashboard load error:', err);
    document.getElementById('purchasedCoursesGrid') && (document.getElementById('purchasedCoursesGrid').innerHTML = '<p class="text-muted" style="text-align:center;padding:40px;">Failed to load courses. <a href="/">Go back home</a></p>');
    document.getElementById('testResultsList') && (document.getElementById('testResultsList').innerHTML = '<p class="text-muted">Failed to load test results.</p>');
  }
}

function renderCourses(user, purchaseData, coursesData) {
  const purchases = purchaseData.purchases || [];
  const allCourses = coursesData.courses || [];

  const purchasedCourseIds = new Set(purchases.map(p => p.courseId));
  const purchasedCourses = allCourses.filter(c => purchasedCourseIds.has(c.courseId));
  const unpurchasedCourses = allCourses.filter(c => !purchasedCourseIds.has(c.courseId));

  document.getElementById('purchasedCount').textContent = purchasedCourses.length || 0;
  document.getElementById('pdfsViewed').textContent = user.pdfsViewed || 0;
  document.getElementById('continueCount').textContent = purchasedCourses.length || 0;

  const purchasedGrid = document.getElementById('purchasedCoursesGrid');
  const availableGrid = document.getElementById('availableCoursesGrid');

  if (purchasedCourses.length === 0 && unpurchasedCourses.length === 0) {
    purchasedGrid.innerHTML = '<div class="no-courses" style="text-align:center;grid-column:1/-1;padding:60px 20px;"><i class="fas fa-shopping-cart" style="font-size:48px;color:var(--text-secondary);margin-bottom:16px;"></i><h3>No Courses Yet</h3><p class="text-muted">Browse our premium courses and start learning today!</p><a href="/" class="btn btn-primary glow" style="margin-top:16px;"><i class="fas fa-search"></i> Browse Courses</a></div>';
    return;
  }

  if (purchasedCourses.length > 0) {
    purchasedGrid.innerHTML = purchasedCourses.map(c => `
      <div class="course-card" onclick="window.location.href='course-view.html?id=${c.courseId}'">
        <img src="${c.thumbnail || placeholderImg(c.title, 400, 250)}" alt="${c.title}" loading="lazy">
        <div class="course-card-body">
          <h3>${c.title}</h3>
          <div class="course-card-meta">
            <span><i class="fas fa-layer-group"></i> ${c.sections ? c.sections.length : 0} Sections</span>
            <span><i class="fas fa-check-circle" style="color:var(--accent-primary)"></i> Purchased</span>
          </div>
          <div style="font-size:13px;color:var(--accent-secondary);margin-top:6px;"><i class="fas fa-tag"></i> ₹${c.price || 0}</div>
        </div>
      </div>
    `).join('');
  } else {
    purchasedGrid.innerHTML = '<p class="text-muted" style="text-align:center;grid-column:1/-1;padding:40px;">No purchased courses yet.</p>';
  }

  if (unpurchasedCourses.length > 0) {
    availableGrid.innerHTML = unpurchasedCourses.map(c => `
      <div class="course-card" onclick="window.location.href='course-view.html?id=${c.courseId}'">
        <img src="${c.thumbnail || placeholderImg(c.title, 400, 250)}" alt="${c.title}" loading="lazy">
        <div class="course-card-body">
          <h3>${c.title}</h3>
          <div class="course-card-meta">
            <span><i class="fas fa-layer-group"></i> ${c.sections ? c.sections.length : 0} Sections</span>
            ${c.isFree || c.price == 0
              ? '<span><i class="fas fa-star" style="color:var(--accent-primary)"></i> Free</span>'
              : '<span><i class="fas fa-lock" style="color:var(--warning)"></i> Premium</span>'
            }
          </div>
          <div style="font-size:13px;color:var(--accent-secondary);margin-top:6px;"><i class="fas fa-tag"></i> ${c.isFree || c.price == 0 ? 'Free' : '₹' + (c.price || 0)}</div>
        </div>
      </div>
    `).join('');
  } else {
    availableGrid.style.display = 'none';
  }
}

function renderReview(reviewData) {
  const section = document.getElementById('reviewSection');
  if (!section) return;
  const review = reviewData.review;
  const form = document.getElementById('reviewForm');
  if (review) {
    document.getElementById('reviewText').value = review.reviewText || '';
    document.getElementById('reviewQualification').value = review.qualification || '';
    document.getElementById('reviewMsg').textContent = 'You already submitted a review. Update it below:';
    document.getElementById('reviewMsg').className = 'form-message';
    setReviewStars(review.rating);
    document.querySelector('#reviewForm button').textContent = 'Update Review';
  }
}

function setReviewStars(rating) {
  document.querySelectorAll('#reviewStars i').forEach(s => {
    s.style.color = parseInt(s.dataset.star) <= rating ? 'var(--warning)' : 'var(--text-secondary)';
  });
}

function renderTestResults(testData) {
  const container = document.getElementById('testResultsList');
  if (!container) return;
  const attempts = testData.attempts || [];

  if (attempts.length === 0) {
    container.innerHTML = '<p class="text-muted">No test attempts yet. <a href="/">Browse courses</a> and take a test!</p>';
    return;
  }

  container.innerHTML = attempts.map(a => {
    const pct = a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0;
    const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
    return `
      <div class="glass" style="padding:16px;margin-bottom:12px;border-radius:12px;display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>${a.test_title || 'Test'}</strong>
          <div class="text-muted" style="font-size:13px;">${a.course_title || ''}</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">${new Date(a.attempted_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:24px;font-weight:800;color:${color};">${pct}%</div>
          <div style="font-size:13px;color:var(--text-secondary);">${a.score}/${a.total_questions}</div>
        </div>
      </div>
    `;
  }).join('');
}