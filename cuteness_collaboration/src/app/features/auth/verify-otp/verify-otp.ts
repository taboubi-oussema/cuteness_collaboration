import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChildren, QueryList, ElementRef, inject
} from '@angular/core';
import { CommonModule }          from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient }             from '@angular/common/http';
import { Subject }                from 'rxjs';
import { takeUntil }              from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

const API = `${environment.apiUrl}/auth`;
const OTP_DURATION_S = 600; // 10 minutes

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './verify-otp.html',
  styleUrls: ['./verify-otp.css']
})
export class VerifyOtpComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private router  = inject(Router);
  private route   = inject(ActivatedRoute);
  private http    = inject(HttpClient);
  private destroy$ = new Subject<void>();

  email         = '';
  digits        = ['', '', '', '', '', ''];
  isLoading     = false;
  errorMessage  = '';
  successMessage = '';

  timeLeft      = OTP_DURATION_S;
  private timer?: ReturnType<typeof setInterval>;
  canResend     = false;
  resendLoading = false;

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.email = params['email'] ?? '';
        if (!this.email) this.router.navigate(['/auth/register']);
      });

    this.startTimer();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.focusFirst(), 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.timer) clearInterval(this.timer);
  }

  private startTimer(): void {
    this.timeLeft = OTP_DURATION_S;
    this.canResend = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timer);
        this.canResend = true;
      }
    }, 1000);
  }

  get timerDisplay(): string {
    const m = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const s = (this.timeLeft % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private focusFirst(): void {
    this.digitInputs?.first?.nativeElement?.focus();
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '');

    if (val.length > 1) {
      // Gestion du collage complet du code OTP
      const pasted = val.slice(0, 6);
      pasted.split('').forEach((d, i) => { this.digits[i] = d; });
      const inputs = this.digitInputs.toArray();
      const nextIdx = Math.min(pasted.length, 5);
      inputs[nextIdx]?.nativeElement.focus();
      return;
    }

    this.digits[index] = val;
    if (val && index < 5) {
      this.digitInputs.toArray()[index + 1]?.nativeElement.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        this.digits[index - 1] = '';
        this.digitInputs.toArray()[index - 1]?.nativeElement.focus();
      } else {
        this.digits[index] = '';
      }
    }
  }

  trackByIndex(index: number): number { return index; }

  get otpValue(): string { return this.digits.join(''); }
  get isOtpComplete(): boolean { return this.otpValue.length === 6; }

  onSubmit(): void {
    if (!this.isOtpComplete) return;
    this.isLoading    = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<{ message: string }>(`${API}/verify-otp`, {
      email: this.email,
      otp:   this.otpValue
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          this.successMessage = res.message;
          setTimeout(() => this.router.navigate(['/auth/login']), 2000);
        },
        error: (err) => {
          this.isLoading    = false;
          this.errorMessage = err?.error?.message ?? err?.error?.error ?? 'Code OTP invalide.';
        }
      });
  }

  resendOtp(): void {
    if (!this.canResend || this.resendLoading) return;
    this.resendLoading = true;
    this.errorMessage  = '';

    this.http.post<{ message: string }>(`${API}/resend-otp`, { email: this.email })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.resendLoading = false;
          this.digits = ['', '', '', '', '', ''];
          this.startTimer();
          setTimeout(() => this.focusFirst(), 50);
        },
        error: (err) => {
          this.resendLoading = false;
          this.errorMessage  = err?.error?.message ?? 'Impossible de renvoyer le code.';
        }
      });
  }
}
