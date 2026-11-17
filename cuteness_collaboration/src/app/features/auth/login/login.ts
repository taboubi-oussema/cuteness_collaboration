import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
         DestroyRef, inject }                          from '@angular/core';
import { CommonModule }                                from '@angular/common';
import { ReactiveFormsModule, FormBuilder,
         FormGroup, Validators }                       from '@angular/forms';
import { RouterLink, ActivatedRoute, Router }          from '@angular/router';
import { takeUntilDestroyed }                          from '@angular/core/rxjs-interop';
import { HttpErrorResponse }                           from '@angular/common/http';
import { AuthService }                                 from '../../../core/services/auth.service';
import { environment }                                 from '../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {

  private readonly _fb          = inject(FormBuilder);
  private readonly _authService = inject(AuthService);
  private readonly _router      = inject(Router);
  private readonly _route       = inject(ActivatedRoute);
  private readonly _destroyRef  = inject(DestroyRef);
  private readonly _cdr         = inject(ChangeDetectorRef);

  readonly isProduction = environment.production;

  form: FormGroup = this._fb.group({
    email:      ['', [Validators.required, Validators.email]],
    motDePasse: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false],
  });

  isLoading      = false;
  showPassword   = false;
  errorMessage   = '';
  sessionExpired = false;

  ngOnInit(): void {
    if (this._authService.isAuthenticated()) {
      this._authService.redirectByRole();
      return;
    }

    const remembered = this._authService.getRememberedEmail();
    if (remembered) {
      this.form.patchValue({ email: remembered, rememberMe: true });
    }

    this._route.queryParams
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(p => this.sessionExpired = p['reason'] === 'session-expired');
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.isLoading    = true;
    this.errorMessage = '';
    const { email, motDePasse, rememberMe } = this.form.value as { email: string; motDePasse: string; rememberMe: boolean };

    this._authService.login({ email, motDePasse }, rememberMe)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this._cdr.markForCheck();
          const returnUrl = this._route.snapshot.queryParams['returnUrl'] as string | undefined;
          returnUrl
            ? this._router.navigateByUrl(returnUrl)
            : this._authService.redirectByRole();
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading    = false;
          this.errorMessage = this.parseError(err);
          this._cdr.markForCheck();
        },
      });
  }

  fillDemo(email: string, pass: string): void {
    this.form.patchValue({ email, motDePasse: pass });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  get emailCtrl()    { return this.form.get('email')!;      }
  get passwordCtrl() { return this.form.get('motDePasse')!; }

  get emailError(): string {
    if (this.emailCtrl.hasError('required')) return "L'email est obligatoire.";
    if (this.emailCtrl.hasError('email'))    return "Format d'email invalide.";
    return '';
  }

  get passwordError(): string {
    if (this.passwordCtrl.hasError('required'))  return 'Le mot de passe est obligatoire.';
    if (this.passwordCtrl.hasError('minlength')) return 'Minimum 6 caractères.';
    return '';
  }

  private parseError(err: HttpErrorResponse): string {
    if (err.status === 401) return 'Email ou mot de passe incorrect.';
    if (err.status === 0)   return 'Serveur inaccessible.';
    return (err.error as { message?: string })?.message ?? 'Une erreur est survenue.';
  }
}