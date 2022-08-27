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

    // Refactor - value shouldn't come from query selecting, store in variable 

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

    renderMessages(dm);
}

async function renderMessages(dm) {
    // could refactor to store dmRoom on session?
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
        // refactor to not be hardcoded!
        messageDiv.innerHTML = '<div class="nodms">No prior DMs. Start a new conversation!</div>';

    }
    messageList.scrollTop = messageList.scrollHeight;
}

window.onload = async () => {
    const user = await fetch('/getUser');
    const loadedUser = await user.json();
    userPfp.setAttribute('src', `pfps/${loadedUser.picURL}`);
    userName.textContent = loadedUser.username;

    await renderDMs();

    const firstDm = document.getElementById('0');
    if (firstDm) {
        firstDm.classList.add('enableddm');
        firstDm.click();
    }
}

sendBtn.addEventListener('click', async () => {
    if (input.value && dmRoom) postMessage(input, dmRoom);
});

input.addEventListener('keypress', async (event) => {
    if (event.key == "Enter" && input.value && dmRoom) postMessage(input, dmRoom);
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

let addModalEnabled = false;
addModalBtn.addEventListener('click', () => {
    // hide and unhide requestmodal too if shown
    if (!addModalEnabled) {
        addFriendModal.style.height = '175px';
        addFriendModal.style.opacity = '1';
        addModalEnabled = true;
    }
    else {
        addFriendModal.style.height = '0px';
        addFriendModal.style.opacity = '0';
        addModalEnabled = false;
    }
})