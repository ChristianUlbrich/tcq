declare namespace Payload {
  type status = number; // see HTTP response status codes
  type event = "addTopic" | "addAgendaItem" | "updateAgendaItemWeight";
}

interface Payload {
  status: Payload.status;
  event: Payload.event;
  data: unknown;
  toString(): string;
}

interface PayloadStatics {
  new(event?: Payload.event): Payload;
  (event?: Payload.event): Payload;
  prototype: Payload;
}

export declare var Payload: PayloadStatics;

// declare class Payload {
//   constructor(action: Payload.action);

//   toString(action: Payload.action): string;
// }

// export = Payload;


export declare class User {
  constructor();

  toString(): string;
}
