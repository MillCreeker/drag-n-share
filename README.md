# [Drag-n-Share](https://drag-n-share.com)

This repo is obsolete!
Check out the newer ones:
- [Frontend](https://github.com/MillCreeker/Drag-n-Share-Frontend)
- [Backend](https://github.com/MillCreeker/Drag-n-Share-Backend)


## About
I’m pretty sure you already know what the deal is, if not, check [this](https://drag-n-share.com/about/) out.
It’s important to mention that – if you use any of this code – it is only allowed under the [GNU license](https://www.gnu.org/licenses/gpl-3.0.en.html).\
Source-Code
This project is a bit of a mess. I can’t discourage you more from putting all of this in a single repository. Deployment becomes a bi**h this way …\
Anyway, I’m a big believer that source code should be self-explanatory.

… mine isn’t though lmao.

Jokes aside, with a bit of guidance you should be able to find what you came to find.
First, the project is separated in 2 folders:
- api
- web

The api folder contains the backend functionality in Python, and the web folder contains all the frontend.

## Frontend
There is no framework used at all. Just the most plain and vanilla HTML, JS, and CSS.
### Points of Interest
#### Single Page Application
The main functionality is a single page application. If you’re halfway sane, you would use Angular, React, or any other of the bazillion JavaScript frameworks that do this. I didn’t.\
Refer to the DNS.changeMode Method in the [index.js](/web/src/index.js) file for how I did this.
#### Drag-n-Drop Area
Something I struggled the most with was this damn thing. I thought this would be a breeze.
In order to make this easier for you, refer to the lines 67 onwards in the [index.js](/web/src/index.js) file.\
I think the implementation is pretty solid.

## Backend
I used Flask and Python to get the API running. For deployment I used Apache.
### Database
There are 3 tables used for this project:
- data
- access
- lock-entries

#### data
This one’s considered the “main” table and stores the data.
![data DB](/READEME/data.png)
#### access
Stores the bearer token of the user who uploaded the data in the first place (to identify them).
Stores the 6 digit access key.
![access DB](/READEME/access.png)
#### lock-entries
When someone enters the wrong access key for a particular data entry, the data-id gets an entry here. The data will no longer be accessible then.
![lock-entries DB](/READEME/lock-entries.png)
