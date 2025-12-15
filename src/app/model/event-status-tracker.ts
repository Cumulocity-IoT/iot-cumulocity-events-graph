export const EVENT_STATUS__BAR_SCALE_DEFAULT = 20;

export type EventStatusTrackerConfig = {
  device: {
    id: string;
    name: string;
  };
  types: EventTypeConfig[];
  barScale?: number;
};

export type EventConfig = {
  name: string;
  color: string;
  label: string;
};

export type EventTypeConfig = {
  type: string;
  values: EventConfig[];
  endFragment?: string;
};
