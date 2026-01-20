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
import { EventStatusTrackerConfig } from '../model/event-status-tracker';
import { EventStatusTrackerService } from './event-status-tracker.service';
import { debounceTime, Subject } from 'rxjs';

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
  blockStart: number;
  blockEnd: number;
  duration: number;
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
    this.reloadSubject
      .pipe(debounceTime(this.reloadTimeout))
      .subscribe(() => this.performReload());
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

  private async performReload(): Promise<void> {
    await this.fetchEvents(this.config.start, this.config.end);

    const blocks = this.buildEventBlocks(this.startEvents, this.endEvents, this.timeframe);

    this.chartOptions = this.buildChartOptions(blocks);
  }

  private devLog(...args: any[]): void {
    if (this.isDev) {
      console.log(...args);
    }
  }

  private buildEventBlocks(
    starts: IEvent[],
    ends: IEvent[],
    timeframe: [Date, Date]
  ): EventBlock[] {
    this.devLog('buildEventBlocks', { starts, ends, timeframe });

    const [frameStart, frameEnd] = timeframe.map((d) => d.getTime());

    const sortedStarts = [...starts]
      .map((e) => ({ ...e, ts: Date.parse(e.time) }))
      .filter((e) => e.ts <= frameEnd)
      .sort((a, b) => a.ts - b.ts);

    const sortedEnds = [...ends]
      .map((e) => ({ ...e, ts: Date.parse(e.time) }))
      .filter((e) => e.ts >= frameStart)
      .sort((a, b) => a.ts - b.ts);

    let endIndex = 0;

    // first end has no matching start – generate artificial start to fill timeframe
    if (sortedStarts.length < sortedEnds.length) {
      console.log('artificial start added');
      const openEnd = sortedEnds[0];

      sortedStarts.unshift({
        type: sortedStarts[0]?.type,
        source: openEnd.source,
        text: openEnd.text,
        time: this.timeframe[0].toISOString(),
        ts: frameStart,
        id: 'synthetic-start',
      });
    }

    this.devLog('buildEventBlocks » events', { sortedStarts, sortedEnds });

    return sortedStarts.map((start, i) => {
      const startTime = Math.max(start.ts, frameStart);
      let endTime: number;

      // Case 1: matching end-event
      if (endIndex < sortedEnds.length && sortedEnds[endIndex].ts > startTime) {
        endTime = sortedEnds[endIndex].ts;
        endIndex++;
      }
      // Case 2: next start-event
      else if (i + 1 < sortedStarts.length) {
        endTime = sortedStarts[i + 1].ts;
      }
      // Case 3: end of timeframe
      else {
        endTime = frameEnd;
      }

      endTime = Math.min(endTime, frameEnd);

      return {
        label: start.text,
        start: startTime, // display purposes
        end: endTime,
        blockStart: startTime, // chart block generation
        blockEnd: endTime,
        duration: endTime - startTime,
      };
    });
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
          const xStart = api.coord([block.start, 0])[0];
          const xEnd = api.coord([block.end, 0])[0];
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
}
