export type Player = {
  playerName: string;
  teamName: string;
  tpps?: number;
  spread?: number;
  bookOverUnder?: number;
  spi: number;
  reboundScore?: number;
}

export type Props = {
  dataSource: string; // Path to the JSON file
  displayType: 'points' | 'threePointers' | 'rebounds';
}