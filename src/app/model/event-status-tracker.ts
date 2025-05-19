export type EventStatusTrackerConfig = {
  hours: number;
  realtime: boolean;
  realtimeInterval: number;
  device: {
    id: string;
    name: string;
  };
  types: EventTypeConfig[];
};

export type EventConfig = {
  name: string;
  color: string;
  label: string;
};

export type EventTypeConfig = {
  type: string;
  values: {
    name: string;
    color: string;
    label: string;
  }[];
};
