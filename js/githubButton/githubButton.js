import "https://kit.fontawesome.com/1a245537f8.js";

function loadGithubButtons() {
    let h = document.querySelectorAll('gitprof');
    h.forEach(function(element) {
        let usenan = element.attributes["username"].value;
        element.style.fontFamily = '"Font Awesome 6 Brands", sans-serif';
        if(element.attributes["size"] != undefined) {
            element.style.fontSize = element.attributes["size"].value;
        }  else {
            element.style.fontSize = "25px";
        }
        element.style.cursor = "pointer";
        element.innerHTML = "\uf092";
        document.onselectstart = function() {
            return false;
        }
        element.onclick = function() {
            window.location.href = "https://github.com/"+usenan;
        }
    });
    console.log(`${h.length} Github Buttons are created.`);
}

function loadYoutubeButtons() {
    let h = document.querySelectorAll('ytprof');
    h.forEach(function(element) {
        let usenan = element.attributes["userid"].value;
        element.style.fontFamily = '"Font Awesome 6 Brands", sans-serif';
        if(element.attributes["size"] != undefined) {
            element.style.fontSize = element.attributes["size"].value;
        } else {
            element.style.fontSize = "25px";
        }
        element.style.cursor = "pointer";
        element.innerHTML = "\uf167";
        document.onselectstart = function() {
            return false;
        }
        element.onclick = function() {
            window.location.href = "https://youtube.com/c/"+usenan;
        }
    });
    console.log(`${h.length} Youtube Buttons are created.`);
}

function load() {
    loadGithubButtons();
    loadYoutubeButtons();
}

load();