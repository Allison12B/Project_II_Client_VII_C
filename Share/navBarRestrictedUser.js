function getAdminIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("adminId"); 
}

function getRestrictedUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("profileId"); 
}

document.addEventListener("DOMContentLoaded", function () {
    const navbar = `
        <nav>
            <input type="checkbox" id="check">
            <label for="check" class="checkbtn">
                <i class="fas fa-bars"></i>
            </label>
            <label class="logo">KidsTube</label>
            <ul>
                <li><a href="../profileHome.html?adminId=${getAdminIdFromUrl()}&profileId=${getRestrictedUserIdFromUrl()}">Home</a></li>
                <li><a href="../restrictedUser/playlistRestrictedUser.html?adminId=${getAdminIdFromUrl()}&profileId=${getRestrictedUserIdFromUrl()}">Playlist</a></li>
            </ul>
        </nav>
    `;
    document.body.insertAdjacentHTML("afterbegin", navbar);
});
