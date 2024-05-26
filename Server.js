@@ -1,35 +1,44 @@
const http = require("http");
const express = require("express");
const path = require("path");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));
// Handle all requests by serving the index.html file
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "public/index.html"));
});
// Track connected players (very basic, needs improvement)
let players = {};
let lobbies = {}; // Object to store lobby information
io.on("connection", (socket) => {
	socket.emit("list-lobbies", lobbies);
	socket.on("join-lobby", (lobbyId) => {
		if (lobbies[lobbyId]) {
			// Lobby exists, add player
			lobbies[lobbyId].players.push(socket.id);
			// Notify other players (optional)
			io.to(lobbyId).emit("player-joined", socket.id);
			const playerCount = lobbies[lobbyId].players.length;

			// Notify other players
			for (i = 0; i < lobbies[lobbyId].players.length; i++) {
				if (lobbies[lobbyId].players[i] !== socket.id) {
					io.to(lobbies[lobbyId].players[i]).emit("player-joined", {
						...lobbies[lobbyId],
						playerCount,
						lobbyId,
					});
				}
			}

			// Send lobby state and information to the joining player, including player count
			const playerCount = lobbies[lobbyId].players.length;
			socket.emit("lobby-joined", {
				...lobbies[lobbyId],
				playerCount,
				lobbyId,
			});
		} else {
			// Create a new lobby
			lobbies[lobbyId] = {
				id: lobbyId,
				players: [socket.id],
				// Add other lobby state properties
			};
			// Inform player about new lobby (optional)
			socket.emit("lobby-created", lobbyId);
			console.log("Lobby Created:", lobbyId);
		}
	});
	console.log("Player connected:", socket.id);
	// Assign player ID (needs improvement for multiple games)
	players[socket.id] = { id: socket.id, monsters: [] };
	// Handle player disconnection (needs improvement for game state)
	socket.on("disconnect", () => {
		delete players[socket.id];
		// Update player count for the lobby the player belonged to
		if (lobbies[socket.lobbyId]) {
			// Check if lobby still exists
			const lobbyId = socket.lobbyId; // Assuming you store the lobby ID on the socket
			const playerCount = lobbies[lobbyId].players.length - 1; // Remove disconnected player
			io.to(lobbyId).emit("playerCount", playerCount); // Broadcast updated player count to the lobby
			for (i = 0; i < lobbies[lobbyId].players.length; i++) {
				if (lobbies[lobbyId].players[i] !== socket.id) {
					io.to(lobbies[lobbyId].players[i]).emit("player-left", {
						playerCount,
						lobbyId,
					});
				}
			}
			lobbies[lobbyId].players = lobbies[lobbyId].players.filter(
				(playerId) => playerId !== socket.id
			); // Remove player ID from the lobby's player list
		}
	});
	// Store the lobby ID the player joins (assuming it's received)
	socket.on("join-lobby", (lobbyId) => {
		socket.lobbyId = lobbyId; // Store the lobby ID for later use (e.g., disconnection)
	});
	// Placeholder for handling game logic (needs full implementation)
	socket.on("game-action", (data) => {
		console.log("Game action received:", data);
		// Implement logic for monster placement, movement, and collision
		// Update game state and broadcast to all players in the lobby
	});
});
server.listen(3000, () => {
	console.log("Server listening on port 3000");
});
  36 changes: 28 additions & 8 deletions36  
public/js/client.js
@@ -3,26 +3,38 @@
let amountOfPlayersInLobby = 0;
// Generate the Game Grid
const gameGrid = [];
let counter = 0;
for (let y = 0; y < 10; y++) {
	gameGrid[y] = [];
	for (let x = 0; x < 10; x++) {
		gameGrid[y][x] = { x: x, y: y, id: counter, currentCharacter: {} }; // Or any placeholder value to represent an empty cell
		counter++;
	}
}
let savedLobbies = [];
function clearMainContent() {
	mainContent.innerHTML = "";
}
function isCharDigit(n) {
	return !!n.trim() && n > -1;
}

function addBackToMainMenuButton() {
	const backToMainMenuButton = document.createElement("p");
	backToMainMenuButton.className = "top-left-button";
	backToMainMenuButton.innerText = "Back to Main Menu";

	backToMainMenuButton.addEventListener("click", () => {
		displayLobbySelector();
	});

	mainContent.appendChild(backToMainMenuButton);
}

