// ======================
// Firebase Initialization
// ======================
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

// ======================
// DOM Elements
// ======================
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const closeAdminModal = document.getElementById("closeAdminModal");
const reportBugBtn = document.getElementById("reportBugBtn");
const submitBugBtn = document.getElementById("submitBugBtn");
const seeBugsBtn = document.getElementById("seeBugsBtn");
const bugsModal = document.getElementById("bugsModal");
const closeBugsModal = document.getElementById("closeBugsModal");
const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const closeInfoModal = document.getElementById("closeInfoModal");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const postBtn = document.getElementById("postBtn");
const postsDiv = document.getElementById("posts");
const toast = document.getElementById("toast");
const onlineCountEl = document.getElementById("onlineCount");
const userNumberEl = document.getElementById("userNumber");

// ======================
// State
// ======================
let isAdmin = false;
let currentUserNumber = Math.floor(Math.random() * 10000);
userNumberEl.textContent = currentUserNumber;

// ======================
// Helper Functions
// ======================
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

function toggleSidebar() {
  sidebar.classList.toggle("open");
}

// ======================
// Sidebar
// ======================
menuBtn.addEventListener("click", toggleSidebar);

// ======================
// Admin Login
// ======================
adminBtn.addEventListener("click", () => {
  adminModal.classList.remove("hidden");
});

closeAdminModal.addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

adminLoginBtn.addEventListener("click", () => {
  const user = document.getElementById("adminUser").value.trim();
  const pass = document.getElementById("adminPass").value.trim();
  if(user === "melting" && pass === "melting") {
    isAdmin = true;
    showToast("Admin logged in");
    adminModal.classList.add("hidden");
    seeBugsBtn.style.display = "block";
    document.getElementById("logoutBtn").style.display = "block";
  } else {
    showToast("Incorrect credentials");
  }
});

// ======================
// Logout Admin
// ======================
document.getElementById("logoutBtn").addEventListener("click", () => {
  isAdmin = false;
  seeBugsBtn.style.display = "none";
  document.getElementById("logoutBtn").style.display = "none";
  showToast("Admin logged out");
});

// ======================
// Post a message
// ======================
postBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  const image = imageInput.value.trim();
  if(!name || !message) return showToast("Name and message required");

  const newPost = {
    name: isAdmin ? "OWNER" : name,
    message,
    image: image || "",
    owner: isAdmin,
    timestamp: Date.now()
  };

  db.ref("posts").push(newPost);
  messageInput.value = "";
  imageInput.value = "";
});

// ======================
// Display posts
// ======================
db.ref("posts").on("value", snapshot => {
  postsDiv.innerHTML = "";
  const posts = snapshot.val();
  if(!posts) return;
  Object.keys(posts).forEach(key => {
    const p = posts[key];
    const postEl = document.createElement("div");
    postEl.classList.add("post");

    let html = `<span class="owner">${p.owner ? "OWNER" : p.name}</span>: ${p.message}`;
    if(p.image) html += `<img src="${p.image}">`;

    html += `<div class="post-meta">${new Date(p.timestamp).toLocaleTimeString()}</div>`;

    if(isAdmin) {
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "⋮";
      deleteBtn.style.position = "absolute";
      deleteBtn.style.right = "6px";
      deleteBtn.style.top = "6px";
      deleteBtn.addEventListener("click", () => db.ref("posts/" + key).remove());
      postEl.appendChild(deleteBtn);
    }

    postEl.innerHTML = html + (postEl.innerHTML);
    postsDiv.appendChild(postEl);
  });
});

// ======================
// Report Bug
// ======================
reportBugBtn.addEventListener("click", () => {
  submitBugBtn.style.display = "block";
  postBtn.style.display = "none";
  postsDiv.style.display = "none";
});

submitBugBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if(!name || !message) return showToast("Name and message required");

  db.ref("bugs").push({ name, message, timestamp: Date.now() });
  showToast("Bug reported");
  submitBugBtn.style.display = "none";
  postBtn.style.display = "block";
  postsDiv.style.display = "block";
  nameInput.value = "";
  messageInput.value = "";
});

// See bugs (Admin)
seeBugsBtn.addEventListener("click", () => {
  bugsModal.classList.remove("hidden");
  postsDiv.style.display = "none";
  db.ref("bugs").once("value").then(snapshot => {
    const bugsList = document.getElementById("bugsList");
    bugsList.innerHTML = "";
    const bugs = snapshot.val();
    if(!bugs) return;
    Object.values(bugs).forEach(b => {
      const el = document.createElement("div");
      el.classList.add("post");
      el.innerHTML = `<span class="owner">${b.name}</span>: ${b.message}`;
      bugsList.appendChild(el);
    });
  });
});

closeBugsModal.addEventListener("click", () => {
  bugsModal.classList.add("hidden");
  postsDiv.style.display = "block";
});

// Info modal
infoBtn.addEventListener("click", () => infoModal.classList.remove("hidden"));
closeInfoModal.addEventListener("click", () => infoModal.classList.add("hidden"));

// ======================
// Online Counter (simple random for demo)
// ======================
setInterval(() => {
  onlineCountEl.textContent = "Online: " + (Math.floor(Math.random() * 10) + 1);
}, 3000);
