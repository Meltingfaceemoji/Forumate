// ---------------- Firebase Init ----------------
const firebaseConfig = {
  apiKey: "AIzaSyA1pylg4PQS_hXhKiLvYcdgh5jbLYhME40",
  authDomain: "html-test-forum.firebaseapp.com",
  databaseURL: "https://html-test-forum-default-rtdb.firebaseio.com",
  projectId: "html-test-forum",
  storageBucket: "html-test-forum.appspot.com",
  messagingSenderId: "781492084495",
  appId: "1:781492084495:web:309c83e29024ba321ba87a",
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ---------------- Globals ----------------
let currentUser = { name: '', admin: false };

// ---------------- UI Elements ----------------
const chatContainer = document.querySelector('.chat-container');
const messageInput = document.querySelector('.composer input[type="text"]');
const postButton = document.querySelector('.composer button');
const sidebar = document.querySelector('.sidebar');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const adminBtn = document.getElementById('adminBtn');
const adminLoginPopup = document.getElementById('adminLoginPopup');
const loginUserInput = document.getElementById('loginUser');
const loginPassInput = document.getElementById('loginPass');
const loginSubmitBtn = document.getElementById('loginSubmit');
const versionEl = document.querySelector('.version');

// ---------------- Sidebar toggle ----------------
hamburgerBtn.addEventListener('click', () => {
  sidebar.classList.toggle('show');
});

// ---------------- Admin login ----------------
adminBtn.addEventListener('click', () => {
  adminLoginPopup.classList.add('show');
});

document.getElementById('adminClose').addEventListener('click', () => {
  adminLoginPopup.classList.remove('show');
});

loginSubmitBtn.addEventListener('click', () => {
  const username = loginUserInput.value.trim();
  const password = loginPassInput.value.trim();
  if(username === 'Admin' && password === 'MELTING') {
    currentUser = { name: 'OWNER', admin: true };
    adminLoginPopup.classList.remove('show');
    alert('Admin logged in!');
    renderSidebar(); // show admin options
  } else {
    alert('Invalid credentials');
  }
});

// ---------------- Post message ----------------
postButton.addEventListener('click', () => {
  const text = messageInput.value.trim();
  if(!text) return;

  const messageData = {
    name: currentUser.name || 'Anonymous',
    content: text,
    timestamp: Date.now(),
    admin: currentUser.admin || false
  };

  const newMsgRef = db.ref('messages').push();
  newMsgRef.set(messageData);
  messageInput.value = '';
});

// ---------------- Listen for messages ----------------
db.ref('messages').on('child_added', snapshot => {
  const msg = snapshot.val();
  addMessageToDOM(msg, snapshot.key);
});

// ---------------- Add message to DOM ----------------
function addMessageToDOM(msg, id) {
  const div = document.createElement('div');
  div.classList.add('chat-message');
  const nameEl = document.createElement('strong');
  nameEl.textContent = msg.name + (msg.admin ? ' (Admin)' : '');
  nameEl.style.color = msg.admin ? 'red' : '#0078FF';
  div.appendChild(nameEl);

  const contentEl = document.createElement('span');
  contentEl.textContent = ': ' + msg.content;
  div.appendChild(contentEl);

  // 3-dot menu
  const menu = document.createElement('div');
  menu.classList.add('message-menu');
  menu.innerHTML = '⋮';
  const menuContent = document.createElement('div');
  menuContent.classList.add('message-menu-content');

  // Normal user options
  const copyBtn = document.createElement('button');
  copyBtn.textContent = 'Copy';
  copyBtn.onclick = () => navigator.clipboard.writeText(msg.content);
  menuContent.appendChild(copyBtn);

  const reportBtn = document.createElement('button');
  reportBtn.textContent = 'Report';
  reportBtn.onclick = () => alert('Reported!');
  menuContent.appendChild(reportBtn);

  // Admin extra options
  if(currentUser.admin) {
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => db.ref('messages/' + id).remove();
    menuContent.appendChild(deleteBtn);

    const pinBtn = document.createElement('button');
    pinBtn.textContent = 'Pin';
    pinBtn.onclick = () => alert('Pinned!');
    menuContent.appendChild(pinBtn);
  }

  menu.appendChild(menuContent);
  div.appendChild(menu);
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ---------------- Render Sidebar ----------------
function renderSidebar() {
  sidebar.innerHTML = ''; // clear
  if(currentUser.admin) {
    ['View Bug Reports','Concurrent Online','Reset Chat'].forEach(text => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.onclick = () => alert(text);
      sidebar.appendChild(btn);
    });
  } else {
    ['Report Bugs','Info','Version'].forEach(text => {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.onclick = () => alert(text);
      sidebar.appendChild(btn);
    });
  }

  // Bottom: always show version and admin login button
  const bottomContainer = document.createElement('div');
  bottomContainer.style.marginTop = 'auto';
  bottomContainer.style.display = 'flex';
  bottomContainer.style.flexDirection = 'column';
  bottomContainer.style.gap = '10px';

  const versionBtn = document.createElement('button');
  versionBtn.textContent = versionEl.textContent;
  bottomContainer.appendChild(versionBtn);

  if(!currentUser.admin) bottomContainer.appendChild(adminBtn);

  sidebar.appendChild(bottomContainer);
}

// ---------------- Init ----------------
renderSidebar();