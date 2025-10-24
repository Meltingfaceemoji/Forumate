/* Forumate v7.4 script.js — full rebuild (uses your Firebase config) */

/* ---------------- Firebase config (your key included) ---------------- */
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

/* ---------------- DOM ---------------- */
const menuButton = document.getElementById('menuButton');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const reportBugBtn = document.getElementById('reportBug');
const seeBugsBtn = document.getElementById('seeBugs');
const pinnedViewBtn = document.getElementById('pinnedView');
const settingsBtn = document.getElementById('settingsBtn');
const logoutButton = document.getElementById('logoutButton');
const onlineCountEl = document.getElementById('onlineCount');

const infoButton = document.getElementById('infoButton');
const infoPopup = document.getElementById('infoPopup');
const closeInfo = document.getElementById('closeInfo');
const userHashEl = document.getElementById('userHash');

const adminButton = document.getElementById('adminButton');
const adminPopup = document.getElementById('adminPopup');
const closeAdminPopup = document.getElementById('closeAdminPopup');
const loginButton = document.getElementById('loginButton');

const messagesEl = document.getElementById('posts') || document.getElementById('posts') /* fallback */;
const postsContainer = document.getElementById('posts') || document.getElementById('posts') /* safe */;
const postsArea = document.getElementById('posts') || document.querySelector('.posts');
const postsList = document.getElementById('posts') || document.querySelector('.posts');

const postsRoot = document.getElementById('posts'); // will be created in index earlier if name differs
const messagesContainer = document.getElementById('posts') || document.getElementById('messages') || document.querySelector('.posts') || document.getElementById('messages') || document.getElementById('posts');
const postsDiv = document.getElementById('posts') || document.getElementById('messages') || document.querySelector('.posts') || document.querySelector('.message-container');

const nameInput = document.getElementById('nameInput');
const imageInput = document.getElementById('imageInput');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const reportSubmitButton = document.getElementById('reportSubmitButton');

/* ---------------- State ---------------- */
const ADMIN_USER = 'melting';
const ADMIN_PASS = 'melting';
let isAdmin = false;
let myIP = null;
let myNumber = null;
let ipMapCache = null;
const LAST_NAME_KEY = 'forumate_last_name';

/* ---------------- Utilities ---------------- */
function $(id){return document.getElementById(id)}
function show(el){ el && el.classList.remove('hidden'); el && el.setAttribute('aria-hidden','false'); }
function hide(el){ el && el.classList.add('hidden'); el && el.setAttribute('aria-hidden','true'); }

/* ---------------- Sidebar handling (works on mobile & desktop) ---------------- */
menuButton.addEventListener('click', () => {
  sidebar.classList.add('visible');
  closeSidebar.style.display = 'block';
  sidebar.setAttribute('aria-hidden','false');
});
closeSidebar.addEventListener('click', () => {
  sidebar.classList.remove('visible');
  closeSidebar.style.display = 'none';
  sidebar.setAttribute('aria-hidden','true');
});
new MutationObserver(()=>{
  closeSidebar.style.display = sidebar.classList.contains('visible') ? 'block' : 'none';
}).observe(sidebar,{attributes:true,attributeFilter:['class']});

/* ---------------- Info popup ---------------- */
infoButton.addEventListener('click', ()=> show(infoPopup));
closeInfo.addEventListener('click', ()=> hide(infoPopup));

/* ---------------- Admin login popup ---------------- */
adminButton.addEventListener('click', ()=> show(adminPopup));
closeAdminPopup.addEventListener('click', ()=> hide(adminPopup));
loginButton.addEventListener('click', ()=>{
  const u = document.getElementById('adminUser').value.trim().toLowerCase();
  const p = document.getElementById('adminPass').value;
  if(u === ADMIN_USER && p === ADMIN_PASS){
    isAdmin = true;
    logoutButton.style.display = 'block';
    seeBugsBtn.style.display = 'block';
    alert('Admin mode enabled — OWNER');
    hide(adminPopup);
    renderPosts();
  } else {
    alert('Wrong admin credentials');
  }
});
logoutButton.addEventListener('click', ()=>{
  isAdmin = false;
  logoutButton.style.display = 'none';
  seeBugsBtn.style.display = 'none';
  alert('Admin logged out');
  renderPosts();
});

