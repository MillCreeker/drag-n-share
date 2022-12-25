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
DNS.modes = {
    overview: 'overview',
    fileUpload: 'file-upload',
    textOnly: 'text-only'
}

DNS.textOnlyMode = false;
DNS.mode = DNS.modes.overview;


DNS.init = function() {
    if (DNS.getCookieValue('readCookieDisclaimer') === 'true') {
        const banner = document.getElementById('cookie-banner');
        banner.style.display = 'none';
    }
};

DNS.getCookieValue = function(cookie) {
    const cookies = document.cookie;
    const regex = new RegExp(`${cookie}=([\\w]+)[,;]`,'g');
    const matches = regex.exec(cookies);

    if (matches == null || matches.length < 2) {
        return undefined;
    }

    return matches[1];
};



dropContainer.ondragenter = function(evt) {
    evt.preventDefault();

    DNS.ondDragEnter();
};
DNS.ondDragEnter = function() {
    const dropContainer = document.getElementById("dropContainer");

    const children = dropContainer.getElementsByTagName('*');
    for (let i in children) {
        try {
            const child = children[i];
            child.style['pointer-events'] = 'none';
            child.style['-moz-drag-over'] = 'none';
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

    DNS.onDragLeave();
};
DNS.onDragLeave = function() {    
    const dropContainer = document.getElementById("dropContainer");

    const children = dropContainer.getElementsByTagName('*');
    for (let i in children) {
        try {
            const child = children[i];
            child.style['pointer-events'] = '';
            child.style['-moz-drag-over'] = '';
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
};

dropContainer.ondrop = function(evt) {
    evt.preventDefault();

    DNS.onDragLeave();
    DNS.changeMode(DNS.modes.fileUpload);
    
    const files = evt.dataTransfer.files;
    const dT = new DataTransfer();

    for (let i=0; i<files.length; i++) {
        const file = files[i];
        dT.items.add(file);
    }

    const workableFiles = dT.files;
    DNS.processFiles(workableFiles);
};

fileUpload.oninput = function(evt) {
    DNS.changeMode(DNS.modes.fileUpload);
    
    const files = evt.currentTarget.files;
    const dT = new DataTransfer();

    for (let i=0; i<files.length; i++) {
        const file = files[i];
        dT.items.add(file);
    }

    const workableFiles = dT.files;
    DNS.processFiles(workableFiles);
};

DNS.processFiles = function(files) {
    const fileList = document.getElementById('file-upload-list');
    for (let i=0; i<files.length; i++) {
        const file = files[i];

        const listItem = DNS.createListItemForFile(`file-${i}`, file);

        fileList.appendChild(listItem);
    }
};

DNS.createListItemForFile = function(id, file) {
    const listItem = document.createElement('li');
    listItem.id = id;
    listItem.innerHTML = DNS.shortenName(file.name, 10);
    listItem.title = file.name;

    return listItem;
};

DNS.shortenName = function(name, length) {
    if (length < 8) {
        return name;
    }

    const nameSplit = name.split('.');
    if (nameSplit.length != 2) {
        return name;
    }

    const fileName = nameSplit[0];
    const fileExt = nameSplit[1];
    
    let shortName = `${fileName}.${fileExt}`;
    if (shortName.length <= length) {
        return shortName;
    }

    shortName = fileName.substring(0,length-(fileExt.length+3));
    shortName += `...${fileExt}`;
    return shortName;
};


DNS.changeMode = function(mode) {
    if (mode === DNS.mode) {
        return;
    }

    const displayOptions = {
        'overview': [
            'btn-upload',
            'btn-text-only',
            'btn-access'
        ],
        'file-upload': [
            'text-name',
            'file-upload-list',
            'btn-submit',
            'btn-overview'
        ],
        'text-only': [
            'text-name',
            'data-textarea',
            'btn-submit',
            'btn-overview'
        ]
    };

    const list = document.getElementById('dropList');
    for (let i=0; i<list.children.length; i++) {
        const elem = list.children[i];
        elem.style.display = 'none';
    }

    for (let i in displayOptions[mode]) {
        const elem = displayOptions[mode][i];
        document.getElementById(`list-${elem}`).style
            .display = 'block';
    }


    const listTextName = document.getElementById('list-text-name');
    if (listTextName.style.display === 'block') {
        const textName = document.getElementById('text-name');
        textName.focus();
    }

    DNS.mode = mode;
};


DNS.pasteClipBoardTextToElement = function (element) {
    navigator.clipboard.readText()
        .then(text => {
            const elem = document.getElementById(element);
            elem.innerHTML = text;
        })
        .catch(err => {
            console.error('Failed to read clipboard contents: ', err);
        });
};


DNS.submitData = function() {
    // TODO
};


DNS.accessData = function() {
    window.open('https://drag-n-share.com/access_data');
};



DNS.closeCookieBanner = function() {
    const banner = document.getElementById('cookie-banner');
    banner.style.display = 'none';

    const today = new Date();
    const curYear = today.getFullYear();
    const nextYear = new Date(today.setFullYear(curYear + 1));

    document.cookie = `readCookieDisclaimer=true, expires=${nextYear}`;
};








DNS.init();