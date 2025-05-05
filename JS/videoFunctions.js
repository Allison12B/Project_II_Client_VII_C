const token = sessionStorage.getItem('jwtToken');
if (!token) {
    window.location.href = "index.html";
}

//Find the params adminId in the url
function getAdminIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("adminId"); 
}

//Find the params profileId
function getRestrictedUserIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("profileId"); 
}

//Find the params playlistId
function getplaylistIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("playlistId"); 
}

//Find the params video
function getvideoIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("videoId"); 
}

function redirectToVideoEdit(param) {
    try {
        window.location.href = `../videoViews/videoEditAdmin.html?adminId=${getAdminIdFromUrl()}&videoId=${param}`;
    }catch (error) {
        console.log("No se puede redirigir a editar video: ", error)
    }
}

function redirectToVideoSearch(param) {
    try {
        window.location.href = `../videoViews/videoEditAdmin.html?adminId=${getAdminIdFromUrl()}&videoId=${param}`;
    }catch (error) {
        console.log("No se puede redirigir a editar video: ", error)
    }
}


//Go back to the playListAdmin.html
function goBackWithAdminId() {
    const adminId = getAdminIdFromUrl();
    if (adminId) {
        window.location.href = `../videoViews/videoAdmin.html?adminId=${adminId}`;
    }
}

//Set a buttom to redirect to crate video page
function createVideoButton() {
    const adminId = getAdminIdFromUrl();
    if(adminId != null) {
        const createButtonContainer = document.getElementById("createVideoButton");
        createButtonContainer.innerHTML = `
            <a href="../videoViews/videoCreateAdmin.html?adminId=${getAdminIdFromUrl()}" class="btn btn-success mt-3 mb-3">Crear</a>
        `;
    }
}

// Query of graphQL API

function queryVideosByAdminID() {
    const query = `
        {
            getAllVideos {
                _id
                description
                name
                url
            }
        }
    `;
    return query;
}

function queryPlaylistByCheckBox() {
    const query = `
        {
            getPlayListByAdminUser {
            _id
            name
            }
        }
    `;
    return query;
}

function queryGetVideoById(id) {
    const query =  `
        {
            getVideoById(id: "${id}") {
                _id
                description
                name
                url
                playLists {
                    _id
                }
            }
        }
    `;
    return query;
}

function querySearchVideo(text) {
    const playlistId = getplaylistIdFromUrl();
    const restrictedUserId = getRestrictedUserIdFromUrl();

    if (!playlistId || !restrictedUserId) {
        throw new Error("playlistId y restrictedUserId son requeridos");
    }

    return `
        {
            searchVideo(playlistId: "${playlistId}", restrictedUserId: "${restrictedUserId}", text: "${text}") {
                _id
                description
                name
                url
            }
        }
    `;
}



// Return the admin´s restricted users from the GraphQL API
async function fetchGraphQL(query) {
    const token = sessionStorage.getItem('jwtToken');

    try {

        const response = await fetch("http://localhost:4000/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query })
        });

        const result = await response.json();

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            return;
        }

        const data = result.data;
        console.log("GraphQL result:", data);
        return data;

    } catch (error) {
        console.error("Error getting data:", error);
        alert("Error to get data");
    }
}

