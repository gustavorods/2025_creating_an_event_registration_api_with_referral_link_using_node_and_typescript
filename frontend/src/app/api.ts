import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, timeout } from 'rxjs';

// Empty uses the same-origin proxy. Set an HTTPS API origin here for separate deployments.
export const API_URL = new InjectionToken<string>('API_URL', { providedIn: 'root', factory: () => '' });
export interface RankingEntry { id: string; name: string; score: number }

@Injectable({ providedIn: 'root' })
export class EventApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_URL);

  subscribe(body: { name: string; email: string; referrer?: string }) {
    return this.http.post<{ subscriberId: string }>(`${this.base}/subscriptions`, body).pipe(timeout(15000));
  }

  dashboard(id: string) {
    const path = `${this.base}/subscribers/${encodeURIComponent(id)}/ranking`;
    return forkJoin({
      clicks: this.http.get<{ count: number }>(`${path}/clicks`),
      invites: this.http.get<{ count: number }>(`${path}/count`),
      position: this.http.get<{ position: number | null }>(`${path}/position`),
      ranking: this.http.get<{ ranking: RankingEntry[] }>(`${this.base}/ranking`),
    }).pipe(timeout(15000));
  }

  inviteUrl(id: string) {
    return new URL(`${this.base}/invites/${encodeURIComponent(id)}`, window.location.origin).href;
  }
}
