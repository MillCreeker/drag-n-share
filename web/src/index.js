const DNS = {};

DNS.colors = {
    'cultured': '#F1EDEE',
    'black-olive': '#403D39',
    'eerie-black-l': '#242220',
    'eerie-black-d': '#1A1A1A',
    'lemon': '#FEF919',
    'orange-yellow': '#F3B700',
    'burnt-orange': '#C45609'
};

DNS.ggs_ggseal = function() {
    window.open("https://my.greengeeks.com/seal/","_blank")
};

DNS.openMenu = function() {
    document.getElementById("menu").style.width = "100%";
};

DNS.closeNav = function() {
    document.getElementById("menu").style.width = "0%";
};



dropContainer.ondragenter = function(evt) {
    evt.preventDefault();

    const dropContainer = document.getElementById("dropContainer");

    const children = dropContainer.getElementsByTagName('*');
    for (i in children) {
        try {
            const child = children[i];
            child.style['pointer-events'] = 'none';
            child.style.opacity = 0.8;
        } catch (e) {}
    }

    dropContainer.style['border-color'] = DNS.colors.lemon;
    dropContainer.style['background-image'] = "url('./img/logo_outlines_lemon.png')";
};

dropContainer.ondragleave = function(evt) {
    evt.preventDefault();

    if (DNS.isInContainer(evt)) {
        console.log('e');
        return;
    }
    
    const dropContainer = document.getElementById("dropContainer");

    const children = dropContainer.getElementsByTagName('*');
    for (i in children) {
        try {
            const child = children[i];
            child.style['pointer-events'] = '';
            child.style.opacity = 1;
        } catch (e) {}
    }

    dropContainer.style['border-color'] = DNS.colors["eerie-black-d"];
    dropContainer.style['background-image'] = "url('./img/logo_outlines.png')";
};

DNS.isInContainer = function(evt) {
    let isInContainer = true;
    const rect = document.getElementById("dropContainer").getBoundingClientRect();
    
    if (evt.clientY < rect.top ||
        evt.clientY >= rect.bottom ||
        evt.clientX < rect.left ||
        evt.clientX >= rect.right) {
        isInContainer = false
    }

    return isInContainer;
};

dropContainer.ondragover = function(evt) {
    evt.preventDefault();
}

dropContainer.ondrop = function(evt) {
    evt.preventDefault();
    // // pretty simple -- but not for IE :(
    // fileInput.files = evt.dataTransfer.files;
    
    // // If you want to use some of the dropped files
    // const dT = new DataTransfer();
    // dT.items.add(evt.dataTransfer.files[0]);
    // dT.items.add(evt.dataTransfer.files[3]);
    // fileInput.files = dT.files;
};