import { Component, inject, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { IEvent, IManagedObject } from '@c8y/client';
import { CoreModule, DatePipe } from '@c8y/ngx-components';
import { formatDistance } from 'date-fns';
import { EChartsOption } from 'echarts';
import { BarChart, CustomChart } from 'echarts/charts';
import { DataZoomComponent, GridComponent, TooltipComponent } from 'echarts/components';
import * as echartsCore from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { debounceTime, Subject } from 'rxjs';
import { EventStatusTrackerConfig } from '../model/event-status-tracker';
import { EventStatusTrackerService } from './event-status-tracker.service';

echartsCore.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
  DataZoomComponent,
  CustomChart,
]);

interface EventBlock {
  label: string;
  start: number;
  end: number;
  blockStart?: number;
  blockEnd?: number;
  duration?: number;
  color?: string;
}

@Component({
  selector: 'c8y-event-status',
  templateUrl: './event-status-tracker.component.html',
  styleUrls: ['./event-status-tracker.component.css'],
  imports: [CoreModule, TooltipModule, NgxEchartsDirective],
  standalone: true,
  providers: [provideEchartsCore({ echarts: echartsCore })],
})
export class EventStatusTrackerComponent implements OnInit, OnChanges, OnDestroy {
  private eventStatusTrackerService = inject(EventStatusTrackerService);
  private datePipe = inject(DatePipe);

  @Input() config: EventStatusTrackerConfig;
  @Input() isInPreviewMode = false;

  // from config
  deviceId!: IManagedObject['id'];

  timeframe!: [Date, Date]; // from widget config
  chartOptions!: EChartsOption; // generated

  startEvents: IEvent[] = []; // via service
  endEvents: IEvent[] = []; // via service
  isDev = false; // from url search param

  // debounce change events
  private readonly reloadTimeout = 300;
  private reloadSubject = new Subject<void>();

  constructor() {
    this.reloadSubject.pipe(debounceTime(this.reloadTimeout)).subscribe(() => this.performReload());
  }

  async ngOnChanges(changes: any): Promise<void> {
    this.deviceId = this.config.device?.id as IManagedObject['id'];

    if (!changes?.config?.currentValue?.date) return;
    this.timeframe = changes.config.currentValue.date;

    this.reloadSubject.next();
  }

  ngOnInit(): void {
    if (window.location.search.indexOf('dev=true') > -1) this.isDev = true;
  }

  ngOnDestroy(): void {
    this.reloadSubject.complete();
  }

  reload(): void {
    this.reloadSubject.next();
  }

  private devLog(...args: any[]): void {
    if (this.isDev) {
      console.log(...args);
    }
  }

  private async performReload(): Promise<void> {
    await this.fetchEvents(this.config.start, this.config.end);

    const blocks = await this.buildEventBlocks(this.startEvents, this.endEvents, this.timeframe);

    this.chartOptions = this.buildChartOptions(blocks);
  }

  private buildChartOptions(blocks: EventBlock[]): EChartsOption {
    return {
      tooltip: {
        formatter: (params: any) => {
          const [, start, end, duration] = params.value;
          return `
            <strong style="max-width:300px;display:block;overflow:hidden;text-overflow:ellipsis">${params.name}</strong>
            Start: ${this.datePipe.transform(start)}<br/>
            End: ${this.datePipe.transform(end)}<br/>
            Duration: ${formatDistance(0, duration, {
              includeSeconds: true,
            })}
          `;
        },
      },

      dataZoom: [
        {
          type: 'slider',
          filterMode: 'weakFilter',
          showDataShadow: false,
          bottom: 10,
        },
        {
          type: 'inside',
          filterMode: 'weakFilter',
        },
      ],

      grid: {
        left: 24,
        right: 32,
        top: 16,
        containLabel: true,
      },

      xAxis: {
        type: 'time',
        min: this.timeframe[0].getTime(),
        max: this.timeframe[1].getTime(),
        // scale: true
        axisLabel: {
          formatter: (val: number) => this.xAxisFormatter(val),
        },
        splitLine: {
          show: this.config.splitLines || false,
        },
      },

      yAxis: {
        type: 'category',
        data: [this.config.label],
      },

      series: blocks.map((block) => ({
        type: 'custom',
        name: block.label,
        encode: { x: [1, 2], y: 0 },

        renderItem: (params: any, api: any) => {
          const y = api.coord([0, 0])[1];
          const xStart = api.coord([block.blockStart, 0])[0];
          const xEnd = api.coord([block.blockEnd, 0])[0];
          const height = api.size([0, 1])[1] * (this.config.barScale / 100);

          return {
            type: 'rect',
            shape: {
              x: xStart,
              y: y - height / 2,
              width: xEnd - xStart,
              height,
            },
            style: api.style({
              fill: this.config.color,
              opacity: 0.9,
            }),
          };
        },

        data: [
          {
            name: block.label,
            value: [0, block.start, block.end, block.duration],
          },
        ],
      })),
    };
  }

