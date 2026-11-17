import { Component, inject, Input, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface ChatMessage {
  role: 'user' | 'bot';
  text: string;
}

type Lang = 'fr' | 'en' | 'ar';

@Component({
  selector: 'app-chat-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-ia.html',
  styleUrls: ['./chat-ia.css'],
})
export class ChatIaComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  @Input() dashboardContext: Record<string, any> | null = null;

  isOpen = false;
  messages: ChatMessage[] = [];
  input = '';
  loading = false;
  lang: Lang = 'fr';
  private hasOpened = false;

  private http = inject(HttpClient);

  private readonly UI: Record<Lang, {
    name: string; status: string; welcome: string;
    placeholder: string; rateLimit: string; error: string;
    langLabel: string;
  }> = {
    fr: {
      name: 'Assistant Cuteness',
      status: 'En ligne',
      welcome: 'Bonjour ! Je suis l\'assistant Cuteness. Comment puis-je vous aider ? 😊',
      placeholder: 'Posez votre question...',
      rateLimit: 'Limite de 15 messages/heure atteinte. Réessaie plus tard.',
      error: 'Une erreur est survenue. Contacte le support : amalcuteness2002@gmail.com',
      langLabel: 'Langue',
    },
    en: {
      name: 'Cuteness Assistant',
      status: 'Online',
      welcome: 'Hello! I\'m the Cuteness assistant. How can I help you? 😊',
      placeholder: 'Ask your question...',
      rateLimit: 'Limit of 15 messages/hour reached. Try again later.',
      error: 'An error occurred. Contact support: amalcuteness2002@gmail.com',
      langLabel: 'Language',
    },
    ar: {
      name: 'مساعد Cuteness',
      status: 'متصل',
      welcome: 'مرحباً! أنا مساعد Cuteness. كيف أقدر نعاونك؟ 😊',
      placeholder: 'اكتب سؤالك هنا...',
      rateLimit: 'وصلت للحد الأقصى (15 رسالة في الساعة). حاول مرة أخرى لاحقاً.',
      error: 'حدث خطأ. اتصل بالدعم: amalcuteness2002@gmail.com',
      langLabel: 'اللغة',
    },
  };

  get t() { return this.UI[this.lang]; }
  get isRTL(): boolean { return this.lang === 'ar'; }

  readonly LANG_OPTIONS: { code: Lang; flag: string; label: string }[] = [
    { code: 'fr', flag: '🇫🇷', label: 'FR' },
    { code: 'en', flag: '🇬🇧', label: 'EN' },
    { code: 'ar', flag: '🇹🇳', label: 'AR' },
  ];

  readonly quickOptions: { fr: string; en: string; ar: string }[] = [
    {
      fr: 'Quel est mon solde actuel ?',
      en: 'What is my current balance?',
      ar: 'ما هو رصيدي الحالي؟',
    },
    {
      fr: 'Combien de filleuls ai-je dans mon réseau ?',
      en: 'How many partners are in my network?',
      ar: 'كم عدد المنتسبين في شبكتي؟',
    },
    {
      fr: 'Montre-moi un résumé de mon évolution',
      en: 'Show me a summary of my progress',
      ar: 'أعطني ملخصاً عن تطوري',
    },
  ];

  get showQuickOptions(): boolean {
    return this.messages.length <= 1 && !this.loading;
  }

  sendQuickReply(text: string): void {
    this.input = text;
    this.send();
  }

  setLang(code: Lang): void {
    this.lang = code;
    if (this.messages.length === 1 && this.messages[0].role === 'bot') {
      this.messages[0].text = this.t.welcome;
    }
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen && !this.hasOpened) {
      this.hasOpened = true;
      this.messages.push({ role: 'bot', text: this.t.welcome });
    }
  }

  send(): void {
    const msg = this.input.trim();
    if (!msg || this.loading) return;
    this.input = '';
    this.messages.push({ role: 'user', text: msg });
    this.loading = true;

    const payload: Record<string, any> = { message: msg };
    if (this.dashboardContext) payload['context'] = this.dashboardContext;

    this.http.post<{ reply: string; error?: string }>(`${environment.apiUrl}/chat`, payload).subscribe({
      next: (res) => {
        this.messages.push({ role: 'bot', text: res.reply });
        this.loading = false;
      },
      error: (err) => {
        const text = err.status === 429 ? this.t.rateLimit : this.t.error;
        this.messages.push({ role: 'bot', text });
        this.loading = false;
      },
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    } catch {}
  }
}
