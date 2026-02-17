import { useNavigate } from "react-router-dom";
import { Settings, Dice5, Grid3X3, Crown } from "lucide-react";
import { useState } from "react";
import SettingsDialog from "@/components/SettingsDialog";

const games = [
  {
    id: "xo",
    title: "XO",
    subtitle: "تيك تاك تو",
    icon: Grid3X3,
    path: "/xo",
    color: "from-red-900/60 to-orange-900/60",
    border: "border-red-700/40",
  },
  {
    id: "chess",
    title: "شطرنج",
    subtitle: "Chess",
    icon: Crown,
    path: "/chess",
    color: "from-emerald-900/60 to-teal-900/60",
    border: "border-emerald-700/40",
  },
  {
    id: "ludo",
    title: "لودو",
    subtitle: "Ludo",
    icon: Dice5,
    path: "/ludo",
    color: "from-blue-900/60 to-indigo-900/60",
    border: "border-blue-700/40",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen wood-texture flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative border */}
      <div className="absolute inset-2 sm:inset-4 border-2 border-gold rounded-2xl pointer-events-none opacity-30" />
      <div className="absolute inset-3 sm:inset-6 border border-gold rounded-xl pointer-events-none opacity-15" />

      {/* Settings button */}
      <button
        onClick={() => setSettingsOpen(true)}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 p-3 rounded-full bg-secondary/80 hover:bg-secondary transition-colors border border-gold"
      >
        <Settings className="w-5 h-5 text-gold" />
      </button>

      {/* Title */}
      <div className="text-center mb-8 sm:mb-12 animate-fade-in">
        <h1 className="text-3xl sm:text-5xl font-bold text-gold mb-2 tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
          🎮 Game Hub
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base" style={{ fontFamily: "'Amiri', serif" }}>
          ألعاب كلاسيكية بتصميم أنيق
        </p>
        <div className="w-32 sm:w-48 h-0.5 gold-gradient mx-auto mt-4 rounded-full" />
      </div>

      {/* Game Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 w-full max-w-3xl px-2">
        {games.map((game, i) => (
          <button
            key={game.id}
            onClick={() => navigate(game.path)}
            className={`group relative rounded-xl border-2 ${game.border} bg-gradient-to-br ${game.color} 
              p-6 sm:p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-amber-900/20
              backdrop-blur-sm animate-fade-in`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="absolute inset-0 rounded-xl border border-gold opacity-0 group-hover:opacity-30 transition-opacity" />
            <game.icon className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gold group-hover:scale-110 transition-transform" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
              {game.title}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">{game.subtitle}</p>
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-8 sm:mt-12 text-muted-foreground text-xs opacity-50">
        Classic Games Collection v1.0
      </p>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
