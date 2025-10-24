/* Forumate — patched script
   - PICTURE.jpg background (if present)
   - admin login & sidebar buttons wired
   - posts with image upload, mini menus, reports, admin tools
   - modal overlay safe defaults (non-blocking unless shown)
   - state persisted to localStorage
*/

/* ---------------- State & keys ---------------- */
const STATE_KEY = 'forumate_state_v1';
const DEVICE_KEY = 'forumate_device_id';
const ONLINE_PREFIX = 'forumate_online_';

let state = {
  posts: [],
  bugReports: [],
  messageReports: [],
  version: 'v7.6 — Simplicity+',
  lastUpdated: new Date().toISOString().split('T')[0]
};

function loadState(){ try{ const s = localStorage.getItem(STATE_KEY); if(s) state = JSON.parse(s); }catch(e){ console.warn('loadState',e);} }
function saveState(){ try{ localStorage.setItem(STATE_KEY, JSON.stringify(state)); }catch(e){ console.warn('saveState',e);} }

/* device/session tracking */
let deviceId = localStorage.getItem(DEVICE_KEY);
if(!deviceId){ deviceId = 'dev-' + Math.floor(Math.random()*900000+100000); localStorage.setItem(DEVICE_KEY, deviceId); }
const onlineKey = ONLINE_PREFIX + deviceId;
function markOnline(){ try{ localStorage.setItem(onlineKey, Date.now().toString()); }catch(e){} }
function markOffline(){ try{ localStorage.removeItem(onlineKey); }catch(e){} }
window.addEventListener('beforeunload', ()=> markOffline());
setInterval(()=> markOnline(), 7000);
markOnline();

/* admin creds */
const ADMIN_USER = 'melting';
const ADMIN_PASS = 'melting';

/* ---------- DOM elements ---------- */
const sidebar = document.getElementById('sidebar');
const hamburger = document.getElementById('hamburger');
const adminCircle = document.getElementById('adminCircle');
const nameTop = document.getElementById('nameTop');
const btnReportBug = document.getElementById('btnReportBug');
const btnInfo = document.getElementById('btnInfo');
const btnMsgReports = document.getElementById('btnMsgReports');
const btnViewBugs = document.getElementById('btnViewBugs');
const btnViewOnline = document.getElementById('btnViewOnline');
const btnReset = document.getElementById('btnReset');
const btnAdminLoginSidebar = document.getElementById('btnAdminLogin');
const btnPost = document.getElementById('btnPost');
const inputName = document.getElementById('inputName');
const inputMessage = document.getElementById('inputMessage');
const inputImage = document.getElementById('inputImage');
const postsDiv = document.getElementById('posts');
const modalOverlay = document.getElementById('modalOverlay');
const toastEl = document.getElementById('toast');
const versionEl = document.getElementById('version');
const lastUpdatedEl = document.getElementById('lastUpdated');
const adminToolsSection = document.getElementById('adminTools');

/* runtime */
let isAdmin = false;
let deviceNameNumber = localStorage.getItem('forumate_name_num') || null;
if(!deviceNameNumber){ deviceNameNumber = Math.floor(Math.random()*9000+1000); localStorage.setItem('forumate_name_num', deviceNameNumber); }

/* load stored state */
loadState();
versionEl.textContent = state.version || 'v7.x';
lastUpdatedEl.textContent = 'Last updated: ' + (state.lastUpdated || new Date().toISOString().split('T')[0]);

/* helper: uid, toast */
function uid(){ return 'id_'+Math.random().toString(36).slice(2,10); }
function toast(msg, ms=1400){
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.style.opacity = '1';
  setTimeout(()=>{ toastEl.style.opacity='0'; setTimeout(()=> toastEl.classList.add('hidden'), 300); }, ms);
}

/* modal helpers (safe, centralized) */
function showModal(html, opts={}){
  modalOverlay.innerHTML = '';
  modalOverlay.classList.remove('hidden');
  modalOverlay.style.display = 'flex';
  modalOverlay.setAttribute('aria-hidden','false');
  const card = document.createElement('div'); card.className='modal-card'; card.innerHTML = html;
  modalOverlay.appendChild(card);
  if(opts.onShow) opts.onShow(card);
  if(opts.closeOnOverlay !== false){
    modalOverlay.addEventListener('click', function ov(e){
      if(e.target === modalOverlay){
        closeModal();
        modalOverlay.removeEventListener('click', ov);
      }
    });
  }
  return card;
}
function closeModal(){ modalOverlay.innerHTML=''; modalOverlay.classList.add('hidden'); modalOverlay.style.display='none'; modalOverlay.setAttribute('aria-hidden','true'); }

/* sidebar controls */
function openSidebar(){ sidebar.classList.add('open'); sidebar.classList.remove('closed'); sidebar.classList.remove('closed'); }
function closeSidebar(){ sidebar.classList.remove('open'); sidebar.classList.add('closed'); }
hamburger.addEventListener('click', ()=> { if(sidebar.classList.contains('open')) closeSidebar(); else openSidebar(); });