// Get all the videos with graphQL
async function getVideos() {
    try {
        const videoData = await fetchGraphQL( queryVideosByAdminID());
        const videos = videoData.getAllVideos;

        const tableBody = document.getElementById("videosTableBody");
        tableBody.innerHTML = ""; 

        videos.forEach((video, index) => {
            const row = document.createElement("tr");
            
            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${video.name}</td>
                <td>${video.url}</td>
                <td>${video.description}</td>
                <td>
                    <button class="btn btn-primary btn-sm edit-btn" data-id="${video._id}" onclick="redirectToVideoEdit('${video._id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn" data-id="${video._id}" onclick="deleteVideo('${video._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error obteniendo los videos:", error);
    }
}

//Get admin´s playlist in checkbox with graphQl
async function getAdminPlaylists() {
    try {
        const playlistData = await fetchGraphQL(queryPlaylistByCheckBox());
        const playlists = playlistData.getPlayListByAdminUser;

        console.log("Playlists desde el cliente: ", playlists);

        if (!Array.isArray(playlists) || playlists.length === 0) {
            console.log("No playlists found for this admin");
        }

        const container = document.getElementById("playlistContainer");
        container.innerHTML = ""; 

        playlists.forEach(playlist => {
            const playlistDiv = document.createElement("div");
            playlistDiv.classList.add("form-check");

            playlistDiv.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${playlist._id}" id="playlist-${playlist._id}">
                <label class="form-check-label" for="playlist-${playlist._id}">${playlist.name}</label>
            `;

            container.appendChild(playlistDiv);
        });

    } catch (error) {
        console.error("Error to getting playlists:", error);
    }
}


//Search a video

async function searchVideo() {
    try {
        const searchText = document.getElementById('textSearch').value;

        // Verifica que los parámetros existan
        const playlistId = getplaylistIdFromUrl();
        const restrictedUserId = getRestrictedUserIdFromUrl();

        if (!playlistId || !restrictedUserId) {
            alert("Faltan parámetros en la URL.");
            return;
        }

        const query = querySearchVideo(searchText);
        const response = await fetchGraphQL(query);
        const videos = response.searchVideo;

        const tableBody = document.getElementById("videosRestrictedUserTableBody");
        tableBody.innerHTML = "";

        if (videos.length === 0) {
            console.warn("No videos found for this playlist");
        }

        videos.forEach((video, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${video.name}</td>
                <td>${video.url}</td>
                <td>${video.description || 'No description'}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching videos:", error);
    }
}



//Get a video by ID to edit graphql
async function getInfoVideoById() {
    try {
        const videoData = await fetchGraphQL(queryGetVideoById(getvideoIdFromUrl()));
        const video = videoData.getVideoById;
        console.log("video: ", video)
        let playlist = [];
        playlist = video.playLists.map(user => user._id);

        document.getElementById('videoName').value = video.name;
        document.getElementById('videoUrl').value = video.url;
        document.getElementById('descriptionVideo').value = video.description;

        checkPlaylistByVideo(playlist);
    }catch (error){
        console.error("No possible load data in playlist edit páge:", error);
    }
}

//Mark all checkboxes with restricted users from a playlist
async function checkPlaylistByVideo(selectedIds = []) {
    try {
        const playlistData =  await fetchGraphQL(queryPlaylistByCheckBox());
        const playlist = playlistData.getPlayListByAdminUser;

        const container = document.getElementById("playlistContainer");
        container.innerHTML = ""; 

        playlist.forEach(user => {
            const isChecked = selectedIds.includes(user._id) ? "checked" : "";

            const userDiv = document.createElement("div");
            userDiv.classList.add("form-check");

            userDiv.innerHTML = `
                <input class="form-check-input" type="checkbox" value="${user._id}" id="user-${user._id}" ${isChecked}>
                <label class="form-check-label" for="user-${user._id}">${user.name}</label>
            `;

            container.appendChild(userDiv);
        });

    } catch (error) {
        console.error("Error al obtener los usuarios restringidos:", error);
    }
}

// Función para obtener los usuarios seleccionados
function getSelectedPlaylist() {
    const selectedPlaylist = [];

    const checkboxes = document.querySelectorAll(".form-check-input:checked");

    checkboxes.forEach(checkbox => {
        selectedPlaylist.push(checkbox.value);
    });

    console.log("Playlist seleccionados:", selectedPlaylist);
    return selectedPlaylist;
}

//Create a new video
async function createVideo() {
    const token = sessionStorage.getItem('jwtToken');
    const name = document.getElementById('videoName').value;
    const url = document.getElementById('videoUrl').value;
    const description = document.getElementById('descriptionVideo').value;
    const playLists = getSelectedPlaylist(); 
    const admin = getAdminIdFromUrl();

    
    if (!name || !url) {
        alert('Please, complete the data');
        return;
    }

    
    const newVideo = {
        name: name,
        url: url,
        description: description,
        playLists: playLists,
        adminId: admin
    };

    try {
    
        const response = await fetch('http://localhost:3001/api/video', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(newVideo),
        });

        if (!response.ok) {
            
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
            return;
        }

    
        const data = await response.json();
        alert(`Video was create. Video Id: ${data._id}`);
        goBackWithAdminId();
    
    } catch (error) {
        console.error('Error creating video:', error);
        alert('Error creating videovideo.');
    }
}

//Delete a video
async function deleteVideo(videoId) {
    const token = sessionStorage.getItem('jwtToken');

    try {
        
        const response = await fetch(`http://localhost:3001/api/video/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
        });

        if (response.status === 404) {
        
            const errorData = await response.json();
            alert(`Error: ${errorData.error}`);
            return;
        }

        if (response.status === 204) {
            
            alert('video deleted');

            goBackWithAdminId(); 
        }
    } catch (error) {
        console.error('Error deleting the video:', error);
        alert('Error deleting the video.');
    }
}




// Calls the function when the page load
function isVideoAdminPage() {
    return window.location.pathname.includes("videoAdmin.html");
}

function isVideoCreateAdminPage() {
    return window.location.pathname.includes("videoCreateAdmin.html");
}

function isVideoEditAdminPage() {
    return window.location.pathname.includes("videoEditAdmin.html");
}

function isVideoRestrictedUserPage() {
    return window.location.pathname.includes("videosRestrictedUser.html");
}

document.addEventListener("DOMContentLoaded", function() {
    
    if (isVideoAdminPage()) {
        getVideos(); 
        createVideoButton();
    }

    if(isVideoCreateAdminPage()) {
        getInfoVideoById() 
        getAdminPlaylists()
    }

    if (isVideoEditAdminPage()) {
        getInfoVideoById()
        getAdminPlaylists(); 
    }

    if (isVideoRestrictedUserPage()) {
        searchVideo(); 
    }
});
