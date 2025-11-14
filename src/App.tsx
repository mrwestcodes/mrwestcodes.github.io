import React, { useEffect, useState } from 'react';
import BettingDashboard, {
  AssistPlayer,
  ReboundPlayer,
  PointsPlayer,
  ThreePointPlayer,
} from './components/betting-dashboard';
import './App.css'; // or whatever your global stylesheet is

const App: React.FC = () => {
  const [assistsData, setAssistsData] = useState<AssistPlayer[]>([]);
  const [reboundsData, setReboundsData] = useState<ReboundPlayer[]>([]);
  const [pointsData, setPointsData] = useState<PointsPlayer[]>([]);
  const [threePointData, setThreePointData] = useState<ThreePointPlayer[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [assistsRes, reboundsRes, pointsRes, threesRes] = await Promise.all([
          fetch('/data/assisters.json'),
          fetch('/data/rebounders.json'),
          fetch('/data/spi.json'),
          fetch('/data/tpps.json'),
        ]);

        if (!assistsRes.ok || !reboundsRes.ok || !pointsRes.ok || !threesRes.ok) {
          throw new Error('One or more data files failed to load');
        }

        const [assistsJson, reboundsJson, pointsJson, threesJson] = await Promise.all([
          assistsRes.json(),
          reboundsRes.json(),
          pointsRes.json(),
          threesRes.json(),
        ]);

        setAssistsData(assistsJson);
        setReboundsData(reboundsJson);
        setPointsData(pointsJson);
        setThreePointData(threesJson);
        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to load player data');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading player data…</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <BettingDashboard
      assistsData={assistsData}
      reboundsData={reboundsData}
      pointsData={pointsData}
      threePointData={threePointData}
    />
  );
};

export default App;
