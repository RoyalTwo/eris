const addBtn = document.getElementById('addfriendbutton');
const addInput = document.getElementById('addfriendinput');

socket.on("update_dms", async () => {
    console.log('Updating DMs...');
    const selectedDM = (document.querySelector('.enableddm'));
    const selectedDMIndex = selectedDM.getAttribute('id');
    dmList.innerHTML = '';

    renderDMs(selectedDMIndex);
})

addBtn.addEventListener('click', async () => {
    if (!addInput.value) return;
    const userToAdd = String(addInput.value);

    socket.emit("add_friend", userToAdd);
})