/* ---------------- Helper: get public IP via ipify (fallback to local pseudo-ip) ---------------- */
async function fetchIP(){
  if(localStorage.getItem('forumate_ip')) return localStorage.getItem('forumate_ip');
  try{
    const r = await fetch('https://api.ipify.org?format=json');
    const j = await r.json();
    localStorage.setItem('forumate_ip', j.ip);
    return j.ip;
  }catch(e){
    const pseudo = 'local-' + (localStorage.getItem('forumate_sms') || Math.floor(Math.random()*100000));
    localStorage.setItem('forumate_ip', pseudo);
    return pseudo;
  }
}

/* ---------------- ipMap for persistent #numbers ---------------- */
async function ensureIpMap(){
  if(ipMapCache) return ipMapCache;
  const snap = await db.ref('ipMap').once('value');
  ipMapCache = snap.val() || {};
  return ipMapCache;
}
async function assignNumberForIP(ip){
  const map = await ensureIpMap();
  if(map[ip]) return map[ip];
  // next number is max+1
  const vals = Object.values(map).map(x=>Number(x)||0);
  const next = vals.length? Math.max(...vals)+1 : 1;
  map[ip] = next;
  await db.ref('ipMap').set(map);
  ipMapCache = map;
  return next;
}

/* ---------------- Setup my IP & number ---------------- */
(async ()=>{
  myIP = await fetchIP();
  myNumber = await assignNumberForIP(myIP);
  userHashEl.textContent = `#${myNumber}`;
})();

/* ---------------- Post messages + image support ---------------- */
async function postMessage(){
  const name = (nameInput.value || '').trim();
  const text = (messageInput.value || '').trim();
  const image = (imageInput && imageInput.value || '').trim();
  if(!name || !text) return alert('Name and message required');

  // use assigned number for this IP (ensures same # when name changes)
  const number = await assignNumberForIP(myIP);

  const timestamp = Date.now();
  const post = {
    name,
    displayName: (isAdmin ? 'OWNER' : name) + ` #${number}`,
    message: text,
    image: image || '',
    ip: myIP,
    number,
    owner: isAdmin? true : false,
    pinned: false,
    ts: timestamp
  };
  await db.ref('posts/'+timestamp).set(post);
  // clear inputs
  messageInput.value = '';
  imageInput && (imageInput.value = '');
  localStorage.setItem(LAST_NAME_KEY, name);
}

// wire send UI
sendButton.addEventListener('click', postMessage);
messageInput.addEventListener('keypress', e=>{ if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postMessage(); } });

/* ---------------- Render posts (live) ---------------- */
function renderPostElement(key, post){
  const div = document.createElement('div');
  div.className = 'post';
  div.dataset.key = key;

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';

  const left = document.createElement('div');
  const nameEl = document.createElement('span');
  nameEl.className = 'name';
  nameEl.textContent = post.displayName || (post.name + ' #' + post.number);
  if(post.owner) nameEl.classList.add('owner');
  left.appendChild(nameEl);

  const msgWrap = document.createElement('div');
  const msgEl = document.createElement('div');
  msgEl.textContent = post.message;
  msgWrap.appendChild(msgEl);
  if(post.image){
    const img = document.createElement('img');
    img.src = post.image;
    img.alt = 'post image';
    img.style.maxWidth = '100%';
    img.style.marginTop = '8px';
    msgWrap.appendChild(img);
  }

  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.gap = '8px';
  right.style.alignItems = 'center';

  // admin controls per post
  if(isAdmin){
    const menu = document.createElement('button');
    menu.textContent = '⋮';
    menu.title = 'Admin options';
    menu.className = 'round-btn';
    menu.style.width = '34px'; menu.style.height = '28px';
    menu.addEventListener('click', ()=> {
      // small admin menu: delete/pin
      const action = prompt('Type "delete" to remove, "pin" to toggle pin');
      if(!action) return;
      if(action.toLowerCase()==='delete'){
        if(confirm('Delete this post?')) db.ref('posts/'+key).remove();
      } else if(action.toLowerCase()==='pin'){
        db.ref('posts/'+key+'/pinned').set(!post.pinned);
      } else {
        alert('unknown action');
      }
    });
    right.appendChild(menu);
  }

  header.appendChild(left);
  header.appendChild(right);

  if(post.pinned){
    const pinnedBanner = document.createElement('div');
    pinnedBanner.textContent = '📌 PINNED';
    pinnedBanner.style.color = '#ffd966';
    pinnedBanner.style.fontWeight = '700';
    pinnedBanner.style.marginBottom = '6px';
    div.appendChild(pinnedBanner);
  }

  div.appendChild(header);
  div.appendChild(msgWrap);
  return div;
}

