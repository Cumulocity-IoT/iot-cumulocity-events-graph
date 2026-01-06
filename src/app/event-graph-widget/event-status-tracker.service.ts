import { Injectable } from '@angular/core';
import { EventService, IEvent } from '@c8y/client';
import { subHours } from 'date-fns';
import { CustomSeriesRenderItem } from 'echarts';
import { groupBy, has, isEmpty } from 'lodash';
import { EventConfig, EventTypeConfig } from '../model/event-status-tracker';

export interface IEventDuration extends IEvent {
  /**
   * Duration in seconds
   */
  duration: number | null;
  /**
   * Optional end fragment to determine event end
   */
  endFragment?: string;
}

@Injectable()
export class EventStatusTrackerService {
  constructor(private eventService: EventService) {}

  async fetchAndPrepareEvents(
    deviceId: string,
    type: EventTypeConfig,
    index: number,
    timeBoxStart: Date,
    timeBoxEnd: Date
  ) {
    const events = await this.fetchEvents(timeBoxStart, timeBoxEnd, deviceId, type.type);
    const withDuration = this.convert(
      timeBoxStart.getTime(),
      timeBoxEnd.getTime(),
      events,
      type.endFragment
    );

    return this.toCustomFormat(index, timeBoxStart.getTime(), withDuration, type.values);
  }

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

  convert(
    timeboxStart: number,
    timeboxEnd: number,
    events: IEvent[],
    endFragment?: string
  ): IEventDuration[] {
    const lastIndex = events.length - 1;

    return events.map((e, index) => {
      const current = this.getTimestampFromString(timeboxStart, e.time);

      if (endFragment && has(e, endFragment)) {
        // Check if endFragment is defined and present in the event
        const endFragmentValue = e[endFragment as keyof IEvent];
        // Try to parse endFragment as a timestamp
        const endTime = this.getTimestampFromString(timeboxStart, String(endFragmentValue));

        return endTime > current
          ? { ...e, duration: endTime - current, endFragment }
          : { ...e, duration: null };
      } else if (index < lastIndex) {
        // Fallback to next event's start time
        const next = this.getTimestampFromString(timeboxStart, events[index + 1].time);

        return next > current ? { ...e, duration: next - current } : { ...e, duration: null };
      }

      // last event that hasn't ended yet
      return { ...e, duration: timeboxEnd - current };
    });
  }

  toCustomFormat(
    categoryIndex: number,
    timeBoxStart: number,
    events: IEventDuration[],
    types: EventConfig[]
  ) {
    let baseTime = timeBoxStart;

    const seriesData = events.map((event) => {
      const hasEndFragment = has(event, 'endFragment');
      const eventConfig = types.find((type) => type.name === event.text);
      const duration = event.duration ?? 0;
      const start = hasEndFragment ? new Date(event.time).getTime() : baseTime;
      const end = hasEndFragment
        ? new Date(event[event['endFragment'] as string]).getTime()
        : (baseTime += duration);

      return {
        name: eventConfig?.label ? eventConfig.label : event.text,
        value: [categoryIndex, start, end, duration],
        itemStyle: {
          color: eventConfig?.color,
        },
      };
    });

    return seriesData;
  }

  toSeries(
    data: {
      name: string;
      value: number[];
      itemStyle: {
        color: string;
      };
    }[],
    renderItem: CustomSeriesRenderItem,
    types: EventConfig[]
  ) {
    const groups = groupBy(data, 'name');
    const names = Object.keys(groups);
    return names.map((name) => ({
      type: 'custom',
      name,
      renderItem: <any>renderItem,
      itemStyle: {
        opacity: 0.9,
        color: types.find((type) => type.name === name || type.label === name)?.color ?? null,
      },
      encode: {
        x: [1, 2],
        y: 0,
      },
      data: groups[name],
    }));
  }

  private getTimestampFromString(timeboxStart: number, dateString: string): number {
    let timestamp = Date.parse(dateString);

    return timestamp < timeboxStart ? timeboxStart : timestamp;
  }
}
