import { IEvent } from '@c8y/client';
import { GlobalTimeContextWidgetConfig } from '@c8y/ngx-components';
import { GlobalContextState } from '@c8y/ngx-components/global-context';

export const EVENT_STATUS__BAR_SCALE_DEFAULT = 20;

export type EventStatusTrackerConfig = GlobalTimeContextWidgetConfig &
  Partial<GlobalContextState> & {
    date?: (string | Date)[] | null;
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
