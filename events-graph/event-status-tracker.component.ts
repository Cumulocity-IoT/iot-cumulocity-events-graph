import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@c8y/ngx-components';
import * as echarts from 'echarts';
import { EChartsOption } from 'echarts';
import { has } from 'lodash';
import { ExternalIdService } from './external-id.service';
import { EventStatusTrackerService, IEventDuration } from './event-status-tracker.service';
import { formatDistance, subHours } from 'date-fns';

export type EventStatusTrackerConfig = {
  type: string;
  device: { id: string; name: string };
  types?: { name: string; color: string }[];
  hours?: number;
};

@Component({
  selector: 'app-event-status',
  templateUrl: './event-status-tracker.component.html',
  styleUrls: ['./event-status-tracker.component.css'],
})
export class EventStatusTrackerComponent implements OnInit {
  @Input() config: EventStatusTrackerConfig;

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
  constructor(
    private eventStatusService: EventStatusTrackerService,
    private extId: ExternalIdService,
    private date: DatePipe
  ) {}

  async ngOnInit() {
    const now = new Date();
    const start = subHours(now, this.config.hours || 4);
    const timeBoxStart = Date.parse(start.toISOString());
    const timeBoxEnd = Date.parse(now.toISOString());

    if (has(this.config, 'device')) {
      const deviceId = this.config.device.id;
      try {
        const events = await this.eventStatusService.fetchEvents(
          start,
          now,
          deviceId,
          this.config.type
        );
        const withDuration = this.eventStatusService.convert(timeBoxStart, timeBoxEnd, events);
        const idOrName =
          (await this.extId.getExternalIdForDevice(deviceId)) || this.config.device.name;

        const categories = [idOrName];
        const custom = this.eventStatusService.toCustomFormat(
          categories.indexOf(idOrName),
          timeBoxStart,
          withDuration
        );

        const renderItem = (
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
        const types = this.config.types || [];
        // @ts-ignore
        this.series = this.eventStatusService.toSeries(custom, <any>renderItem, types);

        this.chartOptions = {
          tooltip: {
            formatter: (item: echarts.DefaultLabelFormatterCallbackParams) => {
              const event = this.series[item.seriesIndex!].data[item.dataIndex];
              const [, startDate, endDate, duration] = item.value as number[];
              return `<b>Text:</b> ${event.name}<br/><b>Start date:</b> ${this.date.transform(
                startDate
              )}<br/><b>End date:</b>${this.date.transform(
                endDate
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
            min: timeBoxStart,
            scale: true,
            axisLabel: {
              formatter: (val: number) => this.date.transform(val, 'HH:mm'),
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
}
