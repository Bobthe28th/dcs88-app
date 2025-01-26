const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { autoUpdater } = require('electron-updater');
let mainWindow;

let user = undefined;
let token = undefined;
const client = new net.Socket();
let connectedServer = false;

const ip = '73.164.246.154';
const port = 3500;

const createWindow = () => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
		frame: false,
		backgroundColor: '#FFF',
		icon: path.join(__dirname, 'assets/logo.png'),
	});
	
	mainWindow.loadFile(path.join(__dirname, '/pages/layout.html'));
	
	mainWindow.on('focus', () => { // remove resizing
		globalShortcut.register("CommandOrControl+plus", () => { return });
		globalShortcut.register("CommandOrControl+=", () => { return });
		globalShortcut.register("CommandOrControl+-", () => { return });
		globalShortcut.register("CommandOrControl+_", () => { return });
	});
	
	mainWindow.on('blur', () => {
		globalShortcut.unregister("CommandOrControl+plus");
		globalShortcut.unregister("CommandOrControl+=");
		globalShortcut.unregister("CommandOrControl+-");
		globalShortcut.unregister("CommandOrControl+_");
	});

	mainWindow.on('closed', () => {
		mainWindow = null;
	});
	
	mainWindow.webContents.openDevTools();
};

autoUpdater.on('update-available', () => {
	console.log('Update available.');
});

autoUpdater.on('update-not-available', () => {
	console.log('Update not available.');
});

autoUpdater.on('error', (err) => {
	console.error('Error in auto-updater:', err);
});

autoUpdater.on('download-progress', (progress) => {
	console.log(`Download speed: ${progress.bytesPerSecond}`);
	console.log(`Downloaded ${progress.percent}%`);
	console.log(`(${progress.transferred}/${progress.total})`);
});

autoUpdater.on('update-downloaded', () => {
	console.log('Update downloaded. It will be installed on restart.');
});

app.whenReady().then(() => {
	createWindow();
	autoUpdater.checkForUpdatesAndNotify();
	
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

ipcMain.on('minimize-window', (event) => {
	mainWindow.minimize();
});

ipcMain.on('maximize-window', (event) => {
	mainWindow.maximize();
});

ipcMain.on('restore-window', (event) => {
	mainWindow.unmaximize();
});

ipcMain.on('fullscreen-window', (event) => {
	mainWindow.setFullScreen(!mainWindow.isFullScreen());
});

ipcMain.on('close-window', (event) => {
	if (connectedServer) client.end();
	mainWindow.close();
});

ipcMain.handle('update-money', (event) => {
	return 100000;
});

ipcMain.handle('load-page', async (event, pageName) => {
	if (pageName == "profile") {
		if (!user) pageName = "login";
		if (!connectedServer) pageName = "home";
	}
	const filePath = path.join(__dirname, `pages/${pageName}.html`);
	try {
		const content = fs.readFileSync(filePath, 'utf-8');
		return { content: content, updatedPageName: pageName };
	} catch (error) {
		return { content: `<h1>Error: Page "${pageName}" not found :3</h1>`, updatedPageName: pageName };
	}
});

ipcMain.handle('file-exists', async (event, filePath) => {
	return fs.existsSync(filePath);
});

let loginResolve = null;
let loginPromise = null;
ipcMain.handle('try-login', async (event, pass) => {
	if (connectedServer) {
		if (loginPromise) {
			return "Already logging in";
		} else {
			loginPromise = new Promise((resolve, reject) => {
				client.write(JSON.stringify({type: "loginAttempt", pass: pass}));
				loginResolve = resolve;
				setTimeout(() => {
					resolve("No response from server");
				}, 5000);
			});
			loginPromise.finally(() => {
				loginPromise = null;
				loginResolve = null;
			});
			let response = await loginPromise;
			if (response.token) {
				user = pass;
				token = response.token;
				loadPage('profile');
			}
			return response;
		}
	} else {
		return "Not connected to server";
	}
});


client.on('data', (data) => {
	console.log('Received:', data.toString());
	let jsonData = JSON.parse(data);
	if (jsonData) {
		if (jsonData.type) {
			switch (jsonData.type) {
				case "loginResponse":
					if (loginResolve) {
						if (jsonData.response) {
							loginResolve(jsonData.response);
						} else {
							loginResolve("Bad response from server");
						}
					} else {
						//TODO notify (startup attempt)
						console.log(jsonData.response);
					}
					break;
			}
		}
	}
});

client.on('error', (error) => {
	console.log(error);
	client.destroy();
	connectedServer = false;
	mainWindow.webContents.send('setConnectionStatus', "server", "none");
});

client.on('end', () => {
	console.log('Disconnected from server');
	client.destroy();
	connectedServer = false;
	mainWindow.webContents.send('setConnectionStatus', "server", "none");
});

let serverTimeout = 0;
let connectingServer = false;
client.on('connect', () => {
	clearTimeout(serverTimeout);
	connectingServer = false;
	mainWindow.webContents.send('setConnectionStatus', "server", "partconnected");
});

ipcMain.handle('connect-server', async (event, to, time) => {
	if (to == "server") {
		if (connectingServer) {
			console.log("Already Connecting");
			return;
		}
		connectingServer = true;
		client.destroy();
		clearTimeout(serverTimeout);
		client.connect({ port: port, host: ip }, () => {
			console.log('Connected to server');
			connectedServer = true;
			client.setKeepAlive(true, 5000);
		});
		
		serverTimeout = setTimeout(() => {
			if (!connectedServer) {
				client.destroy();
				connectingServer = false;
				mainWindow.webContents.send('setConnectionStatus', "server", "none");
			}
		}, time);
	} else {
		mainWindow.webContents.send('setConnectionStatus', to, "none");
	}
});


const RPC = require('discord-rpc');
const clientId = '1332919065685266452';

const rpc = new RPC.Client({ transport: 'ipc' });

rpc.on('ready', async () => {
	console.log('Discord RPC is ready');
	await rpc.setActivity({
		details: 'Flying the A-10A',
		state: 'Destroy SA-3',
		startTimestamp: Date.now(),
		largeImageKey: 'dcs88',
		largeImageText: 'DCS 88 v0.1',
		partyId: 'mission',
		partySize: 1,
		partyMax: 88,
		buttons: [
			{
				label: "Download the app",
				url: "https://bobthe28th.me/dcs88"
			}
		]
	});
	console.log('Rich Presence updated!');
});

rpc.login({ clientId }).catch(console.error);