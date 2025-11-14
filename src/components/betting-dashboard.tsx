import React, { useState, useMemo } from 'react';
import {
  ChevronDown, ChevronUp, TrendingUp, Users, Target,
  DollarSign, Info, Filter, BarChart3, Star, AlertCircle,
  ArrowUp, ArrowDown, Search, X, Activity, Trophy, Zap
} from 'lucide-react';

// Type definitions
interface PlayerOdds {
  oddID: string;
  playerID: string;
  sideID: string;
  statID: string;
  betTypeID: string;
  fairOdds: string;
  bookOdds: string;
  bookOverUnder: string;
}

interface BasePlayer {
  playerName: string;
  teamName: string;
  spread: number;
  oppName: string;
  playerOdds: PlayerOdds;
}

export interface AssistPlayer extends BasePlayer {
  assistScoreV2: number;
  assistsFullRange: number;
  oppPace: number;
  oppFgPercentage: number;
}

export interface ReboundPlayer extends BasePlayer {
  reboundScorev2: number;
  oppPace: number;
  oppFgPercentage: number;
  oppReboundsAllowed: number;
}

export interface PointsPlayer extends BasePlayer {
  spi: number;
  oppPace: number;
  oppDefRat: number;
  avgPoints: number;
  normalizedStdDev?: number;
  avgUsage?: number;
}

export interface ThreePointPlayer {
  playerName: string;
  teamName: string;
  tppsv2: number;
  tppsFullRange: number;
  bookOverUnder: number;
  oppName: string;
  oppPace: number;
  opp3pm: number;
  playerOdds: PlayerOdds;
}

// Props for the dashboard component
interface BettingDashboardProps {
  assistsData: AssistPlayer[];
  reboundsData: ReboundPlayer[];
  pointsData: PointsPlayer[];
  threePointData: ThreePointPlayer[];
}

