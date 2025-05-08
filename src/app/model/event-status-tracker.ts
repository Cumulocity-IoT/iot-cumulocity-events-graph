export type EventStatusTrackerConfig = {
  type: string;
  device: { id: string; name: string };
  types?: EventConfig[];
  hours?: number;
};

export type EventConfig = {
  name: string;
  color: string;
  label: string;
};
