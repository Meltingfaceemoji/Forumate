// ==========================
// Firebase Configuration
// ==========================
const firebaseConfig = {
  apiKey: "AIzaSyA1pylg4PQS_hXhKiLvYcdgh5jbLYhME40", // your API key
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

// ==========================
// DOM Elements
// ==========================
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
let versionNumber = 7.5;
versionLabel.textContent = "v" + versionNumber;

// ==========================
// Admin Setup
// ==========================
let isAdmin = false;
const ADMIN_USER = "melting";
const ADMIN_PASS = "melting";

// ==========================
// Online Counter
// ==========================
const onlineRef = db.ref(".info/connected");
const userID = Math.floor(Math.random() * 1000000);
const userRef = db.ref("online/" + userID);
onlineRef.on("value", snap => {
  if (snap.val()) {
    userRef.set(true);
    userRef.onDisconnect().remove();
  }
});
db.ref("online").on("value", snap => {
  document.getElementById("onlineCount").textContent = snap.numChildren();
});

// ==========================
// Sidebar Toggle
// ==========================
menuBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

// ==========================
// Admin Login
// ==========================
adminBtn.addEventListener("click", () => adminModal.classList.remove("hidden"));
closeAdminModal.addEventListener("click", () => adminModal.classList.add("hidden"));

adminLoginBtn.addEventListener("click", () => {
  const u = adminUser.value.trim();
  const p = adminPass.value.trim();
  if(u.toLowerCase() === ADMIN_USER && p === ADMIN_PASS){
    isAdmin = true;
    adminModal.classList.add("hidden");
    logoutBtn.style.display = "inline-block";
    showToast("Admin logged in");
    seeBugsBtn.style.display = "block";
    submitBugBtn.style.display = "inline-block";
  } else {
    showToast("Invalid admin credentials");
  }
});

logoutBtn.addEventListener("click", () => {
  isAdmin = false;
  logoutBtn.style.display = "none";
  seeBugsBtn.style.display = "none";
  submitBugBtn.style.display = "none";
  showToast("Admin logged out");
});

// ==========================
// Info Modal
// ==========================
infoBtn.addEventListener("click", () => {
  infoModal.classList.remove("hidden");
  userNumberSpan.textContent = userID;
});
closeInfoModal.addEventListener("click", () => infoModal.classList.add("hidden"));

// ==========================
// Reset Chat
// ==========================
resetChatBtn.addEventListener("click", () => {
  if(!isAdmin) return;
  if(confirm("Reset all posts?")) {
    db.ref("posts").remove();
    showToast("Chat reset");
  }
});

// ==========================
// Post Messages
// ==========================
postBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const msg = messageInput.value.trim();
  const img = imageInput.value.trim();
  if(!name || !msg) return;
  const timestamp = Date.now();
  const postRef = db.ref("posts").push();
  postRef.set({name, message: msg, image: img || null, timestamp});
  messageInput.value = "";
  imageInput.value = "";
});

// ==========================
// Bug Reports
// ==========================
reportBugBtn.addEventListener("click", () => {
  submitBugBtn.style.display = "inline-block";
});
submitBugBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Anonymous";
  const msg = messageInput.value.trim();
  if(!msg) return;
  const timestamp = Date.now();
  db.ref("bugs").push().set({name, message: msg, timestamp});
  messageInput.value = "";
  submitBugBtn.style.display = "none";
  showToast("Bug submitted");
});
seeBugsBtn.addEventListener("click", () => {
  bugsModal.classList.remove("hidden");
  db.ref("bugs").on("value", snap => {
    bugsList.innerHTML = "";
    const bugs = snap.val();
    if(!bugs) return;
    Object.keys(bugs).forEach(key => {
      const b = bugs[key];
      const div = document.createElement("div");
      div.classList.add("post","glass");
      div.textContent = `${b.name}: ${b.message}`;
      bugsList.appendChild(div);
    });
  });
});
closeBugsModal.addEventListener("click", () => bugsModal.classList.add("hidden"));

// ==========================
// Display Posts with Admin Mini Menu
// ==========================
db.ref("posts").on("value", snapshot => {
  postsDiv.innerHTML = "";
  const posts = snapshot.val();
  if(!posts) return;

  const sortedKeys = Object.keys(posts).sort((a,b) => posts[b].timestamp - posts[a].timestamp);

  sortedKeys.forEach(key => {
    const p = posts[key];
    const postEl = document.createElement("div");
    postEl.classList.add("post","glass");

    postEl.innerHTML = `<span style="color:${p.owner?'red':'#004080'}; font-weight:${p.owner?'700':'500'};">${p.owner?'OWNER':p.name}</span>: ${p.message}`;
    if(p.image) postEl.innerHTML += `<img src="${p.image}">`;

    postEl.innerHTML += `<div class="post-meta">${new Date(p.timestamp).toLocaleTimeString()}</div>`;

    if(isAdmin){
      const menuBtn = document.createElement("button");
      menuBtn.textContent = "⋮";
      menuBtn.classList.add("icon-btn");
      menuBtn.style.position="absolute";
      menuBtn.style.top="6px";
      menuBtn.style.right="6px";

      const miniMenu = document.createElement("div");
      miniMenu.classList.add("mini-menu","hidden");
      miniMenu.innerHTML = `<button class="mini-btn">Delete</button><button class="mini-btn">Pin to Top</button>`;
      miniMenu.style.position="absolute";
      miniMenu.style.top="24px";
      miniMenu.style.right="6px";

      menuBtn.addEventListener("click",()=> miniMenu.classList.toggle("hidden"));

      miniMenu.querySelectorAll(".mini-btn")[0].addEventListener("click",()=> {
        db.ref("posts/"+key).remove();
        showToast("Post deleted");
      });
      miniMenu.querySelectorAll(".mini-btn")[1].addEventListener("click",()=> {
        db.ref("posts/"+key+"/timestamp").set(Date.now()+999999999);
        showToast("Post pinned");
      });

      postEl.appendChild(menuBtn);
      postEl.appendChild(miniMenu);
    }

    postsDiv.appendChild(postEl);
  });
});

// ==========================
// Toast Helper
// ==========================
function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(()=> t.classList.remove("show"),2000);
}
