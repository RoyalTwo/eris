const socket = io();
const messageList = document.getElementById('messages');
const dmList = document.getElementById('dms');
const sendBtn = document.getElementById('sendbtn');
let dmName;

async function changeDM(btn) {
    const oldDm = document.querySelector('.enableddm');
    const btnArray = Array.from(btn.childNodes);
    const dm = btnArray[3].innerText;
    dmName = dm;
    if (oldDm) {
        socket.emit("change_dm", dm, oldDm.innerText);
        oldDm.classList.remove('enableddm');
    }
    btn.classList.add('enableddm');
    const messageDiv = document.getElementById('messages');
    messageDiv.innerHTML = '';
    // send req to server for messages
    // for each message, create new message div
    const response = await fetch('/loadMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: dmName }),
    })
    const loadedMsgs = await response.json();
    loadedMsgs.forEach(msg => {
        const newMsg = createMessage(msg);
        messageList.appendChild(newMsg);
    });
}
window.onload = () => {
    const firstDm = document.getElementById('0');
    firstDm.classList.add('enableddm');
    dmName = firstDm.innerText;
    socket.emit("change_dm", dmName, null);

    firstDm.click();
}

sendBtn.addEventListener('click', async () => {
    const input = document.getElementById('inputmessage');
    const newMsg = input.value;
    await fetch('/newMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'msg': newMsg, 'room': dmName }),
    });
})

socket.on("dm_message", (msg) => {
    const newMsg = createMessage(msg);
    messageList.appendChild(newMsg);
})

function createMessage(msg) {
    const newMsg = document.createElement('div');
    const pfp = document.createElement('img');
    const msgTextWrap = document.createElement('div');
    const msgUsername = document.createElement('div');
    const msgText = document.createElement('div');


    newMsg.classList.add('messagerecieve');
    pfp.classList.add('pfp');
    msgTextWrap.classList.add('textinfo');
    msgUsername.classList.add('username');
    msgText.classList.add('messagetext');
    pfp.setAttribute('alt', 'Profile Picture');
    pfp.setAttribute('src', 'assets/1.png');

    msgTextWrap.appendChild(msgUsername);
    msgTextWrap.appendChild(msgText);
    newMsg.appendChild(pfp);
    newMsg.appendChild(msgTextWrap);

    msgUsername.textContent = msg.username;
    msgText.textContent = msg.message;
    return newMsg;
}