/***********************
 script.js — Firebase realtime + UI
 Admin login: username "Admin" password "MELTING" (case-insensitive)
************************/

// -------- Firebase init (your project) ----------
const firebaseConfig = {
  apiKey: "AIzaSyA1pylg4PQS_hXhKiLvYcdgh5jbLYhME40",
  authDomain: "html-test-forum.firebaseapp.com",
  databaseURL: "https://html-test-forum-default-rtdb.firebaseio.com",
  projectId: "html-test-forum",
  storageBucket: "html-test-forum.appspot.com",
  messagingSenderId: "781492084495",
  appId: "1:781492084495:web:309c83e29024ba321ba87a",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// -------- DOM refs ----------
const sidebar = document.getElementById('sidebar');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const adminBtn = document.getElementById('adminBtn');
const btnAdminLogin = document.getElementById('btnAdminLogin');

const btnReportBug = document.getElementById('btnReportBug');
const btnInfo = document.getElementById('btnInfo');
const btnMsgReports = document.getElementById('btnMsgReports');
const btnViewBugs = document.getElementById('btnViewBugs');
const btnViewOnline = document.getElementById('btnViewOnline');
const btnReset = document.getElementById('btnReset');

const chatContainer = document.getElementById('chatContainer');
const inputName = document.getElementById('inputName');
const inputMessage = document.getElementById('inputMessage');
const inputImage = document.getElementById('inputImage');
const btnPost = document.getElementById('btnPost');

const modalOverlay = document.getElementById('modalOverlay');
const toastEl = document.getElementById('toast');

const nameTop = document.getElementById('nameTop');
const usernameDisplay = document.getElementById('usernameDisplay');
const versionEl = document.getElementById('version');
const lastUpdatedEl = document.getElementById('lastUpdated');

// -------- state ----------
let currentUser = { name: '', admin: false };
let deviceNum = localStorage.getItem('forumate_device_num');
if(!deviceNum){ deviceNum = Math.floor(Math.random()*9000+1000); localStorage.setItem('forumate_device_num', deviceNum); }

// put version/last updated
versionEl && (versionEl.textContent = 'v7.6 — Simplicity+');
lastUpdatedEl && (lastUpdatedEl.textContent = 'Last updated: ' + new Date().toLocaleDateString());

// -------- helper functions ----------
function toast(msg, ms=1400){ toastEl.textContent = msg; toastEl.classList.add('show'); toastEl.classList.remove('hidden'); setTimeout(()=>{ toastEl.classList.remove('show'); toastEl.classList.add('hidden'); }, ms); }
function uid(){ return 'id_'+Math.random().toString(36).slice(2,10); }
function toSafe(s){ return (s||'').toString(); }
function closeModal(){ modalOverlay.innerHTML=''; modalOverlay.classList.add('hidden'); modalOverlay.style.display='none'; modalOverlay.setAttribute('aria-hidden','true'); }
function showModal(html, onShow){ modalOverlay.innerHTML=''; modalOverlay.classList.remove('hidden'); modalOverlay.style.display='flex'; modalOverlay.setAttribute('aria-hidden','false'); const card=document.createElement('div'); card.className='modal-card'; card.innerHTML=html; modalOverlay.appendChild(card); if(onShow) onShow(card); }

// -------- sidebar toggle (hamburger) ----------
hamburgerBtn.addEventListener('click', ()=> sidebar.classList.toggle('show'));

// keep username display updated
function renderSidebar(){ 
  const nm = toSafe(inputName.value.trim()||'Guest') + ' #' + deviceNum;
  nameTop.textContent = nm;
  usernameDisplay && (usernameDisplay.textContent = inputName.value.trim() || 'Guest');
  // admin tools visibility
  if(currentUser.admin){
    document.getElementById('adminTools').classList.remove('hidden');
    document.getElementById('btnMsgReports') && document.getElementById('btnMsgReports').classList.remove('hidden');
    btnAdminLogin && (btnAdminLogin.textContent = 'Admin Logout');
  } else {
    document.getElementById('adminTools').classList.add('hidden');
    document.getElementById('btnMsgReports') && document.getElementById('btnMsgReports').classList.add('hidden');
    btnAdminLogin && (btnAdminLogin.textContent = 'Admin Login');
  }
}

// -------- admin login flow (top circle and sidebar login) ----------
function openAdminLoginPopup(){
  const html = `<h3>Admin login</h3>
    <input id="modalUser" placeholder="Username" />
    <input id="modalPass" placeholder="Password" type="password" />
    <div style="display:flex; gap:8px; margin-top:10px;">
      <button id="modalOk" class="sidebar-btn">Login</button>
      <button id="modalCancel" class="sidebar-btn">Cancel</button>
    </div>`;
  showModal(html, (card)=>{
    document.getElementById('modalOk').addEventListener('click', ()=>{
      const u = document.getElementById('modalUser').value.trim().toLowerCase();
      const p = document.getElementById('modalPass').value.trim().toLowerCase();
      if(u === 'admin' && p === 'melting'){
        currentUser = { name: 'OWNER', admin: true };
        renderSidebar(); closeModal(); toast('Admin logged in');
      } else {
        toast('Invalid credentials');
      }
    });
    document.getElementById('modalCancel').addEventListener('click', closeModal);
  });
}
adminBtn.addEventListener('click', ()=> {
  if(currentUser.admin){ currentUser = { name:'', admin:false }; renderSidebar(); toast('Admin logged out'); }
  else openAdminLoginPopup();
});
btnAdminLogin && btnAdminLogin.addEventListener('click', ()=> {
  if(currentUser.admin){ currentUser = { name:'', admin:false }; renderSidebar(); toast('Admin logged out'); }
  else openAdminLoginPopup();
});

// -------- posting (supports optional image) ----------
btnPost.addEventListener('click', ()=>{
  const name = toSafe(inputName.value.trim() || (currentUser.admin ? 'OWNER' : 'Guest'));
  const msg = toSafe(inputMessage.value.trim());
  const file = inputImage.files && inputImage.files[0];
  if(!msg && !file){ toast('Type or attach something'); return; }
  const postId = db.ref('messages').push().key;
  if(file){
    const reader = new FileReader();
    reader.onload = (e)=>{
      const dataUrl = e.target.result;
      const payload = { id: postId, name, message: msg, image: dataUrl||null, ts: Date.now(), owner: !!currentUser.admin };
      db.ref('messages/'+postId).set(payload);
    };
    reader.readAsDataURL(file);
  } else {
    const payload = { id: postId, name, message: msg, image: null, ts: Date.now(), owner: !!currentUser.admin };
    db.ref('messages/'+postId).set(payload);
  }
  inputMessage.value=''; inputImage.value='';
});

// -------- listen for realtime changes (add/update/remove) ----------
const messagesRef = db.ref('messages');

// on new message
messagesRef.on('child_added', snap=>{
  const data = snap.val();
  if(!data) return;
  addOrUpdatePost(data);
});

// on message removed
messagesRef.on('child_removed', snap=>{
  const id = snap.key;
  const el = document.querySelector(`[data-post-id="${id}"]`);
  if(el) el.remove();
});

// on changed (e.g., pin flag later), treat as update
messagesRef.on('child_changed', snap=>{
  const data = snap.val();
  addOrUpdatePost(data);
});

// render / update function
function addOrUpdatePost(data){
  const existing = document.querySelector(`[data-post-id="${data.id}"]`);
  if(existing){
    // update content
    const body = existing.querySelector('.body');
    if(body) body.textContent = data.message || '';
    const imgEl = existing.querySelector('img.post-image');
    if(data.image){
      if(imgEl) imgEl.src = data.image;
      else{ const im = document.createElement('img'); im.className='post-image'; im.src=data.image; existing.appendChild(im); }
    } else if(imgEl){ imgEl.remove(); }
    return;
  }

  // create new post element
  const el = document.createElement('article');
  el.className = 'post';
  el.setAttribute('data-post-id', data.id);

  const metaDiv = document.createElement('div'); metaDiv.className='meta';
  const ownerSpan = document.createElement('span');
  ownerSpan.className = data.owner ? 'owner' : 'author';
  ownerSpan.textContent = data.owner ? 'OWNER' : (data.name || 'Guest') + ' #' + deviceNum;
  metaDiv.appendChild(ownerSpan);

  const timeSpan = document.createElement('span'); timeSpan.className='small muted'; timeSpan.style.marginLeft='auto';
  timeSpan.textContent = new Date(data.ts || Date.now()).toLocaleString();
  metaDiv.appendChild(timeSpan);

  const bodyDiv = document.createElement('div'); bodyDiv.className='body'; bodyDiv.textContent = data.message || '';

  el.appendChild(metaDiv);
  el.appendChild(bodyDiv);

  if(data.image){
    const im = document.createElement('img'); im.className='post-image'; im.src = data.image; el.appendChild(im);
  }

  // dots / mini menu
  const dots = document.createElement('div'); dots.className='dots'; dots.textContent='⋯';
  let menu = null;
  dots.addEventListener('click', (ev)=>{
    ev.stopPropagation();
    if(menu){ menu.remove(); menu = null; return; }
    menu = document.createElement('div'); menu.className='mini-menu';
    // copy
    const copyBtn = document.createElement('button'); copyBtn.textContent='Copy'; copyBtn.onclick = ()=>{ navigator.clipboard.writeText(data.message||''); toast('Copied'); };
    menu.appendChild(copyBtn);
    // report
    const reportBtn = document.createElement('button'); reportBtn.textContent='Report'; reportBtn.onclick = ()=>{
      const repId = db.ref('messageReports').push().key;
      db.ref('messageReports/'+repId).set({ id: repId, postId: data.id, reporter: inputName.value || 'Guest', ts: Date.now(), message: data.message||''});
      toast('Message reported');
      menu.remove();
    };
    menu.appendChild(reportBtn);
    // admin options
    if(currentUser.admin){
      const delBtn = document.createElement('button'); delBtn.textContent='Delete'; delBtn.onclick = ()=> db.ref('messages/'+data.id).remove();
      menu.appendChild(delBtn);
      const pinBtn = document.createElement('button'); pinBtn.textContent='Pin to top'; pinBtn.onclick = ()=>{
        // emulate pin by writing a 'pinned' child under message (simple approach)
        db.ref('messages/'+data.id+'/pinned').set(true);
        toast('Pinned (server-side flag set)');
      };
      menu.appendChild(pinBtn);
    }
    el.appendChild(menu);
  });

  el.appendChild(dots);

  // append and scroll
  chatContainer.appendChild(el);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// hide mini menus on outside click
document.addEventListener('click', ()=> document.querySelectorAll('.mini-menu').forEach(m=>m.remove()));

// -------- sidebar buttons wiring --------
btnReportBug && btnReportBug.addEventListener('click', ()=> {
  showModal(`<h3>Report a bug</h3><textarea id="modalBug" rows="6" placeholder="Describe..."></textarea>
    <div style="margin-top:8px"><button id="modalBugOk" class="sidebar-btn">Submit</button> <button id="modalBugCancel" class="sidebar-btn">Cancel</button></div>`, (card)=>{
      document.getElementById('modalBugOk').addEventListener('click', ()=>{
        const v = document.getElementById('modalBug').value.trim();
        if(!v){ toast('Enter a description'); return; }
        const id = db.ref('bugs').push().key;
        db.ref('bugs/'+id).set({ id, description: v, reporter: inputName.value||'Guest', ts: Date.now() });
        closeModal(); toast('Bug reported');
      });
      document.getElementById('modalBugCancel').addEventListener('click', closeModal);
  });
});

btnInfo && btnInfo.addEventListener('click', ()=> {
  showModal(`<h3>Info</h3><p>© MeltingDev</p><p>Your ID: ${deviceNum}</p><div style="margin-top:8px"><button id="closeInfo" class="sidebar-btn">Close</button></div>`, (card)=>{
    document.getElementById('closeInfo').addEventListener('click', closeModal);
  });
});

// admin-only sidebar buttons (these exist but might be hidden)
btnViewBugs && btnViewBugs.addEventListener('click', ()=> {
  // only admin
  if(!currentUser.admin){ toast('Admin only'); return; }
  db.ref('bugs').once('value', snap=>{
    const rows = [];
    snap.forEach(child => {
      const b = child.val(); rows.push(`<div style="padding:8px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.12)"><b>${b.reporter}</b> — ${new Date(b.ts).toLocaleString()}<div style="margin-top:6px">${b.description}</div></div>`);
    });
    showModal(`<h3>Bug Reports</h3><div style="max-height:60vh; overflow:auto">${rows.join('') || '<div class="small muted">No bugs</div>'}</div><div style="margin-top:8px"><button id="closeBugs" class="sidebar-btn">Close</button></div>`, ()=>{
      document.getElementById('closeBugs').addEventListener('click', closeModal);
    });
  });
});

btnViewOnline && btnViewOnline.addEventListener('click', ()=> {
  if(!currentUser.admin){ toast('Admin only'); return; }
  // approximate concurrent using 'presence' node (simple)
  db.ref('presence').once('value', snap=>{
    const active = []; snap.forEach(ch=> { const t = ch.val(); if(Date.now() - (t.ts||0) < 30000) active.push(ch.key); });
    showModal(`<h3>Online</h3><div>${active.map(a=>`<div style="padding:8px">${a}</div>`).join('') || '<div class="small muted">None</div>'}</div><div style="margin-top:8px"><button id="closeOn" class="sidebar-btn">Close</button></div>`, ()=>{
      document.getElementById('closeOn').addEventListener('click', closeModal);
    });
  });
});

btnReset && btnReset.addEventListener('click', ()=> {
  if(!currentUser.admin){ toast('Admin only'); return; }
  if(confirm('Reset chat (delete all messages)?')){ db.ref('messages').remove(); toast('Chat reset'); }
});

// show/hide message reports button based on admin state in renderSidebar()
function renderSidebar(){
  nameTop.textContent = (inputName.value.trim()||'Guest') + ' #' + deviceNum;
  usernameDisplay && (usernameDisplay.textContent = inputName.value.trim()||'Guest');
  if(currentUser.admin){
    document.getElementById('adminTools').classList.remove('hidden');
    btnMsgReports && btnMsgReports.classList.remove('hidden');
    btnAdminLogin && (btnAdminLogin.textContent = 'Admin Logout');
  } else {
    document.getElementById('adminTools').classList.add('hidden');
    btnMsgReports && btnMsgReports.classList.add('hidden');
    btnAdminLogin && (btnAdminLogin.textContent = 'Admin Login');
  }
}

// messageReports view (admin)
btnMsgReports && btnMsgReports.addEventListener('click', ()=> {
  if(!currentUser.admin){ toast('Admin only'); return; }
  db.ref('messageReports').once('value', snap=>{
    const rows = [];
    snap.forEach(c=> { const r=c.val(); const post=r.postId||'(missing)'; rows.push(`<div style="padding:8px;border-radius:8px;margin-bottom:8px;background:rgba(255,255,255,0.12)"><b>${r.reporter}</b> reported post ${post}<div style="margin-top:6px">${r.ts? new Date(r.ts).toLocaleString() : ''}</div></div>`); });
    showModal(`<h3>Message Reports</h3><div style="max-height:60vh;overflow:auto">${rows.join('') || '<div class="muted small">No reports</div>'}</div><div style="margin-top:8px"><button id="closeMR" class="sidebar-btn">Close</button></div>`, ()=>{
      document.getElementById('closeMR').addEventListener('click', closeModal);
    });
  });
});

// presence heartbeat (simple)
const presenceKey = 'presence/' + deviceNum;
function beatPresence(){ db.ref('presence/'+deviceNum).set({ ts: Date.now() }); }
setInterval(beatPresence, 7000);
beatPresence();

// initial render
renderSidebar();

// small usability: pressing enter in textarea posts
inputMessage.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); btnPost.click(); }
});

// debug: show any Firebase errors
window.addEventListener('error', e=> console.warn('Error:', e.error || e.message || e));

// ensure modalOverlay doesn't block clicks unless shown (safety)
modalOverlay.classList.add('hidden');
modalOverlay.style.pointerEvents = 'none';
const obs = new MutationObserver(()=> {
  const isHidden = modalOverlay.classList.contains('hidden');
  modalOverlay.style.pointerEvents = isHidden ? 'none' : 'auto';
});
obs.observe(modalOverlay, { attributes:true, attributeFilter:['class'] });

// end of script