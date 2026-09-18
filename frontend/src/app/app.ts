import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root', imports: [RouterLink, RouterOutlet],
  template: `
    <a class="skip-link" href="#main">Pular para o conteúdo</a>
    <div class="site-shell">
      <header class="header">
        <a routerLink="/" class="brand" aria-label="NLW Connect, início"><span class="brand-icon">&lt;/&gt;</span> nlw<span class="brand-light">connect</span><span class="brand-dot">.</span></a>
        <span class="header-note"><span class="status-dot"></span> Conecte-se ao próximo nível</span>
      </header>
      <main id="main"><router-outlet /></main>
      <footer><span>Feito de código. Movido por conexões.</span><span>NLW <strong>CONNECT</strong> <span class="footer-symbol">↗</span></span></footer>
    </div>
  `,
})
export class App {}