/* render sidebar text + admin visibility */
function renderSidebar(){
  const nameVal = inputName.value.trim() || 'Guest';
  nameTop.textContent = `${nameVal} #${deviceNameNumber}`;
  if(isAdmin){
    adminToolsSection.classList.remove('hidden');
    btnMsgReports.classList.remove('hidden');
    btnAdminLoginSidebar.textContent = 'Admin Logout';
  } else {
    adminToolsSection.classList.add('hidden');
    btnMsgReports.classList.add('hidden');
    btnAdminLoginSidebar.textContent = 'Admin Login';
  }
}

/* render posts */
function renderPosts(){
  const sorted = [...state.posts].sort((a,b)=>{
    if(a.pinned && !b.pinned) return -1;
    if(!a.pinned && b.pinned) return 1;
    return b.ts - a.ts;
  });
  postsDiv.innerHTML = '';
  sorted.forEach(post => {
    const el = document.createElement('article'); el.className='post';
    const ownerHtml = post.owner ? '<span class="owner">OWNER</span>' : `<span>${escapeHtml(post.name)} #${post.deviceNum}</span>`;
    const meta = `<div class="meta">${ownerHtml}<span style="flex:1"></span><span class="muted small">${new Date(post.ts).toLocaleString()}</span></div>`;
    const body = `<div class="body">${escapeHtml(post.message || '')}</div>`;
    el.innerHTML = meta + body;
    if(post.imageDataUrl){ const img = document.createElement('img'); img.className='post-image'; img.src = post.imageDataUrl; el.appendChild(img); }
    // dots
    const dots = document.createElement('div'); dots.className='dots'; dots.textContent='⋯';
    let menu = null;
    dots.addEventListener('click', (ev)=>{
      ev.stopPropagation();
      if(menu){ menu.remove(); menu=null; return; }
      menu = buildMiniMenu(post); el.appendChild(menu);
    });
    el.appendChild(dots);
    postsDiv.appendChild(el);
  });
}

/* mini menu builder */
function buildMiniMenu(post){
  const menu = document.createElement('div'); menu.className='mini-menu';
  const copyBtn = document.createElement('button'); copyBtn.textContent='Copy'; copyBtn.onclick = ()=> { navigator.clipboard.writeText(post.message||''); toast('Copied'); };
  menu.appendChild(copyBtn);
  const reportBtn = document.createElement('button'); reportBtn.textContent='Report'; reportBtn.onclick = ()=> {
    state.messageReports.push({ id: uid(), postId: post.id, reporter: inputName.value||'Guest', ts: Date.now() });
    saveState(); toast('Message reported'); menu.remove();
  };
  menu.appendChild(reportBtn);
  if(isAdmin){
    const delBtn = document.createElement('button'); delBtn.textContent='Delete'; delBtn.onclick = ()=> { state.posts = state.posts.filter(p=>p.id!==post.id); saveState(); renderPosts(); toast('Deleted'); };
    menu.appendChild(delBtn);
    const pinBtn = document.createElement('button'); pinBtn.textContent = (post.pinned ? 'Unpin':'Pin to top'); pinBtn.onclick = ()=> { post.pinned = !post.pinned; saveState(); renderPosts(); toast(post.pinned ? 'Pinned':'Unpinned'); };
    menu.appendChild(pinBtn);
  }
  return menu;
}

/* closing menus on outside click */
document.addEventListener('click', ()=> document.querySelectorAll('.mini-menu').forEach(m=>m.remove()));

/* post button */
document.getElementById('btnPost').addEventListener('click', ()=>{
  const name = inputName.value.trim() || 'Guest';
  const message = inputMessage.value.trim();
  const file = inputImage.files && inputImage.files[0];
  if(!message && !file){ toast('Type or attach something'); return; }
  const createPost = (imgDataUrl)=>{
    const p = { id: uid(), name, deviceNum: deviceNameNumber, message, imageDataUrl: imgDataUrl || null, owner: !!isAdmin, pinned:false, ts: Date.now() };
    state.posts.push(p); saveState(); renderPosts(); inputMessage.value=''; inputImage.value=''; toast('Posted');
  };
  if(file){
    const fr = new FileReader();
    fr.onload = (e)=> createPost(e.target.result);
    fr.readAsDataURL(file);
  } else {
    createPost(null);
  }
});

/* admin login modal flow */
function openAdminLoginModal(){
  const html = `<h3>Admin login</h3>
    <input id="modalAdminUser" placeholder="username" />
    <input id="modalAdminPass" placeholder="password" type="password" />
    <div style="display:flex;gap:8px;margin-top:10px">
      <button id="modalAdminOk" class="btn">Login</button>
      <button id="modalAdminCancel" class="btn muted">Cancel</button>
    </div>`;
  showModal(html, { closeOnOverlay:true, onShow: (card)=>{
    document.getElementById('modalAdminOk').addEventListener('click', ()=>{
      const u = document.getElementById('modalAdminUser').value.trim().toLowerCase();
      const p = document.getElementById('modalAdminPass').value.trim().toLowerCase();
      if(u === ADMIN_USER && p === ADMIN_PASS){ isAdmin = true; saveState(); renderSidebar(); closeModal(); toast('Admin logged in'); }
      else { toast('Wrong credentials'); }
    });
    document.getElementById('modalAdminCancel').addEventListener('click', ()=> closeModal());
  }});
}

