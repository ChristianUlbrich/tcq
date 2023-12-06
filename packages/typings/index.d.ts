declare namespace Payload {
  type action = "addTopic" | "addAgendaItem" | "updateAgendaItemWeight";
}

interface Payload {
  data: unknown;
  toString(): string;
}

interface PayloadStatics {
  new(action?: Payload.action): Payload;
  (action?: Payload.action): Payload;
  prototype: Payload;
}

declare var Payload: PayloadStatics;

// declare class Payload {
//   constructor(action: Payload.action);

//   toString(action: Payload.action): string;
// }

export = Payload;
