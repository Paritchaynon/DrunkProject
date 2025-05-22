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
                    <li>🍺 ถ้าทายผิดต้องดื่ม!</li>
                    <li>🤔 ถ้าทายถูกเพื่อนต้องดื่ม!</li>
                    <li>😅 ถ้าไม่ยอมบอกความลับต้องดื่ม 2 เท่า!</li>
                </ul>
            </div>

            <div className="choice-buttons">
                <button
                    onClick={onCreateRoom}
                    className="choice-btn truth-btn animate__animated animate__pulse"
                >
                    🎮 สร้างห้องใหม่
                </button>
                <button
                    onClick={onJoinRoom}
                    className="choice-btn dare-btn animate__animated animate__pulse"
                >
                    🔗 เข้าร่วมห้อง
                </button>
            </div>
        </div>
    </div>
);

const RoomCodeInput = ({ onSubmit, onBack }) => (
    <div className="setup-container animate__animated animate__fadeIn">
        <button onClick={onBack} className="hub-button">🏠</button>
        <div className="container">
            <div className="title-container">
                <h1 className="game-title">เข้าร่วมห้อง</h1>
            </div>
            
            <form onSubmit={onSubmit} className="space-y-4">
                <div className="input-group">
                    <label>รหัสห้อง:</label>
                    <input
                        type="text"
                        placeholder="กรอกรหัส 6 ตัวอักษร"
                        className="form-input"
                        maxLength="6"
                        pattern="[A-Za-z0-9]{6}"
                        required
                    />
                </div>
                <button type="submit" className="start-button animate__animated animate__pulse">
                    🎯 เข้าร่วม
                </button>
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
                    <li key={player.id} className="player-item animate__animated animate__fadeIn">
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
        <button onClick={onBack} className="hub-button">🏠</button>
        <div className="title-container">
            <h1 className="game-title">เขียนความลับของคุณ</h1>
            <div className="game-subtitle">กรอกความลับของคุณด้านล่าง</div>
        </div>
        <form onSubmit={onSubmit} className="input-group">
            <label htmlFor="secret-input">🤫 ความลับ:</label>
            <textarea
                id="secret-input"
                placeholder="พิมพ์ความลับของคุณที่นี่..."
                className="form-input"
                style={{ height: '120px' }}
                required
            />
            <button type="submit" className="start-button animate__animated animate__pulse">
                ✨ ส่งความลับ
            </button>
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
            <button onClick={onBack} className="hub-button">🏠</button>
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
            <button onClick={onBack} className="hub-button">🏠</button>
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