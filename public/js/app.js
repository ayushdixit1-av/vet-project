document.addEventListener('DOMContentLoaded', function() {
  loadCourses();
  loadFreeCourses();
  loadBlogs();
  loadReviews();
  loadFaqs();
  animateCounters();

  document.getElementById('courseSearch')?.addEventListener('input', filterCourses);
  document.getElementById('categoryFilter')?.addEventListener('change', filterCourses);
  document.getElementById('difficultyFilter')?.addEventListener('change', filterCourses);
  document.getElementById('blogSearch')?.addEventListener('input', filterBlogs);
  document.getElementById('blogCategoryFilter')?.addEventListener('change', filterBlogs);
});

async function loadCourses() {
  try {
    const data = await apiRequest('/courses');
    const premiumCourses = (data.courses || []).filter(c => !(c.isFree === true || c.price === 0 || c.price === '0'));
    renderCourses(premiumCourses);
  } catch (err) {
    document.getElementById('coursesGrid').innerHTML = '<p class="text-muted">Failed to load courses</p>';
  }
}

async function loadFreeCourses() {
  try {
    const data = await apiRequest('/courses');
    const freeCourses = (data.courses || []).filter(c => c.isFree === true || c.price === 0 || c.price === '0');
    renderFreeCourses(freeCourses);
  } catch (err) {
    document.getElementById('freeCoursesGrid').innerHTML = '<p class="text-muted">Failed to load free courses</p>';
  }
}

function renderCourses(courses) {
  const grid = document.getElementById('coursesGrid');
  if (!courses.length) {
    grid.innerHTML = '<p class="text-muted" style="text-align:center;grid-column:1/-1;padding:40px;">No courses available yet.</p>';
    return;
  }
  grid.innerHTML = courses.map(c => createCourseCard(c, true)).join('');
  grid.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.id;
      if (!isLoggedIn()) {
        localStorage.setItem('redirectAfterLogin', `/pages/course-view.html?id=${id}`);
        window.location.href = '/pages/login.html';
      } else {
        window.location.href = `/pages/course-view.html?id=${id}`;
      }
    });
  });
}

function renderFreeCourses(courses) {
  const grid = document.getElementById('freeCoursesGrid');
  if (!courses.length) {
    grid.innerHTML = '<p class="text-muted" style="text-align:center;grid-column:1/-1;padding:40px;">No free courses available yet.</p>';
    return;
  }
  grid.innerHTML = courses.map(c => createCourseCard(c, false)).join('');
  grid.querySelectorAll('.course-card').forEach(card => {
    card.addEventListener('click', () => {
      window.location.href = `/pages/course-view.html?id=${card.dataset.id}`;
    });
  });
}

function createCourseCard(course, showPrice) {
  const price = course.isFree || course.price === 0 || course.price === '0'
    ? '<span class="course-price free">FREE</span>'
    : `<span class="course-price">₹${course.price}</span>`;

  return `
    <div class="course-card" data-id="${course.courseId}">
      <img src="${course.thumbnail || placeholderImg(course.title, 400, 250)}" alt="${course.title}" loading="lazy">
      <div class="course-card-body">
        <h3>${course.title}</h3>
        <p>${course.description || 'Comprehensive veterinary course'}</p>
        <div class="course-card-meta">
          <span><i class="fas fa-signal"></i> ${course.difficulty || 'Beginner'}</span>
          ${showPrice ? price : '<span class="course-price free">FREE</span>'}
        </div>
      </div>
    </div>
  `;
}

async function loadBlogs() {
  try {
    const data = await blogApiRequest('?status=published');
    const blogs = data.blogs || [];
    renderBlogs(blogs);
    populateBlogCategories(blogs);
  } catch (err) {
    const grid = document.getElementById('blogGrid');
    if (grid) grid.innerHTML = '<p class="text-muted" style="text-align:center;padding:40px;">Failed to load blogs</p>';
  }
}

