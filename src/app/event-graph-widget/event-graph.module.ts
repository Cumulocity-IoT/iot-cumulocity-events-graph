import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  CoreModule,
  DynamicWidgetDefinition,
  hookWidget,
  WidgetDataType,
} from '@c8y/ngx-components';
import { hookWidgetConfig } from '@c8y/ngx-components/context-dashboard';
import { gettext } from '@c8y/ngx-components/gettext';
import { defineWidgetControls } from '@c8y/ngx-components/global-context';
import { EventStatusTrackerService } from './event-status-tracker.service';

const eventGraphWidgetControls = defineWidgetControls({
  name: 'events-graph-widget',
  supports: ['timeRange', 'liveRefresh', 'displayMode', 'refreshInterval', 'refreshOption'],
  settings: {
    dashboard: {
      live: {
        inline: {
          showAutoRefresh: true,
          showTimeContext: true,
          showRefreshInterval: true,
        },
      },
      history: {
        inline: {
          showTimeContext: true,
        },
      },
    },
    config: {
      live: {
        inline: {
          showAutoRefresh: true,
          showTimeContext: false,
          showAggregation: false,
        },
        configuration: {
          showTimeContext: true,
          showRefresh: false,
          showAggregation: false,
          showAutoRefresh: false,
          showRefreshInterval: false,
        },
      },
      history: {
        inline: {
          showTimeContext: false,
          showAggregation: false,
        },
        configuration: {
          showTimeContext: true,
          showRefresh: false,
          showAggregation: false,
          showAutoRefresh: false,
          showRefreshInterval: false,
        },
      },
    },
    defaultLinks: {
      config: {},
      dashboard: {
        live: {
          dateTimeContext: true,
          isAutoRefreshEnabled: true,
        },
        history: {
          dateTimeContext: true,
        },
      },
      viewAndConfig: {},
    },
  },
});

async function loadViewComponent() {
  const { EventStatusTrackerComponent } = await import('./view/event-status-tracker.component');
  return EventStatusTrackerComponent;
}

async function loadConfigComponent() {
  const { EventStatusTrackerWidgetConfig } =
    await import('./config/event-status-tracker-config.component');
  return EventStatusTrackerWidgetConfig;
}

@NgModule({
  imports: [CoreModule, CommonModule],
  providers: [
    EventStatusTrackerService,
    hookWidget({
      id: 'events-graph-widget',
      label: 'Events Graph',
      description: 'Show event occurrence in a timeline chart.',
      loadComponent: loadViewComponent,
      loadConfigComponent: loadConfigComponent,
      previewImage: require('../../../docs/preview.png'),
      data: {
        settings: {
          noNewWidgets: false,
          controls: eventGraphWidgetControls,
          widgetDefaults: { _width: 12, _height: 5 },
        },
      },
    } as DynamicWidgetDefinition),
    hookWidgetConfig({
      widgetId: 'events-graph-widget',
      priority: 10,
      label: gettext('Time context'),
      initialState: {
        widgetControls: eventGraphWidgetControls,
      },
      loadComponent: () =>
        import('@c8y/ngx-components/context-dashboard').then(m => m.GlobalContextSectionComponent),
    }),
  ],
})
export class EventsGraphModule {}
