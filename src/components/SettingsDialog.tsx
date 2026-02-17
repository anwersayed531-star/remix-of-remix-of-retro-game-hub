import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Volume2, Music } from "lucide-react";
import { useGameSettings } from "@/hooks/useGameSettings";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const { settings, updateSettings } = useGameSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="wood-texture border-2 border-gold max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-gold text-center text-xl" style={{ fontFamily: "'Cinzel', serif" }}>
            ⚙️ الإعدادات
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-gold" />
              <span className="text-foreground text-sm">مؤثرات صوتية</span>
            </div>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(v) => updateSettings({ soundEnabled: v })}
            />
          </div>

          {/* Sound Volume */}
          {settings.soundEnabled && (
            <div className="pl-8">
              <Slider
                value={[settings.soundVolume]}
                onValueChange={([v]) => updateSettings({ soundVolume: v })}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">{settings.soundVolume}%</p>
            </div>
          )}

          {/* Music */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Music className="w-5 h-5 text-gold" />
              <span className="text-foreground text-sm">موسيقى خلفية</span>
            </div>
            <Switch
              checked={settings.musicEnabled}
              onCheckedChange={(v) => updateSettings({ musicEnabled: v })}
            />
          </div>

          {/* Music Volume */}
          {settings.musicEnabled && (
            <div className="pl-8">
              <Slider
                value={[settings.musicVolume]}
                onValueChange={([v]) => updateSettings({ musicVolume: v })}
                max={100}
                step={5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1 text-center">{settings.musicVolume}%</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
