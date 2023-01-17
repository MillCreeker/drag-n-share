const DNS = {};

DNS.API_ENDPOINT = 'http://localhost:41419/';

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
    textOnly: 'text-only',
    dataSent: 'data-sent',
    accessData: 'access-data',
    enterKey: 'enter-key'
}
DNS.MAX_FILES = 4;

DNS.files = [];
DNS.selectedFile = null;

DNS.mode = null;


DNS.init = function() {
    DNS.changeMode(DNS.MODES.overview);

    if (DNS.getCookieValue('readCookieDisclaimer') === 'true') {
        const banner = document.getElementById('cookie-banner');
        banner.style.display = 'none';
    }

    if (DNS.getCookieValue('bearerToken') != undefined) {
        DNS.changeMode(DNS.MODES.dataSent);
    }
};

DNS.getCookieValue = function(cookie) {
    const cookies = document.cookie;
    const regex = new RegExp(`${cookie}=([\\w%]+)[,;] expires=([\\w\\d\\s,:\\-+\(\)]*)[;]* `,'g');
    const matches = regex.exec(cookies);
    
    if (matches == null || matches.length < 3) {
        return undefined;
    }

    const now = new Date();
    const expireDate = new Date(matches[2]);
    
    if (expireDate < now) {
        return undefined;
    }

    return matches[1];
};


DNS.areFilesDroppable = true;

dropContainer.ondragenter = function(evt) {
    if (DNS.areFilesDroppable == false) return;

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
    if (DNS.areFilesDroppable == false) return;

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
    if (DNS.areFilesDroppable == false) return;

    evt.preventDefault();

    DNS.closeDeleteDialogForFile();
};