function displayGrid(grid) {
	clearMainContent();
	const centeredContentContainer = document.createElement("div");
	centeredContentContainer.className = "centered-content-container";
	const gridContainer = document.createElement("div");
	gridContainer.className = "grid-container";
	grid.forEach((row) => {
		row.forEach((cell) => {
			const cellElement = document.createElement("div");
			cellElement.classList.add("grid-cell"); // Basic styling
			cellElement.innerText = "";
			// Add class based on cell occupancy (example)
			if (cell.occupied) {
				cellElement.classList.add("monster-" + cell.monsterType); // monsterType from cell object
			}
			// Set grid position based on x and y coordinates
			cellElement.style.gridColumn = `${cell.x + 1}`; // +1 for 1-based indexing
			cellElement.style.gridRow = `${cell.y + 1}`; // +1 for 1-based indexing
			gridContainer.appendChild(cellElement);
		});
	});
	centeredContentContainer.appendChild(gridContainer);
	mainContent.appendChild(centeredContentContainer);
}
function displayCenteredMessage(message) {
	clearMainContent();
	const centeredContentContainer = document.createElement("div");
	centeredContentContainer.className = "centered-content-container";
	const connectingToServerTitle = document.createElement("h1");
	connectingToServerTitle.innerText = message;
	centeredContentContainer.appendChild(connectingToServerTitle);
	mainContent.appendChild(centeredContentContainer);
}

