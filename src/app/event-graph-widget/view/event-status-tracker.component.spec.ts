import { EventStatusTrackerComponent } from './event-status-tracker.component';

describe('EventStatusTrackerComponent', () => {
  it('returns no blocks when there are no matching events', async () => {
    const component = Object.create(EventStatusTrackerComponent.prototype) as any;

    component.config = {
      start: 'START',
      end: 'END',
      color: '#000000',
    };
    component.devLog = () => undefined;
    component['fetchSingleEventTime'] = jasmine.createSpy().and.resolveTo(0);

    const result = await component['buildEventBlocks'](
      [],
      [],
      [new Date('2024-01-01T00:00:00Z'), new Date('2024-01-02T00:00:00Z')],
    );

    expect(result).toEqual([]);
  });
});
