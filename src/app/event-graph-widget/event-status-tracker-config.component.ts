import { Component, Input } from '@angular/core';
import { AlertService, DynamicComponent, OnBeforeSave } from '@c8y/ngx-components';
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
export class EventStatusTrackerWidgetConfig implements DynamicComponent, OnBeforeSave {
  @Input() config: EventStatusTrackerConfig;

  constructor(private alert: AlertService) {}

  ngOnInit() {
    if (!this.config.types) {
      this.config.types = [{ name: '', color: '#000000', label: '' }];
    }
  }

  addType() {
    this.config.types?.push({ name: '', color: '#000000', label: '' });
  }

  removeType(index: number) {
    this.config.types?.splice(index, 1);
  }

  onBeforeSave(config: EventStatusTrackerConfig): boolean {
    if (config.type?.trim() === '') {
      this.alert.warning('Please enter a valid text.');
      return false;
    }
    return true;
  }
}
