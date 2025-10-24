/* Forumate v7.4 — script.js (complete) */

/* ---------- Firebase config (user's key included) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyA1pylg4PQS_hXhKiLvYcdgh5jbLYhME40",
  authDomain: "html-test-forum.firebaseapp.com",
  databaseURL: "https://html-test-forum-default-rtdb.firebaseio.com",
  projectId: "html-test-forum",
  storageBucket: "html-test-forum.appspot.com",
  messagingSenderId: "781492084495",
  appId: "1:781492084495:web:309c83e29024ba321ba87a"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

/* ---------- DOM ---------- */
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');

const reportBugBtn = document.getElementById('reportBugBtn');
const seeBugsBtn = document.getElementById('seeBugsBtn');
const pinnedBtn = document.getElementById('pinnedBtn');
const logoutBtn = document.getElementById('logoutBtn');
const onlineCountEl = document.getElementById('onlineCount');

const infoBtn = document.getElementById('infoBtn');
const infoModal = document.getElementById('infoModal');
const closeInfoModal = document.getElementById('closeInfoModal');
const userNumberEl = document.getElementById('userNumber');

const adminBtn = document.getElementById('adminBtn');
const adminModal = document.getElementById('adminModal');
const closeAdminModal = document.getElementById('closeAdminModal');
const adminLoginBtn = document.getElementById('adminLoginBtn');

const postsEl = document.getElementById('posts');
const nameInput = document.getElementById('nameInput');
const imageInput = document.getElementById('imageInput');
const messageInput = document.getElementById('messageInput');
const postBtn = document.getElementById('postBtn');
const submitBugBtn = document.getElementById('submitBugBtn');

const bugsModal = document.getElementById('bugsModal');
const closeBugsModal = document.getElementById('closeBugsModal');
const bugsListEl = document.getElementById('bugsList');

const toastEl = document.getElementById('toast');
const versionLabel = document.getElementById('versionLabel');
const updateCheckEl = document.getElementById('updateCheck');
const lastUpdatedEl = document.getElementById('lastUpdated');

/* ---------- State ---------- */
const ADMIN_USER = 'melting';
const ADMIN_PASS = 'melting';
let isAdmin = false;
let myIP = null;
let myNumber = null;
const LAST_NAME_KEY = 'forumate_last_name';
const LAST_IP_KEY = 'forumate_ip_fallback';

