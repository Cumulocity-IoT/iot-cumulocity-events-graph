import { CommonModule, CommonModule as NgCommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule as NgFormModule, ReactiveFormsModule } from '@angular/forms';
import {
  CoreModule,
  DynamicComponentDefinition,
  DynamicFormsModule,
  HOOK_COMPONENTS,
} from '@c8y/ngx-components';
import { ContextWidgetConfig } from '@c8y/ngx-components/context-dashboard';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgxEchartsModule } from 'ngx-echarts';
import { EventStatusTrackerWidgetConfig } from './events-graph/event-status-tracker-config.component';
import { EventStatusTrackerComponent } from './events-graph/event-status-tracker.component';
import { EventStatusTrackerService } from './events-graph/event-status-tracker.service';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    ModalModule,
    TooltipModule,
    NgCommonModule,
    NgFormModule,
    ReactiveFormsModule,
    DynamicFormsModule,
    ModalModule.forRoot(),
    NgxEchartsModule.forRoot({
      echarts: () => import('echarts'),
    }),
  ],
  declarations: [EventStatusTrackerComponent, EventStatusTrackerWidgetConfig],
  entryComponents: [EventStatusTrackerComponent, EventStatusTrackerWidgetConfig],
  providers: [
    EventStatusTrackerService,
    {
      provide: HOOK_COMPONENTS,
      multi: true,
      useValue: [
        {
          id: 'events-graph-widget',
          label: 'Events Graph',
          description: 'Show event occurence in a timeline chart.',
          component: EventStatusTrackerComponent,
          configComponent: EventStatusTrackerWidgetConfig,
          previewImage: require('./docs/preview.png'),
          data: {
            settings: {
              noNewWidgets: false, // Set this to true, to don't allow adding new widgets.
              widgetDefaults: {
                _width: 12,
                _height: 5,
              },
              ng1: {
                options: {
                  noDeviceTarget: false, // Set this to true to hide the device selector.
                  groupsSelectable: false, // Set this, if not only devices should be selectable.
                },
              },
            },
          } as ContextWidgetConfig,
        },
      ] as DynamicComponentDefinition[],
    },
  ],
})
export class EventsGraphModule {}