function displayWaitingForPlayersScreen(lobbyId) {
	clearMainContent();
	addBackToMainMenuButton();
	const centeredContentContainer = document.createElement("div");
	centeredContentContainer.className = "centered-content-container";

	const waitingForPlayersTitle = document.createElement("h1");
	waitingForPlayersTitle.className = "waiting-for-players-title";
	waitingForPlayersTitle.innerHTML = `Waiting for Players (${lobbyId})`;
	const amountOfPlayersLabel = document.createElement("p");
	amountOfPlayersLabel.className = "amount-of-players";
	amountOfPlayersLabel.innerText = `0/4 Players joined`;
	centeredContentContainer.appendChild(waitingForPlayersTitle);
	centeredContentContainer.appendChild(amountOfPlayersLabel);
	mainContent.appendChild(centeredContentContainer);
}
function updateWaitingForPlayersScreen(amountOfPlayer) {
	const amountOfPlayersLabel = document.querySelector(".amount-of-players");
	amountOfPlayersLabel.innerText = `${amountOfPlayer}/4 Players joined`;
}
function displayLobbySelector() {
	clearMainContent();
	const centeredContentContainer = document.createElement("div");
	centeredContentContainer.className = "centered-content-container";
	const joinLobbyByIdContainer = document.createElement("div");
	joinLobbyByIdContainer.className = "join-lobby-by-id-container";
	const lobbyIdInput = document.createElement("input");
	lobbyIdInput.placeholder = "Lobby ID";
	lobbyIdInput.className = "lobby-id-input";
	const lobbyIdJoinButton = document.createElement("button");
	lobbyIdJoinButton.className = "join-lobby-button";
	lobbyIdJoinButton.innerText = "Join";
	lobbyIdJoinButton.disabled = true;
	lobbyIdInput.addEventListener("keydown", (event) => {
		event.preventDefault();
		if (isCharDigit(event.key)) {
			lobbyIdInput.value += event.key;
		}
		if (event.key === "Backspace")
			lobbyIdInput.value = lobbyIdInput.value.substring(
				0,
				lobbyIdInput.value.length - 1
			);
		if (lobbyIdInput.value.length > 0) lobbyIdJoinButton.disabled = false;
		else lobbyIdJoinButton.disabled = true;
	});
	lobbyIdInput.addEventListener("keyup", (event) => {
		if (event.key === "Enter") {
			lobbyIdJoinButton.click();
		}
	});
	lobbyIdJoinButton.addEventListener("click", () => {
		let lobbyId = lobbyIdInput.value;
		socket.emit("join-lobby", lobbyId);
	});
	joinLobbyByIdContainer.append(lobbyIdInput);
	joinLobbyByIdContainer.append(lobbyIdJoinButton);
	const createLobbyButton = document.createElement("button");
	createLobbyButton.className = "create-lobby-button";
	createLobbyButton.innerText = "Create Lobby";
	createLobbyButton.style.borderBottom = "0.5px solid";
	createLobbyButton.style.borderRadius = "10px 10px 0px 0px";
	createLobbyButton.addEventListener("click", () => {
		let lobbyId = Math.floor(Math.random() * 99999) + 10000;
		socket.emit("join-lobby", lobbyId);
	});
	const browseLobbiesButton = document.createElement("button");
	browseLobbiesButton.className = "create-lobby-button";
	browseLobbiesButton.innerText = "Browse Lobbies";
	browseLobbiesButton.style.borderRadius = "0px 0px 10px 10px";
	browseLobbiesButton.addEventListener("click", () => {
		displayLobbyBrowser();
	});
	centeredContentContainer.appendChild(joinLobbyByIdContainer);
	centeredContentContainer.appendChild(createLobbyButton);
	centeredContentContainer.appendChild(browseLobbiesButton);
	mainContent.appendChild(centeredContentContainer);
}
function displayLobbyBrowser() {
	clearMainContent();
	const centeredContentContainer = document.createElement("div");
	centeredContentContainer.className = "centered-content-container";
	if (Object.keys(savedLobbies).length < 1) {
		const browseLobbiesTitle = document.createElement("h2");
		browseLobbiesTitle.className = "browse-lobbies-title";
		browseLobbiesTitle.innerText = "No Lobbies Found!";
		const backToMainMenuButton = document.createElement("button");
		backToMainMenuButton.className = "create-lobby-button";
		backToMainMenuButton.innerText = "Back to Main Menu";
		backToMainMenuButton.addEventListener("click", () => {
			displayLobbySelector();
		});
		centeredContentContainer.appendChild(browseLobbiesTitle);
		centeredContentContainer.appendChild(backToMainMenuButton);
	} else {
		const lobbyList = document.createElement("ul");
		for (i = 0; i < Object.keys(savedLobbies).length; i++) {
			const LobbyListEntry = document.createElement("li");
			if (i === 0) {
				LobbyListEntry.style.borderRadius = "10px 10px 0px 0px";
			} else if (i + 1 === Object.keys(savedLobbies).length) {
				LobbyListEntry.style.borderRadius = "0px 0px 10px 10px";
			}

			if (i + 1 === Object.keys(savedLobbies).length && i === 0) {
				LobbyListEntry.style.borderRadius = "10px";
			}

			if (i + 1 !== Object.keys(savedLobbies).length) {
				LobbyListEntry.style.borderBottom = "1px solid";
			}
@@ -206,19 +223,12 @@ function displayLobbyBrowser() {
				savedLobbies[Object.keys(savedLobbies)[i]].players.length
			}/4`;

			const backToMainMenuButton = document.createElement("p");
			backToMainMenuButton.className = "top-left-button";
			backToMainMenuButton.innerText = "Back to Main Menu";

			backToMainMenuButton.addEventListener("click", () => {
				displayLobbySelector();
			});
			addBackToMainMenuButton();

			LobbyListEntry.addEventListener("click", () => {
				socket.emit("join-lobby", LobbyListEntryID.innerText);
			});

			mainContent.appendChild(backToMainMenuButton);
			LobbyListEntry.appendChild(LobbyListEntryID);
			LobbyListEntry.appendChild(LobbyListEntryPlayerCount);
			LobbyListEntry.className = "lobby-list-entry";
@@ -251,6 +261,16 @@ socket.on("lobby-joined", (players) => {
	}
});

socket.on("player-joined", (data) => {
	displayWaitingForPlayersScreen(data.lobbyId);
	updateWaitingForPlayersScreen(data.playerCount);
});

socket.on("player-left", (data) => {
	displayWaitingForPlayersScreen(data.lobbyId);
	updateWaitingForPlayersScreen(data.playerCount);
});

socket.on("lobby-created", (lobbyId) => {
	displayWaitingForPlayersScreen(lobbyId);
	updateWaitingForPlayersScreen(1);
});
socket.on("list-lobbies", (lobbies) => {
	console.log(lobbies);
	savedLobbies = lobbies;
});
