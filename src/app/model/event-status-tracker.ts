import { IEvent } from "@c8y/client";
import { GlobalTimeContextWidgetConfig } from "@c8y/ngx-components";

export const EVENT_STATUS__BAR_SCALE_DEFAULT = 20;

export type EventStatusTrackerConfig = GlobalTimeContextWidgetConfig & {
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
  // displaySettings?: WidgetDisplaySettings;
};