const BettingDashboard: React.FC<BettingDashboardProps> = ({
  assistsData,
  reboundsData,
  pointsData,
  threePointData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'points' | 'assists' | 'rebounds' | 'threes'>('overview');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'value' | 'odds' | 'name'>('odds');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showOnlyPositiveEdge, setShowOnlyPositiveEdge] = useState<boolean>(false);
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [volatilityFilter, setVolatilityFilter] =
    useState<'all' | 'low' | 'medium' | 'high'>('all');


  // Utility functions
  const formatPlayerName = (name: string): string => {
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateEdge = (fairOdds: string, bookOdds: string): number => {
    const fair = parseFloat(fairOdds);
    const book = parseFloat(bookOdds);

    const toImpliedProb = (odds: number): number => {
      if (odds > 0) {
        return 100 / (odds + 100);
      } else {
        return Math.abs(odds) / (Math.abs(odds) + 100);
      }
    };

    const fairProb = toImpliedProb(fair);
    const bookProb = toImpliedProb(book);

    return (fairProb - bookProb) * 100;
  };

  const getEdgeColor = (edge: number): string => {
    if (edge > 5) return 'text-green-600 dark:text-green-400';
    if (edge > 2) return 'text-emerald-600 dark:text-emerald-400';
    if (edge > 0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBgColor = (edge: number): string => {
    if (edge > 5) return 'bg-green-100 dark:bg-green-900/30';
    if (edge > 2) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (edge > 0) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  // Get all unique teams
  const allTeams = useMemo(() => {
    const teams = new Set<string>();
    [...pointsData, ...assistsData, ...reboundsData, ...threePointData].forEach(player => {
      teams.add(player.teamName);
    });
    return Array.from(teams).sort();
  }, [pointsData, assistsData, reboundsData, threePointData]);

  // Calculate statistics with useMemo
  const stats = useMemo(() => {
    const allBets = [
      ...pointsData.map(p => ({
        ...p,
        type: 'points',
        edge: calculateEdge(p.playerOdds.fairOdds, p.playerOdds.bookOdds)
      })),
      ...assistsData.map(p => ({
        ...p,
        type: 'assists',
        edge: calculateEdge(p.playerOdds.fairOdds, p.playerOdds.bookOdds)
      })),
      ...reboundsData.map(p => ({
        ...p,
        type: 'rebounds',
        edge: calculateEdge(p.playerOdds.fairOdds, p.playerOdds.bookOdds)
      })),
      ...threePointData.map(p => ({
        ...p,
        type: 'threes',
        edge: calculateEdge(p.playerOdds.fairOdds, p.playerOdds.bookOdds)
      }))
    ];

    const positiveEdge = allBets.filter(b => b.edge > 0).length;
    const avgEdgeNum =
      allBets.length > 0
        ? allBets.reduce((sum, b) => sum + b.edge, 0) / allBets.length
        : 0;

    const bestBet =
      allBets.length > 0
        ? allBets.reduce(
          (best, current) => (current.edge > best.edge ? current : best),
          allBets[0]
        )
        : null;

    return {
      totalProps: allBets.length,
      positiveEdge,
      avgEdge: avgEdgeNum.toFixed(2),
      bestBet,
      edgeDistribution: [
        { range: '< 0%', count: allBets.filter(b => b.edge < 0).length },
        { range: '0-2%', count: allBets.filter(b => b.edge >= 0 && b.edge < 2).length },
        { range: '2-5%', count: allBets.filter(b => b.edge >= 2 && b.edge < 5).length },
        { range: '> 5%', count: allBets.filter(b => b.edge >= 5).length }
      ]
    };
  }, [pointsData, assistsData, reboundsData, threePointData]);

  // Filter and sort players
  const filterAndSortPlayers = (players: any[], type: string) => {
    return players
      .filter(player => {
        const matchesTeam =
          filterTeam === 'all' || player.teamName === filterTeam;

        const matchesSearch =
          searchTerm === '' ||
          formatPlayerName(player.playerName)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          player.teamName.toLowerCase().includes(searchTerm.toLowerCase());

        const edge = calculateEdge(
          player.playerOdds.fairOdds,
          player.playerOdds.bookOdds
        );
        const matchesEdgeFilter = !showOnlyPositiveEdge || edge > 0;

        // --- NEW: volatility filter (points only) ---
        let matchesVolatility = true;
        if (type === 'points' && volatilityFilter !== 'all') {
          const vol: number | undefined = player.normalizedStdDev;
          if (vol == null) {
            // If no volatility value, exclude when a specific bucket is selected
            matchesVolatility = false;
          } else {
            if (volatilityFilter === 'low') {
              // steady guys
              matchesVolatility = vol < 0.15;
            } else if (volatilityFilter === 'medium') {
              matchesVolatility = vol >= 0.15 && vol < 0.30;
            } else if (volatilityFilter === 'high') {
              // boom/bust scorers
              matchesVolatility = vol >= 0.30;
            }
          }
        }
        // -------------------------------------------

        return (
          matchesTeam &&
          matchesSearch &&
          matchesEdgeFilter &&
          matchesVolatility
        );
      })
      .sort((a, b) => {
        if (sortBy === 'name') {
          return formatPlayerName(a.playerName).localeCompare(
            formatPlayerName(b.playerName)
          );
        } else if (sortBy === 'odds') {
          const edgeA = calculateEdge(
            a.playerOdds.fairOdds,
            a.playerOdds.bookOdds
          );
          const edgeB = calculateEdge(
            b.playerOdds.fairOdds,
            b.playerOdds.bookOdds
          );
          return edgeB - edgeA;
        } else {
          // Sort by value
          const getVal = (p: any): number => {
            switch (type) {
              case 'points':
                return p.spi || 0;
              case 'assists':
                return p.assistScoreV2 || 0;
              case 'rebounds':
                return p.reboundScorev2 || 0;
              case 'threes':
                return p.tppsv2 || 0;
              default:
                return 0;
            }
          };
          return getVal(b) - getVal(a);
        }
      });
  };


  // Player Card Component
  interface PlayerCardProps {
    player: any;
    type: string;
    expanded: boolean;
    onToggle: () => void;
  }

  const PlayerCard: React.FC<PlayerCardProps> = ({ player, type, expanded, onToggle }) => {
    const edge = calculateEdge(player.playerOdds.fairOdds, player.playerOdds.bookOdds);
    const edgeColor = getEdgeColor(edge);
    const bgColor = getBgColor(edge);
    const isSelected = selectedPlayers.has(player.playerOdds.oddID);

    const getMainStat = () => {
      switch (type) {
        case 'points':
          return {
            value: player.spi,
            label: 'SPI Score',
            avg: player.avgPoints,
            usage: player.avgUsage,
            volatility: player.normalizedStdDev
          };
        case 'assists':
          return {
            value: player.assistScoreV2,
            label: 'Assist Score',
            fullRange: player.assistsFullRange
          };
        case 'rebounds':
          return {
            value: player.reboundScorev2,
            label: 'Rebound Score',
            oppAllowed: player.oppReboundsAllowed
          };
        case 'threes':
          return {
            value: player.tppsv2,
            label: '3PT Score',
            fullRange: player.tppsFullRange
          };
        default:
          return { value: 0, label: '' };
      }
    };

    const mainStat = getMainStat();

    const handleSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      (e.nativeEvent as any).stopImmediatePropagation?.();

      const newSelected = new Set(selectedPlayers);
      if (isSelected) {
        newSelected.delete(player.playerOdds.oddID);
      } else {
        newSelected.add(player.playerOdds.oddID);
      }
      setSelectedPlayers(newSelected);
    };

    const handleToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      (e.nativeEvent as any).stopImmediatePropagation?.();

      const currentScrollY =
        typeof window !== 'undefined'
          ? window.scrollY || window.pageYOffset
          : 0;

      onToggle(); // this updates expandedCard in parent

      // Restore scroll after React commits the update
      requestAnimationFrame(() => {
        window.scrollTo({
          top: currentScrollY,
          left: 0,
          behavior: 'auto',
        });
      });
    };


    return (
        <div
          className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
            isSelected ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={(e) => {
            e.stopPropagation();
            (e.nativeEvent as any).stopImmediatePropagation?.();
          }}
        >
        {edge > 5 && (
          <div className="absolute top-2 right-2 z-10">
            <Star className="w-5 h-5 text-yellow-500 fill-current" />
          </div>
        )}

        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                {formatPlayerName(player.playerName)}
                {edge > 5 && (
                  <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full">
                    HOT
                  </span>
                )}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{player.teamName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">vs {player.oppName}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSelect}
                className={`p-1 rounded-full transition-colors ${
                  isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {isSelected ? <X className="w-4 h-4" /> : <Target className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleToggle}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {expanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{mainStat.label}</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {mainStat.value?.toFixed(1) || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Line</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {player.playerOdds.bookOverUnder || player.bookOverUnder || player.spread}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Edge</p>
              <p className={`text-xl font-bold ${edgeColor}`}>
                {edge > 0 ? '+' : ''}{edge.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className={`flex justify-between items-center p-3 rounded-lg ${bgColor}`}>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Book</p>
              <p className="font-semibold text-gray-900 dark:text-white">{player.playerOdds.bookOdds}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Fair</p>
              <p className="font-semibold text-gray-900 dark:text-white">{player.playerOdds.fairOdds}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Value</p>
              <p className={`font-bold ${edge > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {edge > 0 ? <ArrowUp className="w-4 h-4 inline" /> : <ArrowDown className="w-4 h-4 inline" />}
              </p>
            </div>
          </div>

          {expanded && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Opp Pace</span>
                  <span className="font-medium text-gray-900 dark:text-white">{player.oppPace?.toFixed(1)}</span>
                </div>

                {type === 'points' && (
                  <>
                    {mainStat.avg && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Season Avg</span>
                        <span className="font-medium text-gray-900 dark:text-white">{mainStat.avg.toFixed(1)}</span>
                      </div>
                    )}
                    {mainStat.usage && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Usage</span>
                        <span className="font-medium text-gray-900 dark:text-white">{mainStat.usage.toFixed(1)}%</span>
                      </div>
                    )}
                    {mainStat.volatility && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Volatility</span>
                        <span className="font-medium text-gray-900 dark:text-white">{(mainStat.volatility * 100).toFixed(1)}%</span>
                      </div>
                    )}
                  </>
                )}

                {(type === 'assists' || type === 'rebounds') && player.oppFgPercentage && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Opp FG%</span>
                    <span className="font-medium text-gray-900 dark:text-white">{(player.oppFgPercentage * 100).toFixed(1)}%</span>
                  </div>
                )}

                {type === 'rebounds' && mainStat.oppAllowed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Opp Allows</span>
                    <span className="font-medium text-gray-900 dark:text-white">{mainStat.oppAllowed.toFixed(1)}</span>
                  </div>
                )}

                {type === 'threes' && player.opp3pm && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Opp 3PM</span>
                    <span className="font-medium text-gray-900 dark:text-white">{player.opp3pm.toFixed(1)}</span>
                  </div>
                )}

                {(type === 'assists' || type === 'threes') && mainStat.fullRange && (
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-600 dark:text-gray-400">Full Range Score</span>
                    <span className="font-medium text-gray-900 dark:text-white">{mainStat.fullRange.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Confidence Level</span>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-6 rounded ${
                          i < Math.ceil(edge / 2) ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Overview Tab Component
  const OverviewTab = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Edge Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edge Distribution</h3>
            <div className="space-y-2">
              {stats.edgeDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.range}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-red-500' :
                          index === 1 ? 'bg-yellow-500' :
                          index === 2 ? 'bg-emerald-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${(item.count / stats.totalProps) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Best Bet */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Top Value Play</h3>
            {stats.bestBet && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatPlayerName(stats.bestBet.playerName)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {stats.bestBet.teamName} vs {stats.bestBet.oppName}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {stats.bestBet.type.charAt(0).toUpperCase() + stats.bestBet.type.slice(1)}
                  </span>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      +{stats.bestBet.edge.toFixed(1)}% Edge
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stats.bestBet.playerOdds.bookOdds}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Props</p>
                <p className="text-3xl font-bold">{stats.totalProps}</p>
              </div>
              <Activity className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Positive Edge</p>
                <p className="text-3xl font-bold">{stats.positiveEdge}</p>
              </div>
              <TrendingUp className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Edge</p>
                <p className="text-3xl font-bold">{stats.avgEdge}%</p>
              </div>
              <Zap className="w-8 h-8 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Teams</p>
                <p className="text-3xl font-bold">{allTeams.length}</p>
              </div>
              <Users className="w-8 h-8 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Tab content renderer
  const renderTabContent = () => {
    if (activeTab === 'overview') {
      return <OverviewTab />;
    }

    const getDataAndType = (): { data: any[]; type: string } => {
      switch (activeTab) {
        case 'points': return { data: pointsData, type: 'points' };
        case 'assists': return { data: assistsData, type: 'assists' };
        case 'rebounds': return { data: reboundsData, type: 'rebounds' };
        case 'threes': return { data: threePointData, type: 'threes' };
        default: return { data: [], type: '' };
      }
    };

    const { data, type } = getDataAndType();
    const filteredData = filterAndSortPlayers(data, type);

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredData.map((player) => (
          <PlayerCard
            key={player.playerOdds.oddID}
            player={player}
            type={type}
            expanded={expandedCard === player.playerOdds.oddID}
            onToggle={() =>
              setExpandedCard(expandedCard === player.playerOdds.oddID ? null : player.playerOdds.oddID)
            }
          />
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No players match your filters</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Trophy className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">NBA Betting Analytics</h1>
            </div>
            <div className="flex items-center gap-4">
              {selectedPlayers.size > 0 && (
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Compare ({selectedPlayers.size})
                </button>
              )}
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline">Player Odds & Analysis</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {['overview', 'points', 'assists', 'rebounds', 'threes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Filters */}
          {activeTab !== 'overview' && (
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="odds">Sort by Edge</option>
                <option value="value">Sort by Value</option>
                <option value="name">Sort by Name</option>
              </select>

              <select
                value={filterTeam}
                onChange={(e) => setFilterTeam(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Teams</option>
                {allTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
              {activeTab === 'points' && (
                <select
                  value={volatilityFilter}
                  onChange={(e) => setVolatilityFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Volatility</option>
                  <option value="low">Low Volatility</option>
                  <option value="medium">Medium Volatility</option>
                  <option value="high">High Volatility</option>
                </select>
              )}

              <button
                onClick={() => setShowOnlyPositiveEdge(!showOnlyPositiveEdge)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  showOnlyPositiveEdge
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                Positive Edge Only
              </button>
            </div>
          )}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </main>
    </div>
  );
};

export default BettingDashboard;
