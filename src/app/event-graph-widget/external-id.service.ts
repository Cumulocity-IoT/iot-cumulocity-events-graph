import { Injectable } from '@angular/core';
import { IdentityService } from '@c8y/client';
import { isEmpty } from 'lodash';

@Injectable({ providedIn: 'root' })
export class ExternalIdService {
  constructor(private identityService: IdentityService) {}

  private externalIdCache: { [key: string]: string } = {};
  async getExternalIdForDevice(managedObjectId: string): Promise<string | null> {
    // If the result is in the cache, return it
    if (this.externalIdCache[managedObjectId]) {
      return this.externalIdCache[managedObjectId];
    }

    // Otherwise, make the request
    try {
      const { data } = await this.identityService.list(managedObjectId);
      if (!isEmpty(data)) {
        const externalId = data[0].externalId;

        // Store the result in the cache
        this.externalIdCache[managedObjectId] = externalId;

        return externalId;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  }
}
