const addBtn = document.getElementById('addfriendbutton');
const addInput = document.getElementById('addfriendinput');
const reqFriendModal = document.getElementById('reqfriendmodal');
const reqAdd = document.getElementById('acceptfriend');
const reqDeny = document.getElementById('rejectfriend');

socket.on("update_dms", async () => {
    console.log('Updating DMs...');
    let selectedDMIndex;
    const selectedDM = (document.querySelector('.enableddm'));
    selectedDMIndex = (selectedDM && selectedDM != null) ?
        document.querySelector('.enableddm') :
        '0';
    renderDMs(selectedDMIndex);
})

socket.on("friend_request", (requestUser) => {
    // display modal with friend request
    reqFriendModal.style.opacity = '1';
    reqFriendModal.style.display = "flex";
    console.log('client to add');
    // add event listeners
    reqAdd.addEventListener('click', () => {
        // emit "friend_response"
        socket.emit("friend_response", requestUser);
        reqFriendModal.style.opacity = '0';
    })
    reqDeny.addEventListener('click', () => {
        socket.emit('friend_response', false);
        reqFriendModal.style.opacity = '0';
    })
})

addBtn.addEventListener('click', async () => {
    if (!addInput.value) return;
    const userToAdd = String(addInput.value);

    socket.emit("add_friend", userToAdd);
    // say request sent soon?
    addFriendModal.style.height = '0px';
    addFriendModal.style.opacity = '0';
})