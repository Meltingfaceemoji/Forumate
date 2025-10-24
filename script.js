// =======================
// Firebase config
// =======================
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

// =======================
// Elements
// =======================
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const closeSidebar = document.getElementById("closeSidebar");
const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const closeAdminModal = document.getElementById("closeAdminModal");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminUser = document.getElementById("adminUser");
const adminPass = document.getElementById("adminPass");
const logoutBtn = document.getElementById("logoutBtn");
const seeBugsBtn = document.getElementById("seeBugsBtn");
const postsDiv = document.getElementById("posts");
const postBtn = document.getElementById("postBtn");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");
const reportBugBtn = document.getElementById("reportBugBtn");
const submitBugBtn = document.getElementById("submitBugBtn");
const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const closeInfoModal = document.getElementById("closeInfoModal");
const bugsModal = document.getElementById("bugsModal");
const closeBugsModal = document.getElementById("closeBugsModal");
const bugsList = document.getElementById("bugsList");
const onlineCountDiv = document.getElementById("onlineCount");
const versionLabel = document.getElementById("versionLabel");
const updateCheck = document.getElementById("updateCheck");
const lastUpdated = document.getElementById("lastUpdated");
const userNumberSpan = document.getElementById("userNumber");

// =======================
// State
// =======================
let isAdmin = false;
let version = "7.4";
let currentUserId = localStorage.getItem("forumateUserId");

if(!currentUserId){
    const newUserRef = db.ref("users").push();
    currentUserId = newUserRef.key;
    const randCounter = Math.floor(Math.random()*9999)+1;
    newUserRef.set({counter: randCounter});
    localStorage.setItem("forumateUserId", currentUserId);
}
db.ref("users/"+currentUserId).once("value").then(s=>{
    const counter = s.val()?.counter || 0;
    userNumberSpan.textContent = counter;
});

// =======================
// Sidebar Toggle
// =======================
menuBtn.addEventListener("click",()=>{sidebar.classList.add("open");});
closeSidebar.addEventListener("click",()=>{sidebar.classList.remove("open");});

// =======================
// Admin Login
// =======================
adminBtn.addEventListener("click",()=>{adminModal.classList.remove("hidden");});
closeAdminModal.addEventListener("click",()=>{adminModal.classList.add("hidden");});

adminLoginBtn.addEventListener("click",()=>{
    if(adminUser.value==="melting" && adminPass.value==="melting"){
        isAdmin=true;
        logoutBtn.style.display="block";
        seeBugsBtn.style.display="block";
        adminModal.classList.add("hidden");
        showToast("Logged in as OWNER");
        fetchPosts(); // refresh posts to show OWNER in red
    } else {
        showToast("Incorrect credentials");
    }
});

logoutBtn.addEventListener("click",()=>{
    isAdmin=false;
    logoutBtn.style.display="none";
    seeBugsBtn.style.display="none";
    showToast("Logged out");
    fetchPosts(); // refresh posts to remove OWNER style
});

// =======================
// Info Modal
// =======================
infoBtn.addEventListener("click",()=>{infoModal.classList.remove("hidden");});
closeInfoModal.addEventListener("click",()=>{infoModal.classList.add("hidden");});

// =======================
// Posting
// =======================
postBtn.addEventListener("click",submitPost);
messageInput.addEventListener("keydown",e=>{
    if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); submitPost(); }
});

function submitPost(){
    const name = nameInput.value.trim() || "Anonymous";
    const message = messageInput.value.trim();
    const image = imageInput.value.trim();
    if(!message && !image){ showToast("Message or image required"); return; }
    const postRef = db.ref("posts").push();
    postRef.set({
        name: name,
        message: message,
        image: image,
        timestamp: Date.now(),
        userId: currentUserId
    });
    messageInput.value="";
    imageInput.value="";
}

// =======================
// Fetch posts
// =======================
function fetchPosts(){
    db.ref("posts").on("value",snapshot=>{
        postsDiv.innerHTML="";
        const posts=snapshot.val()||{};
        Object.keys(posts).sort((a,b)=>posts[a].timestamp - posts[b].timestamp).forEach(key=>{
            const p=posts[key];
            const div=document.createElement("div");
            div.className="post glass";
            let displayName = p.name;
            if(isAdmin && p.name.toLowerCase() === "melting"){
                displayName = "<span class='owner'>OWNER</span>";
            }
            div.innerHTML = `<div class="post-meta">${displayName}</div>` +
                            (p.image?`<img src="${p.image}"/>`:'') +
                            `<p>${p.message}</p>`;
            postsDiv.appendChild(div);
        });
    });
}
fetchPosts();

// =======================
// Bug Reporting
// =======================
reportBugBtn.addEventListener("click",()=>{
    sidebar.classList.remove("open");
    submitBugBtn.style.display="block";
    postBtn.style.display="none";
    postsDiv.style.display="none";
});
submitBugBtn.addEventListener("click",()=>{
    const bugMsg = messageInput.value.trim();
    if(!bugMsg){ showToast("Enter a bug message"); return; }
    db.ref("bugs").push({message:bugMsg,timestamp:Date.now()});
    showToast("Bug submitted");
    messageInput.value="";
    submitBugBtn.style.display="none";
    postBtn.style.display="block";
    postsDiv.style.display="flex";
});

// =======================
// See Bugs (Admin)
// =======================
seeBugsBtn.addEventListener("click",()=>{
    if(!isAdmin) return;
    bugsModal.classList.remove("hidden");
    db.ref("bugs").once("value").then(snapshot=>{
        bugsList.innerHTML="";
        const bugs = snapshot.val()||{};
        Object.keys(bugs).sort((a,b)=>bugs[a].timestamp - bugs[b].timestamp).forEach(k=>{
            const d=bugs[k];
            const div=document.createElement("div");
            div.className="post glass";
            div.textContent=d.message;
            bugsList.appendChild(div);
        });
    });
});
closeBugsModal.addEventListener("click",()=>{bugsModal.classList.add("hidden");});

// =======================
// Toast
// =======================
function showToast(msg){
    const t=document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(()=>{t.classList.remove("show");},2500);
}

// =======================
// Online Count
// =======================
setInterval(()=>{
    db.ref("posts").once("value").then(snapshot=>{
        onlineCountDiv.textContent = "Online: "+Object.keys(snapshot.val()||{}).length;
    });
},3000);

// =======================
// Version & Update
// =======================
versionLabel.textContent=version;
lastUpdated.textContent="Last updated: 2025-10-24";

fetch("https://raw.githubusercontent.com/Meltingfaceemoji/Forumate/main/index.html")
.then(r=>r.text())
.then(txt=>{
    updateCheck.textContent = txt.includes(`v${version}`)?"Up to date":"Update available";
})
.catch(()=>{updateCheck.textContent="Check failed";});