async function renderPosts(){
  const snap = await db.ref('posts').once('value');
  const data = snap.val() || {};
  // sort by timestamp key (keys are timestamps used)
  const items = Object.keys(data).sort((a,b)=>Number(a)-Number(b)).map(k=>({k,p:data[k]}));
  // pinned posts first
  items.sort((A,B) => (B.p.pinned?1:0) - (A.p.pinned?1:0));
  const container = document.querySelector('.posts') || document.getElementById('posts') || document.getElementById('messages');
  if(!container) return;
  container.innerHTML = '';
  items.forEach(item=>{
    const el = renderPostElement(item.k, item.p);
    container.appendChild(el);
  });
  // update online count (unique IPs)
  const allIPs = new Set(items.map(x=>x.p.ip));
  onlineCountEl.textContent = 'Online: ' + allIPs.size;
}

/* real-time listener for immediate updates */
db.ref('posts').on('value', ()=> renderPosts());

/* ---------------- Bug reporting ---------------- */
reportBugBtn.addEventListener('click', ()=>{
  // open report flow: hide posts and show report submit button
  const msg = prompt('Describe the bug:');
  if(!msg) return;
  const t = Date.now();
  db.ref('bugs/'+t).set({msg, ts:t, ip: myIP, number: myNumber, date: new Date().toLocaleString()});
  alert('Bug submitted — thanks');
});

seeBugsBtn.addEventListener('click', async ()=>{
  if(!isAdmin) return alert('admin only');
  // load bugs into bugsList and show panel
  const snap = await db.ref('bugs').once('value');
  const data = snap.val() || {};
  const list = document.getElementById('bugsList') || (()=>{ const d=document.createElement('div'); d.id='bugsList'; return d; })();
  list.innerHTML = '';
  Object.keys(data).sort((a,b)=>b-a).forEach(k=>{
    const b = data[k];
    const item = document.createElement('div'); item.className = 'bug-item';
    item.innerHTML = `<div>${b.date} — #${b.number} (${b.ip})</div><div>${b.msg}</div>`;
    const del = document.createElement('button'); del.textContent='Delete'; del.className='secondary';
    del.style.marginTop='8px';
    del.onclick = ()=> { if(confirm('Remove bug?')) db.ref('bugs/'+k).remove(); };
    item.appendChild(del);
    list.appendChild(item);
  });
  const panel = document.getElementById('bugsPanel');
  if(panel){
    const content = panel.querySelector('#bugsList') || list;
    if(!panel.querySelector('#bugsList')) panel.querySelector('.modal-card').appendChild(list);
    show(panel);
  }
});

/* close bugs panel */
const closeBugs = document.getElementById('closeBugs');
if(closeBugs) closeBugs.addEventListener('click', ()=> hide(document.getElementById('bugsPanel')));

/* ---------------- Update checker (simple) ---------------- */
const updateIndicator = document.getElementById('lastUpdated');
if(updateIndicator) updateIndicator.textContent = '— last updated 2025-10-23';

/* ---------------- Init: load last name from localStorage ---------------- */
if(localStorage.getItem(LAST_NAME_KEY)) nameInput.value = localStorage.getItem(LAST_NAME_KEY);

/* ---------------- Helpers to show/hide modals ---------------- */
function show(el){ if(!el) return; el.classList.remove('hidden'); el.setAttribute('aria-hidden','false'); }
function hide(el){ if(!el) return; el.classList.add('hidden'); el.setAttribute('aria-hidden','true'); }

/* ---------------- Final sanity: ensure UI wiring exists ---------------- */
(function validateWiring(){
  const required = ['menuButton','sidebar','closeSidebar','reportBug','seeBugs','pinnedView','settingsBtn','logoutButton','infoButton','adminButton','adminPopup','loginButton','sendButton','nameInput','messageInput','posts'];
  const missing = required.filter(id => !document.getElementById(id));
  if(missing.length){
    console.warn('Missing elements (check HTML IDs):', missing);
  } else {
    console.log('UI wiring OK');
  }
})();
