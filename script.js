// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA1pylg4PQS_hXhKiLvYcdgh5jbLYhME40",
  authDomain: "html-test-forum.firebaseapp.com",
  databaseURL: "https://html-test-forum-default-rtdb.firebaseio.com",
  projectId: "html-test-forum",
  storageBucket: "html-test-forum.firebasestorage.app",
  messagingSenderId: "781492084495",
  appId: "1:781492084495:web:309c83e29024ba321ba87a",
  measurementId: "G-H877ZK81ZM"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Global state
let currentUser = null;
let isAdmin = false;
let postsData = {};
let ipMap = {};
let onlineIPs = {};

// DOM references
const adminBtn = document.getElementById('adminBtn');
const infoBtn = document.getElementById('infoBtn');
const loginPopup = document.getElementById('loginPopup');
const infoPanel = document.getElementById('infoPanel');
const sidebar = document.getElementById('sidebar');
const sidebarButtons = document.getElementById('sidebarButtons');
const postsDiv = document.getElementById('posts');
const seeBugsBtn = document.getElementById('seeBugsBtn');
const onlineCount = document.getElementById('onlineCount');
const versionEl = document.getElementById('version');
const updateIndicator = document.getElementById('updateIndicator');

// Constants
const ADMIN_USER = "melting";
const ADMIN_PASS = "melting";
const OWNER_NAME = "OWNER";
const VERSION = "v7.4 – Codename Simplicity";
const LAST_UPDATED = "2025-10-23";

// Initialize UI
versionEl.innerText = `${VERSION} (Last updated: ${LAST_UPDATED})`;

// Get visitor IP and assign persistent #number
function assignUserNumber(callback){
  db.ref('ipMap').once('value').then(snap=>{
    ipMap = snap.val()||{};
    fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(data=>{
      const ip = data.ip;
      let userNumber;
      if(ipMap[ip]){
        userNumber = ipMap[ip];
      } else {
        const allNumbers = Object.values(ipMap);
        userNumber = allNumbers.length ? Math.max(...allNumbers)+1 : 1;
        ipMap[ip] = userNumber;
        db.ref('ipMap').set(ipMap);
      }
      callback(ip,userNumber);
    });
  });
}

// Sidebar toggle
function toggleSidebar(){
  sidebar.classList.toggle('show');
}

// Admin login UI
function showAdminLogin(){ loginPopup.style.display="flex"; }
function closeAdminLogin(){ loginPopup.style.display="none"; }

// Login admin
function loginAdmin(){
  const name = document.getElementById('loginName').value.trim();
  const pass = document.getElementById('loginPass').value.trim();
  if(name===ADMIN_USER && pass===ADMIN_PASS){
    isAdmin = true;
    assignUserNumber((ip,num)=>{
      currentUser={name:OWNER_NAME, ip:ip, isAdmin:true, count:num};
      loginPopup.style.display="none";
      document.getElementById('adminMenu').style.display="flex";
      seeBugsBtn.style.display="block";
      renderPosts();
      alert("Admin logged in as OWNER");
      document.getElementById('userNumberDisplay').innerText = `#${num}`;
    });
  } else alert("Wrong credentials");
}

// Logout admin
function logoutAdmin(){
  isAdmin=false;
  currentUser=null;
  document.getElementById('adminMenu').style.display="none";
  seeBugsBtn.style.display="none";
  renderPosts();
}

// Show/Close info panel
function showInfo(){
  infoPanel.style.display="flex";
  if(currentUser){
    document.getElementById('userNumberDisplay').innerText = `#${currentUser.count}`;
  }
}
function closeInfo(){ infoPanel.style.display="none"; }

// Post a message
function postMessage(){
  const nameInput=document.getElementById('name');
  const msgInput=document.getElementById('message');
  const imgInput=document.getElementById('image');
  if(!nameInput.value||!msgInput.value) return alert("Fill name and message");
  assignUserNumber((ip,count)=>{
    const newPost={
      name:nameInput.value,
      message:msgInput.value,
      image:imgInput.value,
      ip:ip,
      count:count,
      timestamp:Date.now(),
      isAdmin:isAdmin&&currentUser.name===OWNER_NAME
    };
    db.ref('posts').push(newPost);
    nameInput.value=""; msgInput.value=""; imgInput.value="";
  });
}

// Listen for posts
db.ref('posts').on('value', snap=>{
  postsData = snap.val()||{};
  renderPosts();
});

// Render posts
function renderPosts(){
  postsDiv.innerHTML="";
  for(let key in postsData){
    const post = postsData[key];
    const div=document.createElement('div');
    div.className="post";
    const nameSpan=document.createElement('span');
    nameSpan.className="name"+(post.isAdmin?" owner":"");
    nameSpan.innerText=post.name;
    const tag=document.createElement('span');
    tag.className="tag";
    tag.innerText=`#${post.count||1}`;
    const msgP=document.createElement('p');
    msgP.innerText=post.message;
    div.appendChild(nameSpan); div.appendChild(tag); div.appendChild(msgP);
    if(post.image){ const imgEl=document.createElement('img'); imgEl.src=post.image; div.appendChild(imgEl);}
    if(isAdmin){
      const delBtn=document.createElement('span');
      delBtn.className="postMenuBtn"; delBtn.innerText="⋮";
      delBtn.onclick=()=>{if(confirm("Delete post?")) db.ref('posts/'+key).remove();}
      div.appendChild(delBtn);
    }
    postsDiv.appendChild(div);
  }
}

// Bug reporting
function showBugForm(){ postsDiv.style.display="none"; document.getElementById('reportBugBtn').style.display="block"; }
function submitBug(){
  const msg=document.getElementById('message').value;
  if(!msg) return alert("Enter bug description");
  db.ref('bugs').push({msg:msg,timestamp:Date.now()});
  alert("Bug reported!");
  postsDiv.style.display="block"; document.getElementById('reportBugBtn').style.display="none";
  document.getElementById('message').value="";
}

// View bugs (admin)
function viewBugs(){
  const postsDiv=document.getElementById('posts');
  const bugsDiv=document.getElementById('bugs');
  postsDiv.style.display="none"; bugsDiv.style.display="block";
  bugsDiv.innerHTML="<h3>Bug Reports:</h3>";
  db.ref('bugs').once('value').then(snapshot=>{
    const data = snapshot.val()||{};
    for(let k in data){
      const d=data[k];
      const p=document.createElement('p'); p.innerText=d.msg;
      bugsDiv.appendChild(p);
    }
    const back=document.createElement('button'); back.innerText="< Back";
    back.onclick=()=>{bugsDiv.style.display="none"; postsDiv.style.display="block";}
    bugsDiv.appendChild(back);
  });
}

// Track online users (simplified)
db.ref('posts').on('value', snap=>{
  const data=snap.val()||{};
  const ips=new Set();
  Object.values(data).forEach(p=>ips.add(p.ip));
  onlineCount.innerText=`Online: ${ips.size}`;
});
