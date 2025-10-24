// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA1pylg4PQS_hXhKiLvYcdgh5jbLYhME40",
  authDomain: "html-test-forum.firebaseapp.com",
  databaseURL: "https://html-test-forum-default-rtdb.firebaseio.com",
  projectId: "html-test-forum",
  storageBucket: "html-test-forum.appspot.com",
  messagingSenderId: "781492084495",
  appId: "1:781492084495:web:309c83e29024ba321ba87a",
  measurementId: "G-H877ZK81ZM"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Elements
const postsDiv = document.getElementById("posts");
const postBtn = document.getElementById("postBtn");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");

const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const adminUser = document.getElementById("adminUser");
const adminPass = document.getElementById("adminPass");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const closeAdminModal = document.getElementById("closeAdminModal");
const logoutBtn = document.getElementById("logoutBtn");

const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const resetChatBtn = document.getElementById("resetChatBtn");
const closeInfoModal = document.getElementById("closeInfoModal");
const userNumberSpan = document.getElementById("userNumber");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const reportBugBtn = document.getElementById("reportBugBtn");
const submitBugBtn = document.getElementById("submitBugBtn");
const seeBugsBtn = document.getElementById("seeBugsBtn");
const bugsModal = document.getElementById("bugsModal");
const bugsList = document.getElementById("bugsList");
const closeBugsModal = document.getElementById("closeBugsModal");

const versionLabel = document.querySelector(".versionLabel");
let versionNumber = 7.6;
versionLabel.textContent = "v" + versionNumber;

// Admin
let isAdmin = false;
const ADMIN_USER = "melting";
const ADMIN_PASS = "melting";

// Sidebar toggle
menuBtn.addEventListener("click", ()=> sidebar.classList.toggle("open"));

// Admin login
adminBtn.addEventListener("click", ()=> adminModal.classList.remove("hidden"));
closeAdminModal.addEventListener("click", ()=> adminModal.classList.add("hidden"));
adminLoginBtn.addEventListener("click", ()=>{
  if(adminUser.value.toLowerCase()===ADMIN_USER && adminPass.value===ADMIN_PASS){
    isAdmin=true;
    adminModal.classList.add("hidden");
    showToast("Admin logged in");
    seeBugsBtn.style.display="block";
    submitBugBtn.style.display="inline-block";
  } else showToast("Invalid credentials");
});

// Info modal
infoBtn.addEventListener("click", ()=> { infoModal.classList.remove("hidden"); userNumberSpan.textContent=Math.floor(Math.random()*10000); });
closeInfoModal.addEventListener("click", ()=> infoModal.classList.add("hidden"));
resetChatBtn.addEventListener("click", ()=>{
  if(!isAdmin) return;
  if(confirm("Reset all posts?")) db.ref("posts").remove();
});

// Posting
postBtn.addEventListener("click", ()=>{
  const name=nameInput.value.trim(); 
  const msg=messageInput.value.trim(); 
  const img=imageInput.value.trim();
  if(!name||!msg) return;
  const timestamp=Date.now();
  const postRef=db.ref("posts").push();
  const owner=isAdmin ? true:false;
  postRef.set({name,message:msg,image:img||null,timestamp,owner});
  messageInput.value=""; imageInput.value="";
});

// Bug report
reportBugBtn.addEventListener("click", ()=> submitBugBtn.style.display="inline-block");
submitBugBtn.addEventListener("click", ()=>{
  const name=nameInput.value.trim() || "Anonymous";
  const msg=messageInput.value.trim();
  if(!msg) return;
  db.ref("bugs").push().set({name,message:msg,timestamp:Date.now()});
  messageInput.value="";
  submitBugBtn.style.display="none";
  showToast("Bug submitted");
});
seeBugsBtn.addEventListener("click", ()=>{
  bugsModal.classList.remove("hidden");
  db.ref("bugs").on("value", snap=>{
    bugsList.innerHTML="";
    const bugs=snap.val();
    if(!bugs) return;
    Object.keys(bugs).forEach(k=>{
      const b=bugs[k];
      const div=document.createElement("div");
      div.classList.add("post","glass");
      div.textContent=`${b.name}: ${b.message}`;
      bugsList.appendChild(div);
    });
  });
});
closeBugsModal.addEventListener("click", ()=> bugsModal.classList.add("hidden"));

// Display posts
db.ref("posts").on("value", snap=>{
  postsDiv.innerHTML="";
  const posts = snap.val();
  if(!posts) return;
  Object.keys(posts).sort((a,b)=>posts[b].timestamp-posts[a].timestamp).forEach(k=>{
    const p=posts[k];
    const postEl=document.createElement("div");
    postEl.classList.add("post","glass");
    postEl.innerHTML=`<span style="color:${p.owner?'red':'#004080'}; font-weight:${p.owner?'700':'500'};">${p.owner?'OWNER':p.name}</span>: ${p.message}`;
    if(p.image) postEl.innerHTML+=`<img src="${p.image}" style="max-width:100%; margin-top:4px;">`;
    if(isAdmin){
      const menuBtn=document.createElement("button");
      menuBtn.textContent="⋮"; menuBtn.classList.add("icon-btn"); menuBtn.style.position="absolute"; menuBtn.style.top="6px"; menuBtn.style.right="6px";
      const miniMenu=document.createElement("div"); miniMenu.classList.add("mini-menu","hidden"); miniMenu.style.position="absolute"; miniMenu.style.top="24px"; miniMenu.style.right="6px";
      miniMenu.innerHTML=`<button class="mini-btn">Delete</button><button class="mini-btn">Pin</button>`;
      menuBtn.addEventListener("click", ()=> miniMenu.classList.toggle("hidden"));
      miniMenu.querySelectorAll(".mini-btn")[0].addEventListener("click", ()=> db.ref("posts/"+k).remove());
      miniMenu.querySelectorAll(".mini-btn")[1].addEventListener("click", ()=> db.ref("posts/"+k+"/timestamp").set(Date.now()+999999999));
      postEl.appendChild(menuBtn); postEl.appendChild(miniMenu);
    }
    postsDiv.appendChild(postEl);
  });
});

// Toast
function showToast(msg){
  const t=document.getElementById("toast");
  t.textContent=msg; t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"),2000);
}
