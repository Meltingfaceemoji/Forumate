// ---------------------- Firebase config ----------------------
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

// ---------------------- Elements ----------------------
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

const infoBtn = document.getElementById("infoBtn");
const infoModal = document.getElementById("infoModal");
const resetChatBtn = document.getElementById("resetChatBtn");
const closeInfoModal = document.getElementById("closeInfoModal");
const userNumberSpan = document.getElementById("userNumber");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const reportBugBtn = document.getElementById("reportBugBtn");
const seeBugsBtn = document.getElementById("seeBugsBtn");
const bugsModal = document.getElementById("bugsModal");
const bugsList = document.getElementById("bugsList");
const closeBugsModal = document.getElementById("closeBugsModal");

const usernameCircle = document.getElementById("usernameCircle");
const toastDiv = document.getElementById("toast");

// ---------------------- State ----------------------
let isAdmin = false;
const ADMIN_USER = "melting";
const ADMIN_PASS = "melting";
let currentUserID = Math.floor(Math.random()*10000);

// Show ID in top circle
usernameCircle.textContent = `Guest #${currentUserID}`;

// ---------------------- Functions ----------------------
function showToast(msg){
    toastDiv.textContent = msg;
    toastDiv.classList.add("show");
    setTimeout(()=>toastDiv.classList.remove("show"),2000);
}

// ---------------------- Sidebar toggle ----------------------
menuBtn.addEventListener("click", ()=>{
    sidebar.classList.toggle("open");
});

// ---------------------- Admin Login ----------------------
adminBtn.addEventListener("click", ()=> adminModal.classList.remove("hidden"));
closeAdminModal.addEventListener("click", ()=> adminModal.classList.add("hidden"));

adminLoginBtn.addEventListener("click", ()=>{
    if(adminUser.value.toLowerCase()===ADMIN_USER && adminPass.value===ADMIN_PASS){
        isAdmin = true;
        adminModal.classList.add("hidden");
        showToast("Admin logged in!");
        document.querySelectorAll('.admin-only').forEach(el => el.style.display='flex');
        usernameCircle.textContent = "OWNER";
        usernameCircle.style.color = "red";
    } else showToast("Invalid credentials!");
});

// ---------------------- Info modal ----------------------
infoBtn.addEventListener("click", ()=>{
    infoModal.classList.remove("hidden");
    userNumberSpan.textContent = currentUserID;
});
closeInfoModal.addEventListener("click", ()=> infoModal.classList.add("hidden"));

// ---------------------- Bugs modal ----------------------
reportBugBtn.addEventListener("click", ()=>{
    let bug = prompt("Describe the bug:");
    if(bug){
        const bugRef = db.ref("bugs").push();
        bugRef.set({bug, timestamp: Date.now()});
        showToast("Bug reported!");
    }
});
seeBugsBtn.addEventListener("click", ()=>{
    bugsModal.classList.remove("hidden");
});
closeBugsModal.addEventListener("click", ()=> bugsModal.classList.add("hidden"));

// ---------------------- Reset Chat ----------------------
resetChatBtn.addEventListener("click", ()=>{
    if(!isAdmin) return;
    if(confirm("Delete all posts?")){
        db.ref("posts").remove();
        showToast("Chat reset!");
    }
});

// ---------------------- Posting ----------------------
postBtn.addEventListener("click", ()=>{
    const name = nameInput.value.trim();
    const msg = messageInput.value.trim();
    const img = imageInput.value.trim();
    if(!name || !msg) return;

    const postRef = db.ref("posts").push();
    postRef.set({
        name: isAdmin ? "OWNER" : name,
        message: msg,
        image: img||null,
        timestamp: Date.now(),
        owner: isAdmin
    });

    messageInput.value="";
    imageInput.value="";
});

// ---------------------- Display posts ----------------------
function displayPosts(){
    db.ref("posts").on("value", snap=>{
        postsDiv.innerHTML="";
        const posts = snap.val();
        if(!posts) return;

        Object.keys(posts).sort((a,b)=>posts[b].timestamp - posts[a].timestamp).forEach(key=>{
            const p = posts[key];
            const postEl = document.createElement("div");
            postEl.classList.add("post","glass");

            let ownerColor = p.owner ? 'red' : '#004080';
            let ownerName = p.owner ? 'OWNER' : p.name;

            postEl.innerHTML = `<span style="color:${ownerColor}; font-weight:bold;">${ownerName}</span>: ${p.message}`;
            if(p.image) postEl.innerHTML += `<img src="${p.image}" style="max-width:100%; margin-top:4px;">`;

            // Mini-menu for admin
            if(isAdmin){
                const menuBtn = document.createElement("div");
                menuBtn.textContent="⋮";
                menuBtn.style.position="absolute";
                menuBtn.style.top="5px";
                menuBtn.style.right="5px";
                menuBtn.style.cursor="pointer";
                menuBtn.addEventListener("click", ()=>{
                    const miniMenu = document.createElement("div");
                    miniMenu.classList.add("mini-menu");
                    const deleteBtn = document.createElement("button");
                    deleteBtn.textContent="Delete";
                    deleteBtn.classList.add("btn","glass");
                    deleteBtn.addEventListener("click", ()=>{
                        db.ref("posts/"+key).remove();
                        miniMenu.remove();
                    });
                    miniMenu.appendChild(deleteBtn);
                    postEl.appendChild(miniMenu);
                });
                postEl.appendChild(menuBtn);
            }

            postsDiv.appendChild(postEl);
        });
    });
}
displayPosts();
