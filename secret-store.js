// Zustand store for game state management
const createSecretStore = (set) => ({
    // Game state
    roomCode: '',
    players: [],
    secrets: [],
    currentSecret: null,
    votes: {},
    gamePhase: 'lobby', // lobby, submitting, voting, results
    currentRound: 0,
    fakeSecretMode: false,
    
    // Player state
    currentPlayer: null,
    playerName: '',
    
    // Actions
    setRoomCode: (code) => set({ roomCode: code }),
    addPlayer: (player) => set((state) => ({ 
        players: [...state.players, player] 
    })),
    removePlayer: (playerId) => set((state) => ({
        players: state.players.filter(p => p.id !== playerId)
    })),
    addSecret: (secret) => set((state) => ({
        secrets: [...state.secrets, secret]
    })),
    setCurrentSecret: (secret) => set({ currentSecret: secret }),
    addVote: (voterId, targetId) => set((state) => ({
        votes: { ...state.votes, [voterId]: targetId }
    })),
    setGamePhase: (phase) => set({ gamePhase: phase }),
    incrementRound: () => set((state) => ({
        currentRound: state.currentRound + 1
    })),
    toggleFakeSecretMode: () => set((state) => ({
        fakeSecretMode: !state.fakeSecretMode
    })),
    setCurrentPlayer: (player) => set({ currentPlayer: player }),
    setPlayerName: (name) => set({ playerName: name }),
    
    // Reset game
    resetGame: () => set({
        secrets: [],
        currentSecret: null,
        votes: {},
        gamePhase: 'lobby',
        currentRound: 0
    })
});

// Create and export the store
const useSecretStore = createSecretStore; 