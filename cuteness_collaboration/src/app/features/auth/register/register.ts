import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule }                          from '@angular/common';
import { ReactiveFormsModule, FormBuilder,
         FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute }    from '@angular/router';
import { Subject }                               from 'rxjs';
import { takeUntil }                             from 'rxjs/operators';
import { HttpClient }                            from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ApiSousPack {
  id:         number;
  nom:        string;
  nomAr:      string;
  emoji:      string;
  theme:      string;
  produitsFr: string[];
  produitsAr: string[];
  imageUrl?:  string;
}

interface ApiPack {
  id:        number;
  nom:       string;
  nomAr:     string;
  prix:      number;
  emoji:     string;
  sousPacks: ApiSousPack[];
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent implements OnInit, OnDestroy {

  private fb       = inject(FormBuilder);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private http     = inject(HttpClient);
  private destroy$ = new Subject<void>();

  form!:          FormGroup;
  isLoading       = false;
  errorMessage    = '';
  showPassword    = false;
  showConfirm     = false;
  selectedPayment = 'carte_bancaire';

  apiPacks: ApiPack[] = [];
  packsLoading = true;

  packs: { value: string; label: string; apiId: number }[] = [];

  availableSousPacks: ApiSousPack[] = [];

  selectedSousPack: ApiSousPack | null = null;

  banques = [
    'BIAT', 'BNA', 'STB', 'Attijari Bank',
    'BH Bank', 'Amen Bank', 'UIB', 'Autre'
  ];

  delegationsMap: Record<string, string[]> = {
    'Ariana':      ['Ariana', 'La Soukra', 'Raoued', 'Kalâat el-Andalous', 'Sidi Thabet', 'Ettadhamen', 'Mnihla'],
    'Béja':        ['Béja Nord', 'Béja Sud', 'Amdoun', 'Nefza', 'Téboursouk', 'Thibar', 'Testour', 'Goubellat', 'Mejez el-Bab'],
    'Ben Arous':   ['Ben Arous', 'Bou Mhel el-Bassatine', 'El Mourouj', 'Ezzahra', 'Fouchana', 'Hammam Chott', 'Hammam Lif', 'Megrine', 'Mohamedia', 'Mornag', 'Radès'],
    'Bizerte':     ['Bizerte Nord', 'Bizerte Sud', 'Bizerte Ouest', 'Ghar El Melh', 'Mateur', 'Menzel Bourguiba', 'Menzel Jemil', 'Ras Jebel', 'Sejnane', 'Utique', 'Zarzouna'],
    'Gabès':       ['Gabès Médina', 'Gabès Ouest', 'Gabès Sud', 'El Hamma', 'Mareth', 'Matmata', 'Nouvelle Matmata', 'Menzel El Habib', 'Ghannouch', 'Métouia'],
    'Gafsa':       ['Gafsa Nord', 'Gafsa Sud', 'Sidi Aïch', 'El Ksar', 'Mdhila', 'El Guettar', 'El Ayoun', 'Redeyef', 'Moularès', 'Oum El Araies'],
    'Jendouba':    ['Jendouba', 'Jendouba Nord', 'Bou Salem', 'Tabarka', 'Aïn Draham', 'Fernana', 'Ghardimaou', 'Oued Mliz', 'Balta-Bou Aouane'],
    'Kairouan':    ['Kairouan Nord', 'Kairouan Sud', 'Bouhajla', 'Chebika', 'Haffouz', 'Hajeb El Ayoun', 'Nasrallah', 'Sbikha', 'El Alaa', 'El Oueslatia'],
    'Kasserine':   ['Kasserine Nord', 'Kasserine Sud', 'Aïn Jedey', 'El Ayoun', 'Feriana', 'Foussana', 'Haïdra', 'Jedeliane', 'Sbeitla', 'Sbiba', 'Thala'],
    'Kébili':      ['Kébili Nord', 'Kébili Sud', 'Douz Nord', 'Douz Sud', 'El Faouar', 'Souk Lahad'],
    'Le Kef':      ['Le Kef Est', 'Le Kef Ouest', 'Dahmani', 'Es Sers', 'Jerissa', 'Kalaat Senan', 'Nebeur', 'Sakiet Sidi Youssef', 'Tajerouine', 'Touiref'],
    'La Manouba':  ['La Manouba', 'Den Den', 'Douar Hicher', 'Djedeida', 'El Battan', 'Mornaguia', 'Oued Ellil', 'Tebourba'],
    'Mahdia':      ['Mahdia', 'Bou Merdes', 'Chorbane', 'El Jem', 'Essouassi', 'Ksour Essaf', 'La Chebba', 'Melloulèche', 'Sidi Alouane'],
    'Médenine':    ['Médenine Nord', 'Médenine Sud', 'Ben Gardane', 'Beni Khedache', 'Djerba Ajim', 'Djerba Houmt Souk', 'Djerba Midoun', 'Sidi Makhlouf', 'Zarzis'],
    'Monastir':    ['Monastir', 'Bembla', 'Beni Hassen', 'Jammel', 'Ksar Hellal', 'Moknine', 'Ouerdanine', 'Sahline', 'Téboulba', 'Zeramdine'],
    'Nabeul':      ['Nabeul', 'Beni Khalled', 'Bou Argoub', 'Dar Chaabane El Fehri', 'El Haouaria', 'Grombalia', 'Hammamet', 'Kelibia', 'Korba', 'Menzel Bouzelfa', 'Menzel Temime', 'Soliman', 'Takelsa'],
    'Sfax':        ['Sfax Ville', 'Sfax Ouest', 'Sfax Est', 'Sakiet Eddaïer', 'Sakiet Ezzit', 'El Ain', 'El Amra', 'El Hencha', 'Jebiniana', 'Kerkennah', 'Mahres', 'Menzel Chaker', 'Skhira', 'Agareb'],
    'Sidi Bouzid': ['Sidi Bouzid Est', 'Sidi Bouzid Ouest', 'Bir El Hafey', 'Jilma', 'Menzel Bouzaïane', 'Mezzouna', 'Ouled Haffouz', 'Regueb', 'Sidi Ali Ben Aoun', 'Souk Jedid', 'El Meknassy'],
    'Siliana':     ['Siliana Nord', 'Siliana Sud', 'Bargou', 'Bou Arada', 'El Aroussa', 'El Krib', 'Gaâfour', 'Kesra', 'Makthar', 'Rohia', 'Sidi Bou Rouis'],
    'Sousse':      ['Sousse Médina', 'Sousse Riadh', 'Sousse Sidi Abdelhamid', 'Sousse Jawhara', 'Akouda', 'Bouficha', 'Enfidha', 'Hammam Sousse', 'Hergla', 'Kalaa Kebira', 'Kalaa Seghira', 'Msaken', 'Sidi Bou Ali', 'Zaouiet Sousse'],
    'Tataouine':   ['Tataouine Nord', 'Tataouine Sud', 'Bir Lahmar', 'Ghomrassen', 'Remada', 'Smar'],
    'Tozeur':      ['Tozeur', 'Degache', 'El Hamma du Jérid', 'Hazoua', 'Nefta', 'Tamerza'],
    'Tunis':       ['Tunis', 'La Goulette', 'La Marsa', 'Le Bardo', 'Carthage', 'El Omrane', 'El Omrane Supérieur', 'El Ouardia', 'Ettahrir', 'Ezzouhour', 'Jebel Jelloud', 'Le Kram', 'Médina', 'Séjoumi', 'Sidi El Béchir', 'Sidi Hassine', 'Cité El Khadra'],
    'Zaghouan':    ['Zaghouan', 'Bir Mcherga', 'El Fahs', 'En Nadhour', 'Saouaf', 'Zriba'],
  };

  gouvernorats = Object.keys(this.delegationsMap);

  get delegations(): string[] {
    const gov = this.form?.get('gouvernorat')?.value;
    return gov ? (this.delegationsMap[gov] ?? []) : [];
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      prenom:         ['', [Validators.required, Validators.minLength(2)]],
      nom:            ['', [Validators.required, Validators.minLength(2)]],
      email:          ['', [Validators.required, Validators.email]],
      telephone:      ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
      motDePasse:     ['', [Validators.required, Validators.minLength(8)]],
      confirmation:   ['', Validators.required],
      pack:           ['', Validators.required],
      souspack:       [''],
      gouvernorat:    ['', Validators.required],
      delegation:     ['', Validators.required],
      codePartenaire: [''],
      modePaiement:   ['carte_bancaire'],
      banque:         ['', Validators.required],
      numeroCompte:   ['', Validators.required],
      numeroEdinar:   ['']
    }, { validators: this.matchPasswords });

