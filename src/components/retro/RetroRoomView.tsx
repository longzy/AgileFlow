import { useEffect } from "react";
import { useMachine } from "@xstate/react";
import { retroMachine } from "../../machines/retroMachine";
import { useRetroStore } from "../../stores/useRetroStore";
import { useStore } from "../../store/useStore";
import { RetroWritingStage } from "./stages/RetroWritingStage";
import { RetroReviewStage } from "./stages/RetroReviewStage";
import { RetroVotingStage } from "./stages/RetroVotingStage";
import { RetroActionStage } from "./stages/RetroActionStage";
import { RetroDoneStage } from "./stages/RetroDoneStage";
import { RetroHeader } from "./RetroHeader";

export function RetroRoomView() {
  const { room, user } = useRetroStore();
  const { currentUser } = useStore();
  const [state, send] = useMachine(retroMachine);

  useEffect(() => {
    if (room) {
      send({ type: "SYNC_STATE", stage: room.stage, endTime: room.endTime || null });
    }
  }, [room, send]);

  if (!room || !currentUser) return null;

  const isHost = room.hostId === currentUser.id;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden w-full min-w-0">
      <RetroHeader room={room} isHost={isHost} state={state} />
      
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-w-0">
        {state.matches("WRITING") && <RetroWritingStage room={room} currentUser={currentUser} />}
        {state.matches("REVIEW") && <RetroReviewStage room={room} currentUser={currentUser} />}
        {state.matches("VOTING") && <RetroVotingStage room={room} currentUser={currentUser} />}
        {state.matches("ACTION") && <RetroActionStage room={room} isHost={isHost} />}
        {state.matches("DONE") && <RetroDoneStage room={room} />}
      </div>
    </div>
  );
}
