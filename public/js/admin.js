console.log('admin.js loaded');
const _adminAuth = requireAdmin();
console.log('admin.js requireAdmin result:', _adminAuth);
if (!_adminAuth) { throw new Error('Not authorized'); }
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded fired');
  loadDashboardData();
  loadManageCourses();
  loadUsers();
  loadAdminBlogs();
  loadAdminFaqs();
  loadAdminMedicines();
  loadAdminTests();
  loadTestCourseSelects();
  loadScoresSelects();
  loadScoresTests();
  loadTestScores();
  loadAdminNotes();

  let chartInstance = null;
  if (document.getElementById('page-dashboard').classList.contains('active')) initChart();

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
      const page = document.getElementById(`page-${this.dataset.page}`);
      if (page) page.classList.add('active');
      document.getElementById('pageTitle').textContent = this.querySelector('span').textContent;
      if (window.innerWidth <= 768) document.getElementById('adminSidebar').classList.remove('open');
      if (this.dataset.page === 'dashboard') initChart();
      if (this.dataset.page === 'manageBlogs') loadAdminBlogs();
      if (this.dataset.page === 'faqs') loadAdminFaqs();
      if (this.dataset.page === 'medicines') loadAdminMedicines();
      if (this.dataset.page === 'notes') loadAdminNotes();
    });
  });

  function initChart() {
    const ctx = document.getElementById('analyticsChart');
    if (!ctx || typeof Chart === 'undefined') return;
    if (chartInstance) { chartInstance.resize(); return; }
    chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'New Users',
          data: [12, 19, 25, 30],
          borderColor: '#00ff88',
          backgroundColor: 'rgba(0,255,136,0.1)',
          tension: 0.4
        }, {
          label: 'Purchases',
          data: [8, 15, 20, 28],
          borderColor: '#00ccff',
          backgroundColor: 'rgba(0,204,255,0.1)',
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { labels: { color: '#e8e8f0' } } },
        scales: {
          x: { ticks: { color: '#8888aa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#8888aa' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }

  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('adminSidebar').classList.toggle('open');
  });

  document.getElementById('createCourseForm')?.addEventListener('submit', handleCreateCourse);
  document.getElementById('addSectionForm')?.addEventListener('submit', handleAddSection);
  document.getElementById('uploadPdfForm')?.addEventListener('submit', handleUploadPdf);
  document.getElementById('createFaqForm')?.addEventListener('submit', handleCreateFaq);
  document.getElementById('editFaqForm')?.addEventListener('submit', handleEditFaq);
  document.getElementById('createMedicineForm')?.addEventListener('submit', handleCreateMedicine);
  document.getElementById('editMedicineForm')?.addEventListener('submit', handleEditMedicine);
  document.getElementById('createBlogForm')?.addEventListener('submit', handleCreateBlog);
  document.getElementById('editBlogForm')?.addEventListener('submit', handleEditBlog);
  document.getElementById('editBlogThumbnailInput')?.addEventListener('change', function() {
    const preview = document.getElementById('editBlogThumbnailPreview');
    const img = preview?.querySelector('img');
    if (this.files.length > 0) {
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(this.files[0]);
    } else {
      if (preview) preview.style.display = 'none';
    }
  });
  document.getElementById('grantCourseForm')?.addEventListener('submit', handleGrantCourse);
  document.getElementById('founderForm')?.addEventListener('submit', handleFounderSave);
  loadFounderSettings();

  loadCourseSelects();

  document.getElementById('addContentForm')?.addEventListener('submit', handleAddContent);
  document.getElementById('editCourseForm')?.addEventListener('submit', handleEditCourse);
  document.getElementById('editCourseThumbnailInput')?.addEventListener('change', function() {
    const preview = document.getElementById('editCourseThumbnailPreview');
    const img = preview?.querySelector('img');
    if (this.files.length > 0) {
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(this.files[0]);
    } else {
      if (preview) preview.style.display = 'none';
    }
  });
  document.getElementById('blogThumbnailInput')?.addEventListener('change', function() {
    const preview = document.getElementById('blogThumbnailPreview');
    const img = preview?.querySelector('img');
    if (this.files.length > 0) {
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(this.files[0]);
    } else {
      if (preview) preview.style.display = 'none';
    }
  });

  document.getElementById('courseThumbnailInput')?.addEventListener('change', function() {
    const preview = document.getElementById('courseThumbnailPreview');
    const img = preview?.querySelector('img');
    if (this.files.length > 0) {
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target.result; preview.style.display = 'block'; };
      reader.readAsDataURL(this.files[0]);
    } else {
      if (preview) preview.style.display = 'none';
    }
  });
});

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 2592000) return Math.floor(diff / 86400) + 'd ago';
  return new Date(dateStr).toLocaleDateString();
}

async function loadDashboardData() {
  try {
    const results = await Promise.allSettled([
      apiRequest('/courses'),
      apiRequest('/pdfs'),
      apiRequest('/auth/users'),
      apiRequest('/reviews'),
      apiRequest('/test-attempts/all')
    ]);

    const courses = (results[0].value?.courses) || [];
    const pdfs = (results[1].value?.pdfs) || [];
    const usersRes = results[2].value || { users: [], count: 0 };
    const users = usersRes.users || [];
    const reviews = (results[3].value?.reviews) || [];
    const attempts = (results[4].value?.attempts) || [];

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setText('totalCourses', courses.length);
    setText('totalPdfs', pdfs.length);
    setText('totalReviews', reviews.length);
    setText('totalUsers', usersRes.count || users.length);

    const activities = [];

    users.forEach(u => {
      activities.push({
        date: u.created_at,
        html: `<i class="fas fa-user-plus" style="color:#00ff88"></i> <strong>${u.name || u.email}</strong> registered`
      });
    });

    attempts.forEach(a => {
      activities.push({
        date: a.attempted_at,
        html: `<i class="fas fa-clipboard-check" style="color:#ffcc00"></i> <strong>${a.user_name || a.user_email}</strong> scored ${a.score}/${a.total_questions} in <em>${a.test_title}</em>`
      });
    });

    reviews.forEach(r => {
      activities.push({
        date: r.createdAt,
        html: `<i class="fas fa-star" style="color:#ff8800"></i> <strong>${r.userName || 'Someone'}</strong> gave ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} rating`
      });
    });

    courses.forEach(c => {
      activities.push({
        date: c.createdAt,
        html: `<i class="fas fa-book" style="color:#00ccff"></i> New course <strong>${c.title}</strong> created`
      });
    });

    activities.sort((a, b) => new Date(b.date) - new Date(a.date));

    const recent = document.getElementById('recentActivity');
    if (recent) {
      if (activities.length) {
        recent.innerHTML = activities.slice(0, 10).map(a =>
          `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:13px;">
            ${a.html}
            <span style="margin-left:auto;color:var(--text-secondary);font-size:11px;white-space:nowrap;">${timeAgo(a.date)}</span>
          </div>`
        ).join('');
      } else {
        recent.innerHTML = '<p class="text-muted">No recent activity</p>';
      }
    }
  } catch (err) { console.error('Dashboard load error:', err); }
}

async function loadCourseSelects() {
  try {
    const data = await apiRequest('/courses');
    const courses = data.courses || [];

    ['sectionCourseSelect', 'pdfCourseSelect', 'grantCourseSelect', 'manageSectionCourseSelect', 'contentCourseSelect'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = courses.map(c => `<option value="${c.courseId}">${c.title}</option>`).join('');
      sel.insertAdjacentHTML('afterbegin', '<option value="">Select course...</option>');
    });
  } catch (err) { console.error(err); }
}

document.getElementById('sectionCourseSelect')?.addEventListener('change', async function() {
  const parentSel = document.getElementById('sectionParentSelect');
  if (!parentSel) return;
  parentSel.innerHTML = '<option value="">None (top-level section)</option>';
  if (!this.value) return;
  try {
    const data = await apiRequest(`/sections/${this.value}`);
    (data.sections || []).forEach(s => {
      parentSel.innerHTML += `<option value="${s.sectionId}">${s.sectionTitle}</option>`;
    });
  } catch (err) {}
});

document.getElementById('contentCourseSelect')?.addEventListener('change', loadContentSections);

async function loadContentSections() {
  const courseSel = document.getElementById('contentCourseSelect');
  const sectionSel = document.getElementById('contentSectionSelect');
  if (!sectionSel) return;
  sectionSel.innerHTML = '<option value="">Loading sections...</option>';
  if (!courseSel || !courseSel.value) { sectionSel.innerHTML = '<option value="">Select section...</option>'; return; }
  try {
    const data = await apiRequest(`/sections/${courseSel.value}`);
    sectionSel.innerHTML = (data.sections || []).map(s => `<option value="${s.sectionId}">${s.sectionTitle}</option>`).join('');
    sectionSel.insertAdjacentHTML('afterbegin', '<option value="">Select section...</option>');
  } catch (err) { sectionSel.innerHTML = '<option value="">Error loading sections</option>'; }
}

