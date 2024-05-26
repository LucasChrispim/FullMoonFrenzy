@@ -1,18 +1,20 @@
const mainContent = document.querySelector("#mainContent");
const socket = io("http://127.0.0.1:3000");
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
@@ -45,6 +47,7 @@ function displayGrid(grid) {
			gridContainer.appendChild(cellElement);
		});
	});

	centeredContentContainer.appendChild(gridContainer);
	mainContent.appendChild(centeredContentContainer);
}
@@ -134,14 +137,97 @@ function displayLobbySelector() {
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

			if (i + 1 !== Object.keys(savedLobbies).length) {
				LobbyListEntry.style.borderBottom = "1px solid";
			}

			const LobbyListEntryID = document.createElement("p");
			LobbyListEntryID.className = "lobby-list-lobby-id";
			LobbyListEntryID.innerText =
				savedLobbies[Object.keys(savedLobbies)[i]].id;

			const LobbyListEntryPlayerCount = document.createElement("p");
			LobbyListEntryPlayerCount.className =
				"lobby-list-lobby-playercount";
			LobbyListEntryPlayerCount.innerText = `${
				savedLobbies[Object.keys(savedLobbies)[i]].players.length
			}/4`;

			const backToMainMenuButton = document.createElement("p");
			backToMainMenuButton.className = "top-left-button";
			backToMainMenuButton.innerText = "Back to Main Menu";

			backToMainMenuButton.addEventListener("click", () => {
				displayLobbySelector();
			});

			LobbyListEntry.addEventListener("click", () => {
				socket.emit("join-lobby", LobbyListEntryID.innerText);
			});

			mainContent.appendChild(backToMainMenuButton);
			LobbyListEntry.appendChild(LobbyListEntryID);
			LobbyListEntry.appendChild(LobbyListEntryPlayerCount);
			LobbyListEntry.className = "lobby-list-entry";
			lobbyList.appendChild(LobbyListEntry);
		}

		centeredContentContainer.appendChild(lobbyList);
	}

	mainContent.appendChild(centeredContentContainer);
}

@@ -169,3 +255,8 @@ socket.on("lobby-created", (lobbyId) => {
	displayWaitingForPlayersScreen(lobbyId);
	updateWaitingForPlayersScreen(1);
});

socket.on("list-lobbies", (lobbies) => {
	console.log(lobbies);
	savedLobbies = lobbies;
});