    this.form.get('pack')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(packValue => {
        this.onPackChange(packValue);
      });

    this.form.get('gouvernorat')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.form.patchValue({ delegation: '' });
      });

    this.loadPacks();
  }

  private loadPacks(): void {
    this.packsLoading = true;
    this.http.get<ApiPack[]>(`${environment.apiUrl}/packs`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.apiPacks = data;
          this.packs = data.map(p => ({
            value: p.nom.toLowerCase(),
            label: `${p.emoji} Pack ${p.nom} — ${p.prix} DT`,
            apiId: p.id,
          }));
          this.packsLoading = false;
          this.applyQueryParams();
        },
        error: () => {
          this.packs = [
            { value: 'starter', label: '🥉 Pack Starter — 99 DT',  apiId: 1 },
            { value: 'silver',  label: '🥈 Pack Silver — 249 DT',  apiId: 2 },
            { value: 'gold',    label: '🥇 Pack Gold — 499 DT',    apiId: 3 },
          ];
          this.packsLoading = false;
          this.applyQueryParams();
        },
      });
  }

  private applyQueryParams(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['pack']) {
          this.form.patchValue({ pack: params['pack'] });
          this.onPackChange(params['pack']);
        }
        if (params['subpack']) {
          // Le paramètre subpack peut être un identifiant numérique ou un identifiant textuel
          const spParam = params['subpack'];
          const packValue = this.form.get('pack')?.value;
          const pack = this.apiPacks.find(p => p.nom.toLowerCase() === packValue);
          if (pack) {
            const spNum = +spParam;
            let sp = isNaN(spNum)
              ? pack.sousPacks.find(s =>
                  (pack.nom.toLowerCase() + '-' + s.nom.toLowerCase().replace(/\s+/g, '-')) === spParam
                )
              : pack.sousPacks.find(s => s.id === spNum);
            if (sp) { this.selectSousPack(sp); }
          }
        }
      });
  }

  private onPackChange(packValue: string): void {
    this.selectedSousPack = null;
    this.form.patchValue({ souspack: '' });

    if (!packValue) { this.availableSousPacks = []; return; }

    const pack = this.apiPacks.find(p => p.nom.toLowerCase() === packValue);
    this.availableSousPacks = pack?.sousPacks ?? [];
  }

  selectSousPack(sp: ApiSousPack): void {
    if (this.selectedSousPack?.id === sp.id) {
      this.selectedSousPack = null;
      this.form.patchValue({ souspack: '' });
    } else {
      this.selectedSousPack = sp;
      const packValue = this.form.get('pack')?.value ?? '';
      const spKey = `${packValue}-${sp.nom.toLowerCase().replace(/\s+/g, '-')}`;
      this.form.patchValue({ souspack: spKey });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private matchPasswords(g: AbstractControl) {
    const p = g.get('motDePasse')?.value;
    const c = g.get('confirmation')?.value;
    return p === c ? null : { mismatch: true };
  }

  selectPayment(mode: string): void {
    this.selectedPayment = mode;
    this.form.patchValue({ modePaiement: mode });

    if (mode === 'carte_bancaire') {
      this.form.get('banque')?.setValidators(Validators.required);
      this.form.get('numeroCompte')?.setValidators(Validators.required);
      this.form.get('numeroEdinar')?.clearValidators();
      this.form.get('numeroEdinar')?.reset('');
    } else {
      this.form.get('numeroEdinar')?.setValidators([
        Validators.required,
        Validators.pattern(/^ED-\d{4}-\d{4}-\d{4}$/)
      ]);
      this.form.get('banque')?.clearValidators();
      this.form.get('numeroCompte')?.clearValidators();
      this.form.get('banque')?.reset('');
      this.form.get('numeroCompte')?.reset('');
    }

    this.form.get('banque')?.updateValueAndValidity();
    this.form.get('numeroCompte')?.updateValueAndValidity();
    this.form.get('numeroEdinar')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isLoading    = true;
    this.errorMessage = '';

    const packValue = this.form.value.pack;
    const foundPack = this.packs.find(p => p.value === packValue);
    const staticMap: Record<string, number> = { starter: 1, silver: 2, gold: 3 };
    const packId = foundPack?.apiId ?? staticMap[packValue] ?? 1;

    const infoBancaire = this.selectedPayment === 'carte_bancaire'
      ? this.form.value.numeroCompte
      : this.form.value.numeroEdinar;

    const payload = {
      nom:            this.form.value.prenom + ' ' + this.form.value.nom,
      email:          this.form.value.email,
      motDePasse:     this.form.value.motDePasse,
      telephone:      this.form.value.telephone,
      packId,
      codeParrainage: this.form.value.codePartenaire || null,
      region:         this.form.value.gouvernorat + ', ' + this.form.value.delegation,
      modePaiement:   this.selectedPayment,
      banque:         this.form.value.banque || null,
      infoBancaire:   infoBancaire || null,
    };

    this.http.post(`${environment.apiUrl}/auth/register`, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/auth/verify-otp'], {
            queryParams: { email: this.form.value.email }
          });
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Register error:', err);
          if (err.status === 200) {
            this.router.navigate(['/auth/verify-otp'], {
              queryParams: { email: this.form.value.email }
            });
          }
          this.errorMessage = err?.error?.message ?? err?.error?.error ?? 'Une erreur est survenue.';
        },
      });
  }

  themeColor(theme: string): string {
    const map: Record<string, string> = {
      coral: '#FF6B5B', blue: '#3AAFD9', mint: '#00C9A7',
      pink: '#F472B6',  gold: '#F59E0B',
    };
    return map[theme] ?? '#FF6B5B';
  }

  get prenomCtrl()  { return this.form.get('prenom')!;       }
  get nomCtrl()     { return this.form.get('nom')!;          }
  get emailCtrl()   { return this.form.get('email')!;        }
  get telCtrl()     { return this.form.get('telephone')!;    }
  get passCtrl()    { return this.form.get('motDePasse')!;   }
  get confirmCtrl() { return this.form.get('confirmation')!; }
  get packCtrl()    { return this.form.get('pack')!;         }
  get gouvernoratCtrl() { return this.form.get('gouvernorat')!; }
  get delegationCtrl()  { return this.form.get('delegation')!; }
  get banqueCtrl()  { return this.form.get('banque')!;       }
  get numeroCtrl()  { return this.form.get('numeroCompte')!; }
  get edinarCtrl()  { return this.form.get('numeroEdinar')!; }
}
