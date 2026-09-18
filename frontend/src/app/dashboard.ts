import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EventApi, RankingEntry } from './api';

@Component({
  selector: 'app-dashboard', imports: [RouterLink],
  template: `
    <section class="dashboard">
      <a class="back-link" routerLink="/">← Voltar ao início</a>
      <div class="dashboard-heading"><div><div class="eyebrow"><span class="status-dot"></span> INSCRIÇÃO CONFIRMADA</div><h1>Você já faz parte.<br><span>Agora, conecte mais pessoas.</span></h1><p>Compartilhe seu convite e acompanhe cada nova conexão.</p></div><span class="success-stamp" aria-hidden="true">✓</span></div>
      <div class="dashboard-grid">
        <div>
          <section class="panel invite-panel"><span class="eyebrow">SEU PRÓXIMO PASSO</span><h2>Uma boa conexão merece ser compartilhada.</h2><p>Envie seu link. Cada nova inscrição por ele conta como uma indicação sua.</p><label for="invite">Seu link de convite</label><div class="copy-row"><input #invite id="invite" readonly [value]="inviteUrl" (focus)="invite.select()"><button class="primary-button" (click)="copy()">Copiar link <span aria-hidden="true">↗</span></button></div><p class="copy-feedback" role="status">{{ copyMessage() }}</p></section>
          <div class="stats" [attr.aria-busy]="loading()"><section class="panel"><span class="stat-icon">↗</span><strong>{{ loading() ? '…' : data() ? data()!.clicks : '—' }}</strong><span>Acessos ao seu link</span></section><section class="panel"><span class="stat-icon">⌘</span><strong>{{ loading() ? '…' : data() ? data()!.invites : '—' }}</strong><span>Inscrições indicadas</span></section><section class="panel"><span class="stat-icon">★</span><strong>{{ loading() ? '…' : data()?.position ? data()!.position + 'º' : '—' }}</strong><span>Sua posição no ranking</span></section></div>
        </div>
        <section class="panel ranking-panel"><div class="ranking-title"><h2>Quem está conectando</h2><span aria-hidden="true">↗</span></div><p>Top 3 em indicações confirmadas</p>
          @if (loading()) { <p role="status" class="empty-state">Carregando conexões…</p> }
          @else if (error()) { <p class="error-message" role="alert">{{ error() }}</p> }
          @else { <ol class="ranking-list">@for (person of ranking(); track person.id; let index = $index) { <li [class.current-user]="person.id === id"><span class="rank-number">{{ index + 1 }}º</span><span class="rank-name">{{ person.name }}@if (person.id === id) { <small>VOCÊ</small> }</span><strong>{{ person.score }}<small>indicações</small></strong></li> } @empty { <li class="empty-state">As primeiras conexões começam com você. Compartilhe seu link para entrar no ranking.</li> }</ol> }
          <button class="text-button" (click)="refresh()" [disabled]="loading()">{{ loading() ? 'Atualizando…' : 'Atualizar resultados ↻' }}</button>
          <div class="ranking-note">Cada indicação é uma nova pessoa construindo o futuro com a gente.</div>
        </section>
      </div>
    </section>
  `,
})
export class Dashboard implements OnInit {
  private readonly api = inject(EventApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id')!;
  readonly inviteUrl = this.api.inviteUrl(this.id);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly copyMessage = signal('');
  readonly data = signal<{ clicks: number; invites: number; position: number | null } | null>(null);
  readonly ranking = signal<RankingEntry[]>([]);

  ngOnInit() { this.refresh(); }

  refresh() {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.api.dashboard(this.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.data.set({ clicks: result.clicks.count, invites: result.invites.count, position: result.position.position });
        this.ranking.set(result.ranking.ranking);
        this.loading.set(false);
      },
      error: () => {
        this.data.set(null);
        this.error.set('Não foi possível carregar os resultados. Tente atualizar novamente.');
        this.loading.set(false);
      },
    });
  }

  async copy() {
    try { await navigator.clipboard.writeText(this.inviteUrl); this.copyMessage.set('Link copiado! Agora é só compartilhar.'); }
    catch { this.copyMessage.set('Selecione o link acima e copie manualmente.'); }
  }
}
