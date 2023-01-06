const DNS = {};

DNS.COLORS = {
    'cultured': '#F1EDEE',
    'black-olive': '#403D39',
    'eerie-black-l': '#242220',
    'eerie-black-d': '#1A1A1A',
    'lemon': '#FEF919',
    'orange-yellow': '#F3B700',
    'burnt-orange': '#C45609',
    'maximun-red': '#D62828',
    'middle-green': '#488B49'
};
DNS.MODES = {
    overview: 'overview',
    fileUpload: 'file-upload',
    textOnly: 'text-only'
}
DNS.MAX_FILES = 4;

DNS.files = [];
DNS.selectedFile = null;

DNS.mode = DNS.MODES.overview;


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
            DNS.disableElement(child.id);
        } catch (e) {}
    }

    if (DNS.files.length >= DNS.MAX_FILES) {
        return;
    }

    dropContainer.style['border-color'] = DNS.COLORS.lemon;
    dropContainer.style['background-image'] = "url('./img/logo_outlines_lemon.png')";
};

dropContainer.ondragleave = function(evt) {
    evt.preventDefault();
    if (DNS.isInContainer(evt)) {
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
            DNS.enableElement(child.id);
        } catch (e) {}
    }

    dropContainer.style['border-color'] = DNS.COLORS["eerie-black-d"];
    dropContainer.style['background-image'] = "url('./img/logo_outlines.png')";

    if (DNS.files.length >= DNS.MAX_FILES) {
        this.disableElement('file-upload-add');
    }
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

    DNS.closeDeleteDialogForFile();
};

dropContainer.ondrop = function(evt) {
    evt.preventDefault();

    DNS.onDragLeave();
    DNS.changeMode(DNS.MODES.fileUpload);
    
    const files = evt.dataTransfer.files;
    const dT = new DataTransfer();

    for (let i=0; i<files.length; i++) {
        const file = files[i];
        dT.items.add(file);
    }

    const workableFiles = dT.files;
    DNS.processFiles(workableFiles);
};

fileUpload.onclick = function() {
    this.value = null;
};
fileUpload.oninput = function(evt) {
    DNS.addFiles(evt);
};
fileAdd.onclick = function() {
    this.value = null;
};
fileAdd.oninput = function(evt) {
    DNS.addFiles(evt);
};
DNS.addFiles = function(evt) {
    DNS.changeMode(DNS.MODES.fileUpload);
    
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
        if (DNS.files.length == DNS.MAX_FILES-1) {
            DNS.disableElement('file-upload-add');
        }
        if (DNS.files.length == DNS.MAX_FILES) {
            window.alert(`Maximum number of files (${DNS.MAX_FILES}) exceeded`);
            DNS.disableElement('file-upload-add');
            break;
        }

        const file = files[i];
        const number = DNS.files.length;
        const listItem = DNS.createListItemForFile(`file-${number}`, file);

        fileList.insertBefore(listItem, fileList.children[fileList.children.length-1]);
        DNS.files.push(file);
    }

    DNS.focusTitle();

    DNS.checkGoButtonEnabled();
};

