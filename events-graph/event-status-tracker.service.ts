import { Injectable } from '@angular/core';
import { EventService, IEvent } from '@c8y/client';
import { subHours } from 'date-fns';
import { CustomSeriesRenderItem } from 'echarts';
import { groupBy, isEmpty } from 'lodash';

export interface IEventDuration extends IEvent {
  /**
   * Duration in seconds
   */
  duration: number | null;
}
@Injectable()
export class EventStatusTrackerService {
  constructor(private eventService: EventService) {}

  async fetchEvents(
    startDate: Date,
    endDate: Date,
    deviceId: string,
    type: string
  ): Promise<IEvent[]> {
    const filter = {
      dateFrom: startDate.toISOString(),
      dateTo: endDate.toISOString(),
      pageSize: 2000,
      revert: true,
      source: deviceId,
      type,
    };
    const result = await this.eventService.list(filter);
    const events = result.data;

    if (!isEmpty(result.data)) {
      const dateTo = result.data[0].time;
      const dateFrom = subHours(startDate, 24).toISOString();

      const dateBefore = {
        dateFrom,
        dateTo,
        pageSize: 1,
        source: deviceId,
        type,
      };
      const { data } = await this.eventService.list(dateBefore);
      if (!isEmpty(data)) {
        events.unshift(data[0]);
      }
    }

    return events;
  }

  convert(timeboxStart: number, timeboxEnd: number, events: IEvent[]): IEventDuration[] {
    const lastIndex = events.length - 1;
    const update = events.map((e, index) => {
      if (index < lastIndex) {
        const current = this.getTimestampFromString(timeboxStart, e.time);
        const next = this.getTimestampFromString(timeboxStart, events[index + 1].time);
        if (next > current) {
          const durationInSeconds = this.asSeconds(next - current);
          return { ...e, duration: durationInSeconds };
        } else {
          return { ...e, duration: null };
        }
      } else {
        // last spool that hasn't ended yet
        const current = this.getTimestampFromString(timeboxStart, e.time);
        const durationInSeconds = this.asSeconds(timeboxEnd - current);
        return { ...e, duration: durationInSeconds };
      }
    });
    return update;
  }

  toCustomFormat(categoryIndex: number, timeBoxStart: number, events: IEventDuration[]) {
    let baseTime = timeBoxStart;
    const seriesData = events.map((event) => {
      const duration = (event.duration ?? 0) * 1000;
      return {
        name: event.text,
        value: [categoryIndex, baseTime, (baseTime += duration), duration],
        // itemStyle: {
        //   color: color,
        // },
      };
    });
    return seriesData;
  }

  toSeries(
    data: {
      name: string;
      value: number[];
      // itemStyle: {
      //   color: string;
      // };
    }[],
    renderItem: CustomSeriesRenderItem,
    types: { name: string; color: string }[]
  ) {
    const groups = groupBy(data, 'name');
    const names = Object.keys(groups);

    return names.map((name) => ({
      type: 'custom',
      name,
      renderItem: <any>renderItem,
      itemStyle: {
        opacity: 0.9,
        color: types.find((type) => type.name === name)?.color ?? null,
      },
      encode: {
        x: [1, 2],
        y: 0,
      },
      data: groups[name],
    }));
  }

  private getTimestampFromString(timeboxStart: number, dateString: string): number {
    let timestap = Date.parse(dateString);
    if (timestap < timeboxStart) {
      timestap = timeboxStart;
    }
    return timestap;
  }

  private asSeconds(timestamp: number): number {
    return Math.floor(timestamp / 1000);
  }
}