/* sidebar admin login button: toggle logout/login */
btnAdminLoginSidebar.addEventListener('click', ()=>{
  if(isAdmin){ isAdmin = false; renderSidebar(); saveState(); toast('Admin logged out'); }
  else openAdminLoginModal();
});

/* open admin login via top circle too */
adminCircle.addEventListener('click', ()=> {
  if(isAdmin){ isAdmin = false; renderSidebar(); saveState(); toast('Admin logged out'); }
  else openAdminLoginModal();
});

/* btnReportBug: open modal */
btnReportBug.addEventListener('click', ()=> {
  const html = `<h3>Report a bug</h3><textarea id="modalBugText" rows="6" placeholder="Describe the bug..."></textarea>
    <div style="display:flex;gap:8px;margin-top:10px"><button id="modalBugSubmit" class="btn">Submit</button><button id="modalBugCancel" class="btn muted">Cancel</button></div>`;
  showModal(html, { onShow: ()=>{
    document.getElementById('modalBugSubmit').addEventListener('click', ()=>{
      const desc = document.getElementById('modalBugText').value.trim();
      if(!desc){ toast('Write something'); return; }
      state.bugReports.push({ id: uid(), description: desc, reporter: inputName.value||'Guest', ts: Date.now() }); saveState(); closeModal(); toast('Bug reported');
    });
    document.getElementById('modalBugCancel').addEventListener('click', ()=> closeModal());
  }});
});

/* view bug reports (admin) */
btnViewBugs.addEventListener('click', ()=> {
  if(!isAdmin){ toast('Admin only'); return; }
  const rows = state.bugReports.map(b => `<div style="padding:8px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.12)"><b>${escapeHtml(b.reporter)}</b> — ${new Date(b.ts).toLocaleString()}<div style="margin-top:6px">${escapeHtml(b.description)}</div></div>`).join('') || '<div class="muted">No bug reports</div>';
  showModal(`<h3>Bug Reports</h3><div style="max-height:60vh;overflow:auto">${rows}</div><div style="margin-top:10px"><button id="closeBugsModal" class="btn">Close</button></div>`);
  document.getElementById('closeBugsModal').addEventListener('click', ()=> closeModal());
});

/* message reports list (admin button in sidebar) */
btnMsgReports.addEventListener('click', ()=> {
  if(!isAdmin){ toast('Admin only'); return; }
  const rows = state.messageReports.map(r => {
    const post = state.posts.find(p=>p.id===r.postId) || { message:'(original missing)', name:'?' };
    return `<div style="padding:8px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.12)"><b>Report</b> by ${escapeHtml(r.reporter)} at ${new Date(r.ts).toLocaleString()}<div style="margin-top:6px"><b>Post:</b> ${escapeHtml(post.message)}<br/><b>Author:</b> ${escapeHtml(post.name)}</div></div>`;
  }).join('') || '<div class="muted">No message reports</div>';
  showModal(`<h3>Message Reports</h3><div style="max-height:60vh;overflow:auto">${rows}</div><div style="margin-top:10px"><button id="closeMsgReports" class="btn">Close</button></div>`);
  document.getElementById('closeMsgReports').addEventListener('click', ()=> closeModal());
});

/* view online devices (admin) */
btnViewOnline.addEventListener('click', ()=> {
  if(!isAdmin){ toast('Admin only'); return; }
  const keys = Object.keys(localStorage).filter(k => k.startsWith(ONLINE_PREFIX));
  const now = Date.now();
  const active = keys.filter(k=>{
    const v = parseInt(localStorage.getItem(k) || '0',10);
    return (now - v) < 20000;
  });
  const listHtml = active.map(k=> `<div style="padding:8px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.12)">${escapeHtml(k.replace(ONLINE_PREFIX,''))}</div>`).join('') || '<div class="muted">No active sessions</div>';
  showModal(`<h3>Online Devices</h3><div style="max-height:60vh;overflow:auto">${listHtml}</div><div style="margin-top:10px"><button id="closeOnline" class="btn">Close</button></div>`);
  document.getElementById('closeOnline').addEventListener('click', ()=> closeModal());
});

/* reset chat (admin) */
btnReset.addEventListener('click', ()=> {
  if(!isAdmin){ toast('Admin only'); return; }
  if(confirm('Reset chat (delete all posts)?')){ state.posts = []; saveState(); renderPosts(); toast('Chat reset'); }
});

/* helper functions: escapeHtml, showModal, closeModal already above */
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]); }

/* initial render */
renderSidebar();
renderPosts();
saveState();

/* heartbeat update for online sessions */
setInterval(()=> { try{ localStorage.setItem(onlineKey, Date.now().toString()); }catch(e){} }, 7000);