/* ---------- Helpers ---------- */
function show(el){ if(!el) return; el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
function hide(el){ if(!el) return; el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }
function toast(msg, time=2500){ toastEl.textContent = msg; show(toastEl); setTimeout(()=>hide(toastEl), time); }

/* ---------- Sidebar behavior ---------- */
menuBtn.addEventListener('click', ()=>{
  sidebar.classList.add('visible');
  sidebar.setAttribute('aria-hidden','false');
});
closeSidebar.addEventListener('click', ()=>{
  sidebar.classList.remove('visible');
  sidebar.setAttribute('aria-hidden','true');
});
new MutationObserver(()=>{ closeSidebar.style.display = sidebar.classList.contains('visible') ? 'block' : 'none'; }).observe(sidebar, { attributes: true, attributeFilter: ['class'] });

/* ---------- Modals ---------- */
adminBtn.addEventListener('click', ()=> show(adminModal));
closeAdminModal.addEventListener('click', ()=> hide(adminModal));
infoBtn.addEventListener('click', ()=> show(infoModal));
closeInfoModal.addEventListener('click', ()=> hide(infoModal));
if(closeBugsModal) closeBugsModal.addEventListener('click', ()=> hide(bugsModal));

/* ---------- IP & # mapping (ipMap stored in Firebase) ---------- */
async function getMyIP(){
  const cached = localStorage.getItem(LAST_IP_KEY);
  if(cached) return cached;
  try{
    const r = await fetch('https://api.ipify.org?format=json');
    if(!r.ok) throw new Error('ip fetch fail');
    const j = await r.json();
    localStorage.setItem(LAST_IP_KEY, j.ip);
    return j.ip;
  }catch(e){
    // fallback pseudo
    const p = 'local-' + (localStorage.getItem('forumate_local') || Math.floor(Math.random()*100000));
    localStorage.setItem(LAST_IP_KEY, p);
    return p;
  }
}

async function ensureIpMap(){
  const snap = await db.ref('ipMap').once('value');
  return snap.val() || {};
}

async function assignNumberForIP(ip){
  const mapSnap = await db.ref('ipMap').once('value');
  const map = mapSnap.val() || {};
  if(map[ip]) return map[ip];
  const nums = Object.values(map).map(n=>Number(n)||0);
  const next = nums.length ? Math.max(...nums)+1 : 1;
  map[ip] = next;
  await db.ref('ipMap').set(map);
  return next;
}

/* ---------- Init my ip & number ---------- */
(async ()=>{
  myIP = await getMyIP();
  myNumber = await assignNumberForIP(myIP);
  if(userNumberEl) userNumberEl.textContent = `#${myNumber}`;
})();

/* ---------- Post creation ---------- */
async function createPost(){
  const name = (nameInput.value || '').trim();
  const text = (messageInput.value || '').trim();
  const image = (imageInput.value || '').trim();
  if(!name || !text){ toast('Enter name and message'); return; }

  // display name uses number for this IP; if admin, show OWNER
  const number = await assignNumberForIP(myIP);
  const displayName = isAdmin ? 'OWNER' : `${name} #${number}`;

  const key = Date.now().toString();
  const post = {
    name: name,
    displayName,
    message: text,
    image: image || '',
    ip: myIP,
    number,
    owner: !!isAdmin,
    pinned: false,
    ts: Date.now()
  };
  await db.ref('posts/'+key).set(post);
  messageInput.value = '';
  imageInput.value = '';
  localStorage.setItem(LAST_NAME_KEY, name);
  toast('Posted');
}

/* wire post */
postBtn.addEventListener('click', createPost);
messageInput.addEventListener('keydown', (e)=> {
  if(e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); createPost(); }
});

/* ---------- Render posts (live listener) ---------- */
function createPostElement(key, p){
  const wrap = document.createElement('div');
  wrap.className = 'post';
  wrap.dataset.key = key;

  // header
  const hdr = document.createElement('div');
  hdr.style.display='flex'; hdr.style.justifyContent='space-between'; hdr.style.alignItems='center';

  const left = document.createElement('div');
  const nameEl = document.createElement('div');
  nameEl.className = 'name';
  nameEl.textContent = p.displayName || (p.name + ' #' + p.number);
  if(p.owner) nameEl.classList.add('owner');
  left.appendChild(nameEl);

  const right = document.createElement('div');
  right.style.display='flex'; right.style.gap='8px'; right.style.alignItems='center';

  // admin menu button for admins
  if(isAdmin){
    const adminMenu = document.createElement('button');
    adminMenu.className = 'icon-btn';
    adminMenu.textContent = '⋮';
    adminMenu.title = 'Admin';
    adminMenu.addEventListener('click', async ()=>{
      const choice = prompt('Admin action: "delete" or "pin"');
      if(!choice) return;
      if(choice.toLowerCase() === 'delete'){
        if(confirm('Delete this post?')) await db.ref('posts/'+key).remove();
      } else if(choice.toLowerCase() === 'pin'){
        await db.ref('posts/'+key+'/pinned').set(!p.pinned);
      } else {
        toast('Unknown command');
      }
    });
    right.appendChild(adminMenu);
  }

  hdr.appendChild(left);
  hdr.appendChild(right);
  wrap.appendChild(hdr);

  // body
  const body = document.createElement('div');
  body.style.marginTop = '8px';
  body.textContent = p.message;
  wrap.appendChild(body);

  if(p.image){
    const img = document.createElement('img');
    img.src = p.image;
    img.alt = 'post image';
    img.style.maxWidth = '100%';
    img.style.marginTop = '8px';
    img.style.borderRadius = '8px';
    wrap.appendChild(img);
  }

  if(p.pinned){
    const pin = document.createElement('div');
    pin.textContent = '📌 PINNED';
    pin.style.color = '#ffd966'; pin.style.fontWeight = '700'; pin.style.marginBottom = '6px';
    wrap.prepend(pin);
  }
  return wrap;
}

