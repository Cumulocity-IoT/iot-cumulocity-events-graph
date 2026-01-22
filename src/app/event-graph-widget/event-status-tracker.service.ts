import { inject, Injectable } from '@angular/core';
import { EventService, IEvent } from '@c8y/client';

@Injectable()
export class EventStatusTrackerService {
  private eventService = inject(EventService);

  async fetchEvents(
    deviceId: string,
    type: string,
    timeframe: [Date, Date],
    pageSize = 2000,
    revert = true
  ): Promise<IEvent[]> {
    const filter = {
      dateFrom: timeframe[0].toISOString(),
      dateTo: timeframe[1].toISOString(),
      pageSize,
      source: deviceId,
      type,
      revert,
    };
    const result = await this.eventService.list(filter);

    return result.data;
  }
}
