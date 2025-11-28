import { Component, inject, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CoreModule, DynamicComponent, GlobalTimeContextWidgetConfig, OnBeforeSave } from '@c8y/ngx-components';
import { EventStatusTrackerConfig } from '../model/event-status-tracker';
import { WidgetConfigService } from '@c8y/ngx-components/context-dashboard';
import { EventStatusTrackerComponent } from './event-status-tracker.component';

@Component({
  selector: 'event-status-config',
  standalone: true,
  imports: [CoreModule, EventStatusTrackerComponent],
  templateUrl: './event-status-tracker-config.component.html',
  styles: [
    `
      .d-flex {
        display: flex;
        align-items: center;
      }
      .egw-card-header {
        display: block;
      }
      .event-type-del {
        float: right;
        padding-top: 25px;
        font-size: 22px;
      }
      .event-value-add {
        font-size: 16px;
        margin-top: 15px;
      }
      .event-value-del {
        font-size: 16px;
        margin-top: 20px;
      }
      .form-group {
        margin-right: 10px;
      }
      .input-group-btn {
        display: flex;
        align-items: center;
      }
    `,
  ],
})
export class EventStatusTrackerWidgetConfig implements OnInit, DynamicComponent, OnBeforeSave {
  @Input() config: EventStatusTrackerConfig & GlobalTimeContextWidgetConfig;

  widgetConfigService = inject(WidgetConfigService)

  // eslint-disable-next-line accessor-pairs
  @ViewChild('preview')
  set previewMapSet(template: TemplateRef<any>) {
    if (template) {
      this.config.widgetInstanceGlobalTimeContext = true;
      this.config.canDecoupleGlobalTimeContext = true;
      this.widgetConfigService.setPreview(template)
      return
    }
    // @ts-expect-error - setPreview expects TemplateRef but we need to clear it
    this.widgetConfigService.setPreview(null)
  }

  ngOnInit() {
    if (!this.config.types) {
      this.config.types = [];
    }
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
}
