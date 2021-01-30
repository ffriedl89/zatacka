import { Player } from "../player";

declare global {
  interface GlobalEventHandlersEventMap {
    'playerscorechange': CustomEvent<{ player: Player }>;
  }
}