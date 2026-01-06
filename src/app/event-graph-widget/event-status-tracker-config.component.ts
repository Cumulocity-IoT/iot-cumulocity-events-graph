import { Component, inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {
  CoreModule,
  DynamicComponent,
  GlobalTimeContextWidgetConfig,
  OnBeforeSave,
} from '@c8y/ngx-components';
import { EVENT_STATUS__BAR_SCALE_DEFAULT, EventStatusTrackerConfig } from '../model/event-status-tracker';
import { WidgetConfigService } from '@c8y/ngx-components/context-dashboard';
import { EventStatusTrackerComponent } from './event-status-tracker.component';

@Component({
  selector: 'c8y-event-status-config',
  standalone: true,
  imports: [CoreModule, EventStatusTrackerComponent],
  templateUrl: './event-status-tracker-config.component.html',
  styleUrl: './event-status-tracker-config.component.css',
})
export class EventStatusTrackerWidgetConfig implements OnInit, DynamicComponent, OnBeforeSave {
  @Input() config: EventStatusTrackerConfig & GlobalTimeContextWidgetConfig;

  widgetConfigService = inject(WidgetConfigService);
  eventHasEndFragment: boolean[] = [];

  // eslint-disable-next-line accessor-pairs
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
    if (!this.config.types) this.config.types = [];
    if (!this.config.barScale) this.config.barScale = EVENT_STATUS__BAR_SCALE_DEFAULT;

    this.initEndFragmentArray();
  }

  addEventType() {
    this.config.types.push({
      type: '',
      values: [{ name: '', color: '#000000', label: '' }],
    });
  }

  removeEventType(index: number) {
    this.config.types.splice(index, 1);
  }

  addValue(typeIndex: number) {
    this.config.types[typeIndex].values.push({ name: '', color: '#000000', label: '' });
  }

  removeValue(typeIndex: number, valueIndex: number) {
    this.config.types[typeIndex].values.splice(valueIndex, 1);
  }

  /**
   * This example onBeforeSave handler cancels the saving, if the text is only a white-space.
   */
  onBeforeSave(config: EventStatusTrackerConfig & GlobalTimeContextWidgetConfig): boolean {
    config.widgetInstanceGlobalTimeContext = true;
    config.canDecoupleGlobalTimeContext = true;
    return true;
  }

  private initEndFragmentArray() {
    this.config.types.forEach((eventType, index) => {
      const hasEndFragment = eventType.endFragment !== undefined;
      this.eventHasEndFragment[index] = hasEndFragment;
    });
  }
}
