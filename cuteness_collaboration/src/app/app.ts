import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
import { ChatIaComponent } from './shared/components/chat-ia/chat-ia';

const PRIVATE_PREFIXES = ['/admin', '/comptable', '/superviseur', '/partner', '/auth'];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ChatIaComponent],
  template: `
    <router-outlet />
    @if (isPublicRoute()) {
      <app-chat-ia />
    }
  `,
})
export class AppComponent {
  private router = inject(Router);

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: this.router.url }
  );

  isPublicRoute(): boolean {
    const url = this.currentUrl();
    return !PRIVATE_PREFIXES.some(prefix => url.startsWith(prefix));
  }
}
