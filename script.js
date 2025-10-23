// ------------------ Firebase ------------------
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

// ------------------ Elements ------------------
const sidebar = document.getElementById('sidebar');
const menuButton = document.getElementById('menuButton');
const closeSidebar = document.getElementById('closeSidebar');
const adminPopup = document.getElementById('adminPopup');
const adminButton = document.getElementById('adminButton');
const closeAdminPopup = document.getElementById('closeAdminPopup');
const loginButton = document.getElementById('loginButton');
const infoButton = document.getElementById('infoButton');
const closeInfo = document.getElementById('closeInfo');
const infoPopup = document.getElementById('infoPopup');
const sendButton = document.getElementById('sendButton');
const nameInput = document.getElementById('nameInput');
const messageInput = document.getElementById('messageInput');
const messages = document.getElementById('messages');
const lastNameKey = "forumateLastName";

// Admin constants
const ADMIN_USERNAME = "melting";
const ADMIN_PASSWORD = "melting";
let isAdmin = false;

// ------------------ LocalStorage for last used name ------------------
if(localStorage.getItem(lastNameKey)) nameInput.value = localStorage.getItem(lastNameKey);

// ------------------ Sidebar ------------------
menuButton.addEventListener('click', () => {
  sidebar.classList.add('visible'); 
  closeSidebar.style.display = 'block';
});
closeSidebar.addEventListener('click', () => {
  sidebar.classList.remove('visible'); 
  closeSidebar.style.display = 'none';
});

// ------------------ Admin Login ------------------
adminButton.addEventListener('click', () => adminPopup.classList.remove('hidden'));
closeAdminPopup.addEventListener('click', () => adminPopup.classList.add('hidden'));
loginButton.addEventListener('click', () => {
  const username = document.getElementById('adminUser').value.trim().toLowerCase();
  const password = document.getElementById('adminPass').value.trim();
  if(username === ADMIN_USERNAME && password === ADMIN_PASSWORD){
    alert("Admin logged in!"); 
    adminPopup.classList.add('hidden'); 
    isAdmin = true;
  } else alert("Wrong credentials!");
});

// ------------------ Info Popup ------------------
infoButton.addEventListener('click', ()=> infoPopup.classList.remove('hidden'));
closeInfo.addEventListener('click', ()=> infoPopup.classList.add('hidden'));

// Generate a random user # (for simplicity)
const userHash = Math.floor(Math.random()*9999+1);
document.getElementById('userHash').textContent = `User #: ${userHash}`;

// ------------------ Send Message ------------------
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', e => { if(e.key==='Enter') sendMessage(); });

function sendMessage(){
  const name = nameInput.value.trim();
  const msg = messageInput.value.trim();
  if(!name || !msg) return;

  localStorage.setItem(lastNameKey, name);

  const timestamp = Date.now();
  const ipHash = getIPHash();
  const counter = getUserCounter(name, ipHash);

  const displayName = `${name} #${counter}`;
  const msgData = { name: displayName, msg, owner: isAdmin?'OWNER':false, timestamp, ipHash };
  db.ref('messages/'+timestamp).set(msgData);

  messageInput.value = '';
}

// ------------------ Load Messages ------------------
db.ref('messages').on('value', snapshot => {
  messages.innerHTML = '';
  const data = snapshot.val();
  if(!data) return;
  Object.values(data).sort((a,b)=>a.timestamp-b.timestamp).forEach(m=>{
    const div=document.createElement('div');
    div.className='message';
    if(m.owner) div.classList.add('owner');
    div.innerHTML=`<b>${m.owner?'OWNER':m.name}:</b> ${m.msg}`;
    messages.appendChild(div);
  });
  messages.scrollTop = messages.scrollHeight;
});

// ------------------ Helper functions ------------------
const ipCounter = {}; // Keeps track of counters per IPHash

function getIPHash(){
  // For simplicity, use localStorage as a pseudo IP
  if(!localStorage.getItem("ipHash")) localStorage.setItem("ipHash", Math.floor(Math.random()*100000));
  return localStorage.getItem("ipHash");
}

function getUserCounter(name, ipHash){
  if(!ipCounter[ipHash]) ipCounter[ipHash] = {};
  if(!ipCounter[ipHash][name]) ipCounter[ipHash][name] = Object.keys(ipCounter[ipHash]).length+1;
  return ipCounter[ipHash][name];
}

// ------------------ Version + Update Checker ------------------
document.getElementById('updateStatus').textContent = "(Up to date)";
