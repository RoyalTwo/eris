async function postMessage(input, dmRoom) {
    const newMsg = String(input.value);
    input.value = '';
    await fetch('/newMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 'msg': newMsg, 'room': dmRoom }),
    });
}

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

async function renderDMs(selectedDMIndex) {
    const response = await fetch('/loadDMs');
    const loadedDMs = await response.json();
    await loadedDMs.forEach((dm, index) => {
        const newDm = createDm(dm, index);
        if (selectedDMIndex) {
            if (index == selectedDMIndex) {
                newDm.classList.add('enableddm');
            }
        }
        dmList.appendChild(newDm);
    });
}