import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import XOGame from "./pages/XOGame";
import ChessGame from "./pages/ChessGame";
import LudoGame from "./pages/LudoGame";
import LobbyTest from "./pages/LobbyTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/xo" element={<XOGame />} />
          <Route path="/chess" element={<ChessGame />} />
          <Route path="/ludo" element={<LudoGame />} />
          <Route path="/lobby-test" element={<LobbyTest />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
