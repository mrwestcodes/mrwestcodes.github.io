import React, { useEffect, useState } from "react";

interface ReboundsData {
  playerName: string;
  teamName: string;
  reboundScorev2: number;
  spread: number;
  oppName: string;
  oppPace: number;
  oppFgPercentage: number;
  oppReboundsAllowed: number;
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

const Rebounds = () => {
  const [data, setData] = useState<ReboundsData[]>([]);

  useEffect(() => {
    fetch("/public/data/rebounders.json")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error loading rebounds data:", error));
  }, []);

  return (
    <div>
      <h2 className="stat-title">Rebounds</h2>
      <div className="container">
        {data.map((player, index) => (
          <div className="card" key={index}>
            <h3>{player.playerName.replace("_", " ")}</h3>
            <p>Team: {player.teamName}</p>
            <p>Rebound Score: {player.reboundScorev2}</p>
            <p>O/U {player.spread}</p>
            <p>Opponent: {player.oppName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Rebounds;
