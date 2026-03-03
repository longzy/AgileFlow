import { setup, assign } from "xstate";

export type RetroStage = "WRITING" | "REVIEW" | "VOTING" | "ACTION" | "DONE";

export interface RetroContext {
  stage: RetroStage;
  endTime: number | null;
}

export const retroMachine = setup({
  types: {
    context: {} as RetroContext,
    events: {} as
      | { type: "SYNC_STATE"; stage: RetroStage; endTime: number | null }
      | { type: "TIMER_EXPIRED" },
  },
  actions: {
    syncContext: assign({
      stage: ({ event }) => (event.type === "SYNC_STATE" ? event.stage : "WRITING"),
      endTime: ({ event }) => (event.type === "SYNC_STATE" ? event.endTime : null),
    }),
  },
}).createMachine({
  id: "retro",
  initial: "WRITING",
  context: {
    stage: "WRITING",
    endTime: null,
  },
  on: {
    SYNC_STATE: {
      actions: "syncContext",
      target: ".routing",
    },
  },
  states: {
    routing: {
      always: [
        { guard: ({ context }) => context.stage === "WRITING", target: "WRITING" },
        { guard: ({ context }) => context.stage === "REVIEW", target: "REVIEW" },
        { guard: ({ context }) => context.stage === "VOTING", target: "VOTING" },
        { guard: ({ context }) => context.stage === "ACTION", target: "ACTION" },
        { guard: ({ context }) => context.stage === "DONE", target: "DONE" },
        { target: "WRITING" },
      ],
    },
    WRITING: {
      on: {
        TIMER_EXPIRED: {
          // In a real app, the server would handle the timer and send a SYNC_STATE.
          // But we can also proactively transition locally if needed.
          // For now, we rely on the server to change the stage.
        },
      },
    },
    REVIEW: {},
    VOTING: {},
    ACTION: {},
    DONE: {},
  },
});
