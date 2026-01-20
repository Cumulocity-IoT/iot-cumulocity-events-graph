import { Component, inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CoreModule, DynamicComponent, GlobalTimeContextWidgetConfig } from '@c8y/ngx-components';
import { WidgetConfigService } from '@c8y/ngx-components/context-dashboard';
import {
  EVENT_STATUS__BAR_SCALE_DEFAULT,
  EventStatusTrackerConfig,
} from '../model/event-status-tracker';
import { EventStatusTrackerComponent } from './event-status-tracker.component';

@Component({
  selector: 'c8y-event-status-config',
  standalone: true,
  imports: [CoreModule, EventStatusTrackerComponent],
  templateUrl: './event-status-tracker-config.component.html',
  styleUrl: './event-status-tracker-config.component.css',
})
export class EventStatusTrackerWidgetConfig implements OnInit, DynamicComponent {
  @Input() config: EventStatusTrackerConfig & GlobalTimeContextWidgetConfig;

  widgetConfigService = inject(WidgetConfigService);
  // config.widgetInstanceGlobalTimeContext = true;
  // config.canDecoupleGlobalTimeContext = true;

  @ViewChild('preview')
  set previewMapSet(template: TemplateRef<any>) {
    if (template) {
      this.config.widgetInstanceGlobalTimeContext = true;
      this.config.canDecoupleGlobalTimeContext = true;
      this.widgetConfigService.setPreview(template);
      return;
    }
    // @ts-expect-error - setPreview expects TemplateRef but we need to clear it
    this.widgetConfigService.setPreview(null);
  }

  ngOnInit() {
    if (!this.config.barScale) this.config.barScale = EVENT_STATUS__BAR_SCALE_DEFAULT;
    if (!this.config.splitLines) this.config.splitLines = false;
  }
}
