import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
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

// Board system pages
import { BoardGallery } from "./pages/boards/BoardGallery";
import { NewBoard } from "./pages/boards/NewBoard";
import { BoardView } from "./pages/boards/BoardView";
import { BoardEditor } from "./pages/boards/BoardEditor";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/play/local" element={<GamePage />} />

        {/* Legacy board explorer — redirect to new gallery */}
        <Route path="/board" element={<Navigate to="/boards" replace />} />

        {/* Board gallery & editor */}
        <Route path="/boards" element={<BoardGallery />} />
        <Route path="/boards/new" element={<NewBoard />} />
        <Route path="/boards/:boardId" element={<BoardView />} />
        <Route path="/boards/:boardId/edit" element={<BoardEditor />} />
        <Route path="/boards/:boardId/play" element={<GamePage />} />

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
