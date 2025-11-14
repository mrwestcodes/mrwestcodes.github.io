import React, { useEffect, useState } from "react";

interface ThreesData {
  playerName: string;
  teamName: string;
  tppsv2: number;
  tppsFullRange: number;
  bookOverUnder: number;
  oppName: string;
  oppPace: number;
  opp3pm: number;
  playerOdds?: {
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

const Threes = () => {
  const [data, setData] = useState<ThreesData[]>([]);

  useEffect(() => {
    fetch("/public/data/tpps.json")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error loading threes data:", error));
  }, []);

  return (
    <div>
      <h2 className="stat-title">Three-Pointers</h2>
      <div className="container">
        {data.map((player, index) => (
          <div className="card" key={index}>
            <h3>{player.playerName.replace("_", " ")}</h3>
            <p>Team: {player.teamName}</p>
            <p>TPPS: {player.tppsv2}</p>
            <p>O/U {player.bookOverUnder}</p>
            <p>Opponent: {player.oppName}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Threes;
