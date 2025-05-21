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
    const [selectedVote, setSelectedVote] = React.useState(null);
    const [voteSubmitted, setVoteSubmitted] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [initialSubmissionEnded, setInitialSubmissionEnded] = React.useState(false);

    // Helper to set up Firestore listener for a room and its players subcollection
    const listenToRoom = (id) => {
        if (roomListener) roomListener(); // Unsubscribe previous
        if (playersListener) playersListener();
        const unsubRoom = db.collection('rooms').doc(id).onSnapshot((doc) => {
            const data = doc.data();
            if (!data) {
                // Room was likely deleted, go back to lobby
                leaveRoom();
                return;
            }
            setRoomName(data.name || '');
            // Always update secrets to ensure consistency
            setSecrets(data.secrets || []);
            // Only update currentSecret if it's different
            if (!currentSecret || data.currentSecret?.text !== currentSecret.text) {
                setCurrentSecret(data.currentSecret || null);
            }
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

    // Helper function to select a random unrevealed secret
    const selectRandomUnrevealedSecret = (secrets) => {
        const unrevealedSecrets = secrets.filter(s => !s.revealed);
        if (unrevealedSecrets.length === 0) return null;
        return unrevealedSecrets[Math.floor(Math.random() * unrevealedSecrets.length)];
    };

    // Restore session on mount
    React.useEffect(() => {
        if (roomId && playerId && playerName) {
            listenToRoom(roomId);
            // Always fetch and set roomName from Firestore if not present
            if (!roomName) {
                db.collection('rooms').doc(roomId).get().then(doc => {
                    if (doc.exists) {
                        setRoomName(doc.data().name || '');
                        localStorage.setItem('roomName', doc.data().name || '');
                    } else {
                         // Room doesn't exist anymore, clear session
                         leaveRoom();
                    }
                });
            }
            setView('waiting'); // Still go to a 'waiting' type view, phase determines content
        }
    }, []);

    // Remove player on tab close
    React.useEffect(() => {
        const handleUnload = async () => {
            try {
                if (roomId && playerId) {
                    // Use navigator.sendBeacon or keepalive fetch for reliable cleanup on unload
                    // Simple delete might not complete before tab closes
                    // For this example, we'll use a simple delete, but be aware of limitations
                    await db.collection('rooms').doc(roomId).collection('players').doc(playerId).delete();
                }
            } catch (e) { /* Ignore errors */ }
        };
        // Using 'beforeunload' for prompt, 'unload' for actual cleanup attempt
        window.addEventListener('beforeunload', handleUnload);
        window.addEventListener('unload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            window.removeEventListener('unload', handleUnload);
        };
    }, [roomId, playerId]);

    // Fetch available rooms in lobby phase
    const fetchRoomList = async () => {
        setIsLoading(true); // Start loading
        try {
            // Only fetch rooms in 'lobby' or 'initial_submitting' phase
            const snap = await db.collection('rooms').where('gamePhase', 'in', ['lobby', 'initial_submitting']).get();
            const rooms = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRoomList(rooms);
        } catch (error) {
            console.error('Error fetching room list:', error);
            // Optionally show an error message to the user
        }
        setIsLoading(false); // End loading
    };

    React.useEffect(() => {
        if (view === 'lobby') fetchRoomList();
        // Clean up listeners on unmount
        return () => { if (roomListener) roomListener(); if (playersListener) playersListener(); };
    }, [view]);

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

    // Create a new room by name
    const createRoom = async (name) => {
        if (isLoading) return; // Prevent multiple clicks
        setIsLoading(true); // Start loading
        let finalName = name && name.trim() ? name.trim() : getRandomPlace();
        const code = generateRoomCode();
        setRoomId(code);
        setRoomName(finalName);
        localStorage.setItem('roomId', code);
        localStorage.setItem('roomName', finalName);
        try {
            const roomData = {
                name: finalName,
                code: code,
                secrets: [], // Secrets array is now for the whole game pool
                currentSecret: null,
                votes: {},
                gamePhase: 'lobby', // Start in lobby phase
                currentRound: 0,
                fakeSecretMode: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('rooms').doc(code).set(roomData);
            listenToRoom(code);
            setView('enterName'); // This should trigger the name entry view
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
            leaveRoom(); // Clear local state if creation fails
        }
        setIsLoading(false); // End loading
    };

    // Join an existing room by code
    const joinRoomByCode = async (code) => {
        if (isLoading) return; // Prevent multiple clicks
        setIsLoading(true); // Start loading
        setRoomId(code);
        try {
            const roomRef = db.collection('rooms').doc(code);
            const roomDoc = await roomRef.get();
            if (!roomDoc.exists) {
                alert('Room not found.');
                leaveRoom(); // Clear local state if room not found
                return;
            }
            const roomData = roomDoc.data();
            setRoomName(roomData.name || '');
            localStorage.setItem('roomName', roomData.name || '');
            listenToRoom(code);
            setView('enterName'); // This should trigger the name entry view
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room.');
            leaveRoom(); // Clear local state if joining fails
        }
        setIsLoading(false); // End loading
    };

    // Add a player to the room's subcollection (reverting transaction due to error)
    const addPlayer = async (name) => {
        if (isLoading || !roomId) return; // Prevent multiple clicks or no room
        setIsLoading(true); // Start loading
        const playerId = firebase.auth().currentUser?.uid || Date.now().toString();

        try {
            const playerRef = db.collection('rooms').doc(roomId).collection('players').doc(playerId);
            const playerDoc = await playerRef.get();

            if (playerDoc.exists) {
                 // Player already exists (e.g., refreshed page), just update name if needed
                 await playerRef.update({ name });
                 setPlayerId(playerId);
                 setPlayerName(name);
                 localStorage.setItem('playerId', playerId);
                 localStorage.setItem('playerName', name);
                 // Re-listen to ensure state is fresh
                 listenToRoom(roomId);
                 setView('waiting');
            } else {
                // New player: Add and assign host if no host exists (without transaction - prone to race conditions)
                const playersSnap = await db.collection('rooms').doc(roomId).collection('players').get();
                const anyHost = playersSnap.docs.some(doc => doc.data().isHost);
                const isHost = !anyHost; // If no host exists, this player is the host

                const playerData = {
                    id: playerId,
                    name: name,
                    isHost: isHost,
                    initialSecretsSubmitted: false, // New flag for initial submission
                    hasVoted: false
                };

                await playerRef.set(playerData);

                setPlayerId(playerId);
                setPlayerName(name);
                localStorage.setItem('playerId', playerId);
                localStorage.setItem('playerName', name);

                 // Re-listen to ensure state is fresh after setting player doc
                 listenToRoom(roomId);
                 setView('waiting');
            }

        } catch (error) {
            console.error('Error adding player:', error);
            alert('Failed to add player.');
            leaveRoom(); // Clear local state if adding player fails
        }
        setIsLoading(false); // End loading
    };

    // Submit a secret (only used during initial_submitting phase)
    const submitSecret = async (secret) => {
        if (gamePhase !== 'initial_submitting') return; // Only allow submission in this phase
        try {
            const secretObj = {
                text: secret,
                ownerId: playerId,
                submittedAt: Date.now(),
                revealed: false // Ensure secret starts as unrevealed
            };

            // Get current secrets array first
            const roomDoc = await db.collection('rooms').doc(roomId).get();
            const currentSecrets = roomDoc.data().secrets || [];

            // Add new secret to the array
            const updatedSecrets = [...currentSecrets, secretObj];

            // Update the room with the new secrets array
            await db.collection('rooms').doc(roomId).update({
                secrets: updatedSecrets
            });

            // Mark player as having submitted initial secrets
            await db.collection('rooms').doc(roomId).collection('players').doc(playerId).update({ 
                initialSecretsSubmitted: true 
            });

        } catch (error) {
            console.error('Error submitting secret:', error);
            alert('Failed to submit secret. Please try again.');
        }
    };

    // Start the game (transition to initial submitting phase)
    const startGame = async () => {
        if (!amIHost()) return; // Only host can start
        if (gamePhase !== 'lobby') return; // Only start from lobby
        try {
            await db.collection('rooms').doc(roomId).update({
                gamePhase: 'initial_submitting',
                currentRound: 1 // Start with round 1
            });
             // Host doesn't need to do anything else, players will transition view based on phase
        } catch (error) {
            console.error('Error starting game:', error);
            alert('Failed to start game.');
        }
    };

    // Host ends initial submission and starts the first voting round
    const endInitialSubmission = async () => {
        if (!amIHost()) return; // Only host can end submission
        if (gamePhase !== 'initial_submitting') return; // Only end from initial submitting phase

        try {
            // Get the latest secrets array
            const roomDoc = await db.collection('rooms').doc(roomId).get();
            const allSecrets = roomDoc.data().secrets || [];

            // Make sure all secrets are marked as unrevealed
            const updatedSecrets = allSecrets.map(s => ({ ...s, revealed: false }));

            // Select a random unrevealed secret
            const secretToReveal = selectRandomUnrevealedSecret(updatedSecrets);

            if (!secretToReveal) {
                alert('No secrets were submitted or all have been revealed!');
                if (allSecrets.length > 0) {
                    await db.collection('rooms').doc(roomId).update({ gamePhase: 'game_over' });
                }
                return;
            }

            // Find the index of the secret to reveal
            const secretIndex = updatedSecrets.findIndex(s => s.text === secretToReveal.text && s.ownerId === secretToReveal.ownerId);

            if (secretIndex === -1) {
                console.error('Selected secret not found in secrets array!', secretToReveal);
                alert('Error revealing secret. Please try again.');
                return;
            }

            // Update the revealed status
            updatedSecrets[secretIndex] = { ...updatedSecrets[secretIndex], revealed: true };

            // Update everything in a single transaction to prevent flashing
            await db.collection('rooms').doc(roomId).update({
                secrets: updatedSecrets,
                gamePhase: 'voting',
                currentSecret: secretToReveal,
                votes: {},
                currentRound: 1
            });

            // Reset hasVoted for all players
            const playersSnap = await db.collection('rooms').doc(roomId).collection('players').get();
            const batch = db.batch();
            playersSnap.forEach(docSnap => {
                batch.update(docSnap.ref, { hasVoted: false });
            });
            await batch.commit();

        } catch (error) {
            console.error('Error ending initial submission:', error);
            alert('Failed to start voting round.');
        }
    };

    // Listen for all players voted, host auto-advances to results
    React.useEffect(() => {
        // Auto-transition from initial_submitting to voting when all players have submitted
        if (gamePhase === 'initial_submitting' && players.length > 0) {
            const allSubmitted = players.every(p => p.initialSecretsSubmitted);
            if (allSubmitted && amIHost()) {
                console.log('All players submitted, auto-ending submission phase');
                endInitialSubmission();
            }
        }

        // Transition from voting to results when all vote
        if (gamePhase === 'voting' && players.length > 0 && currentSecret) {
            const playersWhoCanVote = players.filter(p => !p.isHost || p.id === playerId);
            const allVoted = playersWhoCanVote.every(p => p.hasVoted);

            if (allVoted && amIHost()) {
                console.log('All players voted, transitioning to results phase');
                // Only transition if we're still in voting phase (prevent race conditions)
                db.collection('rooms').doc(roomId).get().then(doc => {
                    if (doc.data().gamePhase === 'voting') {
                        db.collection('rooms').doc(roomId).update({
                            gamePhase: 'results'
                        });
                    }
                });
            }
        }
    }, [gamePhase, players, roomId, currentSecret]);

    // Cast a vote (logic remains similar)
    const castVote = async (targetId) => {
        if (gamePhase !== 'voting') return; // Only allow voting in this phase
        if (players.find(p => p.id === playerId)?.hasVoted) return; // Prevent voting twice

        try {
            const voterId = firebase.auth().currentUser?.uid || playerId;
            // First mark this player as voted to prevent double voting
            await db.collection('rooms').doc(roomId).collection('players').doc(voterId).update({ 
                hasVoted: true 
            });
            
            // Then update the vote
            await db.collection('rooms').doc(roomId).update({
                [`votes.${voterId}`]: targetId
            });

            setVoteSubmitted(true); // Local state for immediate feedback
            setSelectedVote(null); // Clear selected vote after submission
        } catch (error) {
            console.error('Error casting vote:', error);
            alert('Failed to cast vote. Please try again.');
        }
    };

    // Start the next round (from results phase) or end game
    const startNextRound = async () => {
        if (!amIHost()) return; // Only host can start the next round
        if (gamePhase !== 'results') return; // Only start next round from results

        try {
            // Get the latest secrets array
            const roomDoc = await db.collection('rooms').doc(roomId).get();
            const allSecrets = roomDoc.data().secrets || [];

            const unrevealedSecretsCount = allSecrets.filter(s => !s.revealed).length;

            // If no unrevealed secrets left, end the game
            if (unrevealedSecretsCount === 0) {
                console.log('No more unrevealed secrets, ending game');
                await db.collection('rooms').doc(roomId).update({
                    gamePhase: 'game_over'
                });
                // Delete the room document after game over
                await db.collection('rooms').doc(roomId).delete();
                return; // Stop here, game is over
            }

            // Make sure all secrets are marked as unrevealed except the current one
            const updatedSecrets = allSecrets.map(s => ({
                ...s,
                revealed: s.text === currentSecret.text && s.ownerId === currentSecret.ownerId
            }));

            // Select a random unrevealed secret from the UPDATED secrets array
            const nextSecretToReveal = selectRandomUnrevealedSecret(updatedSecrets);

            // Note: selectRandomUnrevealedSecret already handles the case where there are no unrevealed secrets
            // but we added an explicit check above for clarity and safety.
            if (!nextSecretToReveal) {
                 // This case should ideally be caught by the unrevealedSecretsCount check above, but good to have.
                 console.log('No unrevealed secrets found after filtering, ending game.');
                 await db.collection('rooms').doc(roomId).update({
                    gamePhase: 'game_over'
                 });
                 // Delete the room document after game over
                 await db.collection('rooms').doc(roomId).delete();
                 return;
            }

            // Find the index of the secret to reveal
            const secretIndex = updatedSecrets.findIndex(s => s.text === nextSecretToReveal.text && s.ownerId === nextSecretToReveal.ownerId);

            if (secretIndex === -1) {
                console.error('Next secret not found in secrets array!', nextSecretToReveal);
                alert('Error revealing next secret. Please try again.');
                return;
            }

            // Update the revealed status for the next secret
            updatedSecrets[secretIndex] = { ...updatedSecrets[secretIndex], revealed: true };

            // First reset all players' voting status
            const playersSnap = await db.collection('rooms').doc(roomId).collection('players').get();
            const batch = db.batch();
            playersSnap.forEach(docSnap => {
                batch.update(docSnap.ref, { hasVoted: false });
            });
            await batch.commit();

            // Then update the game state
            await db.collection('rooms').doc(roomId).update({
                secrets: updatedSecrets,
                gamePhase: 'voting',
                currentSecret: nextSecretToReveal,
                votes: {},
                currentRound: currentRound + 1
            });

        } catch (error) {
            console.error('Error starting next round:', error);
            alert('Failed to start next round.');
        }
    };

    // Helper to check if current user is host (robust)
    const amIHost = () => {
        const me = players.find(p => p.id === playerId);
        const isHost = !!(me && me.isHost);
        return isHost;
    };

    // Helper: render player submission status (for initial submitting)
    const renderInitialSubmissionStatus = () => (
        <ul className="mb-4">
            {players.map(p => (
                <li key={p.id} className="flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.initialSecretsSubmitted ? <span className="text-green-600">✅ Submitted</span> : <span className="text-gray-400">⌛ Not Submitted</span>}
                </li>
            ))}
        </ul>
    );

    // Helper: render player voting status
    const renderVotingStatus = () => (
        <ul className="mb-4">
            {players.map(p => (
                <li key={p.id} className="flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.hasVoted ? <span className="text-green-600">✅ Voted</span> : <span className="text-gray-400">⌛ Not Voted</span>}
                </li>
            ))}
        </ul>
    );

    // Render the appropriate view based on gamePhase and local state
    const renderView = () => {
        // Always show a base container, content changes based on phase
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4">
                <h1 className="text-4xl font-bold mb-8">Secret Guessing Game</h1>
                {/* Render content based on view and gamePhase */}
                {view === 'lobby' && (
                    <div className="w-full max-w-md">
                        <form className="w-full max-w-md mb-6" onSubmit={e => {
                            e.preventDefault();
                            const roomNameInput = e.target.elements[0];
                            createRoom(roomNameInput.value);
                        }}>
                            <input
                                type="text"
                                placeholder="Create a room name (e.g. แม่กำปอง)"
                                className="w-full p-3 border rounded-lg mb-2"
                                maxLength="30"
                                disabled={isLoading} // Disable input while loading
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                                disabled={isLoading} // Disable button while loading
                            >
                                {isLoading ? 'Creating Room...' : 'Create New Room'}
                            </button>
                        </form>
                        <form className="w-full max-w-md mb-6" onSubmit={e => {
                            e.preventDefault();
                            const roomCodeInput = e.target.elements[0];
                            const code = roomCodeInput.value.trim().toUpperCase();
                            joinRoomByCode(code);
                        }}>
                            <input
                                type="text"
                                placeholder="Enter room code (e.g. ABC123)"
                                className="w-full p-3 border rounded-lg mb-2"
                                maxLength="6"
                                style={{ textTransform: 'uppercase' }}
                                required
                                disabled={isLoading} // Disable input while loading
                            />
                            <button
                                type="submit"
                                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                                disabled={isLoading} // Disable button while loading
                            >
                                {isLoading ? 'Joining Room...' : 'Join by Code'}
                            </button>
                        </form>
                        <div className="w-full max-w-md mb-4">
                            <h2 className="text-xl font-semibold mb-2">Available Rooms</h2>
                            <button onClick={fetchRoomList} className="mb-2 text-blue-500 underline" disabled={isLoading}>
                                {isLoading ? 'Refreshing...' : 'Refresh'}
                            </button>
                            {isLoading && <div className="text-gray-500">Loading rooms...</div>}
                            {!isLoading && roomList.length === 0 && <div className="text-gray-500">No rooms available</div>}
                            {!isLoading && roomList.length > 0 && (
                                <ul className="space-y-2">
                                    {roomList.map(room => {
                                        // Use room.name if it exists, otherwise use a placeholder
                                        const displayName = room.name ? room.name : '(No Name)';
                                        return (
                                            <li key={room.id} className="flex items-center justify-between bg-white rounded p-2 shadow">
                                                <span>Room: <b>{displayName}</b> <span className="text-xs text-gray-500">({room.code || room.id})</span></span>
                                                <button
                                                    onClick={() => joinRoomByCode(room.code || room.id)}
                                                    className="ml-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                                    disabled={isLoading}
                                                >Join</button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                )}

                {view === 'enterName' && (
                    <div className="w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Enter Your Name</h2>
                        <form onSubmit={e => {
                            e.preventDefault();
                            const nameInput = e.target.elements[0];
                            if (nameInput.value.trim()) {
                                addPlayer(nameInput.value.trim());
                            }
                        }}>
                            <input
                                type="text"
                                placeholder="Your name"
                                className="w-full p-3 border rounded-lg mb-4"
                                maxLength="30"
                                required
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Joining...' : 'Join Game'}
                            </button>
                        </form>
                        <button
                            onClick={leaveRoom}
                            className="w-full mt-4 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {(view === 'waiting' || view === 'submitted') && roomName && (
                    // Content shown when inside a room (regardless of phase)
                    <div className="w-full max-w-md flex flex-col items-center">
                        <h2 className="text-2xl font-bold mb-4">Room: {roomName}</h2>
                        <SecretComponents.PlayerList players={players} />

                        {/* Lobby specific content */}
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

                        {/* Initial Submitting Phase */}
                        {gamePhase === 'initial_submitting' && (
                            players.find(p => p.id === playerId)?.initialSecretsSubmitted ? (
                                <div className="flex flex-col items-center">
                                    <h2 className="text-2xl font-bold mb-4">Secret Submitted!</h2>
                                    {renderInitialSubmissionStatus()}
                                    <p className="mb-4">Waiting for all players to submit their secrets...</p>
                                    {!amIHost() && (
                                        <div className="mt-4 text-gray-500">Waiting for other players to submit...</div>
                                    )}
                                </div>
                            ) : (
                                <SecretComponents.SecretSubmission
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        submitSecret(e.target.elements[0].value);
                                    }}
                                    onBack={leaveRoom}
                                />
                            )
                        )}

                        {/* Voting Phase */}
                        {gamePhase === 'voting' && currentSecret && (
                            <div className="flex flex-col items-center w-full">
                                <h2 className="text-2xl font-bold mb-4">Round {currentRound}</h2>
                                <h3 className="text-xl mb-4">Who's Secret Is This?</h3>
                                <div className="bg-white rounded-lg shadow p-6 mb-8 w-full">
                                    <p className="text-lg mb-4">{currentSecret.text}</p>
                                </div>
                                
                                {players.find(p => p.id === playerId)?.hasVoted ? (
                                    <div className="flex flex-col items-center">
                                        <h2 className="text-2xl font-bold mb-4">Vote Submitted!</h2>
                                        {renderVotingStatus()}
                                        <p className="mb-4">Waiting for all players to vote...</p>
                                    </div>
                                ) : (
                                    <form onSubmit={e => {
                                        e.preventDefault();
                                        if (selectedVote) castVote(selectedVote);
                                    }} className="w-full">
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            {players.map(player => (
                                                player.id !== playerId && (
                                                    <button
                                                        key={player.id}
                                                        type="button"
                                                        onClick={() => setSelectedVote(player.id)}
                                                        className={`py-3 px-6 rounded-lg transition ${
                                                            selectedVote === player.id 
                                                                ? 'bg-blue-600 text-white' 
                                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                                        }`}
                                                    >
                                                        {player.name}
                                                    </button>
                                                )
                                            ))}
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={!selectedVote}
                                            className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition disabled:opacity-50"
                                        >
                                            Submit Vote
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}

                        {/* Results Phase */}
                        {gamePhase === 'results' && currentSecret && (
                            <div className="flex flex-col items-center w-full">
                                <h2 className="text-2xl font-bold mb-4">Round {currentRound} Results</h2>
                                <SecretComponents.ResultsPhase
                                    secret={currentSecret.text}
                                    votes={votes}
                                    players={players}
                                    onBack={leaveRoom}
                                />
                                {amIHost() && (
                                    <button
                                        onClick={startNextRound}
                                        className="mt-6 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition"
                                    >
                                        {secrets.filter(s => !s.revealed).length > 0 ? 'Next Round' : 'End Game'}
                                    </button>
                                )}
                                {!amIHost() && (
                                    <div className="mt-6 text-gray-500">
                                        {secrets.filter(s => !s.revealed).length > 0 ? 'Waiting for host to start next round...' : 'Game Over!'}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Game Over Phase */}
                        {gamePhase === 'game_over' && (
                            <div className="flex flex-col items-center">
                                <h2 className="text-4xl font-bold mb-4">Game Over!</h2>
                                <p className="mb-8">All secrets have been revealed.</p>
                                <button
                                    onClick={leaveRoom}
                                    className="mt-4 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400 transition"
                                >
                                    Back to Lobby
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Fallback/Loading state */}
                {isLoading && <div className="text-gray-500">Loading...</div>}
                {/* Initial state or if somehow not in a recognized phase/room */}
                {!(view === 'lobby' || view === 'enterName' || view === 'waiting' || view === 'submitted') && !isLoading && (
                    <div className="text-gray-500">Initializing game...</div>
                )}
            </div>
        );
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

    // Render the app
    return renderView();
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root')); 