DNS.createListItemForFile = function(id, file) {
    const listItem = document.createElement('li');
    listItem.id = id;
    listItem.classList.add('file-list-item');
    listItem.title = file.name;

    const img = document.createElement('img');
    img.alt = 'file';
    img.src = '../img/file-white.png';
    img.style.width = '4vh';
    listItem.appendChild(img);

    const text = document.createElement('p');
    text.innerHTML = DNS.shortenName(file.name, 12);
    listItem.appendChild(text);

    listItem.onclick = function(evt) {
        DNS.showDeleteDialogForFile(evt);
    };

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

DNS.isFileSelected = false;
DNS.showDeleteDialogForFile = function(evt) {
    const msgBox = document.getElementById('msg-box-delete');
    if (msgBox.style.display != 'none') {
        DNS.closeDeleteDialogForFile();
        return;
    };

    const glassPlate = document.createElement('div');
    glassPlate.classList.add('glass-plate');
    glassPlate.id = 'glass-plate';
    glassPlate.onclick = function() {
        DNS.closeDeleteDialogForFile();
    };
    document.body.appendChild(glassPlate);

    const id = evt.currentTarget.id;
    DNS.selectedFile = id;

    DNS.showElement('msg-box-delete');

    DNS.isFileSelected = true;
};

DNS.closeDeleteDialogForFile = function() {
    DNS.hideElement('msg-box-delete');
    const plate = document.getElementById('glass-plate');
    if (plate != null) {
        document.body.removeChild(plate);
    }

    DNS.focusTitle();

    DNS.selectedFile = null;
    DNS.isFileSelected = false;

    DNS.checkGoButtonEnabled();
};

DNS.deleteFile = function() {
    if (DNS.selectedFile == null) {
        DNS.closeDeleteDialogForFile();
        return;
    }

    const regex = new RegExp('file-(\\d+)');
    const match = regex.exec(DNS.selectedFile);
    if (match.length != 2) {
        DNS.closeDeleteDialogForFile();
        return;
    }
    const index = match[1];
    
    const fileList = document.getElementById('file-upload-list');
    const deletedFile = document.getElementById(DNS.selectedFile);
    fileList.removeChild(deletedFile);

    DNS.files.splice(index, 1);
    
    for (let i=index; i<fileList.children.length-1; i++) {
        const elem = fileList.children[i];
        elem.id = `file-${i}`;
    }

    if (DNS.files.length <= DNS.MAX_FILES) {
        DNS.enableElement('file-upload-add');
    }

    DNS.closeDeleteDialogForFile();
};

DNS.showElement = function(element) {
    const elem = document.getElementById(element);
    elem.style.display = 'block';
};
DNS.hideElement = function(element) {
    const elem = document.getElementById(element);
    elem.style.display = 'none';
};


DNS.changeMode = function(mode) {
    if (mode === DNS.mode) {
        return;
    }

    // delete data
    const emptyElements = [
        'text-name',
        'data-textarea'
    ];
    for (let i in emptyElements) {
        const elem = document.getElementById(emptyElements[i]);
        elem.value = '';
    }

    const fileList = document.getElementById('file-upload-list');
    const listChildren = fileList.children.length;
    for (let i=0; i<listChildren; i++) {
        if (fileList.firstChild.id == 'file-upload-add') {
            continue;
        }

        fileList.removeChild(fileList.firstChild);
    }
    DNS.files.length = 0;

    DNS.enableElement('file-upload-add');

    // display fields
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

    DNS.focusTitle();

    DNS.mode = mode;

    DNS.checkGoButtonEnabled();
};

DNS.focusTitle = function() {
    const listTextName = document.getElementById('list-text-name');
    if (listTextName.style.display === 'block') {
        const textName = document.getElementById('text-name');
        textName.focus();
    }
};

DNS.enableElement = function(element) {
    const elem = document.getElementById(element);

    elem.disabled = false;
    elem.style['pointer-events'] = '';
    elem.style['-moz-drag-over'] = '';
    elem.style.opacity = 1;
};
DNS.disableElement = function(element) {
    const elem = document.getElementById(element);

    elem.disabled = true;
    elem.style['pointer-events'] = 'none';
    elem.style['-moz-drag-over'] = 'none';
    elem.style.opacity = 0.7;
};


DNS.pasteClipBoardTextToElement = function (element) {
    navigator.clipboard.readText()
        .then(text => {
            const elem = document.getElementById(element);
            elem.value = text;
            elem.focus();

            DNS.checkGoButtonEnabled();
        })
        .catch(err => {
            console.error('Failed to read clipboard contents: ', err);
            const btnPaste = document.getElementById('btn-copy-to-textarea');
            btnPaste.style.color = DNS.COLORS['eerie-black-d'];
            btnPaste.style.opacity = '70%';
            btnPaste.title = 'Failed to read clipboard contents';
            btnPaste.disabled = true;

            const elem = document.getElementById(element);
            elem.focus();

            DNS.checkGoButtonEnabled();
        });
};


DNS.checkGoButtonEnabled = function() {
    let isEnabled = true;
    let title = 'Ready to share data';

    if (isEnabled == true &&
        DNS.mode == DNS.MODES.overview) {
        isEnabled = false;
        title = 'Not possible in this mode';
    }

    const textName = document.getElementById('text-name');
    if (isEnabled == true &&
        textName.value.length == 0) {
        isEnabled = false;
        title = 'Name missing';
    }

    if (isEnabled == true &&
        DNS.mode == DNS.MODES.fileUpload &&
        DNS.files.length == 0) {
        isEnabled = false;
        title = 'No files uploaded';
    }

    const dataText = document.getElementById('data-textarea');
    if (isEnabled == true &&
        DNS.mode == DNS.MODES.textOnly &&
        dataText.value.length == 0) {
        isEnabled = false;
        title = 'Text missing';
    }

    const goBtn = document.getElementById('btn-submit');
    goBtn.disabled = !isEnabled;
    goBtn.style.opacity = isEnabled ? '100%' : '70%';
    goBtn.title = title;
};

DNS.submitData = function() {
    DNS.httpGetAsync('ping', function(resp) {
        window.alert(resp);
    });
    // TODO
    // https://stackoverflow.com/questions/247483/http-get-request-in-javascript
    // POST post
};

DNS.httpGetAsync = function (apiCall, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open('GET', `http://localhost:41419/${apiCall}`, true); // true for asynchronous 
    xmlHttp.send(null);
}

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