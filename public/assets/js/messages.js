const socket = io();
const messageList = document.getElementById('messages');
const dmList = document.getElementById('dms');
const sendBtn = document.getElementById('sendbtn');
const input = document.getElementById('inputmessage');
const userProfile = document.getElementById('profilecontrol');
const userPfp = document.getElementById('userpfp');
const userName = document.getElementById('usertext');

const addModalBtn = document.getElementById('addfriend');
const addFriendModal = document.getElementById('addfriendmodal');

let dmRoom;

async function changeDM(btn) {
    const oldBtn = document.querySelector('.enableddm');
    const btnArray = Array.from(btn.childNodes);
    const dm = btnArray[1].innerText;
    const rooms = await fetch('/loadRooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toDM: dm }),
    })
    const newDMRoom = await rooms.text();
    dmRoom = newDMRoom;
    socket.emit("change_dm", newDMRoom);
    oldBtn.classList.remove('enableddm');
    btn.classList.add('enableddm');

    const messageDiv = document.getElementById('messages');
    const response = await fetch('/loadMessages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: dmRoom, dmName: dm }),
    })
    let loadedMsgs;
    try {
        loadedMsgs = await response.json();
    }
    catch (err) {
        loadedMsgs = [];
    }
    if (loadedMsgs.length > 0) {
        messageDiv.innerHTML = '';
        loadedMsgs.forEach(msg => {
            const newMsg = createMessage(msg);
            messageList.appendChild(newMsg);
        });
    }
    else {
        messageDiv.innerHTML = '<div class="nodms">No prior DMs. Start a new conversation!</div>';

    }
    messageList.scrollTop = messageList.scrollHeight;
}
window.onload = async () => {
    const user = await fetch('/getUser', {
        method: 'GET',
    });
    const loadedUser = await user.json();
    userPfp.setAttribute('src', `pfps/${loadedUser.picURL}`);
    userName.textContent = loadedUser.username;

    const response = await fetch('/loadDMs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    const loadedDMs = await response.json();
    await loadedDMs.forEach((dm, index) => {
        const newDm = createDm(dm, index);
        dmList.appendChild(newDm);
    })


    const firstDm = document.getElementById('0');
    if (firstDm) {
        firstDm.classList.add('enableddm');
        firstDm.click();
    }
    // set focus to index 0
}

sendBtn.addEventListener('click', async () => {
    if (input.value && dmRoom) {
        const newMsg = String(input.value);
        input.value = '';
        await fetch('/newMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'msg': newMsg, 'room': dmRoom }),
        });
    }
});

input.addEventListener('keypress', async (event) => {
    if (event.key == "Enter" && input.value && dmRoom) {
        const newMsg = String(input.value);
        input.value = '';
        await fetch('/newMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 'msg': newMsg, 'room': dmRoom }),
        });
    }
})

socket.on("dm_message", (msg, pfp) => {
    if (messageList.firstChild) {
        if (messageList.firstChild.classList.contains('nodms')) {
            messageList.removeChild(messageList.firstChild);
        }
    }
    const info = { msg, pfp }
    const newMsg = createMessage(info);
    messageList.appendChild(newMsg);
    messageList.scrollTop = messageList.scrollHeight;
})

function createMessage(col) {
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
    pfp.setAttribute('src', `pfps/${col.pfp}`);

    msgTextWrap.appendChild(msgUsername);
    msgTextWrap.appendChild(msgText);
    newMsg.appendChild(pfp);
    newMsg.appendChild(msgTextWrap);

    msgUsername.textContent = col.msg.username;
    msgText.textContent = col.msg.message;
    return newMsg;
}

function createDm(user, index) {
    const dmButton = document.createElement('button');
    const dmPfp = document.createElement('img');
    const dmTextWrapper = document.createElement('div');
    const dmName = document.createElement('div');
    const dmStatus = document.createElement('div');
    const statusPic = document.createElement('div');

    dmButton.classList.add('profile');
    dmPfp.classList.add("pfp");
    dmTextWrapper.classList.add('dmtext');
    dmName.classList.add('dmname');
    dmStatus.classList.add('dmstatus');
    statusPic.classList.add('statuspic');

    dmButton.setAttribute('onclick', 'changeDM(this)');
    dmButton.setAttribute('id', index);
    dmPfp.setAttribute('src', `pfps/${user.picURL}`);
    dmPfp.setAttribute('alt', 'Profile Picture');

    dmStatus.appendChild(statusPic);
    dmTextWrapper.appendChild(dmName);
    dmTextWrapper.appendChild(dmStatus);
    dmButton.appendChild(dmPfp);
    dmButton.appendChild(dmTextWrapper);

    dmName.textContent = user.username;
    return dmButton;
}


let addModalEnabled = false;
addModalBtn.addEventListener('click', () => {
    if (!addModalEnabled) {
        addFriendModal.style.opacity = '1';
        addModalEnabled = true;
    }
    else {
        addFriendModal.style.opacity = '0';
        addModalEnabled = false;
    }
})