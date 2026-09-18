import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { EventApi } from './api';
import { Registration } from './registration';

describe('Registration', () => {
  const subscribe = vi.fn();
  beforeEach(() => {
    subscribe.mockReset();
    TestBed.configureTestingModule({
      imports: [Registration],
      providers: [provideRouter([]), { provide: EventApi, useValue: { subscribe } }, {
        provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ referrer: 'friend-id' }) } },
      }],
    });
  });

  it('renders the form and prevents invalid submissions', async () => {
    const fixture = TestBed.createComponent(Registration);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[type="email"]')).toBeTruthy();
    await fixture.componentInstance.submit();
    expect(subscribe).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.email.touched).toBe(true);
  });

  it('preserves the referral, trims input and opens the subscriber dashboard', async () => {
    subscribe.mockReturnValue(of({ subscriberId: 'new-id' }));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const component = TestBed.createComponent(Registration).componentInstance;
    component.form.setValue({ name: ' Ana Silva ', email: ' ana@example.com ' });
    await component.submit();
    expect(subscribe).toHaveBeenCalledWith({ name: 'Ana Silva', email: 'ana@example.com', referrer: 'friend-id' });
    expect(navigate).toHaveBeenCalledWith(['/inscricao', 'new-id']);
    expect(component.submitting()).toBe(false);
  });

  it('keeps form values and allows retry after a network failure', async () => {
    subscribe.mockReturnValue(throwError(() => new Error('offline')));
    const component = TestBed.createComponent(Registration).componentInstance;
    component.form.setValue({ name: 'Ana Silva', email: 'ana@example.com' });
    await component.submit();
    expect(component.error()).toContain('Não foi possível');
    expect(component.submitting()).toBe(false);
    expect(component.form.controls.email.value).toBe('ana@example.com');
  });
});
