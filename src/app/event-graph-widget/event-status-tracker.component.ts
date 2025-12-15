import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { CoreModule, CountdownIntervalComponent, DatePipe, GlobalTimeContextWidgetConfig } from '@c8y/ngx-components';
import { EChartsOption } from 'echarts';
import { has } from 'lodash';
import { EventStatusTrackerService, IEventDuration } from './event-status-tracker.service';
import { differenceInDays, differenceInHours, formatDistance, isSameMinute, startOfToday } from 'date-fns';
import { EventStatusTrackerConfig } from '../model/event-status-tracker';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts';
import * as echartsCore from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
echartsCore.use([BarChart, GridComponent, CanvasRenderer]);

@Component({
  selector: 'c8y-event-status',
  templateUrl: './event-status-tracker.component.html',
  styleUrls: ['./event-status-tracker.component.css'],
  imports: [CoreModule, ModalModule, TooltipModule, NgxEchartsDirective],
  standalone: true,
  providers: [provideEchartsCore({ echarts: echartsCore })],
})
export class EventStatusTrackerComponent implements OnInit, OnChanges {
  @Input() config: EventStatusTrackerConfig & GlobalTimeContextWidgetConfig;
  @Input() isInPreviewMode = false;

  @ViewChild(CountdownIntervalComponent, { static: false })
  countdownIntervalComponent?: CountdownIntervalComponent;

  events: IEventDuration[] = [];
  chartOptions: EChartsOption;
  series: {
    type: string;
    name: string;
    renderItem: any;
    itemStyle: { opacity: number; color: string };
    encode: { x: number[]; y: number };
    data: { name: string; value: number[] }[];
  }[];

  startDate?: Date;
  endDate?: Date;
  shouldUseRealtime = false;

  isWithinRange: 'DAY' | 'HOUR' | 'MINUTE' = 'DAY';

  constructor(
    private eventStatusService: EventStatusTrackerService,
    private datePipe: DatePipe
  ) { }

  ngOnInit(): void {
    if (this.isInPreviewMode) {
      // In preview mode, we set default dates to show some data
      this.endDate = new Date();
      this.startDate = startOfToday();
      this.shouldUseRealtime = false;
      this.loadChartData();
    } else if (this.shouldUseRealtime) {
      this.countdownIntervalComponent!.start();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isInPreviewMode && changes['config']?.currentValue.date) {
      const [startDate, endDate] = changes['config']?.currentValue.date;
      if ((!this.startDate && !this.endDate) || (this.startDate !== startDate && this.endDate !== endDate)) {
        this.startDate = new Date(startDate);
        this.endDate = new Date(endDate);
        this.isWithinRange = this.detectTimeframe(this.startDate, this.endDate);
        // Consider realtime if the configured endDate is the same minute as now (ignore seconds and ms)
        const shouldUseRealtime = !!endDate && isSameMinute(endDate, new Date());
        if (this.shouldUseRealtime !== shouldUseRealtime) {
          this.shouldUseRealtime = shouldUseRealtime;
          shouldUseRealtime && setTimeout(() => {
            this.countdownIntervalComponent!.start();
          }, 200);
        }
        void this.loadChartData();
      }
    }
  }

  private detectTimeframe(startDate: Date, endDate: Date) {
    const diffInHours = differenceInHours(endDate, startDate);
    const diffInDays = differenceInDays(endDate, startDate);

    if (diffInHours <= 1) {
      return 'MINUTE';
    } else if (diffInDays <= 1) {
      return 'HOUR';
    } else {
      return 'DAY';
    }
  }

  refresh(): void {
    this.loadChartData();
    this.countdownIntervalComponent?.reset();
  }

  onCountdownEnded(): void {
    this.loadChartData();
    this.countdownIntervalComponent?.reset();
  }

  async loadChartData() {
    if (!this.startDate || !this.endDate) {
      return;
    }
    this.series = [];
    if (has(this.config, 'device')) {
      try {
        const categories: string[] = [];
        this.config.types.forEach((type) => {
          categories.push(type.type);
        });
        // @ts-ignore
        this.series = await this.prepareChartData(this.startDate!, this.endDate!);

        this.chartOptions = {
          tooltip: {
            formatter: (item: echarts.DefaultLabelFormatterCallbackParams) => {
              const event = this.series[item.seriesIndex!].data[item.dataIndex];
              const [, startDate, endDate, duration] = item.value as number[];
              return `<b>Text:</b> ${event.name}<br/><b>Start date:</b> ${this.datePipe.transform(
                startDate, 'medium'
              )}<br/><b>End date:</b>${this.datePipe.transform(
                endDate, 'medium'
              )}<br/><b>Duration:</b> ca. ${formatDistance(0, duration, {
                includeSeconds: true,
              })}`;
            },
          },

          dataZoom: [
            {
              type: 'slider',
              filterMode: 'weakFilter',
              showDataShadow: false,
              top: 250,
              labelFormatter: '',
            },
            {
              type: 'inside',
              filterMode: 'weakFilter',
            },
          ],
          legend: {
            top: 10,
          },
          grid: {
            left: '3%',
            containLabel: true,
            height: 150,
          },

          xAxis: {
            min: this.startDate.getTime(),
            scale: true,
            axisLabel: {
              formatter: (val: number) => this.xAxisFormatter(val, this.isWithinRange),
            },
          },

          yAxis: {
            data: categories,
          },
          series: <any>this.series,
        };
      } catch (e) {
        console.error(e);
      }
    }
  }

  xAxisFormatter(value: number, isWithinRange: 'DAY' | 'HOUR' | 'MINUTE'): string {
    if (isWithinRange === 'HOUR') {
      return this.datePipe.transform(value, 'HH:mm') || '';
    } else if (isWithinRange === 'MINUTE') {
      return this.datePipe.transform(value, 'HH:mm:ss') || '';
    }
    return this.datePipe.transform(value, 'MMM d, HH:mm') || '';
  }

  async prepareChartData(timeBoxStart: Date, timeBoxEnd: Date) {
    const series = [];
    for (const [index, type] of this.config.types.entries()) {
      const custom = await this.eventStatusService.fetchAndPrepareEvents(
        this.config.device.id,
        type,
        index,
        timeBoxStart,
        timeBoxEnd
      );

      // @ts-ignore
      series.push(...this.eventStatusService.toSeries(custom, this.renderItem, type.values));
      console.log('Prepared series:', series);
    }
    return series;
  }

  renderItem = (
    params: echarts.CustomSeriesRenderItemParams,
    api: echarts.CustomSeriesRenderItemAPI
  ) => {
    const categoryIndex = api.value(0);
    const start = api.coord([api.value(1), categoryIndex]);
    const end = api.coord([api.value(2), categoryIndex]);
    // @ts-ignore
    const height = api.size([0, 1])[1] * 0.2;
    const rectShape = echarts.graphic.clipRectByRect(
      {
        x: start[0],
        y: start[1] - height / 2,
        width: end[0] - start[0],
        height: height,
      },
      {
        x: (<any>params.coordSys).x,
        y: (<any>params.coordSys).y,
        width: (<any>params.coordSys).width,
        height: (<any>params.coordSys).height,
      }
    );
    return (
      rectShape && {
        type: 'rect',
        transition: ['shape'],
        shape: rectShape,
        style: api.style(),
      }
    );
  };
}
