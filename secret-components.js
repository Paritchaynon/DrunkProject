// Game Components
const Lobby = ({ onJoinRoom, onCreateRoom }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold mb-8">Secret Guessing Game</h1>
        <div className="space-y-4 w-full max-w-md">
            <button
                onClick={onCreateRoom}
                className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
            >
                Create New Room
            </button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-100 text-gray-500">or</span>
                </div>
            </div>
            <button
                onClick={onJoinRoom}
                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition"
            >
                Join Existing Room
            </button>
        </div>
    </div>
);

const RoomCodeInput = ({ onSubmit, onBack }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Enter Room Code</h2>
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
            <input
                type="text"
                placeholder="Enter 6-digit code"
                className="w-full p-3 border rounded-lg"
                maxLength="6"
                pattern="[A-Za-z0-9]{6}"
                required
            />
            <div className="flex space-x-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition"
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
                >
                    Join
                </button>
            </div>
        </form>
    </div>
);

const PlayerList = ({ players }) => (
    <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-xl font-semibold mb-4">Players ({players.length})</h3>
        <ul className="space-y-2">
            {players.map(player => (
                <li key={player.id} className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>{player.name}</span>
                </li>
            ))}
        </ul>
    </div>
);

const SecretSubmission = ({ onSubmit, onBack }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Submit Your Secret</h2>
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-4">
            <textarea
                placeholder="Type your secret here..."
                className="w-full p-3 border rounded-lg h-32"
                required
            />
            <div className="flex space-x-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition"
                >
                    Back
                </button>
                <button
                    type="submit"
                    className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
                >
                    Submit
                </button>
            </div>
        </form>
    </div>
);

const VotingPhase = ({ secret, players, onVote, onBack }) => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h2 className="text-2xl font-bold mb-4">Who's Secret Is This?</h2>
        <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-md w-full">
            <p className="text-lg mb-4">{secret}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
            {players.map(player => (
                <button
                    key={player.id}
                    onClick={() => onVote(player.id)}
                    className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
                >
                    {player.name}
                </button>
            ))}
        </div>
    </div>
);

const ResultsPhase = ({ secret, votes, players, onNextRound, onBack }) => {
    const voteCounts = players.reduce((acc, player) => {
        acc[player.id] = Object.values(votes).filter(v => v === player.id).length;
        return acc;
    }, {});

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <h2 className="text-2xl font-bold mb-4">Voting Results</h2>
            <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-md w-full">
                <p className="text-lg mb-4">{secret}</p>
                <div className="space-y-4">
                    {players.map(player => (
                        <div key={player.id} className="flex justify-between items-center">
                            <span>{player.name}</span>
                            <span className="font-bold">{voteCounts[player.id] || 0} votes</span>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex space-x-4">
                <button
                    onClick={onBack}
                    className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition"
                >
                    Back to Lobby
                </button>
                <button
                    onClick={onNextRound}
                    className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
                >
                    Next Round
                </button>
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