function renderBlogs(blogs) {
  const grid = document.getElementById('blogGrid');
  if (!grid) return;
  if (!blogs.length) {
    grid.innerHTML = '<p class="text-muted" style="text-align:center;grid-column:1/-1;padding:40px;">No blogs published yet.</p>';
    return;
  }
  grid.innerHTML = blogs.map(b => `
    <div class="blog-card" onclick="window.location.href='/blog/${b.slug || b.id}'">
      <img src="${b.thumbnail || placeholderImg('Blog', 400, 200, '1a1a2e', '00ccff')}" alt="${b.title}" loading="lazy">
      <div class="blog-card-body">
        <h3>${b.title}</h3>
        <div style="display:flex;gap:8px;margin-bottom:6px;flex-wrap:wrap;">
          ${b.category ? `<span class="blog-tag">${b.category}</span>` : ''}
        </div>
        <div class="blog-desc">${b.description || ''}</div>
        <div class="blog-card-meta">
          <span><i class="fas fa-user"></i> ${b.author || 'VetCrack'}</span>
          <span><i class="fas fa-calendar-alt"></i> ${b.created_at ? new Date(b.created_at).toLocaleDateString() : ''}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function populateBlogCategories(blogs) {
  const sel = document.getElementById('blogCategoryFilter');
  if (!sel) return;
  const tags = new Set();
  blogs.forEach(b => {
    if (b.tags) b.tags.split(',').forEach(t => tags.add(t.trim()));
  });
  tags.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t; opt.textContent = t;
    sel.appendChild(opt);
  });
}

function filterCourses() {
  const search = (document.getElementById('courseSearch')?.value || '').toLowerCase();
  const category = document.getElementById('categoryFilter')?.value || 'all';
  const difficulty = document.getElementById('difficultyFilter')?.value || 'all';

  document.querySelectorAll('#coursesGrid .course-card').forEach(card => {
    const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
    const cats = card.querySelector('.course-card-meta span:last-child')?.textContent?.toLowerCase() || '';
    const diffs = card.querySelector('.course-card-meta span:first-child')?.textContent?.toLowerCase() || '';
    const match = (!search || title.includes(search)) &&
      (category === 'all' || cats.includes(category)) &&
      (difficulty === 'all' || diffs.includes(difficulty));
    card.style.display = match ? '' : 'none';
  });
}

function filterBlogs() {
  const search = (document.getElementById('blogSearch')?.value || '').toLowerCase();
  const category = document.getElementById('blogCategoryFilter')?.value || 'all';

  document.querySelectorAll('#blogGrid .blog-card').forEach(card => {
    const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
    const tags = card.querySelector('.blog-card-meta:last-child')?.textContent?.toLowerCase() || '';
    const match = (!search || title.includes(search)) &&
      (category === 'all' || tags.includes(category.toLowerCase()));
    card.style.display = match ? '' : 'none';
  });
}

async function loadReviews() {
  const grid = document.getElementById('testimonialGrid');
  if (!grid) return;
  try {
    const data = await apiRequest('/reviews');
    const reviews = data.reviews || [];
    if (!reviews.length) {
      grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;">No reviews yet. Be the first to review!</p>';
      return;
    }
    grid.innerHTML = reviews.map(r => `
      <div class="testimonial-card glass">
        <i class="fas fa-quote-left"></i>
        <p>"${r.reviewText || ''}"</p>
        <h4>${r.userName}</h4>
        ${r.qualification ? `<span style="font-size:13px;color:var(--accent-secondary);display:block;margin-top:-6px;margin-bottom:8px;">${r.qualification}</span>` : ''}
        <div class="star-rating">${'<i class="fas fa-star"></i>'.repeat(r.rating)}</div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p class="text-muted" style="grid-column:1/-1;text-align:center;">Failed to load reviews</p>';
  }
}

async function loadFaqs() {
  const grid = document.getElementById('faqGrid');
  if (!grid) return;
  try {
    const data = await apiRequest('/faqs');
    const faqs = data.faqs || [];
    if (!faqs.length) { grid.innerHTML = ''; return; }
    const faqIcons = {
      'vetcrack': 'fa-graduation-cap',
      'free': 'fa-tag',
      'premium': 'fa-crown',
      'access': 'fa-lock-open',
      'mobile': 'fa-mobile-alt',
      'payment': 'fa-credit-card',
      'support': 'fa-headset',
      'contact': 'fa-envelope',
      'course': 'fa-book-open',
      'price': 'fa-rupee-sign',
    };
    const getIcon = (q) => {
      const lower = q.toLowerCase();
      for (const [key, icon] of Object.entries(faqIcons)) {
        if (lower.includes(key)) return icon;
      }
      return 'fa-question-circle';
    };
    grid.innerHTML = faqs.map((f, i) => `
      <div class="faq-item${i === 0 ? ' active' : ''}">
        <div class="faq-question" onclick="toggleFaq(this)">
          <span class="faq-q-icon"><i class="fas ${getIcon(f.question)}"></i></span>
          <span class="faq-q-text">${f.question}</span>
          <span class="faq-chevron"><i class="fas fa-chevron-down"></i></span>
        </div>
        <div class="faq-answer">
          <p>${f.answer}</p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<p class="text-muted">Failed to load FAQs</p>';
  }
}

function toggleFaq(el) {
  const item = el.parentElement;
  const isCurrentlyOpen = item.classList.contains('active');
  document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
  if (!isCurrentlyOpen) item.classList.add('active');
}

function animateCounters() {
  const counters = document.querySelectorAll('.stat-number[data-target]');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const increment = target / 50;
    let current = 0;
    const update = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.ceil(current);
        requestAnimationFrame(update);
      } else {
        counter.textContent = target + '+';
      }
    };
    update();
  });
}
