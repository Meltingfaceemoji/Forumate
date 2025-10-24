// ======================
// Firebase Config
// ======================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
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
// Elements
// ======================
const postsEl = document.getElementById("posts");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const postBtn = document.getElementById("postBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("closeSidebar");
const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const closeAdminModal = document.getElementById("closeAdminModal");
const adminUser = document.getElementById("adminUser");
const adminPass = document.getElementById("adminPass");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const reportBugBtn = document.getElementById("reportBugBtn");
const submitBugBtn = document.getElementById("submitBugBtn");
const seeBugsBtn = document.getElementById("seeBugsBtn");
const bugsModal = document.getElementById("bugsModal");
const bugsList = document.getElementById("bugsList");
const closeBugsModal = document.getElementById("closeBugsModal");
const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const closeInfoModal = document.getElementById("closeInfoModal");
const userNumberEl = document.getElementById("userNumber");
const toast = document.getElementById("toast");
const versionLabel = document.getElementById("versionLabel");
const updateCheck = document.getElementById("updateCheck");
const logoutBtn = document.getElementById("logoutBtn");

let adminLoggedIn = false;

// ======================
// Utilities
// ======================
function showToast(msg){
  toast.innerText = msg;
  toast.classList.add("show");
  setTimeout(()=>toast.classList.remove("show"),2000);
}

// Generate or retrieve device #number
let deviceNumber = localStorage.getItem("deviceNumber");
if(!deviceNumber){
  deviceNumber = Math.floor(Math.random()*9000)+1000;
  localStorage.setItem("deviceNumber",deviceNumber);
}
userNumberEl.innerText = deviceNumber;

// ======================
// Sidebar
// ======================
menuBtn.addEventListener("click",()=>sidebar.classList.add("open"));
closeSidebar.addEventListener("click",()=>sidebar.classList.remove("open"));

// ======================
// Admin Login
// ======================
adminBtn.addEventListener("click",()=>adminModal.classList.remove("hidden"));
closeAdminModal.addEventListener("click",()=>adminModal.classList.add("hidden"));

adminLoginBtn.addEventListener("click",()=>{
  if(adminUser.value.toLowerCase() === "melting" && adminPass.value === "melting"){
    adminLoggedIn = true;
    showToast("Admin Logged In");
    seeBugsBtn.style.display = "block";
    logoutBtn.style.display = "block";
    adminModal.classList.add("hidden");
  }else{
    showToast("Incorrect credentials");
  }
});

logoutBtn.addEventListener("click",()=>{
  adminLoggedIn = false;
  seeBugsBtn.style.display = "none";
  logoutBtn.style.display = "none";
  showToast("Admin Logged Out");
});

// ======================
// Post messages
// ======================
postBtn.addEventListener("click",()=>{
  const name = nameInput.value.trim() || "Anonymous";
  const msg = messageInput.value.trim();
  const img = imageInput.value.trim();
  if(!msg) return;
  const postData = {
    name: name,
    message: msg,
    img: img || "",
    owner: adminLoggedIn && name.toLowerCase()==="melting"?true:false,
    timestamp: Date.now(),
    device: deviceNumber
  };
  db.ref("posts").push(postData);
  messageInput.value = "";
  imageInput.value = "";
});

// ======================
// Display posts
// ======================
db.ref("posts").on("value",snapshot=>{
  postsEl.innerHTML="";
  snapshot.forEach(snap=>{
    const data = snap.val();
    const div = document.createElement("div");
    div.className="post glass";
    div.innerHTML=`<span class="owner">${data.owner?data.name+" (OWNER)":data.name}</span>: ${data.message}`;
    if(data.img) div.innerHTML+=`<br><img src="${data.img}">`;
    postsEl.appendChild(div);
  });
});

// ======================
// Bug Reports
// ======================
reportBugBtn.addEventListener("click",()=>{
  submitBugBtn.style.display="block";
  messageInput.value="";
  nameInput.value="";
  sidebar.classList.remove("open");
  showToast("Enter bug in composer then press Submit Bug");
});

submitBugBtn.addEventListener("click",()=>{
  const bugMsg = messageInput.value.trim();
  if(!bugMsg) return;
  db.ref("bugs").push({message:bugMsg,timestamp:Date.now()});
  messageInput.value="";
  submitBugBtn.style.display="none";
  showToast("Bug submitted");
});

// See bug reports
seeBugsBtn.addEventListener("click",()=>{
  bugsModal.classList.remove("hidden");
  db.ref("bugs").once("value",snapshot=>{
    bugsList.innerHTML="";
    snapshot.forEach(snap=>{
      const data = snap.val();
      const div = document.createElement("div");
      div.className="glass";
      div.style.margin="4px 0";
      div.textContent=data.message;
      bugsList.appendChild(div);
    });
  });
});
closeBugsModal.addEventListener("click",()=>bugsModal.classList.add("hidden"));

// ======================
// Info Modal
// ======================
infoBtn.addEventListener("click",()=>infoModal.classList.remove("hidden"));
closeInfoModal.addEventListener("click",()=>infoModal.classList.add("hidden"));

// ======================
// Online Counter
// ======================
let onlineUsers = 1; // simplified demo
document.getElementById("onlineCount").innerText="Online: "+onlineUsers;

// ======================
// Update Checker (simplified)
// ======================
fetch("https://raw.githubusercontent.com/Meltingfaceemoji/Forumate/main/index.html")
.then(r=>r.text())
.then(t=>{
  if(t.includes("7.4")) updateCheck.innerText="Up-to-date";
  else updateCheck.innerText="Update available";
});
