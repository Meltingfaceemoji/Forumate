// ---------------- Firebase config ----------------
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

// ---------------- Elements ----------------
const postsDiv = document.getElementById("posts");
const postBtn = document.getElementById("postBtn");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const imageInput = document.getElementById("imageInput");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

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

const reportBugBtn = document.getElementById("reportBugBtn");
const seeBugsBtn = document.getElementById("seeBugsBtn");
const bugsModal = document.getElementById("bugsModal");
const bugsList = document.getElementById("bugsList");
const closeBugsModal = document.getElementById("closeBugsModal");

const messageReportsModal = document.getElementById("messageReportsModal");
const messageReportsList = document.getElementById("messageReportsList");
const closeMessageReportsModal = document.getElementById("closeMessageReportsModal");

const toastDiv = document.getElementById("toast");

// ---------------- State ----------------
let isAdmin = false;
const ADMIN_USER = "melting";
const ADMIN_PASS = "melting";
const VERSION = "7.4 - Simplicity";
let currentUserID = Math.floor(Math.random() * 10000);

// ---------------- Functions ----------------
function showToast(msg){
    toastDiv.textContent = msg;
    toastDiv.classList.add("show");
    setTimeout(()=>toastDiv.classList.remove("show"),2000);
}

// ---------------- Sidebar ----------------
menuBtn.addEventListener("click", () => sidebar.classList.toggle("open"));

function renderSidebar(){
    sidebar.innerHTML = "";
    let buttons = [];

    // Normal user buttons
    if(!isAdmin){
        buttons = [
            {text:"Report Bug", id:"reportBugBtn"},
            {text:`Name: Guest #${currentUserID}`, id:null},
            {text:"Info", id:"infoBtn"},
            {text:"Admin Login", id:"adminBtn"},
            {text:`Version: ${VERSION}`, id:null}
        ];
    } else {
        buttons = [
            {text:"View Bug Reports", id:"seeBugsBtn"},
            {text:"Concurrent Online", id:null},
            {text:"Reset Chat", id:"resetChatBtn"},
            {text:"See Message Reports", id:"seeMessageReportsBtn"},
            {text:"Report Bug", id:"reportBugBtn"},
            {text:`Name: OWNER`, id:null},
            {text:"Info", id:"infoBtn"},
            {text:"Admin Logout", id:"adminBtn"},
            {text:`Version: ${VERSION}`, id:null}
        ];
    }

    buttons.forEach(btn=>{
        if(btn.id){
            const b = document.createElement("button");
            b.className="btn glass";
            b.id=btn.id;
            b.textContent = btn.text;
            sidebar.appendChild(b);
        } else {
            const span = document.createElement("div");
            span.textContent=btn.text;
            span.style.color = isAdmin ? "red":"#004080";
            span.style.textAlign="center";
            sidebar.appendChild(span);
        }
    });
}

// ---------------- Admin Login ----------------
adminBtn.addEventListener("click", ()=>{
    if(!isAdmin){
        adminModal.classList.remove("hidden");
    } else {
        // Logout
        isAdmin=false;
        usernameCircle.textContent = `Guest #${currentUserID}`;
        renderSidebar();
        showToast("Admin logged out!");
    }
});
closeAdminModal.addEventListener("click", ()=> adminModal.classList.add("hidden"));

adminLoginBtn.addEventListener("click", ()=>{
    if(adminUser.value.toLowerCase()===ADMIN_USER && adminPass.value===ADMIN_PASS){
        isAdmin = true;
        adminModal.classList.add("hidden");
        showToast("Admin logged in!");
        renderSidebar();
    } else showToast("Invalid credentials!");
});

// ---------------- Info Modal ----------------
infoBtn?.addEventListener("click", ()=> infoModal.classList.remove("hidden"));
closeInfoModal?.addEventListener("click", ()=> infoModal.classList.add("hidden"));
userNumberSpan.textContent=currentUserID;

// ---------------- Bugs ----------------
reportBugBtn?.addEventListener("click", ()=>{
    let bug = prompt("Describe the bug:");
    if(bug){
        const bugRef=db.ref("bugs").push();
        bugRef.set({bug, timestamp: Date.now()});
        showToast("Bug reported!");
    }
});
seeBugsBtn?.addEventListener("click", ()=> bugsModal.classList.remove("hidden"));
closeBugsModal?.addEventListener("click", ()=> bugsModal.classList.add("hidden"));

// ---------------- Message Reports (Admin) ----------------
const seeMessageReportsBtn = document.getElementById("seeMessageReportsBtn");
seeMessageReportsBtn?.addEventListener("click", ()=>{
    messageReportsModal.classList.remove("hidden");
});
closeMessageReportsModal?.addEventListener("click", ()=> messageReportsModal.classList.add("hidden"));

// ---------------- Reset Chat ----------------
resetChatBtn?.addEventListener("click", ()=>{
    if(!isAdmin) return;
    if(confirm("Delete all posts?")){
        db.ref("posts").remove();
        showToast("Chat reset!");
    }
});

// ---------------- Posts ----------------
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
    imageInput.value="";
});

// ---------------- Display Posts ----------------
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

            // Mini-menu
            const menuBtn = document.createElement("div");
            menuBtn.textContent="⋮";
            menuBtn.style.position="absolute";
            menuBtn.style.top="5px";
            menuBtn.style.right="5px";
            menuBtn.style.cursor="pointer";
            menuBtn.addEventListener("click", ()=>{
                const miniMenu = document.createElement("div");
                miniMenu.classList.add("mini-menu");

                const copyBtn = document.createElement("button");
                copyBtn.textContent="Copy";
                copyBtn.classList.add("btn","glass");
                copyBtn.addEventListener("click", ()=> navigator.clipboard.writeText(p.message));

                const reportBtn = document.createElement("button");
                reportBtn.textContent="Report";
                reportBtn.classList.add("btn","glass");
                reportBtn.addEventListener("click", ()=>{
                    const r = db.ref("messageReports").push();
                    r.set({message: p.message, user: p.name, timestamp: Date.now()});
                    showToast("Message reported!");
                });

                miniMenu.appendChild(copyBtn);
                miniMenu.appendChild(reportBtn);

                if(isAdmin){
                    const delBtn = document.createElement("button");
                    delBtn.textContent="Delete";
                    delBtn.classList.add("btn","glass");
                    delBtn.addEventListener("click", ()=> db.ref("posts/"+key).remove());

                    const pinBtn = document.createElement("button");
                    pinBtn.textContent="Pin";
                    pinBtn.classList.add("btn","glass");
                    // pin functionality can be added later
                    miniMenu.appendChild(delBtn);
                    miniMenu.appendChild(pinBtn);
                }

                postEl.appendChild(miniMenu);
            });

            postEl.appendChild(menuBtn);
            postsDiv.appendChild(postEl);
        });
    });
}
displayPosts();
renderSidebar();
