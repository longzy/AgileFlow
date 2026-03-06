import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";
import { useRetroStore } from "../../store/useRetroStore";
import { RetroRoomView } from "./RetroRoomView";
import { RetroLobby } from "./RetroLobby";

export function RetroView() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useStore();
  const { connect, disconnect, room, error } = useRetroStore();

  useEffect(() => {
    if (roomId && currentUser?.id) {
      const isCreating = location.state?.isCreating;
      const template = location.state?.template;
      connect(roomId, currentUser, isCreating, template);
    }
    return () => {
      disconnect();
    };
  }, [roomId, currentUser?.id, connect, disconnect, location.state?.isCreating, location.state?.template]);

  if (!roomId) {
    return <RetroLobby />;
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl max-w-md w-full text-center">
          <h3 className="font-bold mb-2">Error joining room</h3>
          <p>{error}</p>
          <button 
            onClick={() => navigate("/retro")}
            className="mt-4 px-4 py-2 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm font-medium text-gray-500">Joining room...</p>
        </div>
      </div>
    );
  }

  return <RetroRoomView />;
}
