package com.cuteness.backend.config;

import com.cuteness.backend.entity.Pack;
import com.cuteness.backend.entity.SousPack;
import com.cuteness.backend.repository.PackRepository;
import com.cuteness.backend.repository.SousPackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PackDataInitializer implements ApplicationRunner {

    private final PackRepository     packRepository;
    private final SousPackRepository spRepo;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (packRepository.count() == 0) {
            log.info("Seeding default packs + sous-packs...");
            seedStarter();
            seedSilver();
            seedGold();
            log.info("Default packs seeded successfully.");
        } else {
            // Packs already exist: ensure each pack has its 4 sous-packs
            log.info("Packs already exist — ensuring sous-packs are present...");
            ensureSousPacksForAll();
        }
    }

    // ── Called on restart when packs exist but sous-packs may be missing ──
    private void ensureSousPacksForAll() {
        for (Pack pack : packRepository.findAll()) {
            List<SousPack> existing = spRepo.findAllByPackIdOrderByOrdreAsc(pack.getId());
            if (!existing.isEmpty()) {
                log.info("Pack '{}' already has {} sous-packs, skipping.", pack.getNom(), existing.size());
                continue;
            }
            log.info("Pack '{}' has no sous-packs — seeding them now.", pack.getNom());
            switch (pack.getNom().toLowerCase()) {
                case "starter" -> seedStarterSousPacks(pack);
                case "silver"  -> seedSilverSousPacks(pack);
                case "gold"    -> seedGoldSousPacks(pack);
                default        -> log.warn("Unknown pack name '{}', skipping.", pack.getNom());
            }
        }
    }

    // ──────────────────────── STARTER ────────────────────────────
    private void seedStarter() {
        Pack p = packRepository.save(Pack.builder()
            .nom("Starter").nomAr("ستارتر")
            .description("Accès à la plateforme, code parrainage, 5% de commission, support email.")
            .prix(99).tauxCommissionDirect(5).tauxCommissionNiveau2(0).tauxCommissionNiveau3(0)
            .tauxReduction(5).emoji("🥉").color("coral").niveaux(1)
            .taglineFr("Pour commencer votre aventure MLM")
            .taglineAr("لبداية مسيرتك في التسويق الشبكي")
            .featuresFr("Accès à la plateforme|Code parrainage unique|Tableau de bord basique|Support email")
            .featuresAr("الوصول للمنصة|كود إحالة فريد|لوحة تحكم أساسية|دعم عبر البريد الإلكتروني")
            .advantagesFrJson("[{\"icon\":\"fas fa-user-plus\",\"title\":\"Parrainage direct\",\"desc\":\"Invitez des partenaires et suivez leur activité en temps réel.\"},{\"icon\":\"fas fa-chart-simple\",\"title\":\"Dashboard basique\",\"desc\":\"Suivez vos commissions et partenaires depuis une interface claire.\"},{\"icon\":\"fas fa-headset\",\"title\":\"Support email\",\"desc\":\"Réponse garantie sous 48h par notre équipe dédiée.\"}]")
            .advantagesArJson("[{\"icon\":\"fas fa-user-plus\",\"title\":\"إحالة مباشرة\",\"desc\":\"ادعُ شركاء وتابع نشاطهم في الوقت الفعلي.\"},{\"icon\":\"fas fa-chart-simple\",\"title\":\"لوحة تحكم أساسية\",\"desc\":\"تابع عمولاتك وشركاءك من واجهة واضحة.\"},{\"icon\":\"fas fa-headset\",\"title\":\"دعم بالبريد الإلكتروني\",\"desc\":\"رد مضمون خلال 48 ساعة.\"}]")
            .build());
        seedStarterSousPacks(p);
    }

    private void seedStarterSousPacks(Pack p) {
        spRepo.save(sp(p, "Starter Cosmétique", "ستارتر كوزميتيك", "💄", "coral", 0,
            "1 crème hydratante visage (50ml)|1 sérum anti-âge (30ml)|1 masque purifiant|1 lotion tonique",
            "كريم مرطب للوجه (50ml)|سيروم مضاد للشيخوخة (30ml)|قناع منقّي|لوسيون منشّط"));
        spRepo.save(sp(p, "Starter Parfum", "ستارتر عطور", "🌸", "pink", 1,
            "1 eau de parfum 50ml|1 déodorant spray 150ml|1 lotion corps parfumée|1 savon de luxe",
            "عطر 50ml|مزيل عرق سبراي 150ml|لوسيون جسم معطّر|صابون فاخر"));
        spRepo.save(sp(p, "Starter Montre", "ستارتر ساعات", "⌚", "blue", 2,
            "1 montre classique acier|1 bracelet de rechange|1 écrin de présentation|1 chiffon de nettoyage",
            "ساعة كلاسيكية من الفولاذ|سوار احتياطي|علبة عرض أنيقة|قماش تنظيف"));
        spRepo.save(sp(p, "Starter Mix", "ستارتر ميكس", "🎁", "mint", 3,
            "1 crème hydratante visage|1 eau de parfum 30ml|1 montre fashion|1 pochette cadeau",
            "كريم مرطب للوجه|عطر 30ml|ساعة فاشون|حقيبة هدايا"));
    }

    // ──────────────────────── SILVER ─────────────────────────────
    private void seedSilver() {
        Pack p = packRepository.save(Pack.builder()
            .nom("Silver").nomAr("سيلفر")
            .description("Tout Starter inclus, 10% de commission, réseau 2 niveaux, formations incluses.")
            .prix(249).tauxCommissionDirect(10).tauxCommissionNiveau2(3).tauxCommissionNiveau3(0)
            .tauxReduction(10).emoji("🥈").color("blue").niveaux(2)
            .taglineFr("Pour développer un réseau solide")
            .taglineAr("لبناء شبكة قوية ومتينة")
            .featuresFr("Tout Starter inclus|Réseau 2 niveaux|10% commission niveau 1|3% commission niveau 2|Formations vidéo|Support prioritaire")
            .featuresAr("كل مزايا ستارتر|شبكة من مستويين|عمولة 10% المستوى 1|عمولة 3% المستوى 2|تدريبات فيديو|دعم ذو أولوية")
            .advantagesFrJson("[{\"icon\":\"fas fa-sitemap\",\"title\":\"Réseau 2 niveaux\",\"desc\":\"Commissions sur vos filleuls directs (10%) et leurs filleuls (3%).\"},{\"icon\":\"fas fa-graduation-cap\",\"title\":\"Formations vidéo\",\"desc\":\"Accédez à notre bibliothèque de formations MLM.\"},{\"icon\":\"fas fa-star\",\"title\":\"Support prioritaire\",\"desc\":\"Réponse sous 24h par un conseiller Senior.\"}]")
            .advantagesArJson("[{\"icon\":\"fas fa-sitemap\",\"title\":\"شبكة من مستويين\",\"desc\":\"عمولات من إحالاتك المباشرة (10%) ومن إحالاتهم (3%).\"},{\"icon\":\"fas fa-graduation-cap\",\"title\":\"تدريبات فيديو\",\"desc\":\"استفد من مكتبة التدريبات.\"},{\"icon\":\"fas fa-star\",\"title\":\"دعم ذو أولوية\",\"desc\":\"رد خلال 24 ساعة.\"}]")
            .build());
        seedSilverSousPacks(p);
    }

    private void seedSilverSousPacks(Pack p) {
        spRepo.save(sp(p, "Silver Cosmétique", "سيلفر كوزميتيك", "✨", "coral", 0,
            "1 coffret soin visage complet|1 sérum vitamine C (50ml)|1 crème nuit régénérante|1 contour des yeux|1 gommage doux corps|1 huile corporelle premium",
            "طقم عناية كامل بالوجه|سيروم فيتامين C (50ml)|كريم ليلي مجدد|كريم حول العينين|تقشير ناعم للجسم|زيت جسم فاخر"));
        spRepo.save(sp(p, "Silver Parfum", "سيلفر عطور", "💐", "pink", 1,
            "2 eaux de parfum 50ml (mixte)|1 déodorant premium 200ml|1 body lotion luxe 200ml|1 gel douche parfumé|1 coffret cadeau luxe",
            "عطران 50ml (مختلطان)|مزيل عرق بريميوم 200ml|لوسيون جسم فاخر 200ml|جل استحمام معطّر|علبة هدايا فاخرة"));
        spRepo.save(sp(p, "Silver Montre", "سيلفر ساعات", "🕰️", "blue", 2,
            "1 montre homme/femme premium|2 bracelets interchangeables|1 écrin de luxe|1 garantie 1 an|1 pochette transport",
            "ساعة رجالية/نسائية بريميوم|سواران قابلان للتبادل|علبة فاخرة|ضمان لمدة سنة|حقيبة نقل"));
        spRepo.save(sp(p, "Silver Mix", "سيلفر ميكس", "🎀", "mint", 3,
            "1 coffret soin visage (3 produits)|1 eau de parfum 50ml|1 montre fashion premium|1 body lotion 150ml|1 coffret cadeau élégant",
            "طقم عناية بالوجه (3 منتجات)|عطر 50ml|ساعة فاشون بريميوم|لوسيون جسم 150ml|علبة هدايا أنيقة"));
    }

    // ──────────────────────── GOLD ───────────────────────────────
    private void seedGold() {
        Pack p = packRepository.save(Pack.builder()
            .nom("Gold").nomAr("غولد")
            .description("Tout Silver inclus, 15% de commission, réseau 3 niveaux, analytics avancés.")
            .prix(499).tauxCommissionDirect(15).tauxCommissionNiveau2(5).tauxCommissionNiveau3(2)
            .tauxReduction(15).emoji("🥇").color("gold").niveaux(3)
            .taglineFr("Pour les leaders qui visent haut")
            .taglineAr("للقادة الطموحين الذين يستهدفون القمة")
            .featuresFr("Tout Silver inclus|Réseau 3 niveaux|15% commission niveau 1|5% commission niveau 2|2% commission niveau 3|Analytics avancés|Support dédié 24/7|Badge Gold")
            .featuresAr("كل مزايا سيلفر|شبكة 3 مستويات|عمولة 15% المستوى 1|عمولة 5% المستوى 2|عمولة 2% المستوى 3|تحليلات متقدمة|دعم 24/7|شارة غولد")
            .advantagesFrJson("[{\"icon\":\"fas fa-crown\",\"title\":\"Badge Gold\",\"desc\":\"Affichez votre statut premium et boostez la confiance de votre réseau.\"},{\"icon\":\"fas fa-chart-line\",\"title\":\"Analytics avancés\",\"desc\":\"Rapports détaillés, export CSV, prévisions de revenus.\"},{\"icon\":\"fas fa-phone-volume\",\"title\":\"Support 24/7\",\"desc\":\"Conseiller personnel disponible à tout moment.\"}]")
            .advantagesArJson("[{\"icon\":\"fas fa-crown\",\"title\":\"شارة غولد\",\"desc\":\"أظهر وضعك المتميز وعزّز ثقة شركائك في شبكتك.\"},{\"icon\":\"fas fa-chart-line\",\"title\":\"تحليلات متقدمة\",\"desc\":\"تقارير مفصّلة، تصدير CSV، توقعات الدخل.\"},{\"icon\":\"fas fa-phone-volume\",\"title\":\"دعم 24/7\",\"desc\":\"مستشار شخصي متاح في أي وقت.\"}]")
            .build());
        seedGoldSousPacks(p);
    }

    private void seedGoldSousPacks(Pack p) {
        spRepo.save(sp(p, "Gold Cosmétique", "غولد كوزميتيك", "👑", "coral", 0,
            "1 coffret soin premium complet (6 produits)|1 sérum acide hyaluronique 50ml|1 crème jour SPF50 premium|1 crème nuit régénérante luxe|1 masque or 24 carats|1 huile visage précieuse|1 contour yeux anti-âge|1 gommage corps exfoliant",
            "طقم عناية بريميوم كامل (6 منتجات)|سيروم حمض الهيالورونيك 50ml|كريم نهاري SPF50 فاخر|كريم ليلي مجدد فاخر|قناع ذهب 24 قيراط|زيت وجه ثمين|كريم حول العينين مضاد للشيخوخة|تقشير جسم مقشّر"));
        spRepo.save(sp(p, "Gold Parfum", "غولد عطور", "💎", "pink", 1,
            "2 eaux de parfum 100ml collection exclusive|1 parfum oud 30ml|1 déodorant luxe 200ml|1 body lotion or 250ml|1 savon de hammam luxe|1 coffret cadeau premium gravé",
            "عطران 100ml من المجموعة الحصرية|عطر عود 30ml|مزيل عرق فاخر 200ml|لوسيون جسم ذهبي 250ml|صابون حمام فاخر|علبة هدايا بريميوم منقوشة"));
        spRepo.save(sp(p, "Gold Montre", "غولد ساعات", "🏆", "blue", 2,
            "1 montre de luxe acier doré|1 montre fashion tendance|3 bracelets interchangeables|1 écrin de voyage luxe|1 garantie 2 ans|1 service entretien offert",
            "ساعة فاخرة من الفولاذ الذهبي|ساعة فاشون عصرية|3 أساور قابلة للتبديل|علبة سفر فاخرة|ضمان سنتين|خدمة صيانة مجانية"));
        spRepo.save(sp(p, "Gold Mix", "غولد ميكس", "🌟", "mint", 3,
            "1 coffret soin visage premium (4 produits)|1 eau de parfum 100ml exclusive|1 montre de luxe acier|1 body lotion or 200ml|1 parfum oud 30ml|1 coffret cadeau luxe gravé",
            "طقم عناية بالوجه بريميوم (4 منتجات)|عطر 100ml حصري|ساعة فاخرة من الفولاذ|لوسيون جسم ذهبي 200ml|عطر عود 30ml|علبة هدايا فاخرة منقوشة"));
    }

    // ── helper ──
    private SousPack sp(Pack pack, String nom, String nomAr, String emoji, String theme,
                        int ordre, String fr, String ar) {
        return SousPack.builder()
                .pack(pack).nom(nom).nomAr(nomAr).emoji(emoji).theme(theme)
                .ordre(ordre).produitsFr(fr).produitsAr(ar).build();
    }
}
