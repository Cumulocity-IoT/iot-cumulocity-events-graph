import { IEvent } from "@c8y/client";

export const EVENT_STATUS__BAR_SCALE_DEFAULT = 20;

export interface EventStatusTrackerConfig {
  device: {
    id: string;
    name: string;
  };
  barScale: number;
  label: string;
  color: string;
  start: IEvent['type'];
  end: IEvent['type'];
  splitLines: boolean;
};
