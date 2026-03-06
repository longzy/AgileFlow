import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useRetroStore } from "../../store/useRetroStore";
import { Plus, Users, ArrowRight } from "lucide-react";

export function RetroLobby() {
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const { createRoom } = useRetroStore();
  const [roomId, setRoomId] = useState("");
  const [template, setTemplate] = useState("start-stop-continue");

  const handleCreate = () => {
    if (!currentUser) return;
    const newRoomId = `retro-${Date.now()}`;
    navigate(`/retro/${newRoomId}`, { state: { isCreating: true, template } });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim()) {
      navigate(`/retro/${roomId.trim()}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Create Room */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
            <Plus className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Retro</h2>
          <p className="text-gray-500 mb-8">Start a new retrospective session with your team.</p>
          
          <div className="w-full text-left mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Template</label>
            <select 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            >
              <option value="start-stop-continue">Start / Stop / Continue</option>
              <option value="went-well-improve-action">Went Well / To Improve / Action</option>
              <option value="mad-sad-glad">Mad / Sad / Glad</option>
              <option value="timeline">Timeline (10 Days)</option>
            </select>
          </div>

          <button 
            onClick={handleCreate}
            className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
          >
            Create Room
          </button>
        </div>

        {/* Join Room */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-6">
            <Users className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Join Retro</h2>
          <p className="text-gray-500 mb-8">Enter a room ID to join an existing session.</p>
          
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-4">
            <div className="w-full text-left">
              <label className="block text-sm font-medium text-gray-700 mb-2">Room ID</label>
              <input 
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="e.g. retro-123456789"
                className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              />
            </div>
            <button 
              type="submit"
              disabled={!roomId.trim()}
              className="w-full py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Join Room
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
