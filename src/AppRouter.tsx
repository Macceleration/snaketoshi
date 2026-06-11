import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import { GamePage } from "./pages/GamePage";
import { BoardExplorer } from "./pages/BoardExplorer";
import { CreateRoom } from "./pages/room/CreateRoom";
import { JoinRoom } from "./pages/room/JoinRoom";
import { RoomLobby } from "./pages/room/RoomLobby";
import { RoomGame } from "./pages/room/RoomGame";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/play/local" element={<GamePage />} />
        <Route path="/board" element={<BoardExplorer />} />
        
        {/* Room routes */}
        <Route path="/room/create" element={<CreateRoom />} />
        <Route path="/room/:roomId" element={<RoomLobby />} />
        <Route path="/room/:roomId/join" element={<JoinRoom />} />
        <Route path="/room/:roomId/play" element={<RoomGame />} />
        
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;