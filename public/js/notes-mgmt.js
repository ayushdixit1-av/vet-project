// Notes management module — loaded alongside admin.js (provides admin-sidebar + page switching)
// =============== NOTES MANAGEMENT ===============



function _htmlName(name) {
  return ('' + name).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function _noteClick(e) {
  e.preventDefault();
  e.stopPropagation();
  var el = e.currentTarget;
  var action = el.getAttribute('data-note');
  if (action === 'toggle-cat') { toggleNoteCat(el.getAttribute('data-cat-id')); return; }
  if (action === 'toggle-sub') { toggleNoteSub(el.getAttribute('data-sub-id')); return; }
  if (action === 'delete') { deleteNoteItem(el.getAttribute('data-type'), el.getAttribute('data-id'), el.getAttribute('data-name')); return; }
  if (action === 'add-subcategory') { openNoteModal('subcategory', el.getAttribute('data-cat-id')); return; }
  if (action === 'edit-category') { editNoteCategory(el.getAttribute('data-cat-id')); return; }
  if (action === 'add-page') { openNoteModal('page', el.getAttribute('data-sub-id'), el.getAttribute('data-cat-id')); return; }
  if (action === 'edit-subcategory') { editNoteSubcategory(el.getAttribute('data-sub-id')); return; }
  if (action === 'edit-page') { editNotePage(el.getAttribute('data-page-id')); return; }
}

function _bindNotes(parent) {
  parent.querySelectorAll('[data-note]').forEach(function(el) {
    el.addEventListener('click', _noteClick);
  });
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
    let html = '<div id="notesListInner" style="display:flex;flex-direction:column;gap:8px;">';
    for (const cat of cats) {
      html += `
        <div class="course-manage-item" style="flex-direction:column;align-items:stretch;padding:12px;">
          <table style="width:100%;border-collapse:collapse;"><tr>
            <td style="width:auto;padding:0;">
              <div class="course-info" style="cursor:default;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                  <i class="fas fa-folder-open" style="color:var(--accent-primary);font-size:14px;"></i>
                  <b style="font-size:15px;">${cat.name}</b>
                  <span class="text-muted" style="font-size:12px;">${cat.subcategory_count || 0} topics, ${cat.page_count || 0} pages</span>
                </div>
              </div>
            </td>
            <td style="width:1px;white-space:nowrap;padding:0;">
              <div data-note="toggle-cat" data-cat-id="${cat.id}" style="display:inline-flex;align-items:center;gap:4px;cursor:pointer;padding:4px 10px;border-radius:6px;background:rgba(255,255,255,0.05);font-size:13px;color:var(--text-secondary);">
                <i class="fas fa-chevron-right" id="noteCatArrow-${cat.id}" style="font-size:10px;transition:transform 0.2s;"></i>
                <span>Expand</span>
              </div>
            </td>
            <td style="width:1px;white-space:nowrap;padding:0 0 0 6px;">
              <span style="display:inline-flex;gap:4px;">
                <button type="button" data-note="add-subcategory" data-cat-id="${cat.id}" class="btn btn-sm" style="background:rgba(255,255,255,0.08);color:var(--accent-primary);border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" title="Add subcategory"><i class="fas fa-plus"></i></button>
                <button type="button" data-note="edit-category" data-cat-id="${cat.id}" class="btn btn-sm" style="background:rgba(255,255,255,0.08);color:var(--accent-primary);border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" title="Edit"><i class="fas fa-edit"></i></button>
                <button type="button" data-note="delete" data-type="category" data-id="${cat.id}" data-name="${_htmlName(cat.name)}" class="btn btn-sm" style="background:rgba(255,255,255,0.08);color:var(--danger);border:none;padding:6px 10px;border-radius:6px;cursor:pointer;" title="Delete"><i class="fas fa-trash"></i></button>
              </span>
            </td>
          </tr></table>
          <div id="noteCatChildren-${cat.id}" style="display:none;padding:8px 0 0 0;"></div>
        </div>`;
    }
    html += '</div>';
    container.innerHTML = html;
    _bindNotes(container);
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
          <div style="border:1px solid rgba(255,255,255,0.08);border-radius:8px;margin-bottom:6px;padding:8px 12px;">
            <table style="width:100%;border-collapse:collapse;"><tr>
              <td style="width:auto;padding:0;">
                <span style="font-size:14px;">${sub.name}</span>
                <span class="text-muted" style="font-size:12px;margin-left:6px;">${sub.page_count || 0} pages</span>
              </td>
              <td style="width:1px;white-space:nowrap;padding:0 0 0 8px;">
                <div data-note="toggle-sub" data-sub-id="${sub.id}" style="display:inline-flex;align-items:center;gap:3px;cursor:pointer;padding:3px 8px;border-radius:4px;background:rgba(255,255,255,0.05);font-size:12px;color:var(--text-secondary);">
                  <i class="fas fa-chevron-right" id="noteSubArrow-${sub.id}" style="font-size:8px;transition:transform 0.2s;"></i>
                  <span>Open</span>
                </div>
              </td>
              <td style="width:1px;white-space:nowrap;padding:0 0 0 4px;">
                <span style="display:inline-flex;gap:2px;">
                  <button type="button" data-note="add-page" data-sub-id="${sub.id}" data-cat-id="${catId}" class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:4px;" title="Add page"><i class="fas fa-plus"></i></button>
                  <button type="button" data-note="edit-subcategory" data-sub-id="${sub.id}" class="btn btn-sm" style="background:none;border:none;color:var(--accent-primary);cursor:pointer;padding:4px;" title="Edit"><i class="fas fa-edit"></i></button>
                  <button type="button" data-note="delete" data-type="subcategory" data-id="${sub.id}" data-name="${_htmlName(sub.name)}" class="btn btn-sm" style="background:none;border:none;color:var(--danger);cursor:pointer;padding:4px;" title="Delete"><i class="fas fa-trash"></i></button>
                </span>
              </td>
            </tr></table>
            <div id="noteSubChildren-${sub.id}" style="display:none;padding:6px 0 0 8px;"></div>
          </div>`;
      }
      for (const p of topPages) {
        html += renderNotePageRow(p);
      }
    }
    children.innerHTML = html;
    _bindNotes(children);
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
      _bindNotes(children);
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
    const cat = (data.categories || []).find(c => c.id == catId);
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
      const sub = (subsData.subcategories || []).find(s => s.id == subId);
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

  console.log('SAVE STARTED');

  try {
    const msg = document.getElementById('notePageMsg');
    console.log('msg', msg);

    const btn = e.target.querySelector('button[type="submit"]');
    console.log('btn', btn);

    if (btn) btn.disabled = true;

    const id = document.getElementById('notePageId')?.value;

    const body = {
      category_id: document.getElementById('notePageCategory')?.value,
      subcategory_id: document.getElementById('notePageSubcategory')?.value || null,
      title: document.getElementById('notePageTitle')?.value || '',
      slug: document.getElementById('notePageSlug')?.value || '',
      html_content: document.getElementById('notePageContent')?.value || '',
      status: document.getElementById('notePageStatus')?.value || 'active',
      sort_order: parseInt(document.getElementById('notePageSortOrder')?.value) || 0
    };

    console.log('ID =', id);
    console.log('BODY =', body);

    let result;

    if (id) {
      console.log('PUT REQUEST');

      result = await apiRequest('/note-pages/' + id, {
        method: 'PUT',
        body: JSON.stringify(body)
      });

    } else {
      console.log('POST REQUEST');

      result = await apiRequest('/note-pages', {
        method: 'POST',
        body: JSON.stringify(body)
      });
    }

    console.log('API RETURNED =', result);
    console.log('SAVE SUCCESS');

    msg.textContent = id ? 'Page updated successfully!' : 'Page created successfully!';
    msg.className = 'form-message success';

    setTimeout(() => {
      closeNoteModal('page');
      loadAdminNotes().catch(console.error);
    }, 500);

  } catch (err) {
    console.error('SAVE ERROR =', err);

    const msg = document.getElementById('notePageMsg');
    if (msg) {
      msg.textContent = err.message || 'Unknown error';
      msg.className = 'form-message error';
    }
  } finally {
    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = false;

    console.log('SAVE FINISHED');
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