async function renderAllPosts(snapshot){
  const data = snapshot.val() || {};
  // convert to array and sort by ts asc
  const arr = Object.entries(data).map(([k,v]) => ({k, ...v}));
  // pinned first
  arr.sort((a,b) => (b.pinned?1:0) - (a.pinned?1:0) || (a.ts - b.ts));
  postsEl.innerHTML = '';
  arr.forEach(item => postsEl.appendChild(createPostElement(item.k, item)));
  // online count = unique ips among posts
  const ips = new Set(arr.map(x=>x.ip));
  onlineCountEl.textContent = 'Online: ' + ips.size;
}

/* subscribe */
db.ref('posts').on('value', renderAllPosts);

/* ---------- Bug reporting ---------- */
reportBugBtn.addEventListener('click', async ()=>{
  const desc = prompt('Describe the bug you saw (short):');
  if(!desc) return;
  const key = Date.now().toString();
  await db.ref('bugs/'+key).set({msg: desc, ip: myIP, number: myNumber, ts: Date.now(), date: new Date().toLocaleString()});
  toast('Bug reported — thanks');
});

seeBugsBtn.addEventListener('click', async ()=>{
  if(!isAdmin) return toast('Admin only');
  const snap = await db.ref('bugs').once('value');
  const data = snap.val() || {};
  bugsListEl.innerHTML = '';
  Object.entries(data).sort((a,b)=>b[0]-a[0]).forEach(([k,v])=>{
    const item = document.createElement('div'); item.className='bug-item';
    item.innerHTML = `<div><strong>#${v.number}</strong> ${v.date}</div><div>${v.msg}</div>`;
    const del = document.createElement('button'); del.className='btn secondary'; del.textContent='Delete';
    del.style.marginTop='8px';
    del.onclick = ()=> { if(confirm('Delete bug?')) db.ref('bugs/'+k).remove(); };
    item.appendChild(del);
    bugsListEl.appendChild(item);
  });
  show(bugsModal);
});

/* ---------- Admin login ---------- */
adminLoginBtn.addEventListener('click', ()=>{
  const u = (document.getElementById('adminUser').value || '').trim().toLowerCase();
  const p = (document.getElementById('adminPass').value || '').trim();
  if(u === ADMIN_USER && p === ADMIN_PASS){
    isAdmin = true;
    toast('Admin logged in (OWNER)');
    show(seeBugsBtn);
    show(logoutBtn);
    hide(adminModal);
    renderAllPosts({ val: () => db.ref('posts').once('value').then(snap=>snap.val())}); // quick refresh
  } else {
    toast('Wrong admin credentials');
  }
});
logoutBtn.addEventListener('click', ()=>{ isAdmin = false; hide(seeBugsBtn); hide(logoutBtn); toast('Admin logged out'); renderAllPosts({ val: () => db.ref('posts').once('value').then(snap=>snap.val())}); });

/* ---------- update checker (compares raw index.html on GitHub) ---------- */
(async function checkForUpdate(){
  try{
    const rawUrl = 'https://raw.githubusercontent.com/Meltingfaceemoji/Forumate/main/index.html';
    const r = await fetch(rawUrl);
    if(!r.ok) throw new Error('fetch fail');
    const text = await r.text();
    // Simple check: look for "v7.4" or version label in remote file
    if(text.includes('v7.4')) updateCheckEl.textContent = 'Up to date';
    else updateCheckEl.textContent = 'Remote changed';
  }catch(e){
    updateCheckEl.textContent = 'Update check failed';
  }
})();

/* ---------- load last name ---------- */
if(localStorage.getItem(LAST_NAME_KEY)) nameInput.value = localStorage.getItem(LAST_NAME_KEY);

/* ---------- basic sanity log ---------- */
(function validateIds(){
  const want = ['menuBtn','sidebar','closeSidebar','reportBugBtn','seeBugsBtn','pinnedBtn','logoutBtn','infoBtn','adminBtn','adminModal','adminLoginBtn','postBtn','posts'];
  const missing = want.filter(id=>!document.getElementById(id));
  if(missing.length) console.warn('Missing elements (check HTML ids):', missing);
})();
