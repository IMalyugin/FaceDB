const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const app = require('./express');
const iconvlite = require('iconv-lite');
const filePath = path.resolve(__dirname, '../data/labels.csv');
const profileFilePath = path.resolve(__dirname, '../data/base.json');

const getCsvAsArray = async (csvFilePath) => {
  try {
    return iconvlite.decode(fs.readFileSync(csvFilePath), 'windows-1251').trim().split(/\r?\n/);
  } catch (e) {
    return undefined;
  }
};
const headers = ['ID', 'Name', 'CurrentDevice', 'CurrentDevice_image', 'TargetDevice', 'TargetDevice_image'];
const getJsonAsArray = (jsonFilePath) => {
  try {
    const rawProfilesData = fs.readFileSync(jsonFilePath);
    const profiles = JSON.parse(rawProfilesData);
    return profiles.map(item => headers.map(key => item[key]));
  } catch (e) {
    return undefined;
  }
};

const getProfileIdList = () => getCsvAsArray(filePath);

const getProfileDataList = async () => {
  const profiles = getJsonAsArray(profileFilePath);
  return {
    headers,
    profiles,
  };
};

app.all('/', async (req, res) => {
  res.render('index', {
    Component: 'components.WebCam',
    error: null,
    model: {
      userData: {
        list: await getProfileIdList() || [],
        ...await getProfileDataList() || [],
      },
    },
  });
});

const server = app.listen(app.get('port'), () => {
  console.log(`
    ------------------------------
    🌍  GOTO http://localhost:${app.get('port')}
    ------------------------------
  `);
});
const io = require('socket.io')(server);

class User {
  constructor(uuid) {
    this.id = null;
    this.uuid = uuid;
    this.imageScore = 0;
    this.imageData = null;
  }

  getUUID() { return this.uuid; }
  getImageData() { return this.imageData; }

  setID(id) { this.id = id; }
  updateImageData({ imageData, imageScore }) {
    this.imageData = imageData;
    this.imageScore = imageScore;
  }
}

class UserDB {
  constructor() {
    this.uuids = [];
    this.data = {};
    this.pointer = 0;
    this.broadcastUserAdded = () => {};
  }

  hasUser(uuid) { return !!this.data[uuid]; }
  addUser({ uuid, imageData, imageScore }) {
    if (!this.hasUser(uuid)) {
      this.data[uuid] = new User(uuid);
      this.uuids = [...this.uuids, uuid];
    }
    this.data[uuid].updateImageData({ imageData, imageScore });
    this.broadcastUserAdded();
  }

  keepAlive(keepAliveUUIDs) {
    const deleteUUIDs = this.uuids.filter(uuid => keepAliveUUIDs.indexOf(uuid) === -1);
    deleteUUIDs.forEach(uuid => this.removeUser(uuid));
  }

  removeUser(uuid) {
    if (this.hasUser(uuid)) {
      delete this.data[uuid];

      // adjust pointer to make up for removed element
      if (this.uuids.indexOf(uuid) < this.pointer) {
        this.pointer = this.pointer - 1;
      }

      this.uuids = this.uuids.filter(val => val !== uuid);

      if (!this.uuids.length) {
        this.pointer = 0;
      } else {
        // if uuid was last in list, we need to reset pointer
        this.pointer = this.pointer % this.uuids.length;
      }
    }
  }

  async hasUsers() {
    if (this.uuids.length) return;
    await this.subscribeUserAdded();
  }

  subscribeUserAdded() {
    return new Promise((resolve) => {
      this.broadcastUserAdded = () => {
        resolve();
        this.broadcastUserAdded = () => {};
      };
    });
  }

  async getNextUser() {
    await this.hasUsers();
    const userUUID = this.uuids[this.pointer];
    const user = this.data[userUUID];

    /** tell client that current user needs a better photo */
    io.sockets.emit('dataChange', { scores: { [userUUID]: 0 } });
    this.pointer = (this.pointer + 1) % this.uuids.length;
    return user;
  }

  fillUserData({ uuid, id }) {
    if (this.hasUser(uuid)) {
      this.data[uuid].setID(id);
    }
  }
}


const userDB = new UserDB();

io.on('connection', (socket) => {
  console.log('Socket connection initialized');

  socket.on('image', ({ uuid, imageData, imageScore = 1 }) => {
    console.log(`Camera sent new image ${uuid} with score ${imageScore}`);
    userDB.addUser({ uuid, imageData, imageScore });
    // fs.writeFileSync(path.resolve(__dirname, '../data/face.png'), imageData, 'base64');
    // fs.writeFileSync(path.resolve(__dirname, '../data/face.png.base64'), imageData);
  });
  socket.on('keepalive', ({ uuids = [] }) => {
    // console.log(`Camera keep alive: ${uuids}`);
    userDB.keepAlive(uuids);
  });
  socket.on('disconnect', () => {
    console.log('Socket connection closed');
  });
});

app.all('/identity', async (req, res) => {
  console.log('Got request for image');
  const body = { ...req.query, ...req.body };
  Object.keys(body).forEach((uuid) => {
    const id = body[uuid];
    console.log(`Received match for user ${uuid} = ${id}`);
    userDB.fillUserData({ uuid, id });
    io.sockets.emit('dataChange', { uuids: { [uuid]: id } });
  });

  const userData = await userDB.getNextUser();
  res.json({ [userData.getUUID()]: userData.getImageData() });
});


// One-liner for current directory, ignores .dotfiles
chokidar.watch(filePath).on('all', async () => {
  const list = await getProfileIdList();
  console.log('Active user list updated', list);
  io.emit('dataChange', { list });
});

// One-liner for current directory, ignores .dotfiles
chokidar.watch(profileFilePath).on('all', async () => {
  const { profiles } = await getProfileDataList();
  console.log('Profile data changed');
  io.emit('dataChange', { profiles, headers });
});
