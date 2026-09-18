import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EventApi } from './api';

@Component({
  selector: 'app-registration', imports: [ReactiveFormsModule],
  template: `
    <section class="registration-layout">
      <div class="event-story">
        <div class="eyebrow"><span class="small-line"></span> PARA QUEM CONSTRÓI O FUTURO</div>
        <h1>O próximo nível<br>começa com uma<br><span>conexão.</span><span class="heading-star" aria-hidden="true">✳</span></h1>
        <p class="intro">Código, aprendizado e pessoas que compartilham a mesma vontade de ir além. Seu próximo passo começa no NLW Connect.</p>
        <div class="event-tags"><span>↗ Tecnologia</span><span>⌘ Comunidade</span><span>✳ Novas conexões</span></div>
        <div class="connection-art" aria-hidden="true"><span class="art-label">IDEIAS SE CONECTAM. VOCÊ EVOLUI.</span><div class="art-track"><span class="code-node">&lt;/&gt;</span><i></i><span class="center-node">connect<span>↗</span></span><i></i><span class="code-node">&#123; &#125;</span></div><span class="art-bottom">BUILD · SHARE · CONNECT</span><span class="art-coordinate">[ 01 — ∞ ]</span></div>
      </div>
      <div class="registration-side">
        <section class="panel registration-card" aria-labelledby="form-title">
          <div class="card-topline"><span class="pill">INSCRIÇÕES ABERTAS</span><span class="corner-arrow" aria-hidden="true">↗</span></div>
          <h2 id="form-title">Faça parte dessa conexão</h2><p>Inscreva-se e convide sua comunidade.</p>
          @if (referrer) { <div class="referral-note">✳ Você chegou por um convite. Sua conexão já começou!</div> }
          <form [formGroup]="form" (ngSubmit)="submit()">
            <label for="name">Nome completo</label>
            <input id="name" formControlName="name" autocomplete="name" placeholder="Como podemos chamar você?" [attr.aria-invalid]="form.controls.name.touched && form.controls.name.invalid" aria-describedby="name-error">
            <div id="name-error" class="field-error">@if (form.controls.name.touched && form.controls.name.invalid) { Informe seu nome (pelo menos 2 caracteres). }</div>
            <label for="email">E-mail</label>
            <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="Seu melhor e-mail" [attr.aria-invalid]="form.controls.email.touched && form.controls.email.invalid" aria-describedby="email-error">
            <div id="email-error" class="field-error">@if (form.controls.email.touched && form.controls.email.invalid) { Informe um e-mail válido. }</div>
            @if (error()) { <p class="error-message" role="alert">{{ error() }}</p> }
            <button class="primary-button" type="submit" [disabled]="submitting()">{{ submitting() ? 'Confirmando inscrição…' : 'Quero me conectar' }}<span aria-hidden="true">↗</span></button>
          </form>
          <p class="form-footnote">Já se inscreveu? Use o mesmo e-mail para acessar seu link de indicação.</p>
        </section>
        <div class="below-card"><span class="mini-icon">↗</span><p><strong>Uma conexão pode abrir muitas portas.</strong><br>Depois de se inscrever, compartilhe seu link e acompanhe suas indicações.</p></div>
      </div>
    </section>
    <section class="steps" aria-label="Como funciona"><div><span>01</span><p><strong>Entre para o evento</strong>Seu primeiro passo é se inscrever.</p></div><div><span>02</span><p><strong>Espalhe a conexão</strong>Convide pessoas com seu link exclusivo.</p></div><div><span>03</span><p><strong>Acompanhe seu impacto</strong>Veja suas indicações e o ranking.</p></div></section>
  `,
})
export class Registration {
  private readonly api = inject(EventApi);
  private readonly router = inject(Router);
  readonly referrer = inject(ActivatedRoute).snapshot.queryParamMap.get('referrer')?.trim() || undefined;
  readonly form = inject(FormBuilder).nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email]],
  });
  readonly submitting = signal(false);
  readonly error = signal('');

  async submit() {
    if (this.submitting()) return;
    this.form.setValue({ name: this.form.controls.name.value.trim(), email: this.form.controls.email.value.trim() });
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const result = await firstValueFrom(this.api.subscribe({ ...this.form.getRawValue(), ...(this.referrer ? { referrer: this.referrer } : {}) }));
      await this.router.navigate(['/inscricao', result.subscriberId]);
    } catch {
      this.error.set('Não foi possível confirmar sua inscrição. Verifique sua conexão e tente novamente.');
    } finally { this.submitting.set(false); }
  }
}