dropContainer.ondrop = function(evt) {
    if (DNS.areFilesDroppable == false) return;

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
            DNS.showAlert(`Maximum number of files (${DNS.MAX_FILES}) exceeded`);
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

DNS.showAlert = function(text) {
    const msgBox = document.getElementById('msg-box-alert');
    if (msgBox.style.display != 'none') {
        DNS.closeAlert();
        return;
    }

    const alertText = document.getElementById('msg-box-alert-text');
    alertText.innerHTML = text;

    DNS.createGlassPlate(DNS.closeAlert);
    DNS.showElement('msg-box-alert');
};

DNS.createGlassPlate = function(onClick) {
    const glassPlate = document.createElement('div');
    glassPlate.classList.add('glass-plate');
    glassPlate.id = 'glass-plate';

    if (typeof onClick === 'function') {
        glassPlate.onclick = function() {
            onClick();
        };
    }

    document.body.appendChild(glassPlate);
};

DNS.closeAlert = function() {
    DNS.hideElement('msg-box-alert');
    DNS.removeGlassPlate();

    DNS.focusTitle();

    DNS.checkGoButtonEnabled();
    DNS.checkSearchButtonEnabled();
};

DNS.removeGlassPlate = function() {
    const plate = document.getElementById('glass-plate');
    if (plate != null) {
        document.body.removeChild(plate);
    }
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

    const id = evt.currentTarget.id;
    DNS.selectedFile = id;

    DNS.createGlassPlate(DNS.closeDeleteDialogForFile);
    DNS.showElement('msg-box-delete-file');

    DNS.isFileSelected = true;
};

DNS.closeDeleteDialogForFile = function() {
    DNS.hideElement('msg-box-delete-file');
    DNS.removeGlassPlate();

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
        'data-textarea',
        'access-key',
        'access-key-search-field'
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
        ],
        'data-sent': [
            'text-name',
            'access-key',
            'more-options'
        ],
        'access-data': [
            'text-name',
            'btn-search',
            'btn-overview'
        ],
        'enter-key': [
            'access-key-search-field',
            'access-key-search-btn',
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

    DNS.handleModeDataSent(mode == DNS.MODES.dataSent);

    DNS.mode = mode;

    DNS.focusTitle();
    DNS.checkGoButtonEnabled();
    DNS.checkSearchButtonEnabled();
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

DNS.handleModeDataSent = function(isModeDataSent) {
    DNS.areFilesDroppable = !isModeDataSent;

    const textName = document.getElementById('text-name');
    textName.disabled = isModeDataSent;

    if (isModeDataSent == false) {
        return;
    }

    DNS.httpSendAsync('GET', 'get_access_key_and_name', null,
        function(resp) {
            if (resp == '' || resp == null) { 
                DNS.showAlert('An unexpected error occurred');
                DNS.changeMode(DNS.MODES.overview);
                return
            }
            jsonResp = JSON.parse(resp);
            accessKey = jsonResp.accessKey;
            
            const nameText = document.getElementById('text-name');
            nameText.value = jsonResp.name;
            const keyField = document.getElementById('access-key');
            keyField.innerHTML = `${accessKey.substring(0,3)} ${accessKey.substring(3)}`;
        },
        function(resp, status) {
            document.cookie = 'bearerToken=""';
            DNS.changeMode(DNS.MODES.overview);
        }
    );
};

DNS.showMoreOptions = function() {
    const moreOptions = document.getElementById('list-more-options');
    const dataSentOptions = document.getElementById('list-data-sent-options');
    const accessDataInstructions = document.getElementById('list-access-data-instructions');
    const textName = document.getElementById('text-name');

    moreOptions.style.display = 'none';
    dataSentOptions.style.display = 'block';
    accessDataInstructions.style.display = 'block';
    textName.disabled = false;
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
        DNS.mode != DNS.MODES.fileUpload  &&
        DNS.mode != DNS.MODES.textOnly) {
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
    DNS.httpSendAsync('GET', 'ping', null,
        function(resp) {
            DNS.uploadData();
        },
        function(resp, status) {
            
        }
    );
};

DNS.httpSendAsync = function (type, route, body, successFunc, errorFunc) {
    DNS.busyShow();
    var xmlHttp = new XMLHttpRequest();

    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4) {
            if (xmlHttp.status == 200) {
                successFunc(xmlHttp.responseText);
            } else if (typeof errorFunc == 'function') {
                let msg = xmlHttp.responseText
                console.error(msg);

                if (msg.length > 75) {
                    msg = 'An unexpected error occured';
                }
                DNS.showAlert(msg);
                errorFunc(msg, xmlHttp.status);
            }

            DNS.busyHide();
        }
    }
    const bearerToken = DNS.getCookieValue('bearerToken');
    xmlHttp.open(type, `${DNS.API_ENDPOINT}${route}`, true); // true for asynchronous 
    xmlHttp.setRequestHeader('Access', bearerToken);
    xmlHttp.send(body);
}

DNS.busyShow = function() {
    DNS.createGlassPlate();

    const busyIndicator = document.getElementById('busy-indicator');
    busyIndicator.style.display = 'block';
};

DNS.busyHide = function() {
    const busyIndicator = document.getElementById('busy-indicator');
    busyIndicator.style.display = 'none';

    DNS.removeGlassPlate();
};

DNS.uploadData = async function() {
    const title = document.getElementById('text-name').value;
    let data = null;

    switch (DNS.mode) {
        case (DNS.MODES.fileUpload):
            const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });

            const fileArr = [];
            try {
                for (let i=0; i<DNS.files.length; i++) {
                    const base64 = await toBase64(DNS.files[i]);
                    fileArr.push(base64);
                }
            } catch(e) {
                console.error(e);
                DNS.showAlert('Looks like your files refused to be uploaded :.(');
                break;
            }
            data = JSON.stringify(fileArr);
            break;
        case (DNS.MODES.textOnly):
            data = document.getElementById('data-textarea').value;
            break;
        default:
            return;
    };

    const body = JSON.stringify({
        name: title,
        data: data,
        isTextOnly: DNS.mode == DNS.MODES.textOnly
    });

    DNS.httpSendAsync('POST', 'upload_data',
        body,
        function(resp) {
            DNS.createCookie('bearerToken', resp, 5);
            DNS.changeMode(DNS.MODES.dataSent);
        },
        function(resp, status) {
            
        }
    );
};

