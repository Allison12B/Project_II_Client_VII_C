function getAdminIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("adminId"); 
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
                <li><a href="../profileHome.html?adminId=${getAdminIdFromUrl()}">Home</a></li>
                <li><a href="../restrictedUser/restrictedUserAdmin.html?adminId=${getAdminIdFromUrl()}">Restricted Users</a></li>
                <li><a href="../playListViews/playListAdmin.html?adminId=${getAdminIdFromUrl()}">PlayLists</a></li>
                <li><a href="../videoViews/videoAdmin.html?adminId=${getAdminIdFromUrl()}">Videos</a></li>
            </ul>
        </nav>
    `;
    document.body.insertAdjacentHTML("afterbegin", navbar);
});
