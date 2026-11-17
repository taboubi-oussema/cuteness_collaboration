import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { ReactiveFormsModule, FormBuilder,
         FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router }    from '@angular/router';
import { Subject }                               from 'rxjs';
import { takeUntil }                             from 'rxjs/operators';
import { AuthService }                           from '../../../core/services/auth.service';

type Step = 'request' | 'success' | 'change' | 'done';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {

  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);
  private route       = inject(ActivatedRoute);
  private destroy$    = new Subject<void>();

  step: Step    = 'request';
  requestForm!: FormGroup;
  changeForm!:  FormGroup;
  isLoading     = false;
  errorMessage  = '';
  showNewPass   = false;
  showConfirm   = false;

  ngOnInit(): void {
    this.requestForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(p => {
      if (p['token']) {
        this.step = 'change';
        this.changeForm = this.fb.group({
          token:             [p['token']],
          nouveauMotDePasse: ['', [Validators.required, Validators.minLength(8)]],
          confirmation:      ['', Validators.required]
        }, { validators: this.matchPasswords });
      }
    });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  private matchPasswords(g: AbstractControl) {
    const p = g.get('nouveauMotDePasse')?.value;
    const c = g.get('confirmation')?.value;
    return p === c ? null : { mismatch: true };
  }

  onRequestSubmit(): void {
    if (this.requestForm.invalid) { this.requestForm.markAllAsTouched(); return; }
    this.isLoading = true; this.errorMessage = '';
    this.authService.requestPasswordReset(this.requestForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.isLoading = false; this.step = 'success'; },
        error: (e) => { 
          this.isLoading = false; 
          this.errorMessage = this.extractErrorMessage(e); 
        }
      });
  }

  onChangeSubmit(): void {
    if (this.changeForm.invalid) { this.changeForm.markAllAsTouched(); return; }
    this.isLoading = true; this.errorMessage = '';
    this.authService.changePassword(this.changeForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:  () => { this.isLoading = false; this.step = 'done'; },
        error: (e) => { 
          this.isLoading = false; 
          this.errorMessage = this.extractErrorMessage(e) || 'Lien expiré.'; 
        }
      });
  }

  goToLogin(): void { this.router.navigate(['/auth/login']); }

  get emailCtrl()   { return this.requestForm?.get('email')!;            }
  get newPassCtrl() { return this.changeForm?.get('nouveauMotDePasse')!; }
  get confirmCtrl() { return this.changeForm?.get('confirmation')!;      }

  get passStrength(): 'weak' | 'medium' | 'strong' {
    const len = this.newPassCtrl?.value?.length ?? 0;
    if (len >= 12) return 'strong';
    if (len >= 8)  return 'medium';
    return 'weak';
  }
  get passStrengthWidth(): string {
    return this.passStrength === 'strong' ? '100%' : this.passStrength === 'medium' ? '60%' : '30%';
  }
  get passStrengthLabel(): string {
    return this.passStrength === 'strong' ? 'Fort' : this.passStrength === 'medium' ? 'Moyen' : 'Faible';
  }

  private extractErrorMessage(e: unknown): string {
    if (!e) return 'Erreur.';
    if (typeof e === 'object' && 'message' in e) return (e as { message: unknown }).message as string;
    if (typeof e === 'object' && 'error' in e) {
      const err = e as { error?: { message?: unknown } };
      return err.error?.message as string ?? JSON.stringify(e);
    }
    return String(e);
  }
}