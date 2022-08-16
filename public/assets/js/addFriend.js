const addBtn = document.getElementById('addfriendbutton');
const addInput = document.getElementById('addfriendinput');

addBtn.addEventListener('click', async () => {
    if (!addInput.value) return;
    const userToAdd = String(addInput.value);

    const postReq = await fetch('/addFriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: userToAdd }),
    });
    const didAdd = await postReq.text();

    // load dms again
    const selectedDM = (document.querySelector('.enableddm'));
    const selectedDMIndex = selectedDM.getAttribute('id');
    dmList.innerHTML = '';
    const response = await fetch('/loadDMs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    });
    const loadedDMs = await response.json();
    await loadedDMs.forEach((dm, index) => {
        const newDm = createDm(dm, index);
        if (index == selectedDMIndex) {
            newDm.classList.add('enableddm');
        }
        dmList.appendChild(newDm);
    });

})