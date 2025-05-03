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
function queryGetVideoByPlaylist(id) {
    const query =  `
        {
            getVideoByPlayList(id: "${id}") {
                _id
                name
                description
            }
        }
    `;
    return query;
}

function queryVideosByAdminID() {
    const query = `
        {
            getAllVideos {
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
        console.log("GraphQL result:", result);

        if (result.errors) {
            console.error('GraphQL errors:', result.errors);
            return;
        }

        const data = result.data;

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
        tableBody.innerHTML = ""; // Limpiar la tabla antes de agregar nuevos datos

        videos.forEach((video, index) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <th scope="row">${index + 1}</th>
                <td>${video.name}</td>
                <td>${video.url}</td>
                <td>${video.description}</td>
                <td>
                    <a href="" class="btn btn-warning btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm" onclick="deleteVideo('${video._id}')">Delete</button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error obteniendo los videos:", error);
    }
}

//Create a new video
async function createVideo() {
    const token = sessionStorage.getItem('jwtToken');
    const name = document.getElementById('videoName').value;
    const url = document.getElementById('videoUrl').value;
    const description = document.getElementById('descriptionVideo').value;
    const playLists = []; 
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

//Get admin´s playlist in checkbox
async function getAdminPlaylists() {
    const adminId = getAdminIdFromUrl(); 
    if (!adminId) {
        console.error("Admin ID not found in URL");
        return;
    }

    try {
        console.log("Entró en el método de cargar los checkboxes de playlists");
        
        const response = await fetch(`http://localhost:3001/api/playList/adminUser/${adminId}`);
        const playlists = await response.json();
        
        console.log("Playlists desde el cliente: ", playlists);

        if (!Array.isArray(playlists) || playlists.length === 0) {
            console.log("No playlists found for this admin");
            return;
        }

        const container = document.getElementById("playlistsContainer");
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

//Get playlist´s videos
async function getVideosByPlaylist() {
    const playListId = getplaylistIdFromUrl(); 

    if (!playListId) {
        console.error("Error: Playlist ID is required.");
        return;
    }

    try {
        
        const response = await fetch(`http://localhost:3001/api/video/playList/${playListId}`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Error fetching videos.");
        }

        const videos = await response.json();
        console.log("Videos for playlist:", videos);

        const tableBody = document.getElementById("videosRestrictedUserTableBody");
        tableBody.innerHTML = ""; 

        if (videos.length === 0) {
            console.warn("No videos found for this playlist");
            return;
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


// Calls the function when the page load
function isVideoAdminPage() {
    return window.location.pathname.includes("videoAdmin.html");
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

    if (isVideoEditAdminPage()) {
        getAdminPlaylists(); 
    }

    if (isVideoRestrictedUserPage()) {
        getVideosByPlaylist(); 
    }
});
