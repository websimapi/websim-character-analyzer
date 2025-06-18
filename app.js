const { useState, useEffect, useMemo } = React;
const { Chart: ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement } = ChartJS_2;
const { Radar } = ReactChartJS2;

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement);

const STAT_CONFIG = {
    strength: { weight: 0.3, max: 10 },
    speed: { weight: 0.2, max: 10 },
    intelligence: { weight: 0.3, max: 10 },
    popularity: { weight: 0.2, max: 10 },
};

const calculateCharacterScore = (character) => {
    let rawScore = 0;
    for (const stat in STAT_CONFIG) {
        rawScore += (character.stats[stat] / STAT_CONFIG[stat].max) * STAT_CONFIG[stat].weight;
    }
    return Math.round(rawScore * 100);
};

const CharacterCard = ({ character, onSelect, onInfo, team }) => {
    const teamClass = team === 1 ? 'selected-team1' : team === 2 ? 'selected-team2' : '';
    return (
        <div className={`character-card ${teamClass}`}>
            <img src={character.image} alt={character.name} onClick={() => onInfo(character)} />
            <h4>{character.name}</h4>
            <div className="score">Score: {character.score}</div>
            <button onClick={() => onSelect(character)} style={{marginTop: '5px', fontSize: '0.7rem', padding: '2px 4px'}}>Add to Team</button>
        </div>
    );
};

