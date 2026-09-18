import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EventApi } from './api';

describe('EventApi integration contract', () => {
  let api: EventApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    api = TestBed.inject(EventApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('sends the referrer and accepts the subscriber identifier', () => {
    const body = { name: 'Ana Silva', email: 'ana@example.com', referrer: 'referrer-id' };
    let subscriberId = '';
    api.subscribe(body).subscribe(result => subscriberId = result.subscriberId);
    const req = http.expectOne('/subscriptions');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ subscriberId: 'ana-id' }, { status: 201, statusText: 'Created' });
    expect(subscriberId).toBe('ana-id');
  });

  it('reads all dashboard endpoints and preserves an unranked position', () => {
    let position: number | null | undefined;
    api.dashboard('ana-id').subscribe(result => position = result.position.position);
    http.expectOne('/subscribers/ana-id/ranking/clicks').flush({ count: 0 });
    http.expectOne('/subscribers/ana-id/ranking/count').flush({ count: 0 });
    http.expectOne('/subscribers/ana-id/ranking/position').flush({ position: null });
    http.expectOne('/ranking').flush({ ranking: [] });
    expect(position).toBeNull();
  });

  it('propagates server failures so the dashboard can offer retry', () => {
    let failed = false;
    api.dashboard('ana-id').subscribe({ error: () => failed = true });
    const requests = http.match(() => true);
    requests[0].flush({}, { status: 503, statusText: 'Unavailable' });
    expect(failed).toBe(true);
  });

  it('shares the tracking endpoint instead of bypassing the click counter', () => {
    expect(api.inviteUrl('ana-id')).toBe(`${window.location.origin}/invites/ana-id`);
  });
});
