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
}

dropContainer.ondrop = function(evt) {
    evt.preventDefault();

    DNS.changeMode(DNS.modes.fileUpload);
    // // pretty simple -- but not for IE :(
    // fileInput.files = evt.dataTransfer.files;
    
    // // If you want to use some of the dropped files
    // const dT = new DataTransfer();
    // dT.items.add(evt.dataTransfer.files[0]);
    // dT.items.add(evt.dataTransfer.files[3]);
    // fileInput.files = dT.files;
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
            'btn-overview'
        ],
        'text-only': [
            'text-name',
            'data-textarea',
            'btn-overview'
        ]
    };

    var mode = mode
    Object.keys(displayOptions).forEach(key => {
        const arr = displayOptions[key];
        for (let i in arr) {
            const elem = `list-${arr[i]}`;
            document.getElementById(elem).style
                .display = key === mode ? 'block' : 'none';
        }
    });


    const listTextName = document.getElementById('list-text-name');
    if (listTextName.style.display === 'block') {
        const textName = document.getElementById('text-name');
        textName.focus();
    }

    DNS.mode = mode;
};

DNS.switchTextOnlyMode = function() {
    const textOnlyDisplay = [
        'list-name',
        'list-textarea'
    ];
    const fileUploadDisplay = [
        'list-btn-upload'
    ];

    const isTextOnly = !DNS.textOnlyMode;
    const btnTextOnly = document.getElementById('btn-text-only');
    btnTextOnly.innerHTML = isTextOnly ? '&#x1F5D8; Overview' : '&#x1F5D8; Text only';

    for (let i in textOnlyDisplay) {
        const elem = textOnlyDisplay[i];
        document
            .getElementById(elem)
            .style
            .display = isTextOnly ? 'block' : 'none';
    }
    for (let i in fileUploadDisplay) {
        const elem = fileUploadDisplay[i];
        document
            .getElementById(elem)
            .style
            .display = isTextOnly ? 'none' : 'block';
    }

    btnTextOnly.blur();

    if (isTextOnly === true) {
        const textName = document.getElementById('text-name');
        textName.focus();
    }

    DNS.textOnlyMode = isTextOnly;
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