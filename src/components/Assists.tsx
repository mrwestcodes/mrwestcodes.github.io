import React, { useEffect, useState } from "react";

interface AssistData {
  playerName: string;
  teamName: string;
  assistScoreV2: number;
  assistsFullRange: number;
  spread: number;
  oppName: string;
  oppPace: number;
  oppFgPercentage: number;
  playerOdds: {
    oddID: string;
    playerID: string;
    sideID: string;
    statID: string;
    betTypeID: string;
    fairOdds: string;
    bookOdds: string;
    bookOverUnder: string;
  };
}

const Assists = () => {
  const [data, setData] = useState<AssistData[]>([]);

  useEffect(() => {
    fetch("/data/assisters.json") 
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error loading assists data:", error));
  }, []);

  return (
    <div>
      <h2 className="stat-title">Assists</h2>
      <div className="container">
        {data.map((player, index) => (
          <div className="card" key={index}>
            <h3>{player.playerName.replace("_", " ")}</h3>
            <p>Team: {player.teamName}</p>
            <p>Assist Score: {player.assistScoreV2}</p>
            <p> O/U {player.spread}</p>
            <p>Opponent: {player.oppName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Assists;
