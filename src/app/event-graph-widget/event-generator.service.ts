import { inject, Injectable } from '@angular/core';
import { EventService } from '@c8y/client';
import * as moment from 'moment';

export interface TimelineEvent {
  source: { id: string };
  type: string;
  text: string;
  time: string;
  endTime: string;
}

@Injectable()
export class EventGeneratorService {
  private eventService = inject(EventService);

  async sendEvents(events: TimelineEvent[]) {
    const responses = await Promise.all(
      events.map((event) => {
        return this.eventService.create(event);
      })
    );

    console.log(responses);
  }

  generateEvents(
    source: string,
    type: string,
    text: string[],
    count: number = 15,
    end: moment.Moment = moment() // last event ends "now" by default
  ): TimelineEvent[] {
    const events: TimelineEvent[] = [];

    // Start by generating backwards from the end, then reverse
    // because we need a flexible unknown start time
    let currentTime = moment().subtract(1, 'day'); // arbitrary start anchor (your choice)

    for (let i = 0; i < count; i++) {
      // Random delay BEFORE the event starts (1–30 min)
      const delay = this.randomInt(1, 30);
      const eventStart = currentTime.clone().add(delay, 'minutes');

      // Random duration (5–60 min)
      const duration = this.randomInt(5, 60);
      const eventEnd = eventStart.clone().add(duration, 'minutes');

      const event: TimelineEvent = {
        source: { id: source },
        type: type,
        text: text[this.randomInt(0, text.length - 1)],
        time: eventStart.toISOString(),
        endTime: eventEnd.toISOString(),
      };

      events.push(event);

      // Next event begins AFTER this event ends
      currentTime = eventEnd.clone();
    }

    return events;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