const TeamPanel = ({ team, teamNumber, teamName, onRemove }) => {
    const totalScore = useMemo(() => team.reduce((sum, char) => sum + char.score, 0), [team]);
    const teamTitleClass = teamNumber === 1 ? 'team1-title' : 'team2-title';

    return (
        <div className="team-panel">
            <div className="team-header">
                <h3 className={teamTitleClass}>{teamName}</h3>
                <span className="total-score">Total Score: {totalScore}</span>
            </div>
            <div className="team-grid">
                {team.map(char => (
                    <div key={char.id} className="team-character" onClick={() => onRemove(char, teamNumber)}>
                        <img src={char.image} alt={char.name} />
                        <p>{char.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const CharacterModal = ({ character, onClose }) => {
    if (!character) return null;

    const chartData = {
        labels: Object.keys(character.stats).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        datasets: [
            {
                label: character.name,
                data: Object.values(character.stats),
                backgroundColor: 'rgba(88, 166, 255, 0.2)',
                borderColor: 'rgba(88, 166, 255, 1)',
                borderWidth: 1,
            },
        ],
    };
    
    const chartOptions = {
        scales: {
            r: {
                angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
                grid: { color: 'rgba(255, 255, 255, 0.2)' },
                pointLabels: { color: '#c9d1d9' },
                ticks: {
                  display: false,
                  beginAtZero: true,
                  max: 10,
                  stepSize: 2
                },
                suggestedMax: 10,
                suggestedMin: 0
            }
        },
        plugins: {
            legend: { display: false }
        },
        maintainAspectRatio: false
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <div className="modal-header">
                    <img src={character.image} alt={character.name} />
                    <div className="modal-header-info">
                        <h2>{character.name}</h2>
                        <div className="score">Base Score: {character.score}</div>
                    </div>
                </div>
                <div className="modal-body">
                    <div className="modal-stats">
                        <h3>Base Attributes</h3>
                        <ul>
                            {Object.entries(character.stats).map(([stat, value]) => (
                                <li key={stat}>
                                    <strong>{stat.charAt(0).toUpperCase() + stat.slice(1)}</strong>
                                    <span>{value}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="modal-chart">
                        <Radar data={chartData} options={chartOptions}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

const App = () => {
    const [characters, setCharacters] = useState([]);
    const [team1, setTeam1] = useState([]);
    const [team2, setTeam2] = useState([]);
    const [activeTeam, setActiveTeam] = useState(1);
    const [battleLog, setBattleLog] = useState([]);
    const [winner, setWinner] = useState(null);
    const [selectedCharacter, setSelectedCharacter] = useState(null);

    useEffect(() => {
        fetch('characters.json')
            .then(res => res.json())
            .then(data => {
                const charactersWithScores = data.map(char => ({
                    ...char,
                    score: calculateCharacterScore(char)
                }));
                setCharacters(charactersWithScores);
            });
    }, []);

    const handleSelectCharacter = (character) => {
        const targetTeam = activeTeam === 1 ? team1 : team2;
        const otherTeam = activeTeam === 1 ? team2 : team1;
        
        if (targetTeam.find(c => c.id === character.id) || otherTeam.find(c => c.id === character.id)) {
            alert(`${character.name} is already on a team.`);
            return;
        }

        if (targetTeam.length >= 5) {
            alert(`Team ${activeTeam} is full (max 5 members).`);
            return;
        }

        if (activeTeam === 1) {
            setTeam1([...team1, character]);
            setActiveTeam(2);
        } else {
            setTeam2([...team2, character]);
            setActiveTeam(1);
        }
    };
    
    const handleRemoveCharacter = (character, teamNumber) => {
        if (teamNumber === 1) {
            setTeam1(team1.filter(c => c.id !== character.id));
        } else {
            setTeam2(team2.filter(c => c.id !== character.id));
        }
    };

    const simulateBattle = () => {
        let log = [];
        setWinner(null);

        const team1Score = team1.reduce((sum, char) => sum + char.score, 0);
        const team2Score = team2.reduce((sum, char) => sum + char.score, 0);

        log.push({ type: 'info', text: 'Battle Begins!' });
        log.push({ type: 'info', text: `Team 1 (Score: ${team1Score}) vs. Team 2 (Score: ${team2Score})` });

        for (let i = 1; i <= 5; i++) {
            log.push({ type: 'round', text: `----- Round ${i} -----`});
            
            const char1 = team1[Math.floor(Math.random() * team1.length)];
            const char2 = team2[Math.floor(Math.random() * team2.length)];

            const roll1 = Math.random() * char1.score;
            const roll2 = Math.random() * char2.score;

            if (roll1 > roll2) {
                log.push({ type: 'action', text: `${char1.name} (Team 1) overpowers ${char2.name} (Team 2)!` });
            } else if (roll2 > roll1) {
                log.push({ type: 'action', text: `${char2.name} (Team 2) outsmarts ${char1.name} (Team 1)!` });
            } else {
                log.push({ type: 'action', text: `${char1.name} and ${char2.name} are evenly matched!` });
            }
        }
        
        log.push({ type: 'info', text: `----- Final Tally -----`});
        if (team1Score > team2Score) {
            setWinner(1);
            log.push({ type: 'winner', team: 1, text: 'Team 1 is victorious!' });
        } else if (team2Score > team1Score) {
            setWinner(2);
            log.push({ type: 'winner', team: 2, text: 'Team 2 is victorious!' });
        } else {
            log.push({ type: 'winner', text: 'The battle is a draw!' });
        }

        setBattleLog(log);
    };
    
    const getCharacterTeam = (charId) => {
        if (team1.some(c => c.id === charId)) return 1;
        if (team2.some(c => c.id === charId)) return 2;
        return 0;
    };

    return (
        <div className="app-container">
            <header>
                <h1>Character Analyzer</h1>
                <p>Assemble your teams and simulate the ultimate battle!</p>
            </header>
            
            <div className="main-content">
                <div className="left-panel">
                    <div className="section-container">
                        <h2 className="section-title">Character Roster (Adding to Team {activeTeam})</h2>
                        <div className="character-roster-grid">
                            {characters.map(char => (
                                <CharacterCard 
                                    key={char.id} 
                                    character={char} 
                                    onSelect={handleSelectCharacter}
                                    onInfo={setSelectedCharacter}
                                    team={getCharacterTeam(char.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="right-panel">
                    <div className="section-container">
                        <TeamPanel team={team1} teamNumber={1} teamName="Team 1" onRemove={handleRemoveCharacter} />
                    </div>
                    <div className="section-container">
                        <TeamPanel team={team2} teamNumber={2} teamName="Team 2" onRemove={handleRemoveCharacter} />
                    </div>
                    <div className="section-container">
                         <h2 className="section-title">Battle Arena</h2>
                         <div className="battle-controls">
                            <button className="btn btn-battle" onClick={simulateBattle} disabled={team1.length === 0 || team2.length === 0}>
                                Start Battle
                            </button>
                         </div>
                         {battleLog.length > 0 && (
                            <div className="battle-log">
                                {battleLog.map((entry, index) => (
                                    <div key={index} className={`battle-log-entry ${entry.type} ${entry.type === 'winner' ? 'team' + entry.team : ''}`}>
                                        {entry.text}
                                    </div>
                                ))}
                            </div>
                         )}
                    </div>
                </div>
            </div>
             <CharacterModal character={selectedCharacter} onClose={() => setSelectedCharacter(null)} />
        </div>
    );
};

ReactDOM.render(<App />, document.getElementById('root'));

