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
    const [roomCode, setRoomCode] = React.useState('');
    const [players, setPlayers] = React.useState([]);
    const [secrets, setSecrets] = React.useState([]);
    const [currentSecret, setCurrentSecret] = React.useState(null);
    const [votes, setVotes] = React.useState({});
    const [gamePhase, setGamePhase] = React.useState('lobby');
    const [currentRound, setCurrentRound] = React.useState(0);
    const [fakeSecretMode, setFakeSecretMode] = React.useState(false);

    // Create a new room
    const createRoom = async () => {
        const code = generateRoomCode();
        setRoomCode(code);
        
        try {
            await db.collection('rooms').doc(code).set({
                players: [],
                secrets: [],
                currentSecret: null,
                votes: {},
                gamePhase: 'lobby',
                currentRound: 0,
                fakeSecretMode: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            setView('waiting');
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room. Please try again.');
        }
    };

    // Join an existing room
    const joinRoom = async (code) => {
        try {
            const roomRef = db.collection('rooms').doc(code);
            const roomDoc = await roomRef.get();
            
            if (!roomDoc.exists) {
                alert('Room not found. Please check the code and try again.');
                return;
            }
            
            setRoomCode(code);
            setView('waiting');
            
            // Listen for room updates
            roomRef.onSnapshot((doc) => {
                const data = doc.data();
                setPlayers(data.players);
                setSecrets(data.secrets);
                setCurrentSecret(data.currentSecret);
                setVotes(data.votes);
                setGamePhase(data.gamePhase);
                setCurrentRound(data.currentRound);
                setFakeSecretMode(data.fakeSecretMode);
            });
        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room. Please try again.');
        }
    };

    // Add a player to the room
    const addPlayer = async (name) => {
        try {
            const playerId = firebase.auth().currentUser?.uid || Date.now().toString();
            const player = { id: playerId, name };
            
            await db.collection('rooms').doc(roomCode).update({
                players: firebase.firestore.FieldValue.arrayUnion(player)
            });
            
            setView('waiting');
        } catch (error) {
            console.error('Error adding player:', error);
            alert('Failed to add player. Please try again.');
        }
    };

    // Submit a secret
    const submitSecret = async (secret) => {
        try {
            const secretObj = {
                text: secret,
                ownerId: firebase.auth().currentUser?.uid || Date.now().toString(),
                submittedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('rooms').doc(roomCode).update({
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
            
            await db.collection('rooms').doc(roomCode).update({
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
            
            await db.collection('rooms').doc(roomCode).update({
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

    // Render the appropriate view
    const renderView = () => {
        switch (view) {
            case 'lobby':
                return (
                    <SecretComponents.Lobby
                        onCreateRoom={createRoom}
                        onJoinRoom={() => setView('join')}
                    />
                );
            case 'join':
                return (
                    <SecretComponents.RoomCodeInput
                        onSubmit={(e) => {
                            e.preventDefault();
                            joinRoom(e.target.elements[0].value);
                        }}
                        onBack={() => setView('lobby')}
                    />
                );
            case 'waiting':
                return (
                    <div className="flex flex-col items-center justify-center min-h-screen p-4">
                        <h2 className="text-2xl font-bold mb-4">Room Code: {roomCode}</h2>
                        <SecretComponents.PlayerList players={players} />
                        {gamePhase === 'submitting' && (
                            <SecretComponents.SecretSubmission
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    submitSecret(e.target.elements[0].value);
                                }}
                                onBack={() => setView('lobby')}
                            />
                        )}
                        {gamePhase === 'voting' && currentSecret && (
                            <SecretComponents.VotingPhase
                                secret={currentSecret.text}
                                players={players}
                                onVote={castVote}
                                onBack={() => setView('lobby')}
                            />
                        )}
                        {gamePhase === 'results' && currentSecret && (
                            <SecretComponents.ResultsPhase
                                secret={currentSecret.text}
                                votes={votes}
                                players={players}
                                onNextRound={startNewRound}
                                onBack={() => setView('lobby')}
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