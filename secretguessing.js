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

// Game Components
const Lobby = ({ onJoinRoom, onCreateRoom }) => (
    <div className="setup-container animate__animated animate__fadeIn">
        <button onClick={() => window.location.href = 'index.html'} className="hub-button">🏠</button>
        <div className="container">
            <div className="title-container">
                <h1 className="game-title">Secret Guessing Game</h1>
                <div className="game-subtitle">วงเหล้า Edition</div>
            </div>
            <div className="game-rules">
                <h3>📜 กติกา</h3>
                <ul>
                    <li>🎯 ผู้เล่นจะต้องทายความลับของเพื่อน</li>
                </ul>
            </div>
            <form className="input-group" onSubmit={onCreateRoom}>
                <input type="text" placeholder="ตั้งชื่อห้อง (เช่น แม่กำปอง)" className="form-input" maxLength="30" />
                <button type="submit" className="start-button">🎮 สร้างห้องใหม่</button>
            </form>
            <form className="input-group" onSubmit={onJoinRoom}>
                <input type="text" placeholder="รหัสห้อง (เช่น ABC123)" className="form-input" maxLength="6" style={{ textTransform: 'uppercase' }} required />
                <button type="submit" className="start-button">🔗 เข้าร่วมห้อง</button>
            </form>
            <div className="room-list-container" style={{ textAlign: 'center' }}>
                <div className="room-list-header">ห้องที่เปิดอยู่</div>
                <button className="start-button" style={{marginBottom: '10px'}} onClick={fetchRoomList}>รีเฟรช</button>
                {isLoading && <div className="game-subtitle">กำลังโหลด...</div>}
                {!isLoading && roomList.length === 0 && <div className="game-subtitle">ไม่มีห้องที่เปิดอยู่</div>}
                {!isLoading && roomList.length > 0 && (
                    <ul className="room-list" style={{ display: 'inline-block', textAlign: 'left', margin: '0 auto' }}>
                        {roomList.map(room => (
                            <li key={room.id} className="room-list-item" style={{ margin: '0 auto', maxWidth: 350 }}>
                                <span>
                                    {room.name || '(ไม่มีชื่อห้อง)'}
                                    <span style={{ color: '#6b7280', fontSize: '0.95em', marginLeft: 8 }}>
                                        ({room.code || room.id})
                                    </span>
                                </span>
                                <button className="choice-btn" onClick={() => onJoinRoom(room.code || room.id)}>เข้าร่วม</button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    </div>
);

const RoomCodeInput = ({ onSubmit, onBack }) => (
    <div className="setup-container animate__animated animate__fadeIn">
        <button onClick={onBack} className="hub-button">🏠</button>
        <div className="container">
            <div className="title-container">
                <h1 className="game-title">ใส่ชื่อของคุณ</h1>
            </div>
            <form className="input-group" onSubmit={onSubmit}>
                <input type="text" placeholder="ชื่อของคุณ" className="form-input" maxLength="30" required />
                <button type="submit" className="start-button">เข้าร่วมเกม</button>
            </form>
        </div>
    </div>
);

const PlayerList = ({ players }) => (
    <div className="player-list-container">
        <div className="player-list-header">
            <strong>👥 ผู้เล่น ({players.length})</strong>
        </div>
        <div className="player-list">
            <ul className="player-order-list">
                {players.map(player => (
                    <li key={player.id} className="player-item">
                        <span className="player-status"></span>
                        <span>{player.name}</span>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

const SecretSubmission = ({ onSubmit, onBack }) => (
    <div className="container animate__animated animate__fadeIn">
        <div className="title-container">
            <h1 className="game-title">ส่งความลับ</h1>
        </div>
        <form onSubmit={onSubmit} className="input-group">
            <input type="text" placeholder="ความลับ" className="form-input" required />
            <button type="submit" className="start-button">ส่งความลับ</button>
        </form>
    </div>
);

const VotingPhase = ({ secret, players, onVote, onBack, bigSecret }) => {
    const [selectedPlayerId, setSelectedPlayerId] = React.useState(null);
    const [submitted, setSubmitted] = React.useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (selectedPlayerId && !submitted) {
            onVote(selectedPlayerId);
            setSubmitted(true);
        }
    };
    return (
        <div className="container animate__animated animate__fadeIn voting-phase">
            <div className="title-container">
                <h1 className="game-title">ทายความลับ</h1>
                <div className="game-subtitle">ใครเป็นเจ้าของความลับนี้?</div>
            </div>
            <div className="question-display animate__animated animate__fadeIn">
                <div className={bigSecret ? "question-text big-secret" : "question-text"}>{secret}</div>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="player-carousel" style={{ justifyContent: 'center' }}>
                    {players.map(player => (
                        <div
                            key={player.id}
                            className={`player-card${selectedPlayerId === player.id ? ' selected animate__animated animate__pulse' : ''}`}
                            onClick={() => !submitted && setSelectedPlayerId(player.id)}
                            style={{ pointerEvents: submitted ? 'none' : 'auto', opacity: submitted && selectedPlayerId !== player.id ? 0.5 : 1 }}
                        >
                             <span className="player-icon">👤</span>
                             <span>{player.name}</span>
                             {/* Voting status indicator */}
                             {player.hasVoted ? (
                                 <span style={{ marginLeft: '5px', color: '#10B981' }}>✅</span> // Voted
                             ) : (
                                 <span style={{ marginLeft: '5px', color: '#EF4444' }}>🕒</span> // Not Voted
                             )}
                        </div>
                    ))}
                </div>
                <button type="submit" className="start-button" disabled={!selectedPlayerId || submitted}>
                    {submitted ? 'ส่งคำตอบแล้ว!' : 'ส่งคำตอบ'}
                </button>
            </form>
        </div>
    );
};

const ResultsPhase = ({ secret, votes, players, onBack, bigSecret }) => {
    const voteCounts = players.reduce((acc, player) => {
        acc[player.id] = Object.values(votes).filter(v => v === player.id).length;
        return acc;
    }, {});
    return (
        <div className="container animate__animated animate__fadeIn">
            <div className="title-container">
                <h1 className="game-title">ผลการทาย</h1>
            </div>
            <div className="question-display animate__animated animate__fadeIn">
                <div className={bigSecret ? "question-text big-secret" : "question-text"}>{secret}</div>
                <div className="results-container">
                    {players.map(player => (
                        <div key={player.id} className="result-item animate__animated animate__fadeIn">
                            <span>👤 {player.name}</span>
                            <span className="font-bold">🎯 {voteCounts[player.id] || 0} โหวต</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// Export components
window.SecretComponents = {
    Lobby,
    RoomCodeInput,
    PlayerList,
    SecretSubmission,
    VotingPhase,
    ResultsPhase
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
    const [copied, setCopied] = React.useState(false);
    const handleCopyCode = () => {
        if (roomId) {
            navigator.clipboard.writeText(roomId);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        }
    };

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

    // Helper: render player list (only in lobby view)
    const renderPlayerList = () => {
        if (gamePhase === 'lobby') {
            return (
                <div className="player-list-container">
                  <div className="player-list-header">
                    <strong>👥 ผู้เล่น ({players.length})</strong>
                  </div>
                  <div className="player-list">
                    <ul className="player-order-list">
                      {players.map(player => (
                        <li key={player.id} className="player-item">
                          <span className="player-status"></span>
                          <span>{player.name}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
        } else {
            return null; // Hide player list in other phases
        }
      };
      
    // Main render function
    const renderView = () => {
        // Render the hub button is now handled directly in components

        if (view === 'lobby') {
            return (
                <div className="container animate__animated animate__fadeIn view-lobby">
                    {/* Hub button is now in Lobby component */}
                    <div className="title-container">
                        <h1 className="game-title">Secret Guessing Game</h1>
                        <div className="game-subtitle">วงเหล้า Edition</div>
                    </div>
                    <div className="game-rules">
                        <h3>📜 กติกา</h3>
                        <ul>
                            <li>🎯 ผู้เล่นจะต้องทายความลับของเพื่อน</li>
                        </ul>
                    </div>
                    <form className="input-group" onSubmit={e => { e.preventDefault(); createRoom(e.target.elements[0].value); }}>
                        <input type="text" placeholder="ตั้งชื่อห้อง (เช่น แม่กำปอง)" className="form-input" maxLength="30" />
                        <button type="submit" className="start-button">🎮 สร้างห้องใหม่</button>
                    </form>
                    <form className="input-group" onSubmit={e => { e.preventDefault(); joinRoomByCode(e.target.elements[0].value.trim().toUpperCase()); }}>
                        <input type="text" placeholder="รหัสห้อง (เช่น ABC123)" className="form-input" maxLength="6" style={{ textTransform: 'uppercase' }} required />
                        <button type="submit" className="start-button">🔗 เข้าร่วมห้อง</button>
                    </form>
                    <div className="room-list-container" style={{ textAlign: 'center' }}>
                        <div className="room-list-header">ห้องที่เปิดอยู่</div>
                        <button className="start-button" style={{marginBottom: '10px'}} onClick={fetchRoomList}>รีเฟรช</button>
                        {isLoading && <div className="game-subtitle">กำลังโหลด...</div>}
                        {!isLoading && roomList.length === 0 && <div className="game-subtitle">ไม่มีห้องที่เปิดอยู่</div>}
                        {!isLoading && roomList.length > 0 && (
                            <ul className="room-list" style={{ display: 'inline-block', textAlign: 'left', margin: '0 auto' }}>
                                {roomList.map(room => (
                                    <li key={room.id} className="room-list-item" style={{ margin: '0 auto', maxWidth: 350 }}>
                                        <span>
                                            {room.name || '(ไม่มีชื่อห้อง)'}
                                            <span style={{ color: '#6b7280', fontSize: '0.95em', marginLeft: 8 }}>
                                                ({room.code || room.id})
                                            </span>
                                        </span>
                                        <button className="choice-btn" onClick={() => joinRoomByCode(room.code || room.id)}>เข้าร่วม</button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            );
        }
        if (view === 'enterName') {
            return (
                <div className="container animate__animated animate__fadeIn view-enterName">
                     {/* Hub button is now in RoomCodeInput component */}
                    <div className="title-container">
                        <h1 className="game-title">ใส่ชื่อของคุณ</h1>
                    </div>
                    <form className="input-group" onSubmit={e => { e.preventDefault(); addPlayer(e.target.elements[0].value.trim()); }}>
                        <input type="text" placeholder="ชื่อของคุณ" className="form-input" maxLength="30" required />
                        <button type="submit" className="start-button">เข้าร่วมเกม</button>
                    </form>
                </div>
            );
        }
        if ((view === 'waiting' || view === 'submitted') && roomName) {
            return (
                <div className="container animate__animated animate__fadeIn view-waiting">
                    <button onClick={() => window.location.href = 'index.html'} className="hub-button">🏠</button>
                    <div className="title-container">
                        <h1 className="game-title">{roomName}</h1>
                        <div className="game-subtitle">
                            รหัสห้อง:
                            <span
                                className={copied ? "room-code copied" : "room-code"}
                                onClick={handleCopyCode}
                                title={copied ? "คัดลอกแล้ว!" : "แตะเพื่อคัดลอก"}
                            >
                                {roomId}
                            </span>
                            {copied && <span style={{color:'#059669',marginLeft:8,fontSize:'0.95em'}}>คัดลอกแล้ว!</span>}
                        </div>
                        <div className="game-subtitle">รอผู้เล่นเข้าร่วมห้อง</div>
                    </div>
                    {renderPlayerList()}
                    {gamePhase === 'lobby' && amIHost() && (
                        <button onClick={startGame} className="start-button">เริ่มเกม</button>
                    )}
                    {gamePhase === 'lobby' && !amIHost() && (
                        <div className="game-subtitle">รอเจ้าของห้องเริ่มเกม...</div>
                    )}
                    {gamePhase === 'initial_submitting' && (
                        players.find(p => p.id === playerId)?.initialSecretsSubmitted ? (
                            <div className="game-subtitle">รอผู้เล่นคนอื่นส่งความลับ...</div>
                        ) : (
                            <SecretComponents.SecretSubmission
                                onSubmit={e => { e.preventDefault(); submitSecret(e.target.elements[0].value); }}
                                onBack={leaveRoom}
                            />
                        )
                    )}
                    {gamePhase === 'voting' && currentSecret && (
                        <SecretComponents.VotingPhase
                            secret={currentSecret.text}
                            players={players}
                            onVote={castVote}
                            onBack={leaveRoom}
                            bigSecret={true}
                        />
                    )}
                    {gamePhase === 'results' && currentSecret && (
                        <>
                        <SecretComponents.ResultsPhase
                            secret={currentSecret.text}
                            votes={votes}
                            players={players}
                            onBack={leaveRoom}
                            bigSecret={true}
                        />
                        {amIHost() && secrets.filter(s => !s.revealed).length > 0 && (
                            <button onClick={startNextRound} className="start-button">รอบถัดไป</button>
                        )}
                        {amIHost() && (
                            <button onClick={async () => { await db.collection('rooms').doc(roomId).update({ gamePhase: 'game_over' }); }} className="end-button">จบเกม</button>
                        )}
                        </>
                    )}
                    {gamePhase === 'game_over' && (
                        <div className="title-container">
                            <h1 className="game-title">เกมจบแล้ว!</h1>
                            <div className="game-subtitle">ความลับทั้งหมดถูกเปิดเผยแล้ว</div>
                            <button onClick={leaveRoom} className="start-button">กลับสู่หน้าหลัก</button>
                        </div>
                    )}
                </div>
            );
        }
        return <div className="container"><div className="game-title">Loading...</div></div>;
    };

    // Leave room logic
    const leaveRoom = async () => {
        try {
            if (roomId && playerId) {
                const playerRef = db.collection('rooms').doc(roomId).collection('players').doc(playerId);
                await playerRef.delete();

                // After deleting the player, check if the room is empty
                const playersSnap = await db.collection('rooms').doc(roomId).collection('players').get();
                if (playersSnap.empty) {
                    console.log(`Room ${roomId} is empty, deleting room document.`);
                    await db.collection('rooms').doc(roomId).delete();
                }
            }
        } catch (e) {
            // Ignore errors (e.g., room or player already deleted)
            console.warn('Error during leaveRoom cleanup:', e);
        }
        // Clean up local state and storage regardless of Firebase operations
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
    return (
        <>
            <button onClick={() => window.location.href = 'index.html'} className="hub-button">🏠</button>
            {renderView()}
        </>
    );
};

// Render the app
ReactDOM.render(<App />, document.getElementById('root')); 