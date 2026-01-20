import { inject, Injectable } from '@angular/core';
import { EventService, IEvent } from '@c8y/client';
// import { subHours } from 'date-fns';
// import { isEmpty } from 'lodash';

@Injectable()
export class EventStatusTrackerService {
  private eventService = inject(EventService);

  async fetchEvents(
    deviceId: string,
    type: string,
    timeframe: [Date, Date],
  ): Promise<IEvent[]> {
    const filter = {
      dateFrom: timeframe[0].toISOString(),
      dateTo: timeframe[1].toISOString(),
      pageSize: 2000,
      revert: true,
      source: deviceId,
      type,
    };
    const result = await this.eventService.list(filter);
    const events = result.data;

    // if (!isEmpty(result.data)) {
    //   const dateTo = result.data[0].time;
    //   const dateFrom = subHours(timeframe[0], 24).toISOString();

    //   const dateBefore = {
    //     dateFrom,
    //     dateTo,
    //     pageSize: 1,
    //     source: deviceId,
    //     type,
    //   };
    //   const { data } = await this.eventService.list(dateBefore);

    //   if (!isEmpty(data)) {
    //     events.unshift(data[0]);
    //   }
    // }

    return events;
  }
}
