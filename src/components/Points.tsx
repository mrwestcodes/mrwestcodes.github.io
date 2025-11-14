import React, { useEffect, useState } from "react"; 

interface PointsData {
  playerName: string;
  teamName: string;
  spi: number;
  spiFullRange: number;
  spread: number;
  oppName: string;
  oppPace: number;
  oppDefRat: number;
  avgPoints: number;
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

const Points = () => {
  const [data, setData] = useState<PointsData[]>([]);

  useEffect(() => {
    fetch("/data/spi.json")
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error loading points data:", error));
  }, []);

  console.log(data)

  return (
    <div>
      <h2 className="stat-title">Points</h2>
      <div className="container">
        {data.map((player, index) => (
          <div className="card" key={index}>
            <h3>{player.playerName.replace("_", " ")}</h3>
            <p>Team: {player.teamName}</p>
            <p>Opponent: {player.oppName}</p>
            <p>PPG: {player.avgPoints}</p>
            <p>SPI: {player.spi}</p>
            {/* <p>Full Range: {player.spiFullRange}</p> */}
            <p>O/U {player.spread}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Points;