  private xAxisFormatter(value: number): string {
    const date = new Date(value);
    const time = date.getHours() * 60 + date.getMinutes();
    const format = time === 0 ? 'MMM d' : 'HH:mm';

    return this.datePipe.transform(date, format) as string;
  }

  private async fetchEvents(start: string, end: string): Promise<void> {
    const [starts, ends] = await Promise.all([
      this.eventStatusTrackerService.fetchEvents(this.deviceId, start, this.timeframe),
      this.eventStatusTrackerService.fetchEvents(this.deviceId, end, this.timeframe),
    ]);

    this.startEvents = starts;
    this.endEvents = ends;
  }

  private async buildEventBlocks(
    starts: IEvent[],
    ends: IEvent[],
    timeFrame: [Date, Date]
  ): Promise<EventBlock[]> {
    const startType = this.config.start;
    const endType = this.config.end;

    const mergedEvents = this.sortEventsByTime([...starts, ...ends]);
    this.devLog(mergedEvents);
    const blocks = this.generateEventBlocks(mergedEvents, startType, endType);
    this.devLog(blocks);

    if (!blocks[0].start)
      blocks[0].start = await this.fetchSingleEventTime(
        startType,
        new Date(0),
        timeFrame[0],
        false
      );
    if (!!blocks.slice(-1)[0] && !blocks.at(-1)?.end) {
      blocks.slice(-1)[0].end = await this.fetchSingleEventTime(endType, timeFrame[1]);
    }
    // dedupe?

    return this.generateDurations(blocks, timeFrame);
  }

  private sortEventsByTime(events: IEvent[]): IEvent[] {
    return (events = [...events]
      .map((e) => ({ ...e, ts: Date.parse(e.time) }))
      .sort((a, b) => a.ts - b.ts));
  }

  private generateEventBlocks(
    mergedEvents: IEvent[],
    startType: IEvent['type'],
    endType: IEvent['type']
  ): EventBlock[] {
    const blocks: EventBlock[] = [];
    let prevType = '';
    let blockIndex = -1;

    mergedEvents.forEach((event, index) => {
      let block: Partial<EventBlock> = {
        label: event.text,
        color: this.config.color,
      };

      if (event.type === startType) block.start = this.getUnixTime(event.time);
      if (event.type === endType) block.end = this.getUnixTime(event.time);

      if (index > 0 && event.type === endType && event.type !== prevType) {
        blocks[blockIndex].end = this.getUnixTime(event.time);
      } else {
        blocks.push(block as EventBlock);
        blockIndex++;
      }

      prevType = event.type;
    });

    return blocks;
  }

  private getUnixTime(time: Date | string): number {
    return new Date(time).getTime();
  }

  private async fetchSingleEventTime(
    type: IEvent['type'],
    from: Date,
    to = new Date(),
    revert = true
  ): Promise<number> {
    const event = await this.eventStatusTrackerService.fetchEvents(
      this.deviceId,
      this.config.start,
      [from, to],
      1,
      revert
    );

    return this.getUnixTime(event[0]?.time);
  }

  private generateDurations(blocks: EventBlock[], timeFrame: [Date, Date]): EventBlock[] {
    const [timeFrameStart, timeFrameEnd] = timeFrame.map((t) => this.getUnixTime(t));

    return blocks.map((block, index) => {
      if (!block.start) block.start = blocks[index - 1].end;
      if (!block.end) block.end = blocks[index + 1] ? blocks[index + 1].start : timeFrameEnd;

      this.devLog(`Block ${index}: start=${block.start}, end=${block.end}`);

      block.duration = block.end - block.start;
      block.blockStart = block.start < timeFrameStart ? timeFrameStart : block.start;
      block.blockEnd = block.end > timeFrameEnd ? timeFrameEnd : block.end;

      return block;
    });
  }
}
