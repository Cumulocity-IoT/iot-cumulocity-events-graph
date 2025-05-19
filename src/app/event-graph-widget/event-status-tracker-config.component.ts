import { Component, Input } from '@angular/core';
import { DynamicComponent } from '@c8y/ngx-components';
import { EventStatusTrackerConfig } from '../model/event-status-tracker';

@Component({
  selector: 'event-status',
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
export class EventStatusTrackerWidgetConfig implements DynamicComponent {
  @Input() config: EventStatusTrackerConfig;

  ngOnInit() {
    if (!this.config.types) {
      this.config.types = [];
    }
    this.config.realtimeInterval = this.config.realtimeInterval || 30000;
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
}