document.getElementById('pdfCourseSelect')?.addEventListener('change', async function() {
  const sectionSel = document.getElementById('pdfSectionSelect');
  if (!sectionSel) return;
  sectionSel.innerHTML = '<option value="">Loading sections...</option>';
  if (!this.value) { sectionSel.innerHTML = '<option value="">Select section...</option>'; return; }
  try {
    const data = await apiRequest(`/sections/${this.value}`);
    sectionSel.innerHTML = (data.sections || []).map(s => `<option value="${s.sectionId}">${s.sectionTitle}</option>`).join('');
    sectionSel.insertAdjacentHTML('afterbegin', '<option value="">Select section...</option>');
  } catch (err) { sectionSel.innerHTML = '<option value="">Error loading sections</option>'; }
});

async function handleCreateCourse(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  const msg = document.getElementById('createCourseMsg');
  msg.className = 'form-message';

  try {
    let thumbnailUrl = '';
    const fileInput = document.getElementById('courseThumbnailInput');
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('thumbnail', fileInput.files[0]);
      const token = localStorage.getItem('vetcrack_token');
      const uploadRes = await fetch(`${API_URL}/api/settings/upload-course-thumbnail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      thumbnailUrl = uploadData.imageUrl;
    }

    const data = await apiRequest('/courses/create', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('courseTitle').value,
        description: document.getElementById('courseDescription').value,
        thumbnail: thumbnailUrl,
        category: document.getElementById('courseCategory').value,
        price: parseFloat(document.getElementById('coursePrice').value) || 0,
        difficulty: document.getElementById('courseDifficulty').value
      })
    });
    msg.textContent = 'Course created successfully!';
    msg.className = 'form-message success';
    e.target.reset();
    document.getElementById('courseThumbnailPreview').style.display = 'none';
    loadManageCourses();
    loadCourseSelects();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

function toggleContentFields() {
  const type = document.getElementById('contentType').value;
  document.getElementById('contentFileGroup').style.display = type === 'embed' ? 'none' : 'block';
  document.getElementById('contentEmbedGroup').style.display = type === 'embed' ? 'block' : 'none';
  document.getElementById('contentDriveGroup').style.display = type === 'embed' ? 'none' : 'block';
}

async function handleAddContent(e) {
  e.preventDefault();
  const msg = document.getElementById('addContentMsg');
  msg.className = 'form-message';
  const btn = e.target.querySelector('button');
  btn.disabled = true;

  try {
    const sectionId = document.getElementById('contentSectionSelect').value;
    const title = document.getElementById('contentTitle').value;
    const type = document.getElementById('contentType').value;
    const order = parseInt(document.getElementById('contentOrder').value) || 0;
    const embedUrl = document.getElementById('contentEmbedUrl').value;
    const driveLink = document.getElementById('contentDriveLink').value;
    const fileInput = document.getElementById('contentFileInput');

    if (type === 'embed' && !embedUrl) {
      throw new Error('Embed URL is required for embed type');
    }

    const formData = new FormData();
    formData.append('sectionId', sectionId);
    formData.append('title', title);
    formData.append('type', type);
    formData.append('order', order.toString());
    formData.append('embedUrl', embedUrl);
    formData.append('driveLink', driveLink);
    if (fileInput.files.length > 0) {
      formData.append('file', fileInput.files[0]);
    }

    const token = localStorage.getItem('vetcrack_token');
    const uploadRes = await fetch(`${API_URL}/api/contents/add`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to add content');

    msg.textContent = 'Content added successfully!';
    msg.className = 'form-message success';
    e.target.reset();
    document.getElementById('contentEmbedGroup').style.display = 'none';
    document.getElementById('contentDriveGroup').style.display = 'block';
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function handleAddSection(e) {
  e.preventDefault();
  const msg = document.getElementById('addSectionMsg');
  msg.className = 'form-message';

  try {
    const parentId = document.getElementById('sectionParentSelect').value;
    const data = await apiRequest('/sections/create', {
      method: 'POST',
      body: JSON.stringify({
        courseId: document.getElementById('sectionCourseSelect').value,
        sectionTitle: document.getElementById('sectionTitle').value,
        order: parseInt(document.getElementById('sectionOrder').value) || 0,
        ...(parentId ? { parentId } : {})
      })
    });
    msg.textContent = 'Section added successfully!';
    msg.className = 'form-message success';
    e.target.reset();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
}

async function handleUploadPdf(e) {
  e.preventDefault();
  const msg = document.getElementById('uploadPdfMsg');
  msg.className = 'form-message';

  try {
    const data = await apiRequest('/pdfs/add', {
      method: 'POST',
      body: JSON.stringify({
        courseId: document.getElementById('pdfCourseSelect').value,
        sectionId: document.getElementById('pdfSectionSelect').value,
        title: document.getElementById('pdfTitle').value,
        driveLink: document.getElementById('pdfDriveLink').value
      })
    });
    msg.textContent = 'PDF uploaded successfully!';
    msg.className = 'form-message success';
    e.target.reset();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
}

async function handleGrantCourse(e) {
  e.preventDefault();
  const msg = document.getElementById('grantCourseMsg');
  msg.className = 'form-message';
  const btn = e.target.querySelector('button');
  btn.disabled = true;

  try {
    const data = await apiRequest('/payment/grant', {
      method: 'POST',
      body: JSON.stringify({
        email: document.getElementById('grantEmail').value.trim(),
        courseId: document.getElementById('grantCourseSelect').value
      })
    });
    msg.textContent = data.message;
    msg.className = 'form-message success';
    e.target.reset();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function handleCreateBlog(e) {
  e.preventDefault();
  const msg = document.getElementById('createBlogMsg');
  msg.className = 'form-message';
  const btn = e.target.querySelector('button');
  btn.disabled = true;

  try {
    let thumbnail = '';
    const fileInput = document.getElementById('blogThumbnailInput');
    if (fileInput && fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('thumbnail', fileInput.files[0]);
      const token = localStorage.getItem('vetcrack_token');
      const uploadRes = await fetch(`${API_URL}/api/settings/upload-course-thumbnail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      thumbnail = uploadData.imageUrl;
    }

    const data = await blogApiRequest('/', {
      method: 'POST',
      body: JSON.stringify({
        title: document.getElementById('blogTitle').value,
        slug: document.getElementById('blogSlug').value,
        thumbnail,
        description: document.getElementById('blogDescription').value,
        content: document.getElementById('blogContent').value,
        author: document.getElementById('blogAuthor').value,
        category: document.getElementById('blogCategory').value,
        tags: document.getElementById('blogTags').value,
        status: document.getElementById('blogStatus').value,
        meta_title: document.getElementById('blogMetaTitle').value,
        meta_description: document.getElementById('blogMetaDescription').value
      })
    });
    msg.textContent = 'Blog created successfully!';
    msg.className = 'form-message success';
    e.target.reset();
    document.getElementById('blogThumbnailPreview').style.display = 'none';
    loadAdminBlogs();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function loadManageCourses() {
  const container = document.getElementById('manageCoursesList');
  if (!container) return;
  try {
    const data = await apiRequest('/courses');
    const courses = data.courses || [];
    if (!courses.length) { container.innerHTML = '<p class="text-muted">No courses yet.</p>'; return; }
    container.innerHTML = courses.map(c => `
      <div class="course-manage-item">
        <img src="${c.thumbnail || placeholderImg('C', 60, 60)}" alt="">
        <div class="course-info">
          <h4>${c.title}</h4>
          <p>₹${c.price || 0} | ${c.difficulty || 'Beginner'}</p>
        </div>
        <div class="course-manage-actions">
          <button class="btn btn-primary" onclick="editCourse('${c.courseId}')"><i class="fas fa-edit"></i></button>
          <button class="btn btn-primary" onclick="window.location.href='course-view.html?id=${c.courseId}'"><i class="fas fa-eye"></i></button>
          <button class="btn btn-danger" onclick="deleteCourse('${c.courseId}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  } catch (err) { container.innerHTML = '<p class="text-muted">Failed to load courses</p>'; }
}

async function deleteCourse(courseId) {
  if (!confirm('Delete this course and all its content?')) return;
  try {
    await apiRequest(`/courses/${courseId}`, { method: 'DELETE' });
    loadManageCourses();
  } catch (err) { alert('Delete failed: ' + err.message); }
}

async function editCourse(courseId) {
  const msg = document.getElementById('editCourseMsg');
  msg.className = 'form-message';
  try {
    const data = await apiRequest(`/courses/${courseId}`);
    const c = data.course;
    document.getElementById('editCourseId').value = c.courseId;
    document.getElementById('editCourseTitle').value = c.title;
    document.getElementById('editCourseDescription').value = c.description;
    document.getElementById('editCourseCategory').value = c.category || 'general';
    document.getElementById('editCoursePrice').value = c.price;
    document.getElementById('editCourseDifficulty').value = c.difficulty || 'beginner';
    const preview = document.getElementById('editCourseThumbnailPreview');
    if (c.thumbnail) {
      preview.querySelector('img').src = c.thumbnail;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
    document.getElementById('editCourseThumbnailInput').value = '';
    document.getElementById('editCourseModal').style.display = 'block';
  } catch (err) {
    msg.textContent = 'Failed to load course: ' + err.message;
    msg.className = 'form-message error';
  }
}

function closeEditCourse() {
  document.getElementById('editCourseModal').style.display = 'none';
}

async function handleEditCourse(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  const msg = document.getElementById('editCourseMsg');
  msg.className = 'form-message';

  try {
    const courseId = document.getElementById('editCourseId').value;
    let thumbnailUrl = document.getElementById('editCourseThumbnailPreview').querySelector('img').src || '';
    const fileInput = document.getElementById('editCourseThumbnailInput');
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('thumbnail', fileInput.files[0]);
      const token = localStorage.getItem('vetcrack_token');
      const uploadRes = await fetch(`${API_URL}/api/settings/upload-course-thumbnail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      thumbnailUrl = uploadData.imageUrl;
    }

    await apiRequest(`/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: document.getElementById('editCourseTitle').value,
        description: document.getElementById('editCourseDescription').value,
        thumbnail: thumbnailUrl,
        category: document.getElementById('editCourseCategory').value,
        price: parseFloat(document.getElementById('editCoursePrice').value) || 0,
        difficulty: document.getElementById('editCourseDifficulty').value
      })
    });
    msg.textContent = 'Course updated successfully!';
    msg.className = 'form-message success';
    closeEditCourse();
    loadManageCourses();
    loadCourseSelects();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

const sectionsCache = {};

async function loadSectionsForManage() {
  const sel = document.getElementById('manageSectionCourseSelect');
  const container = document.getElementById('manageSectionsList');
  if (!sel || !container) return;
  const courseId = sel.value;
  if (!courseId) { container.innerHTML = '<p class="text-muted">Select a course to view sections</p>'; return; }
  if (sectionsCache[courseId]) {
    renderManageSectionsTree(sectionsCache[courseId]);
    return;
  }
  container.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading sections...</div>';
  try {
    const data = await apiRequest(`/sections/tree/${courseId}`);
    const sections = data.sections || [];
    sectionsCache[courseId] = sections;
    renderManageSectionsTree(sections);
  } catch (err) { container.innerHTML = '<p class="text-muted">Failed to load sections</p>'; }
}

function renderManageSectionsTree(sections, depth = 0) {
  const container = document.getElementById('manageSectionsList');
  if (!container) return;
  if (depth === 0) {
    if (!sections.length) { container.innerHTML = '<p class="text-muted">No sections in this course.</p>'; return; }
    container.innerHTML = '';
  }
  sections.forEach(s => {
    const subHtml = renderSubsectionsHtml(s.subsections, depth + 1);
    container.innerHTML += `
      <div class="course-manage-item" style="margin-left:${depth * 24}px;${depth > 0 ? 'border-left:2px solid var(--accent-primary);margin-bottom:4px;' : ''}">
        <div class="course-info">
          <h4>${depth > 0 ? '<i class="fas fa-level-down-alt" style="font-size:12px;color:var(--accent-primary);margin-right:6px;"></i>' : ''}${s.sectionTitle}</h4>
          <p>Order: ${s.order || 0} ${s.contents && s.contents.length ? `| ${s.contents.length} content item(s)` : ''} ${s.pdfs && s.pdfs.length ? `| ${s.pdfs.length} PDF(s)` : ''}</p>
          ${s.contents && s.contents.length ? '<div style="margin-top:8px;padding:8px;background:rgba(0,255,0,0.05);border:1px solid rgba(0,255,0,0.2);border-radius:6px;"><strong style="font-size:13px;">Contents:</strong><div style="margin-top:4px;font-size:13px;">' + s.contents.map(c => `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(0,255,136,0.1);padding:3px 10px;border-radius:4px;margin:2px;"><i class="fas ${c.type === 'video' ? 'fa-video' : c.type === 'pdf' ? 'fa-file-pdf' : 'fa-code'}"></i> ${c.title} <button class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();renameContentItem('${c.contentId}','${c.title.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i></button> <button class="btn btn-sm" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();deleteContentItem('${c.contentId}')"><i class="fas fa-times"></i></button></span>`).join('') + '</div></div>' : ''}
          ${s.pdfs && s.pdfs.length ? '<div style="margin-top:8px;padding:8px;background:rgba(255,100,100,0.05);border:1px solid rgba(255,100,100,0.2);border-radius:6px;"><strong style="font-size:13px;">PDFs:</strong><div style="margin-top:4px;font-size:13px;">' + s.pdfs.map(p => `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,100,100,0.1);padding:3px 10px;border-radius:4px;margin:2px;"><i class="fas fa-file-pdf"></i> ${p.title} <button class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();renamePdfItem('${p.pdfId}','${p.title.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i></button> <button class="btn btn-sm" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();deletePdfItem('${p.pdfId}')"><i class="fas fa-times"></i></button></span>`).join('') + '</div></div>' : ''}
          ${subHtml}
        </div>
        <div class="course-manage-actions">
          <button class="btn btn-danger" onclick="deleteSection('${s.sectionId}', '${s.sectionTitle.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  });
}

function renderSubsectionsHtml(subsections, depth) {
  if (!subsections || !subsections.length) return '';
  return subsections.map(s => {
    const subSubHtml = renderSubsectionsHtml(s.subsections, depth + 1);
    return `
      <div class="course-manage-item" style="margin-left:24px;border-left:2px solid var(--accent-primary);margin-bottom:4px;margin-top:4px;">
        <div class="course-info">
          <h4><i class="fas fa-level-down-alt" style="font-size:12px;color:var(--accent-primary);margin-right:6px;"></i>${s.sectionTitle}</h4>
          <p>Order: ${s.order || 0} ${s.contents && s.contents.length ? `| ${s.contents.length} content item(s)` : ''} ${s.pdfs && s.pdfs.length ? `| ${s.pdfs.length} PDF(s)` : ''}</p>
          ${s.contents && s.contents.length ? '<div style="margin-top:8px;padding:8px;background:rgba(0,255,0,0.05);border:1px solid rgba(0,255,0,0.2);border-radius:6px;"><strong style="font-size:13px;">Contents:</strong><div style="margin-top:4px;font-size:13px;">' + s.contents.map(c => `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(0,255,136,0.1);padding:3px 10px;border-radius:4px;margin:2px;"><i class="fas ${c.type === 'video' ? 'fa-video' : c.type === 'pdf' ? 'fa-file-pdf' : 'fa-code'}"></i> ${c.title} <button class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();renameContentItem('${c.contentId}','${c.title.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i></button> <button class="btn btn-sm" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();deleteContentItem('${c.contentId}')"><i class="fas fa-times"></i></button></span>`).join('') + '</div></div>' : ''}
          ${s.pdfs && s.pdfs.length ? '<div style="margin-top:8px;padding:8px;background:rgba(255,100,100,0.05);border:1px solid rgba(255,100,100,0.2);border-radius:6px;"><strong style="font-size:13px;">PDFs:</strong><div style="margin-top:4px;font-size:13px;">' + s.pdfs.map(p => `<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,100,100,0.1);padding:3px 10px;border-radius:4px;margin:2px;"><i class="fas fa-file-pdf"></i> ${p.title} <button class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();renamePdfItem('${p.pdfId}','${p.title.replace(/'/g, "\\'")}')"><i class="fas fa-pen"></i></button> <button class="btn btn-sm" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:0;font-size:12px;" onclick="event.stopPropagation();deletePdfItem('${p.pdfId}')"><i class="fas fa-times"></i></button></span>`).join('') + '</div></div>' : ''}
          ${subSubHtml}
        </div>
        <div class="course-manage-actions">
          <button class="btn btn-danger" onclick="deleteSection('${s.sectionId}', '${s.sectionTitle.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  }).join('');
}

async function renamePdfItem(pdfId, currentTitle) {
  const newTitle = prompt('Rename PDF:', currentTitle);
  if (!newTitle || newTitle === currentTitle) return;
  try {
    await apiRequest('/pdfs/' + pdfId, { method: 'PUT', body: { title: newTitle } });
    const courseId = document.getElementById('manageSectionCourseSelect').value;
    delete sectionsCache[courseId];
    loadSectionsForManage();
  } catch (err) { alert('Rename failed: ' + err.message); }
}

async function renameContentItem(contentId, currentTitle) {
  const newTitle = prompt('Rename content:', currentTitle);
  if (!newTitle || newTitle === currentTitle) return;
  try {
    await apiRequest('/contents/' + contentId, { method: 'PUT', body: { title: newTitle } });
    const courseId = document.getElementById('manageSectionCourseSelect').value;
    delete sectionsCache[courseId];
    loadSectionsForManage();
  } catch (err) { alert('Rename failed: ' + err.message); }
}

async function deleteContentItem(contentId) {
  if (!confirm('Delete this content item?')) return;
  try {
    await apiRequest('/contents/' + contentId, { method: 'DELETE' });
    const courseId = document.getElementById('manageSectionCourseSelect').value;
    delete sectionsCache[courseId];
    loadSectionsForManage();
  } catch (err) { alert('Delete failed: ' + err.message); }
}

async function deletePdfItem(pdfId) {
  if (!confirm('Delete this PDF?')) return;
  try {
    await apiRequest('/pdfs/' + pdfId, { method: 'DELETE' });
    const courseId = document.getElementById('manageSectionCourseSelect').value;
    delete sectionsCache[courseId];
    loadSectionsForManage();
  } catch (err) { alert('Delete failed: ' + err.message); }
}

async function deleteSection(sectionId, sectionTitle) {
  if (!confirm(`Delete section "${sectionTitle}" and all its PDFs?`)) return;
  try {
    await apiRequest(`/sections/${sectionId}`, { method: 'DELETE' });
    delete sectionsCache[document.getElementById('manageSectionCourseSelect').value];
    loadSectionsForManage();
  } catch (err) { alert('Delete failed: ' + err.message); }
}

async function loadUsers() {
  const container = document.getElementById('usersList');
  if (!container) return;
  try {
    const data = await apiRequest('/auth/users');
    const users = data.users || [];
    if (!users.length) { container.innerHTML = '<p class="text-muted">No users yet.</p>'; return; }
    container.innerHTML = users.map(u => `
      <div class="user-item">
        <div class="user-avatar"><i class="fas fa-user"></i></div>
        <div class="user-info">
          <h4>${u.name || 'Unknown'}</h4>
          <p>${u.email || ''} ${u.role === 'admin' ? '<span class="badge badge-admin">Admin</span>' : '<span class="badge badge-user">User</span>'}</p>
        </div>
        <span style="font-size:12px;color:var(--text-secondary)">${u.created_at ? new Date(u.created_at).toLocaleDateString() : ''}</span>
      </div>
    `).join('');
  } catch (err) { container.innerHTML = '<p class="text-muted">Failed to load users</p>'; }
}

async function loadAdminBlogs() {
  try {
    const data = await blogApiRequest('');
    const blogs = data.blogs || [];
    let html = '<p class="text-muted">No blogs yet.</p>';
    if (blogs.length) {
      html = '';
      for (const b of blogs) {
        const statusBadge = b.status === 'published'
          ? '<span class="badge badge-success">published</span>'
          : '<span class="badge" style="background:var(--warning);color:#000;">' + (b.status || 'draft') + '</span>';
        const dateStr = b.created_at ? new Date(b.created_at).toLocaleDateString() : '';
        html += '<div class="blog-manage-item">'
          + '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">'
          + '<div>'
          + '<h4>' + b.title + '</h4>'
          + '<p style="font-size:13px;color:var(--text-secondary)">' + (b.author || 'VetCrack') + ' | ' + dateStr + ' | ' + statusBadge
          + (b.category ? ' | <span style="color:var(--accent-primary)">' + b.category + '</span>' : '')
          + (b.slug ? ' | <span style="color:var(--text-secondary);font-size:11px;">/blog/' + b.slug + '</span>' : '')
          + '</p>'
          + '</div>'
          + '<div style="display:flex;gap:8px;">'
          + '<button class="btn btn-primary" onclick="editBlog(' + b.id + ')"><i class="fas fa-edit"></i></button>'
          + '<button class="btn btn-danger" onclick="deleteBlog(' + b.id + ')"><i class="fas fa-trash"></i></button>'
          + '</div>'
          + '</div>'
          + '</div>';
      }
    }
    const el1 = document.getElementById('manageBlogsList');
    const el2 = document.getElementById('manageBlogsListPage');
    if (el1) el1.innerHTML = html;
    if (el2) el2.innerHTML = html;
  } catch (err) {
    const el1 = document.getElementById('manageBlogsList');
    const el2 = document.getElementById('manageBlogsListPage');
    if (el1) el1.innerHTML = '<p class="text-muted">Failed to load blogs</p>';
    if (el2) el2.innerHTML = '<p class="text-muted">Failed to load blogs</p>';
  }
}

async function deleteBlog(blogId) {
  if (!confirm('Delete this blog?')) return;
  try {
    await blogApiRequest(`/${blogId}`, { method: 'DELETE' });
    loadAdminBlogs();
  } catch (err) { alert('Delete failed: ' + err.message); }
}

async function editBlog(blogId) {
  const msg = document.getElementById('editBlogMsg');
  msg.className = 'form-message';
  try {
    const data = await blogApiRequest(`/${blogId}`);
    const b = data.blog;
    document.getElementById('editBlogId').value = b.id;
    document.getElementById('editBlogTitle').value = b.title;
    document.getElementById('editBlogSlug').value = b.slug || '';
    document.getElementById('editBlogDescription').value = b.description;
    document.getElementById('editBlogContent').value = b.content;
    document.getElementById('editBlogAuthor').value = b.author || 'VetCrack';
    document.getElementById('editBlogCategory').value = b.category || '';
    document.getElementById('editBlogTags').value = b.tags || '';
    document.getElementById('editBlogStatus').value = b.status || 'draft';
    document.getElementById('editBlogMetaTitle').value = b.meta_title || '';
    document.getElementById('editBlogMetaDescription').value = b.meta_description || '';
    const preview = document.getElementById('editBlogThumbnailPreview');
    if (b.thumbnail) {
      preview.querySelector('img').src = b.thumbnail;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
    document.getElementById('editBlogThumbnailInput').value = '';
    document.getElementById('editBlogModal').style.display = 'block';
  } catch (err) {
    msg.textContent = 'Failed to load blog: ' + err.message;
    msg.className = 'form-message error';
  }
}

function closeEditBlog() {
  document.getElementById('editBlogModal').style.display = 'none';
}

async function handleEditBlog(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  const msg = document.getElementById('editBlogMsg');
  msg.className = 'form-message';

  try {
    const blogId = document.getElementById('editBlogId').value;
    let thumbnail = document.getElementById('editBlogThumbnailPreview').querySelector('img').src || '';
    const fileInput = document.getElementById('editBlogThumbnailInput');
    if (fileInput && fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('thumbnail', fileInput.files[0]);
      const token = localStorage.getItem('vetcrack_token');
      const uploadRes = await fetch(`${API_URL}/api/settings/upload-course-thumbnail`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      thumbnail = uploadData.imageUrl;
    }

    await blogApiRequest(`/${blogId}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: document.getElementById('editBlogTitle').value,
        slug: document.getElementById('editBlogSlug').value,
        thumbnail,
        description: document.getElementById('editBlogDescription').value,
        content: document.getElementById('editBlogContent').value,
        author: document.getElementById('editBlogAuthor').value,
        category: document.getElementById('editBlogCategory').value,
        tags: document.getElementById('editBlogTags').value,
        status: document.getElementById('editBlogStatus').value,
        meta_title: document.getElementById('editBlogMetaTitle').value,
        meta_description: document.getElementById('editBlogMetaDescription').value
      })
    });
    msg.textContent = 'Blog updated successfully!';
    msg.className = 'form-message success';
    closeEditBlog();
    loadAdminBlogs();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function loadAdminFaqs() {
  try {
    const data = await apiRequest('/faqs');
    const faqs = data.faqs || [];
    let html = '<p class="text-muted">No FAQs yet.</p>';
    if (faqs.length) {
      html = '';
      for (const f of faqs) {
        html += '<div class="course-manage-item">'
          + '<div class="course-info">'
          + '<h4>' + f.question + '</h4>'
          + '<p style="font-size:13px;color:var(--text-secondary)">' + f.answer.substring(0, 120) + (f.answer.length > 120 ? '...' : '') + '</p>'
          + '</div>'
          + '<div class="course-manage-actions">'
          + '<button class="btn btn-primary" onclick="editFaq(' + f.faq_id + ')"><i class="fas fa-edit"></i></button>'
          + '<button class="btn btn-danger" onclick="deleteFaq(' + f.faq_id + ')"><i class="fas fa-trash"></i></button>'
          + '</div>'
          + '</div>';
      }
    }
    document.getElementById('manageFaqsList').innerHTML = html;
  } catch (err) {
    document.getElementById('manageFaqsList').innerHTML = '<p class="text-muted">Failed to load FAQs</p>';
  }
}

async function handleCreateFaq(e) {
  e.preventDefault();
  const msg = document.getElementById('createFaqMsg');
  msg.className = 'form-message';
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  try {
    await apiRequest('/faqs', {
      method: 'POST',
      body: JSON.stringify({
        question: document.getElementById('faqQuestion').value,
        answer: document.getElementById('faqAnswer').value,
        sort_order: parseInt(document.getElementById('faqSortOrder').value) || 0
      })
    });
    msg.textContent = 'FAQ added successfully!';
    msg.className = 'form-message success';
    e.target.reset();
    loadAdminFaqs();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function editFaq(faqId) {
  try {
    const data = await apiRequest('/faqs');
    const faq = (data.faqs || []).find(f => f.faq_id === faqId);
    if (!faq) throw new Error('FAQ not found');
    document.getElementById('editFaqId').value = faq.faq_id;
    document.getElementById('editFaqQuestion').value = faq.question;
    document.getElementById('editFaqAnswer').value = faq.answer;
    document.getElementById('editFaqSortOrder').value = faq.sort_order || 0;
    document.getElementById('editFaqModal').style.display = 'block';
  } catch (err) {
    alert('Failed to load FAQ: ' + err.message);
  }
}

function closeEditFaq() {
  document.getElementById('editFaqModal').style.display = 'none';
}

async function handleEditFaq(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  const msg = document.getElementById('editFaqMsg');
  msg.className = 'form-message';
  try {
    const faqId = document.getElementById('editFaqId').value;
    await apiRequest('/faqs/' + faqId, {
      method: 'PUT',
      body: JSON.stringify({
        question: document.getElementById('editFaqQuestion').value,
        answer: document.getElementById('editFaqAnswer').value,
        sort_order: parseInt(document.getElementById('editFaqSortOrder').value) || 0
      })
    });
    msg.textContent = 'FAQ updated successfully!';
    msg.className = 'form-message success';
    closeEditFaq();
    loadAdminFaqs();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function deleteFaq(faqId) {
  if (!confirm('Delete this FAQ?')) return;
  try {
    await apiRequest('/faqs/' + faqId, { method: 'DELETE' });
    loadAdminFaqs();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}

async function loadAdminMedicines() {
  console.trace('loadAdminMedicines called');
  const el = document.getElementById('manageMedsList');
  console.log('manageMedsList element:', el);
  if (!el) return;
  try {
    const res = await fetch('/api/medicines');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const meds = data.medicines || [];
    if (!meds.length) { el.innerHTML = '<p class="text-muted">No medicines yet.</p>'; return; }
    el.innerHTML = meds.map(m => `
      <div class="blog-manage-item">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div>
            <h4>${m.name}</h4>
            <p style="font-size:13px;color:var(--text-secondary);">
              ${m.generic_name ? '<i>' + m.generic_name + '</i> | ' : ''}
              <span style="color:var(--accent-primary)">${m.category || 'Uncategorized'}</span>
              ${m.species ? ' | ' + m.species : ''}
            </p>
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-primary" onclick="editMedicine(${m.id})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-danger" onclick="deleteMedicine(${m.id})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    el.innerHTML = '<p class="text-muted">Failed to load: ' + err.message + '</p>';
  }
}

async function handleCreateMedicine(e) {
  e.preventDefault();
  const msg = document.getElementById('createMedMsg');
  msg.className = 'form-message';
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  try {
    const data = await apiRequest('/medicines', {
      method: 'POST',
      body: JSON.stringify({
        name: document.getElementById('medName').value,
        generic_name: document.getElementById('medGeneric').value,
        category: document.getElementById('medCategory').value,
        species: document.getElementById('medSpecies').value,
        dosage: document.getElementById('medDosage').value,
        description: document.getElementById('medDescription').value,
        indications: document.getElementById('medIndications').value,
        contraindications: document.getElementById('medContraindications').value,
        side_effects: document.getElementById('medSideEffects').value,
        brand_names: document.getElementById('medBrands').value,
      })
    });
    msg.textContent = 'Medicine added!';
    msg.className = 'form-message success';
    e.target.reset();
    loadAdminMedicines();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function editMedicine(id) {
  const msg = document.getElementById('editMedMsg');
  msg.className = 'form-message';
  try {
    const res = await fetch('/api/medicines/' + id);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    const m = data.medicine;
    document.getElementById('editMedId').value = m.id;
    document.getElementById('editMedName').value = m.name;
    document.getElementById('editMedGeneric').value = m.generic_name || '';
    document.getElementById('editMedCategory').value = m.category || '';
    document.getElementById('editMedSpecies').value = m.species || '';
    document.getElementById('editMedDosage').value = m.dosage || '';
    document.getElementById('editMedDescription').value = m.description || '';
    document.getElementById('editMedIndications').value = m.indications || '';
    document.getElementById('editMedContraindications').value = m.contraindications || '';
    document.getElementById('editMedSideEffects').value = m.side_effects || '';
    document.getElementById('editMedBrands').value = m.brand_names || '';
    document.getElementById('editMedModal').style.display = 'block';
  } catch (err) {
    msg.textContent = 'Failed to load: ' + err.message;
    msg.className = 'form-message error';
  }
}

function closeEditMed() {
  document.getElementById('editMedModal').style.display = 'none';
}

async function handleEditMedicine(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button');
  btn.disabled = true;
  const msg = document.getElementById('editMedMsg');
  msg.className = 'form-message';
  try {
    const id = document.getElementById('editMedId').value;
    await apiRequest('/medicines/' + id, {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('editMedName').value,
        generic_name: document.getElementById('editMedGeneric').value,
        category: document.getElementById('editMedCategory').value,
        species: document.getElementById('editMedSpecies').value,
        dosage: document.getElementById('editMedDosage').value,
        description: document.getElementById('editMedDescription').value,
        indications: document.getElementById('editMedIndications').value,
        contraindications: document.getElementById('editMedContraindications').value,
        side_effects: document.getElementById('editMedSideEffects').value,
        brand_names: document.getElementById('editMedBrands').value,
      })
    });
    msg.textContent = 'Medicine updated!';
    msg.className = 'form-message success';
    closeEditMed();
    loadAdminMedicines();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function deleteMedicine(id) {
  if (!confirm('Delete this medicine?')) return;
  try {
    await apiRequest('/medicines/' + id, { method: 'DELETE' });
    loadAdminMedicines();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}

async function loadFounderSettings() {
  try {
    const data = await apiRequest('/settings/founder');
    const f = data.founder || {};
    document.getElementById('founderName').value = f.founder_name || '';
    document.getElementById('founderTitle').value = f.founder_title || '';
    document.getElementById('founderDesc').value = f.founder_desc || '';
    document.getElementById('founderExp').value = f.founder_exp || '';
    document.getElementById('founderDegree').value = f.founder_degree || '';
    if (f.founder_image) {
      document.getElementById('founderImagePreview').innerHTML = `<img src="${f.founder_image}" style="width:100%;border-radius:50%;">`;
    }
  } catch (err) { console.error('Failed to load founder settings:', err); }
}

async function handleFounderSave(e) {
  e.preventDefault();
  const msg = document.getElementById('founderMsg');
  msg.className = 'form-message';
  const btn = e.target.querySelector('button');
  btn.disabled = true;

  try {
    const fileInput = document.getElementById('founderImageInput');
    let imageUrl = '';
    if (fileInput.files.length > 0) {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      const token = localStorage.getItem('vetcrack_token');
      const uploadRes = await fetch(`${API_URL}/api/settings/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');
      imageUrl = uploadData.imageUrl;
    }

    await apiRequest('/settings/founder', {
      method: 'PUT',
      body: JSON.stringify({
        name: document.getElementById('founderName').value,
        title: document.getElementById('founderTitle').value,
        description: document.getElementById('founderDesc').value,
        experience: document.getElementById('founderExp').value,
        degree: document.getElementById('founderDegree').value,
        ...(imageUrl ? { image: imageUrl } : {})
      })
    });

    msg.textContent = 'Founder info saved successfully!';
    msg.className = 'form-message success';
    if (imageUrl) loadFounderSettings();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

function addQuestionField() {
  const container = document.getElementById('questionsContainer');
  const q = document.createElement('div');
  q.className = 'question-block';
  q.style.cssText = 'background:rgba(255,255,255,0.04);border-radius:12px;padding:16px;margin-bottom:12px;border:1px solid rgba(255,255,255,0.08);';
  q.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <strong style="color:var(--accent-primary);">Question ${container.children.length + 1}</strong>
      <button type="button" onclick="this.parentElement.parentElement.remove()" style="background:none;border:none;color:var(--danger);cursor:pointer;"><i class="fas fa-trash"></i></button>
    </div>
    <div class="form-group"><label>Question</label><input type="text" class="q-text" required></div>
    <div class="form-row" style="grid-template-columns:1fr 1fr;">
      <div class="form-group"><label>A</label><input type="text" class="q-a" required></div>
      <div class="form-group"><label>B</label><input type="text" class="q-b" required></div>
    </div>
    <div class="form-row" style="grid-template-columns:1fr 1fr;">
      <div class="form-group"><label>C</label><input type="text" class="q-c" required></div>
      <div class="form-group"><label>D</label><input type="text" class="q-d" required></div>
    </div>
    <div class="form-group"><label>Correct Answer</label><select class="q-correct" required><option value="">Select...</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></div>
  `;
  container.appendChild(q);
}

document.getElementById('createTestForm')?.addEventListener('submit', handleCreateTest);
document.getElementById('manageTestCourseSelect')?.addEventListener('change', loadAdminTests);

async function handleCreateTest(e) {
  e.preventDefault();
  const msg = document.getElementById('createTestMsg');
  msg.className = 'form-message';
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;

  try {
    const qBlocks = document.querySelectorAll('#questionsContainer .question-block');
    const questions = [];
    qBlocks.forEach(q => {
      const text = q.querySelector('.q-text').value.trim();
      const a = q.querySelector('.q-a').value.trim();
      const b = q.querySelector('.q-b').value.trim();
      const c = q.querySelector('.q-c').value.trim();
      const d = q.querySelector('.q-d').value.trim();
      const correct = q.querySelector('.q-correct').value;
      if (text && a && b && c && d && correct) {
        questions.push({ questionText: text, optionA: a, optionB: b, optionC: c, optionD: d, correctOption: correct });
      }
    });

    if (questions.length === 0) {
      throw new Error('Add at least one question with all fields filled');
    }

    await apiRequest('/tests/create', {
      method: 'POST',
      body: JSON.stringify({
        courseId: document.getElementById('testCourseSelect').value,
        title: document.getElementById('testTitle').value,
        description: document.getElementById('testDescription').value,
        durationMinutes: parseInt(document.getElementById('testDuration').value) || 30,
        questions
      })
    });

    msg.textContent = 'Test created successfully!';
    msg.className = 'form-message success';
    e.target.reset();
    document.getElementById('questionsContainer').innerHTML = '';
    loadAdminTests();
  } catch (err) {
    msg.textContent = err.message;
    msg.className = 'form-message error';
  }
  btn.disabled = false;
}

async function loadAdminTests() {
  const container = document.getElementById('manageTestsList');
  if (!container) return;
  container.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

  try {
    const courseId = document.getElementById('manageTestCourseSelect')?.value || '';
    const url = courseId ? '/tests?courseId=' + courseId : '/tests';
    const data = await apiRequest(url);
    const tests = data.tests || [];

    if (tests.length === 0) {
      container.innerHTML = '<p class="text-muted">No tests created yet.</p>';
      return;
    }

    container.innerHTML = tests.map(t => `
      <div class="manage-item glass" style="padding:16px;margin-bottom:12px;border-radius:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <strong>${t.title}</strong>
            <div class="text-muted" style="font-size:13px;">${t.total_questions || 0} questions &middot; ${t.duration_minutes} min</div>
            ${t.description ? '<p style="font-size:13px;margin:4px 0 0;">' + t.description + '</p>' : ''}
          </div>
          <div style="display:flex;gap:8px;">
            <button class="btn btn-sm btn-danger" onclick="deleteTest('${t.test_id}')"><i class="fas fa-trash"></i></button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<p class="text-muted error">Failed to load tests: ' + err.message + '</p>';
  }
}

async function loadTestCourseSelects() {
  try {
    const data = await apiRequest('/courses');
    const courses = data.courses || [];
    const createSelect = document.getElementById('testCourseSelect');
    if (createSelect) {
      createSelect.innerHTML = '<option value="">Select course...</option>' + courses.map(c => `<option value="${c.courseId}">${c.title}</option>`).join('');
    }
    const filterSelect = document.getElementById('manageTestCourseSelect');
    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">All Courses</option>' + courses.map(c => `<option value="${c.courseId}">${c.title}</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to load courses', err);
  }
}

async function deleteTest(testId) {
  if (!confirm('Delete this test and all its questions?')) return;
  try {
    await apiRequest('/tests/' + testId, { method: 'DELETE' });
    loadAdminTests();
  } catch (err) {
    alert('Failed to delete test: ' + err.message);
  }
}

// Test Scores
async function loadTestScores() {
  const container = document.getElementById('testScoresList');
  if (!container) return;
  container.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading scores...</div>';

  try {
    const courseId = document.getElementById('scoresCourseSelect')?.value || '';
    const testId = document.getElementById('scoresTestSelect')?.value || '';
    let url = '/test-attempts/all?';
    if (courseId) url += 'courseId=' + courseId + '&';
    if (testId) url += 'testId=' + testId + '&';
    const data = await apiRequest(url);
    const attempts = data.attempts || [];

    if (attempts.length === 0) {
      container.innerHTML = '<p class="text-muted">No test attempts found.</p>';
      return;
    }

    container.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1);">
            <th style="padding:10px 8px;text-align:left;">User</th>
            <th style="padding:10px 8px;text-align:left;">Course</th>
            <th style="padding:10px 8px;text-align:left;">Test</th>
            <th style="padding:10px 8px;text-align:center;">Score</th>
            <th style="padding:10px 8px;text-align:center;">Percentage</th>
            <th style="padding:10px 8px;text-align:right;">Date</th>
          </tr>
        </thead>
        <tbody>
          ${attempts.map(a => {
            const pct = a.total_questions > 0 ? Math.round((a.score / a.total_questions) * 100) : 0;
            const color = pct >= 70 ? 'var(--success)' : pct >= 40 ? 'var(--warning)' : 'var(--danger)';
            return `<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">
              <td style="padding:10px 8px;">${a.user_name || a.user_email || a.user_id}</td>
              <td style="padding:10px 8px;">${a.course_title || '-'}</td>
              <td style="padding:10px 8px;">${a.test_title || '-'}</td>
              <td style="padding:10px 8px;text-align:center;">${a.score}/${a.total_questions}</td>
              <td style="padding:10px 8px;text-align:center;color:${color};font-weight:600;">${pct}%</td>
              <td style="padding:10px 8px;text-align:right;font-size:12px;color:var(--text-secondary);">${new Date(a.attempted_at).toLocaleDateString()}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    container.innerHTML = '<p class="text-muted error">Failed to load scores: ' + err.message + '</p>';
  }
}

async function loadScoresSelects() {
  try {
    const data = await apiRequest('/courses');
    const courses = data.courses || [];
    const sel = document.getElementById('scoresCourseSelect');
    if (sel) {
      sel.innerHTML = '<option value="">All Courses</option>' + courses.map(c => `<option value="${c.courseId}">${c.title}</option>`).join('');
    }
  } catch (err) {}
}

async function loadScoresTests() {
  try {
    const courseId = document.getElementById('scoresCourseSelect')?.value || '';
    const url = courseId ? '/tests?courseId=' + courseId : '/tests';
    const data = await apiRequest(url);
    const tests = data.tests || [];
    const sel = document.getElementById('scoresTestSelect');
    if (sel) {
      sel.innerHTML = '<option value="">All Tests</option>' + tests.map(t => `<option value="${t.test_id}">${t.title}</option>`).join('');
    }
    loadTestScores();
  } catch (err) {}
}

function slugify(text) {
  return text.toString().toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// =============== NOTES MANAGEMENT ===============

let noteDeleteState = { type: '', id: null };

function _htmlName(name) {
  return ('' + name).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

async function loadAdminNotes() {
  console.log('loadAdminNotes called');
  const container = document.getElementById('notesList');
  if (!container) { console.log('notesList container not found'); return; }
  try {
    const data = await apiRequest('/note-categories');
    const cats = data.categories || [];
    if (!cats.length) {
      container.innerHTML = '<p class="text-muted">No note categories yet. Create one to get started.</p>';
      return;
    }
    let html = '<div id="notesListInner" style="display:flex;flex-direction:column;gap:12px;">';
    for (const cat of cats) {
      html += `
        <div class="course-manage-item" style="flex-direction:column;align-items:stretch;">
          <div style="display:flex;align-items:center;gap:12px;">
            <div data-note="toggle-cat" data-cat-id="${cat.id}" style="display:flex;align-items:center;gap:12px;flex:1;cursor:pointer;">
              <i class="fas fa-chevron-right" id="noteCatArrow-${cat.id}" style="color:var(--text-secondary);font-size:12px;transition:transform 0.2s;"></i>
              <i class="fas fa-folder-open" style="color:var(--accent-primary);"></i>
              <div class="course-info" style="flex:1;">
                <h4>${cat.name}</h4>
                <p class="text-muted" style="font-size:13px;">${cat.subcategory_count || 0} topics, ${cat.page_count || 0} pages</p>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0;">
              <button type="button" data-note="add-subcategory" data-cat-id="${cat.id}" class="btn btn-sm" style="background:rgba(255,255,255,0.08);color:var(--accent-primary);border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" title="Add subcategory"><i class="fas fa-plus"></i></button>
              <button type="button" data-note="edit-category" data-cat-id="${cat.id}" class="btn btn-sm" style="background:rgba(255,255,255,0.08);color:var(--accent-primary);border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" title="Edit"><i class="fas fa-edit"></i></button>
              <button type="button" data-note="delete" data-type="category" data-id="${cat.id}" data-name="${_htmlName(cat.name)}" class="btn btn-sm" style="background:rgba(255,255,255,0.08);color:var(--danger);border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" title="Delete"><i class="fas fa-trash"></i></button>
            </div>
          </div>
          <div id="noteCatChildren-${cat.id}" style="display:none;padding:8px 0 0 32px;"></div>
        </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
  } catch (err) {
    container.innerHTML = '<p class="text-muted">Failed to load notes: ' + err.message + '</p>';
  }
}

async function toggleNoteCat(catId) {
  const children = document.getElementById('noteCatChildren-' + catId);
  const arrow = document.getElementById('noteCatArrow-' + catId);
  if (!children) return;
  if (children.style.display !== 'none') {
    children.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
    return;
  }
  if (arrow) arrow.style.transform = 'rotate(90deg)';
  if (children.innerHTML) {
    children.style.display = 'block';
    return;
  }
  children.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  children.style.display = 'block';
  try {
    const [subsData, pagesData] = await Promise.all([
      apiRequest('/note-subcategories?category_id=' + catId),
      apiRequest('/note-pages?category_id=' + catId)
    ]);
    const subs = subsData.subcategories || [];
    const pages = pagesData.pages || [];
    const topPages = pages.filter(p => !p.subcategory_id);
    let html = '';
    if (!subs.length && !topPages.length) {
      html = '<p class="text-muted" style="font-size:13px;padding:8px 0;">No subcategories. <a href="#" data-note="add-subcategory" data-cat-id="' + catId + '" style="color:var(--accent-primary);">Add one</a> or <a href="#" data-note="add-page" data-cat-id="' + catId + '" style="color:var(--accent-primary);">create a page</a>.</p>';
    } else {
      for (const sub of subs) {
        html += `
          <div style="border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;">
              <div data-note="toggle-sub" data-sub-id="${sub.id}" style="display:flex;align-items:center;gap:8px;flex:1;cursor:pointer;">
                <i class="fas fa-chevron-right" id="noteSubArrow-${sub.id}" style="color:var(--text-secondary);font-size:10px;transition:transform 0.2s;"></i>
                <span style="font-size:14px;">${sub.name}</span>
                <span class="text-muted" style="font-size:12px;">${sub.page_count || 0} pages</span>
              </div>
              <div style="display:flex;gap:4px;flex-shrink:0;">
                <button type="button" data-note="add-page" data-sub-id="${sub.id}" data-cat-id="${catId}" class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:4px;" title="Add page"><i class="fas fa-plus"></i></button>
                <button type="button" data-note="edit-subcategory" data-sub-id="${sub.id}" class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:4px;" title="Edit"><i class="fas fa-edit"></i></button>
                <button type="button" data-note="delete" data-type="subcategory" data-id="${sub.id}" data-name="${_htmlName(sub.name)}" class="btn btn-sm" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:4px;" title="Delete"><i class="fas fa-trash"></i></button>
              </div>
            </div>
            <div id="noteSubChildren-${sub.id}" style="display:none;padding:0 12px 8px 24px;"></div>
          </div>`;
      }
      for (const p of topPages) {
        html += renderNotePageRow(p);
      }
    }
    children.innerHTML = html;
  } catch (err) {
    children.innerHTML = '<p class="text-muted" style="font-size:13px;">Failed to load: ' + err.message + '</p>';
  }
}

async function toggleNoteSub(subId) {
  const children = document.getElementById('noteSubChildren-' + subId);
  const arrow = document.getElementById('noteSubArrow-' + subId);
  if (!children) return;
  if (children.style.display !== 'none') {
    children.style.display = 'none';
    if (arrow) arrow.style.transform = 'rotate(0deg)';
    return;
  }
  if (arrow) arrow.style.transform = 'rotate(90deg)';
  if (children.innerHTML) {
    children.style.display = 'block';
    return;
  }
  children.innerHTML = '<div class="loader"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';
  children.style.display = 'block';
  try {
    const data = await apiRequest('/note-pages?subcategory_id=' + subId);
    const pages = data.pages || [];
    if (!pages.length) {
      children.innerHTML = '<p class="text-muted" style="font-size:12px;padding:4px 0;">No pages in this topic.</p>';
    } else {
      children.innerHTML = pages.map(p => renderNotePageRow(p)).join('');
    }
  } catch (err) {
    children.innerHTML = '<p class="text-muted" style="font-size:12px;">Failed to load: ' + err.message + '</p>';
  }
}

function renderNotePageRow(page) {
  return `
    <div style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:6px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.04)'" onmouseout="this.style.background='transparent'">
      <i class="fas fa-file-alt" style="color:#3b82f6;font-size:12px;"></i>
      <span style="flex:1;font-size:13px;">${page.title}</span>
      <span class="text-muted" style="font-size:11px;">${page.view_count || 0} views</span>
      <button type="button" data-note="edit-page" data-page-id="${page.id}" class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:3px;" title="Edit"><i class="fas fa-edit"></i></button>
      <button type="button" data-note="delete" data-type="page" data-id="${page.id}" data-name="${_htmlName(page.title)}" class="btn btn-sm" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:3px;" title="Delete"><i class="fas fa-trash"></i></button>
    </div>`;
}

document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-note]');
  if (!el) return;
  var action = el.getAttribute('data-note');
  if (action === 'toggle-cat') {
    e.preventDefault();
    toggleNoteCat(el.getAttribute('data-cat-id'));
    return;
  }
  if (action === 'toggle-sub') {
    e.preventDefault();
    toggleNoteSub(el.getAttribute('data-sub-id'));
    return;
  }
  if (action === 'delete') {
    e.preventDefault();
    deleteNoteItem(el.getAttribute('data-type'), el.getAttribute('data-id'), el.getAttribute('data-name'));
    return;
  }
  if (action === 'add-subcategory') {
    e.preventDefault();
    openNoteModal('subcategory', el.getAttribute('data-cat-id'));
    return;
  }
  if (action === 'edit-category') {
    e.preventDefault();
    editNoteCategory(el.getAttribute('data-cat-id'));
    return;
  }
  if (action === 'add-page') {
    e.preventDefault();
    openNoteModal('page', el.getAttribute('data-sub-id'), el.getAttribute('data-cat-id'));
    return;
  }
  if (action === 'edit-subcategory') {
    e.preventDefault();
    editNoteSubcategory(el.getAttribute('data-sub-id'));
    return;
  }
  if (action === 'edit-page') {
    e.preventDefault();
    editNotePage(el.getAttribute('data-page-id'));
    return;
  }
});

function closeNoteModal(type) {
  document.getElementById('noteCategoryModal').style.display = 'none';
  document.getElementById('noteSubcategoryModal').style.display = 'none';
  document.getElementById('notePageModal').style.display = 'none';
  document.getElementById('noteCategoryMsg').className = 'form-message';
  document.getElementById('noteSubcategoryMsg').className = 'form-message';
  document.getElementById('notePageMsg').className = 'form-message';
}

function closeNoteDeleteModal() {
  document.getElementById('noteDeleteModal').style.display = 'none';
  noteDeleteState = { type: '', id: null };
}

// ---- Category ----

function openNoteModal(type, subCatId, catId) {
  if (type === 'category') {
    document.getElementById('noteCategoryId').value = '';
    document.getElementById('noteCategoryForm').reset();
    document.getElementById('noteCatStatus').value = 'active';
    document.getElementById('noteCatSortOrder').value = '0';
    document.getElementById('noteCategoryModalTitle').textContent = 'New Category';
    document.getElementById('noteCategoryMsg').className = 'form-message';
    document.getElementById('noteCategoryModal').style.display = 'block';
  } else if (type === 'subcategory') {
    document.getElementById('noteSubcategoryId').value = '';
    document.getElementById('noteSubcategoryForm').reset();
    document.getElementById('noteSubCatCategoryId').value = subCatId || '';
    document.getElementById('noteSubCatStatus').value = 'active';
    document.getElementById('noteSubCatSortOrder').value = '0';
    document.getElementById('noteSubcategoryModalTitle').textContent = 'New Subcategory';
    document.getElementById('noteSubcategoryMsg').className = 'form-message';
    document.getElementById('noteSubcategoryModal').style.display = 'block';
  } else if (type === 'page') {
    document.getElementById('notePageId').value = '';
    document.getElementById('notePageForm').reset();
    document.getElementById('notePageStatus').value = 'active';
    document.getElementById('notePageSortOrder').value = '0';
    document.getElementById('notePageModalTitle').textContent = 'New Page';
    document.getElementById('notePageMsg').className = 'form-message';
    loadNotePageCategorySelect(catId);
    if (subCatId) {
      setTimeout(() => document.getElementById('notePageSubcategory').value = subCatId, 100);
    }
    document.getElementById('notePageModal').style.display = 'block';
  }
}

async function loadNotePageCategorySelect(selectedId) {
  try {
    const data = await apiRequest('/note-categories');
    const cats = data.categories || [];
    const sel = document.getElementById('notePageCategory');
    sel.innerHTML = '<option value="">Select category</option>';
    for (const c of cats) {
      sel.innerHTML += `<option value="${c.id}"${selectedId && c.id == selectedId ? ' selected' : ''}>${c.name}</option>`;
    }
  } catch (err) {}
}

async function loadNotePageSubcategories(categoryId) {
  const sel = document.getElementById('notePageSubcategory');
  sel.innerHTML = '<option value="">None</option>';
  if (!categoryId) return;
  try {
    const data = await apiRequest('/note-subcategories?category_id=' + categoryId);
    const subs = data.subcategories || [];
    for (const s of subs) {
      sel.innerHTML += `<option value="${s.id}">${s.name}</option>`;
    }
  } catch (err) {}
}

async function editNoteCategory(catId) {
  try {
    const data = await apiRequest('/note-categories');
    const cat = (data.categories || []).find(c => c.id === catId);
    if (!cat) throw new Error('Category not found');
    document.getElementById('noteCategoryId').value = cat.id;
    document.getElementById('noteCatName').value = cat.name || '';
    document.getElementById('noteCatSlug').value = cat.slug || '';
    document.getElementById('noteCatDescription').value = cat.description || '';
    document.getElementById('noteCatIcon').value = cat.icon || '';
    document.getElementById('noteCatStatus').value = cat.status || 'active';
    document.getElementById('noteCatSortOrder').value = cat.sort_order || 0;
    document.getElementById('noteCategoryModalTitle').textContent = 'Edit Category';
    document.getElementById('noteCategoryMsg').className = 'form-message';
    document.getElementById('noteCategoryModal').style.display = 'block';
  } catch (err) {
    alert('Failed to load category: ' + err.message);
  }
}

async function handleNoteCategorySave(e) {
  e.preventDefault();
  try {
    const msg = document.getElementById('noteCategoryMsg');
    if (!msg) return;
    msg.className = 'form-message';
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const id = document.getElementById('noteCategoryId')?.value;
    const body = {
      name: document.getElementById('noteCatName')?.value || '',
      slug: document.getElementById('noteCatSlug')?.value || '',
      description: document.getElementById('noteCatDescription')?.value || '',
      icon: document.getElementById('noteCatIcon')?.value || '',
      status: document.getElementById('noteCatStatus')?.value || 'active',
      sort_order: parseInt(document.getElementById('noteCatSortOrder')?.value) || 0
    };
    if (id) {
      await apiRequest('/note-categories/' + id, { method: 'PUT', body: JSON.stringify(body) });
      msg.textContent = 'Category updated!';
    } else {
      await apiRequest('/note-categories', { method: 'POST', body: JSON.stringify(body) });
      msg.textContent = 'Category created!';
    }
    msg.className = 'form-message success';
    closeNoteModal('category');
    loadAdminNotes().catch(() => {});
  } catch (err) {
    const msg = document.getElementById('noteCategoryMsg');
    if (msg) { msg.textContent = err.message; msg.className = 'form-message error'; }
  }
}

// ---- Subcategory ----

async function editNoteSubcategory(subId) {
  try {
    const catsData = await apiRequest('/note-categories');
    const cats = catsData.categories || [];
    let found = null;
    for (const cat of cats) {
      const subsData = await apiRequest('/note-subcategories?category_id=' + cat.id);
      const sub = (subsData.subcategories || []).find(s => s.id === subId);
      if (sub) { found = sub; break; }
    }
    if (!found) throw new Error('Subcategory not found');
    document.getElementById('noteSubcategoryId').value = found.id;
    document.getElementById('noteSubCatCategoryId').value = found.category_id;
    document.getElementById('noteSubCatName').value = found.name || '';
    document.getElementById('noteSubCatSlug').value = found.slug || '';
    document.getElementById('noteSubCatDescription').value = found.description || '';
    document.getElementById('noteSubCatStatus').value = found.status || 'active';
    document.getElementById('noteSubCatSortOrder').value = found.sort_order || 0;
    document.getElementById('noteSubcategoryModalTitle').textContent = 'Edit Subcategory';
    document.getElementById('noteSubcategoryMsg').className = 'form-message';
    document.getElementById('noteSubcategoryModal').style.display = 'block';
  } catch (err) {
    alert('Failed to load subcategory: ' + err.message);
  }
}

async function handleNoteSubcategorySave(e) {
  e.preventDefault();
  try {
    const msg = document.getElementById('noteSubcategoryMsg');
    if (!msg) return;
    msg.className = 'form-message';
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const id = document.getElementById('noteSubcategoryId')?.value;
    const body = {
      category_id: document.getElementById('noteSubCatCategoryId')?.value,
      name: document.getElementById('noteSubCatName')?.value || '',
      slug: document.getElementById('noteSubCatSlug')?.value || '',
      description: document.getElementById('noteSubCatDescription')?.value || '',
      status: document.getElementById('noteSubCatStatus')?.value || 'active',
      sort_order: parseInt(document.getElementById('noteSubCatSortOrder')?.value) || 0
    };
    if (id) {
      await apiRequest('/note-subcategories/' + id, { method: 'PUT', body: JSON.stringify(body) });
      msg.textContent = 'Subcategory updated!';
    } else {
      await apiRequest('/note-subcategories', { method: 'POST', body: JSON.stringify(body) });
      msg.textContent = 'Subcategory created!';
    }
    msg.className = 'form-message success';
    closeNoteModal('subcategory');
    loadAdminNotes().catch(() => {});
  } catch (err) {
    const msg = document.getElementById('noteSubcategoryMsg');
    if (msg) { msg.textContent = err.message; msg.className = 'form-message error'; }
  }
}

// ---- Page ----

async function editNotePage(pageId) {
  try {
    const data = await apiRequest('/note-pages/' + pageId);
    const p = data.page;
    if (!p) throw new Error('Page not found');
    document.getElementById('notePageId').value = p.id;
    document.getElementById('notePageTitle').value = p.title || '';
    document.getElementById('notePageSlug').value = p.slug || '';
    document.getElementById('notePageStatus').value = p.status || 'active';
    document.getElementById('notePageSortOrder').value = p.sort_order || 0;
    document.getElementById('notePageContent').value = p.html_content || '';
    document.getElementById('notePageModalTitle').textContent = 'Edit Page';
    document.getElementById('notePageMsg').className = 'form-message';
    await loadNotePageCategorySelect(p.category_id);
    if (p.subcategory_id) {
      await loadNotePageSubcategories(p.category_id);
      document.getElementById('notePageSubcategory').value = p.subcategory_id;
    }
    document.getElementById('notePageModal').style.display = 'block';
  } catch (err) {
    alert('Failed to load page: ' + err.message);
  }
}

async function handleNotePageSave(e) {
  e.preventDefault();
  try {
    const msg = document.getElementById('notePageMsg');
    if (!msg) return;
    msg.className = 'form-message';
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    const id = document.getElementById('notePageId')?.value;
    const subcategoryId = document.getElementById('notePageSubcategory')?.value;
    const body = {
      category_id: document.getElementById('notePageCategory')?.value,
      subcategory_id: subcategoryId || null,
      title: document.getElementById('notePageTitle')?.value || '',
      slug: document.getElementById('notePageSlug')?.value || '',
      html_content: document.getElementById('notePageContent')?.value || '',
      status: document.getElementById('notePageStatus')?.value || 'active',
      sort_order: parseInt(document.getElementById('notePageSortOrder')?.value) || 0
    };
    if (id) {
      await apiRequest('/note-pages/' + id, { method: 'PUT', body: JSON.stringify(body) });
      msg.textContent = 'Page updated!';
    } else {
      await apiRequest('/note-pages', { method: 'POST', body: JSON.stringify(body) });
      msg.textContent = 'Page created!';
    }
    msg.className = 'form-message success';
    closeNoteModal('page');
    loadAdminNotes().catch(() => {});
  } catch (err) {
    const msg = document.getElementById('notePageMsg');
    if (msg) { msg.textContent = err.message; msg.className = 'form-message error'; }
  }
}

// ---- Delete ----

function deleteNoteItem(type, id, name) {
  console.log('deleteNoteItem called:', type, id, name);
  noteDeleteState = { type, id };
  document.getElementById('noteDeleteTitle').textContent = 'Delete ' + type + ' "' + (name || '') + '"?';
  document.getElementById('noteDeleteModal').style.display = 'block';
}

async function confirmNoteDelete() {
  const { type, id } = noteDeleteState;
  if (!id) return;
  try {
    const btn = document.getElementById('noteDeleteConfirmBtn');
    if (btn) btn.disabled = true;
    const endpoints = { category: 'note-categories', subcategory: 'note-subcategories', page: 'note-pages' };
    await apiRequest('/' + (endpoints[type] || 'note-' + type + 's') + '/' + id, { method: 'DELETE' });
    closeNoteDeleteModal();
    loadAdminNotes().catch(() => {});
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}
