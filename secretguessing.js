// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBaUeaE0UqeqXbmN1BXkdZGitVv5q__8Wo",
    authDomain: "secret-guessing-game.firebaseapp.com",
    projectId: "secret-guessing-game",
    storageBucket: "secret-guessing-game.firebasestorage.app",
    messagingSenderId: "149323200330",
    appId: "1:149323200330:web:5664f49d85698042eb73b3",
    measurementId: "G-46EX0GRC6X"
  };

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Generate a random room code
const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

// Main App Component
const App = () => {
    const [view, setView] = React.useState('lobby');
    const [roomName, setRoomName] = React.useState(localStorage.getItem('roomName') || '');
    const [roomId, setRoomId] = React.useState(localStorage.getItem('roomId') || '');
    const [players, setPlayers] = React.useState([]);
    const [secrets, setSecrets] = React.useState([]);
    const [currentSecret, setCurrentSecret] = React.useState(null);
    const [votes, setVotes] = React.useState({});
    const [gamePhase, setGamePhase] = React.useState('lobby');
    const [currentRound, setCurrentRound] = React.useState(0);
    const [fakeSecretMode, setFakeSecretMode] = React.useState(false);
    const [playerName, setPlayerName] = React.useState(localStorage.getItem('playerName') || '');
    const [playerId, setPlayerId] = React.useState(localStorage.getItem('playerId') || '');
    const [roomList, setRoomList] = React.useState([]);
    const [roomListener, setRoomListener] = React.useState(null);
    const [playersListener, setPlayersListener] = React.useState(null);

    // Helper to set up Firestore listener for a room and its players subcollection
    const listenToRoom = (id) => {
        if (roomListener) roomListener(); // Unsubscribe previous
        if (playersListener) playersListener();
        const unsubRoom = db.collection('rooms').doc(id).onSnapshot((doc) => {
            const data = doc.data();
            if (!data) return;
            setRoomName(data.name || '');
            setSecrets(data.secrets || []);
            setCurrentSecret(data.currentSecret || null);
            setVotes(data.votes || {});
            setGamePhase(data.gamePhase || 'lobby');
            setCurrentRound(data.currentRound || 0);
            setFakeSecretMode(data.fakeSecretMode || false);
        });
        setRoomListener(() => unsubRoom);
        // Listen to players subcollection
        const unsubPlayers = db.collection('rooms').doc(id).collection('players').onSnapshot((snap) => {
            setPlayers(snap.docs.map(doc => doc.data()));
        });
        setPlayersListener(() => unsubPlayers);
    };

    // Restore session on mount
    React.useEffect(() => {
        if (roomId && playerId && playerName) {
            listenToRoom(roomId);
            setView('waiting');
        }
    }, []);

    // Fetch available rooms in lobby phase
    const fetchRoomList = async () => {
        const snap = await db.collection('rooms').where('gamePhase', '==', 'lobby').get();
        setRoomList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    React.useEffect(() => {
        if (view === 'lobby') fetchRoomList();
        // Clean up listeners on unmount
        return () => { if (roomListener) roomListener(); if (playersListener) playersListener(); };
    }, [view]);

    // Create a new room by name
    const createRoom = async (name) => {
        // Check if room name already exists
        const existing = await db.collection('rooms').where('name', '==', name).get();
        if (!existing.empty) {
            alert('Room name already exists. Please choose another.');
            return;
        }
        const id = db.collection('rooms').doc().id;
        setRoomId(id);
        setRoomName(name);
        localStorage.setItem('roomId', id);
        localStorage.setItem('roomName', name);
        try {
            await db.collection('rooms').doc(id).set({
                name,
                secrets: [],
                currentSecret: null,
                votes: {},
                gamePhase: 'lobby',
                currentRound: 0,
                fakeSecretMode: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            listenToRoom(id);
            setView('enterName');
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    };

    // Join an existing room by id
    const joinRoom = async (id) => {
        setRoomId(id);
        localStorage.setItem('roomId', id);
        try {
            const roomRef = db.collection('rooms').doc(id);
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) {
                alert('Room not found.');
                return;
            }
            setRoomName(roomDoc.data().name);
            localStorage.setItem('roomName', roomDoc.data().name);
            listenToRoom(id);
            setView('enterName');
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room.');
        }
    };

    // Add a player to the room's subcollection
    const addPlayer = async (name) => {
        try {
            const id = firebase.auth().currentUser?.uid || Date.now().toString();
            setPlayerId(id);
            setPlayerName(name);
            localStorage.setItem('playerId', id);
            localStorage.setItem('playerName', name);
            // Check if this is the first player (host)
            const playersSnap = await db.collection('rooms').doc(roomId).collection('players').get();
            let isHost = false;
            if (playersSnap.empty) {
                isHost = true;
            } else {
                // Double-check: if no one is host, make this player host
                const anyHost = playersSnap.docs.some(doc => doc.data().isHost);
                if (!anyHost) isHost = true;
            }
            await db.collection('rooms').doc(roomId).collection('players').doc(id).set({
                id, name, isHost
            });
            setView('waiting');
        } catch (error) {
            console.error('Error adding player:', error);
            alert('Failed to add player.');
        }
    };

    // Helper to check if current user is host
    const amIHost = () => {
        return players.find(p => p.id === playerId)?.isHost;
    };

    // Submit a secret
    const submitSecret = async (secret) => {
        try {
            const secretObj = {
                text: secret,
                ownerId: firebase.auth().currentUser?.uid || Date.now().toString(),
                submittedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('rooms').doc(roomId).update({
                secrets: firebase.firestore.FieldValue.arrayUnion(secretObj)
            });
            
            setView('waiting');
        } catch (error) {
            console.error('Error submitting secret:', error);
            alert('Failed to submit secret. Please try again.');
        }
    };

    // Cast a vote
    const castVote = async (targetId) => {
        try {
            const voterId = firebase.auth().currentUser?.uid || Date.now().toString();
            
            await db.collection('rooms').doc(roomId).update({
                [`votes.${voterId}`]: targetId
            });
            
            setView('waiting');
        } catch (error) {
            console.error('Error casting vote:', error);
            alert('Failed to cast vote. Please try again.');
        }
    };

    // Start a new round
    const startNewRound = async () => {
        try {
            const randomIndex = Math.floor(Math.random() * secrets.length);
            const newSecret = secrets[randomIndex];
            
            await db.collection('rooms').doc(roomId).update({
                currentSecret: newSecret,
                votes: {},
                gamePhase: 'voting',
                currentRound: currentRound + 1
            });
            
            setView('voting');
        } catch (error) {
            console.error('Error starting new round:', error);
            alert('Failed to start new round. Please try again.');
        }
    };

    // Start the game (set phase to submitting)
    const startGame = async () => {
        try {
            await db.collection('rooms').doc(roomId).update({
                gamePhase: 'submitting'
            });
        } catch (error) {
            alert('Failed to start game.');
        }
    };

    // Leave room logic
    const leaveRoom = async () => {
        try {
            if (roomId && playerId) {
                await db.collection('rooms').doc(roomId).collection('players').doc(playerId).delete();
            }
        } catch (e) {
            // Ignore errors
        }
        // Clean up local state and storage
        if (roomListener) roomListener();
        if (playersListener) playersListener();
        setRoomId('');
        setRoomName('');
        setPlayerId('');
        setPlayerName('');
        localStorage.removeItem('roomId');
        localStorage.removeItem('roomName');
        localStorage.removeItem('playerId');
        localStorage.removeItem('playerName');
        setView('lobby');
    };

    // Room name placeholders
    const chiangMaiPlaces = [
        'ม่อนแจ่ม',
        'แม่กำปอง',
        'ดอยสุเทพ',
        'ดอยอินทนนท์',
        'วัดพระธาตุดอยคำ',
        'วัดอุโมงค์',
        'ถนนนิมมาน',
        'ประตูท่าแพ',
        'สวนสัตว์เชียงใหม่',
        'น้ำตกแม่สา',
        'อ่างแก้ว',
        'วัดเจดีย์หลวง',
        'วัดพระสิงห์',
        'วัดเชียงมั่น',
        'วัดสวนดอก',
        'วัดโลกโมฬี',
        'วัดพันเตา',
        'วัดศรีสุพรรณ',
        'วัดเกตการาม',
        'วัดร่ำเปิง'
    ];
    function getRandomPlace() {
        return chiangMaiPlaces[Math.floor(Math.random() * chiangMaiPlaces.length)];
    }

    // Render the appropriate view
    const renderView = () => {
        switch (view) {
            case 'lobby':
                return (
                    <div className="flex flex-col items-center justify-center min-h-screen p-4">
                        <h1 className="text-4xl font-bold mb-8">Secret Guessing Game</h1>
                        <form className="w-full max-w-md mb-6" onSubmit={e => {
                            e.preventDefault();
                            createRoom(e.target.elements[0].value);
                        }}>
                            <input
                                type="text"
                                placeholder="Create a room name (e.g. แม่กำปอง)"
                                className="w-full p-3 border rounded-lg mb-2"
                                maxLength="30"
                                required
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
                            >
                                Create New Room
                            </button>
                        </form>
                        <div className="w-full max-w-md mb-4">
                            <h2 className="text-xl font-semibold mb-2">Available Rooms</h2>
                            <button onClick={fetchRoomList} className="mb-2 text-blue-500 underline">Refresh</button>
                            <ul className="space-y-2">
                                {roomList.length === 0 && <li className="text-gray-500">No rooms available</li>}
                                {roomList.map(room => {
                                    const displayName = room.name && room.name.trim() ? room.name : getRandomPlace();
                                    return (
                                        <li key={room.id} className="flex items-center justify-between bg-white rounded p-2 shadow">
                                            <span>Room: <b>{displayName}</b></span>
                                            <button
                                                onClick={() => joinRoom(room.id)}
                                                className="ml-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                            >Join</button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>
                );
            case 'enterName':
                return (
                    <div className="flex flex-col items-center justify-center min-h-screen p-4">
                        <h2 className="text-2xl font-bold mb-4">Enter Your Name</h2>
                        <form onSubmit={e => {
                            e.preventDefault();
                            addPlayer(e.target.elements[0].value);
                        }} className="w-full max-w-md space-y-4">
                            <input
                                type="text"
                                placeholder="Your name"
                                className="w-full p-3 border rounded-lg"
                                maxLength="20"
                                required
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
                            >
                                Join Game
                            </button>
                        </form>
                    </div>
                );
            case 'waiting':
                return (
                    <div className="flex flex-col items-center justify-center min-h-screen p-4">
                        <h2 className="text-2xl font-bold mb-4">Room: {roomName}</h2>
                        <SecretComponents.PlayerList players={players} />
                        <button
                            onClick={leaveRoom}
                            className="mt-4 mb-2 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition"
                        >
                            Leave Room
                        </button>
                        {/* Start Game button only in lobby phase and only for host */}
                        {gamePhase === 'lobby' && amIHost() && (
                            <button
                                onClick={startGame}
                                className="mt-6 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition"
                            >
                                Start Game
                            </button>
                        )}
                        {gamePhase === 'lobby' && !amIHost() && (
                            <div className="mt-6 text-gray-500">Waiting for host to start the game...</div>
                        )}
                        {gamePhase === 'submitting' && (
                            <SecretComponents.SecretSubmission
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    submitSecret(e.target.elements[0].value);
                                }}
                                onBack={leaveRoom}
                            />
                        )}
                        {gamePhase === 'voting' && currentSecret && (
                            <SecretComponents.VotingPhase
                                secret={currentSecret.text}
                                players={players}
                                onVote={castVote}
                                onBack={leaveRoom}
                            />
                        )}
                        {gamePhase === 'results' && currentSecret && (
                            <SecretComponents.ResultsPhase
                                secret={currentSecret.text}
                                votes={votes}
                                players={players}
                                onNextRound={startNewRound}
                                onBack={leaveRoom}
                            />
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return renderView();
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root')); 