DNS.createCookie = function(name, value, expiresInMin=null) {
    let expireDate = null;
    const now = new Date();

    if (expiresInMin == null) {
        const curYear = now.getFullYear();
        expireDate = new Date(now.setFullYear(curYear + 1));
    } else {
        const time = now.getTime();
        expireDate = new Date(now.setTime(time + expiresInMin * 60000));
    }

    document.cookie = `${name}=${value}, expires=${expireDate}`;
};

DNS.refresh = function() {
    const textName = document.getElementById('text-name');
    const title = textName.value;

    DNS.httpSendAsync('POST', 'refresh',
        title,
        function(resp) {
            DNS.handleModeDataSent(true);
            DNS.showMoreOptions();
        },
        function(resp, status) {

        }
    );
};

DNS.showDeleteDataDialog = function() {
    DNS.createGlassPlate(DNS.closeDeleteDataDialog);
    DNS.showElement('msg-box-delete-data');
};

DNS.closeDeleteDataDialog = function() {
    DNS.removeGlassPlate();
    DNS.hideElement('msg-box-delete-data');
};

DNS.deleteData = function() {
    DNS.closeDeleteDataDialog();

    DNS.httpSendAsync('DELETE', 'delete',
        null,
        function(resp) {
            document.cookie = 'bearerToken=""';
            DNS.changeMode(DNS.MODES.overview);
        },
        function(resp, status) {
            document.cookie = 'bearerToken=""';
            DNS.changeMode(DNS.MODES.overview);
        }
    );
    DNS.changeMode(DNS.MODES.overview);
};

DNS.accessData = function() {
    DNS.changeMode(DNS.MODES.accessData);
};

DNS.checkSearchButtonEnabled = function() {
    let isEnabled = true;
    let title = 'Ready to search';

    if (isEnabled == true &&
        DNS.mode != DNS.MODES.accessData) {
        isEnabled = false;
        title = 'Not possible in this mode';
    }

    const textName = document.getElementById('text-name');
    if (isEnabled == true &&
        textName.value.length == 0) {
        isEnabled = false;
        title = 'Name missing';
    }

    const searchBtn = document.getElementById('btn-search');
    searchBtn.disabled = !isEnabled;
    searchBtn.style.opacity = isEnabled ? '100%' : '70%';
    searchBtn.title = title;
};

DNS.searchName = function() {
    const textname = document.getElementById('text-name');
    const name = textname.value;

    DNS.httpSendAsync('POST', 'search_name',
        name,
        function(resp) {
            DNS.changeMode(DNS.MODES.enterKey);
            const keyField = document.getElementById('access-key-search-field');
            keyField.focus();
        },
        function(resp, status) {
            
        }
    );
};

DNS.validateKey = function() {
    const keyField = document.getElementById('access-key-search-field');
    const accessKey = keyField.value.replace(' ', '');

    // TODO button enablen/disablen
    // TODO namen besorgen / vorher merken
    
    DNS.httpSendAsync('POST', 'validate_key',
    accessKey,
        function(resp) {
            
        },
        function(resp, status) {
            
        }
    );
};

DNS.onInputAccessKeySearchField = function() {
    const searchField = document.getElementById("access-key-search-field");
    searchField.addEventListener("input", function() {
        let value = searchField.value;
        value = value.replace(/\D/g, "");
        value = value.replace(/(\d{3})(?=\d)/g, "$1 ");
        searchField.value = value;
    });
};



DNS.closeCookieBanner = function() {
    DNS.hideElement('cookie-banner');

    DNS.createCookie('readCookieDisclaimer', 'true');
};








DNS.init();