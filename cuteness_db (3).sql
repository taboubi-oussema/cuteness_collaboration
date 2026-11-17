
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 14 avr. 2026 à 13:21
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `cuteness_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `couleur` varchar(255) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `nom` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `categories`
--

INSERT INTO `categories` (`id`, `couleur`, `description`, `nom`) VALUES
(1, '#923ad9', 'beauté ', 'makeup');

-- --------------------------------------------------------

--
-- Structure de la table `commandes`
--

CREATE TABLE `commandes` (
  `id` int(11) NOT NULL,
  `date_commande` datetime(6) DEFAULT NULL,
  `montant_original` double DEFAULT NULL,
  `montant_reduction` double DEFAULT NULL,
  `montant_total` double DEFAULT NULL,
  `statut` enum('ANNULEE','EN_ATTENTE','LIVREE') DEFAULT NULL,
  `taux_reduction` double DEFAULT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `commandes`
--

INSERT INTO `commandes` (`id`, `date_commande`, `montant_original`, `montant_reduction`, `montant_total`, `statut`, `taux_reduction`, `user_id`) VALUES
(1, '2026-04-01 13:30:55.000000', 2670, 40.05, 226.95, 'LIVREE', 15, 25);

-- --------------------------------------------------------

--
-- Structure de la table `formations`
--

CREATE TABLE `formations` (
  `id` int(11) NOT NULL,
  `acces_requis` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `duree` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `niveau` varchar(255) DEFAULT NULL,
  `ordre` int(11) NOT NULL,
  `titre` varchar(255) NOT NULL,
  `video_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `formations`
--

INSERT INTO `formations` (`id`, `acces_requis`, `description`, `duree`, `image_url`, `niveau`, `ordre`, `titre`, `video_url`) VALUES
(1, 'GOLD', 'une foramtion compléte pour bien mitraiser mlm ', '10 min ', NULL, 'Intermédiaire', 5, 'maitriser mlm ', 'https://youtu.be/UZycZOZ_v20?si=zUf0OB06X--rg8rN'),
(2, 'TOUS', 'description de l\'application', '10', NULL, 'Débutant', 1, 'concept application', 'https://youtu.be/6MmhwofbBKI?si=Gncvb2wO4NQSUrDk');

-- --------------------------------------------------------

--
-- Structure de la table `lignes_commande`
--

CREATE TABLE `lignes_commande` (
  `id` int(11) NOT NULL,
  `prix_unitaire` double NOT NULL,
  `quantite` int(11) NOT NULL,
  `commande_id` int(11) NOT NULL,
  `pack_id` int(11) DEFAULT NULL,
  `produit_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `lignes_commande`
--

INSERT INTO `lignes_commande` (`id`, `prix_unitaire`, `quantite`, `commande_id`, `pack_id`, `produit_id`) VALUES
(1, 89, 3, 1, NULL, 2);

-- --------------------------------------------------------

--
-- Structure de la table `packs`
--

CREATE TABLE `packs` (
  `id` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `prix` double NOT NULL,
  `taux_commission_direct` double NOT NULL,
  `taux_commission_niveau2` double NOT NULL,
  `taux_commission_niveau3` double NOT NULL,
  `taux_reduction` double NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `advantages_ar_json` text DEFAULT NULL,
  `advantages_fr_json` text DEFAULT NULL,
  `color` varchar(255) DEFAULT NULL,
  `emoji` varchar(255) DEFAULT NULL,
  `features_ar` text DEFAULT NULL,
  `features_fr` text DEFAULT NULL,
  `niveaux` int(11) NOT NULL,
  `tagline_ar` varchar(500) DEFAULT NULL,
  `tagline_fr` varchar(500) DEFAULT NULL,
  `nom_ar` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `packs`
--

INSERT INTO `packs` (`id`, `description`, `nom`, `prix`, `taux_commission_direct`, `taux_commission_niveau2`, `taux_commission_niveau3`, `taux_reduction`, `image_url`, `advantages_ar_json`, `advantages_fr_json`, `color`, `emoji`, `features_ar`, `features_fr`, `niveaux`, `tagline_ar`, `tagline_fr`, `nom_ar`) VALUES
(1, 'Pack de démarrage pour nouveaux partenaires', 'Starter', 99, 5, 0, 0, 10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, NULL, NULL, NULL),
(2, 'Pack intermédiaire pour partenaires actifs', 'Silver', 249, 10, 3, 0, 15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
(3, 'Pack premium pour partenaires confirmés', 'Gold', 499, 15, 5, 3, 20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 3, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `packs_sous`
--

CREATE TABLE `packs_sous` (
  `id` bigint(20) NOT NULL,
  `emoji` varchar(255) DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `nom_ar` varchar(255) DEFAULT NULL,
  `ordre` int(11) NOT NULL,
  `produits_ar` text DEFAULT NULL,
  `produits_fr` text DEFAULT NULL,
  `theme` varchar(255) DEFAULT NULL,
  `modele_id` bigint(20) DEFAULT NULL,
  `pack_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `pack_image`
--

CREATE TABLE `pack_image` (
  `id` bigint(20) NOT NULL,
  `image_url` varchar(255) NOT NULL,
  `ordre` int(11) NOT NULL,
  `pack_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `page_content`
--

CREATE TABLE `page_content` (
  `id` int(11) NOT NULL,
  `cle` varchar(80) NOT NULL,
  `section` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `valeur` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `page_content`
--

INSERT INTO `page_content` (`id`, `cle`, `section`, `type`, `updated_at`, `valeur`) VALUES
(1, 'badge', 'hero', 'text', '2026-04-12 01:35:55.000000', 'Plateforme MLM nouvelle génération'),
(2, 'titre', 'hero', 'text', '2026-04-12 01:37:21.000000', 'Développez votre réseau,ensemble'),
(3, 'sous_titre', 'hero', 'text', '2026-04-12 01:35:55.000000', 'Gérez vos partenaires, suivez vos commissions multi-niveaux et boostez votre activité MLM depuis une seule plateforme intuitive et puissante.'),
(4, 'cta_primaire', 'hero', 'text', '2026-04-12 01:35:55.000000', 'Commencer maintenant'),
(5, 'cta_secondaire', 'hero', 'text', '2026-04-12 01:35:55.000000', 'Voir la démo'),
(6, 'image_url', 'hero', 'image', '2026-04-12 01:35:55.000000', ''),
(7, 'partenaires', 'stats', 'text', '2026-04-12 01:35:55.000000', '248+'),
(8, 'commissions', 'stats', 'text', '2026-04-12 01:35:55.000000', '4 712 DT'),
(9, 'livraison', 'stats', 'text', '2026-04-12 01:35:55.000000', '97%'),
(10, 'ca', 'stats', 'text', '2026-04-12 01:35:55.000000', '18 540 DT'),
(11, 'texte', 'banner_promo', 'text', '2026-04-12 01:37:21.000000', '-50% sur tous les packs ce week end !!!!!'),
(12, 'couleur', 'banner_promo', 'color', '2026-04-12 01:37:21.000000', '#db3624'),
(13, 'lien', 'banner_promo', 'text', '2026-04-12 01:35:55.000000', ''),
(14, 'actif', 'banner_promo', 'boolean', '2026-04-12 01:39:04.000000', 'false'),
(15, 'titre', 'cta', 'text', '2026-04-12 01:35:55.000000', 'Prêt à développer votre réseau ?'),
(16, 'desc', 'cta', 'text', '2026-04-12 01:35:55.000000', 'Rejoignez des centaines de partenaires qui développent déjà leur activité sur Cuteness Collaboration.'),
(17, 'desc', 'footer', 'text', '2026-04-12 01:35:55.000000', 'La plateforme MLM nouvelle génération pour développer votre réseau de partenaires en Tunisie.'),
(18, 'facebook', 'footer', 'text', '2026-04-12 01:35:55.000000', ''),
(19, 'instagram', 'footer', 'text', '2026-04-12 01:35:55.000000', ''),
(20, 'linkedin', 'footer', 'text', '2026-04-12 01:35:55.000000', ''),
(21, 'whatsapp', 'footer', 'text', '2026-04-12 01:35:55.000000', ''),
(22, 'starter_prix', 'packs', 'text', '2026-04-12 01:35:55.000000', '99 DT'),
(23, 'starter_desc', 'packs', 'text', '2026-04-12 01:35:55.000000', 'Accès à la plateforme, code parrainage, 5% de commission, support email.'),
(24, 'silver_prix', 'packs', 'text', '2026-04-12 01:35:55.000000', '249 DT'),
(25, 'silver_desc', 'packs', 'text', '2026-04-12 01:35:55.000000', 'Tout Starter inclus, 10% de commission, réseau 2 niveaux, formations incluses.'),
(26, 'gold_prix', 'packs', 'text', '2026-04-12 01:35:55.000000', '499 DT'),
(27, 'gold_desc', 'packs', 'text', '2026-04-12 01:35:55.000000', 'Tout Silver inclus, 15% de commission, réseau 3 niveaux, analytics avancés.'),
(28, 'banniere_texte', 'boutique', 'text', '2026-04-12 01:35:55.000000', ''),
(29, 'banniere_couleur', 'boutique', 'color', '2026-04-12 01:35:55.000000', '#FF6B5B'),
(30, 'banniere_actif', 'boutique', 'boolean', '2026-04-12 01:35:55.000000', 'false'),
(31, 'titre_section', 'boutique', 'text', '2026-04-12 01:35:55.000000', 'Achetez et revendez nos produits'),
(32, 'sous_titre', 'boutique', 'text', '2026-04-12 01:35:55.000000', 'Accédez à notre catalogue et générez des commissions sur chaque vente.'),
(33, 'email', 'contact', 'text', '2026-04-12 01:35:55.000000', 'contact@cuteness.tn'),
(34, 'telephone', 'contact', 'text', '2026-04-12 01:35:55.000000', ''),
(35, 'adresse', 'contact', 'text', '2026-04-12 01:35:56.000000', ''),
(36, 'horaires', 'contact', 'text', '2026-04-12 01:35:56.000000', ''),
(37, 'facebook', 'contact', 'text', '2026-04-12 01:35:56.000000', ''),
(38, 'instagram', 'contact', 'text', '2026-04-12 01:35:56.000000', ''),
(39, 'linkedin', 'contact', 'text', '2026-04-12 01:35:56.000000', ''),
(40, 'whatsapp', 'contact', 'text', '2026-04-12 01:35:56.000000', ''),
(41, 'couleur_principale', 'theme', 'color', '2026-04-12 01:41:55.000000', '#FF6B5B'),
(42, 'couleur_secondaire', 'theme', 'color', '2026-04-12 01:41:55.000000', '#3AAFD9'),
(43, 'couleur_accent', 'theme', 'color', '2026-04-12 01:41:55.000000', '#00C9A7'),
(44, 'couleur_gold', 'theme', 'color', '2026-04-12 01:41:55.000000', '#F59E0B');

-- --------------------------------------------------------

--
-- Structure de la table `produits`
--

CREATE TABLE `produits` (
  `id` int(11) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `prix` double NOT NULL,
  `stock` int(11) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `categorie_id` int(11) DEFAULT NULL,
  `best_seller` bit(1) NOT NULL,
  `en_promo` bit(1) NOT NULL,
  `prix_promo` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `produits`
--

INSERT INTO `produits` (`id`, `description`, `nom`, `prix`, `stock`, `image_url`, `categorie_id`, `best_seller`, `en_promo`, `prix_promo`) VALUES
(1, 'Crème hydratante naturelle 50ml', 'Crème visage', 50, 100, NULL, NULL, b'0', b'0', NULL),
(2, 'Sérum concentré anti-rides 30ml', 'Sérum anti-âge', 89, 47, NULL, NULL, b'0', b'0', NULL),
(3, 'Huile 100% naturelle lavande 10ml', 'Huile essentielle', 35, 200, NULL, NULL, b'0', b'0', NULL),
(4, 'Masque argile purifiant visage', 'Masque purifiant', 45, 80, NULL, NULL, b'0', b'0', NULL),
(6, 'Test product', 'Product A', 50, 10, NULL, NULL, b'0', b'0', NULL),
(7, 'SACcdezf', 'FOND', 20, 100, NULL, 1, b'0', b'0', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `sous_pack`
--

CREATE TABLE `sous_pack` (
  `id` bigint(20) NOT NULL,
  `actif` bit(1) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `description_ar` varchar(500) DEFAULT NULL,
  `emoji` varchar(255) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `nom_ar` varchar(255) DEFAULT NULL,
  `ordre` int(11) NOT NULL,
  `theme` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `sous_pack`
--

INSERT INTO `sous_pack` (`id`, `actif`, `description`, `description_ar`, `emoji`, `nom`, `nom_ar`, `ordre`, `theme`) VALUES
(1, b'1', 'Crèmes, sérums et soins visage/corps', 'كريمات وسيرومات وعناية بالوجه والجسم', '💄', 'Cosmétique', 'كوزميتيك', 0, 'coral'),
(2, b'1', 'Eaux de parfum, déodorants et body lotion', 'عطور ومزيلات عرق ولوسيون جسم', '🌸', 'Parfum', 'عطور', 1, 'pink'),
(3, b'1', 'Montres classiques et accessoires horlogerie', 'ساعات كلاسيكية وإكسسوارات الساعات', '⌚', 'Montre', 'ساعات', 2, 'blue'),
(4, b'1', 'Coffret cadeau combinant cosmétique, parfum et montre', 'صندوق هدايا يجمع كوزميتيك وعطور وساعات', '🎁', 'Mix', 'ميكس', 3, 'mint');

-- --------------------------------------------------------

--
-- Structure de la table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `date` datetime(6) DEFAULT NULL,
  `montant` double NOT NULL,
  `type` enum('ACHAT','COMMISSION','CREDIT') DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `statut` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `transactions`
--

INSERT INTO `transactions` (`id`, `date`, `montant`, `type`, `user_id`, `statut`) VALUES
(1, '2026-03-22 19:11:42.000000', 0, 'ACHAT', 6, NULL),
(2, '2026-03-22 19:11:42.000000', 24.9, 'COMMISSION', 5, NULL),
(3, '2026-03-22 19:11:42.000000', 0, 'COMMISSION', 4, NULL),
(4, '2026-03-22 19:15:36.000000', 0, 'ACHAT', 5, NULL),
(5, '2026-03-22 19:15:36.000000', 0, 'COMMISSION', 4, NULL),
(6, '2026-03-22 19:16:27.000000', 99, 'ACHAT', 5, NULL),
(7, '2026-03-22 19:16:27.000000', 0, 'COMMISSION', 4, NULL),
(8, '2026-03-22 19:18:35.000000', 249, 'ACHAT', 5, NULL),
(9, '2026-03-22 19:18:35.000000', 37.35, 'COMMISSION', 4, NULL),
(10, '2026-03-22 19:22:16.000000', 499, 'ACHAT', 6, NULL),
(11, '2026-03-22 19:22:16.000000', 49.9, 'CREDIT', 5, NULL),
(12, '2026-03-22 19:22:16.000000', 24.95, 'COMMISSION', 4, NULL),
(13, '2026-03-22 19:28:38.000000', 99, 'ACHAT', 6, NULL),
(14, '2026-03-22 19:28:38.000000', 9.9, 'COMMISSION', 5, NULL),
(15, '2026-03-22 19:28:38.000000', 4.95, 'COMMISSION', 4, NULL),
(16, '2026-03-31 15:59:14.000000', 120, 'CREDIT', 17, NULL),
(17, '2026-03-31 16:16:45.000000', 12450, 'CREDIT', 19, NULL),
(18, '2026-04-01 13:30:56.000000', 226.95, 'ACHAT', 25, NULL),
(19, '2026-04-01 13:49:17.000000', 124, 'CREDIT', 23, NULL),
(20, '2026-04-01 14:03:23.000000', 14, 'CREDIT', 5, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `code_parrainage` varchar(255) DEFAULT NULL,
  `date_creation` datetime(6) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) NOT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `role` enum('ADMIN','COMPTABLE','PARTENAIRE','SUPERVISEUR') DEFAULT NULL,
  `solde_interne` double DEFAULT NULL,
  `statut` bit(1) NOT NULL,
  `taux_reduction` double DEFAULT NULL,
  `pack_id` int(11) DEFAULT NULL,
  `parrain_id` int(11) DEFAULT NULL,
  `banque` varchar(255) DEFAULT NULL,
  `info_bancaire` varchar(255) DEFAULT NULL,
  `mode_paiement` varchar(255) DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `code_parrainage`, `date_creation`, `email`, `mot_de_passe`, `nom`, `role`, `solde_interne`, `statut`, `taux_reduction`, `pack_id`, `parrain_id`, `banque`, `info_bancaire`, `mode_paiement`, `telephone`, `region`) VALUES
(4, 'CUT-AA1407', '2026-03-22 18:52:55.000000', 'aymen.trabelsi@gmail.com', '$2a$10$rR3kauqkoB2rRLLesc/f.eFoLHvEtjnGJcX4cL6InS30GWqmyohZ2', 'Aymen Trabelsi', 'PARTENAIRE', 0, b'1', 15, 3, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 'CUT-CB1DA8', '2026-03-22 18:53:14.000000', 'sarra.belhaj@gmail.com', '$2a$10$Bvu1MmAOerXuYNjlEsnzA.aRLbk2JaNSgallfszquFFfU3rbz56EW', 'Sarra Belhaj', 'PARTENAIRE', 0, b'1', 10, 2, 4, NULL, NULL, NULL, NULL, NULL),
(6, 'CUT-5F2C3F', '2026-03-22 18:53:34.000000', 'mohamed.gharbi@gmail.com', '$2a$10$uJYHjNLHgs8V2wP.Bjs9o.sqPcTSbaw53Rf/8D3f1JqfjCxSqKDbW', 'Mohamed Gharbi', 'PARTENAIRE', 0, b'1', 5, 1, 5, NULL, NULL, NULL, NULL, NULL),
(17, 'CUT-0DCB5F', '2026-03-22 23:31:46.000000', 'tabedzl@gmail.com', '$2a$10$AlKy16IayUu83ArZGTn9V.y6IfSY1eXEWGmR8oJ2OkHt/gZca1Zv2', 'Mohamed Gharbi', 'PARTENAIRE', 0, b'1', 5, 1, 6, NULL, NULL, NULL, NULL, NULL),
(19, 'CUTE-A4CD72', '2026-03-30 11:39:25.000000', 'faf@gmail.com', '$2a$10$G.fyx7OtM3fTjUwyE7EByexhOYYqzwNUK/erPaB0/wVFogJq3lhLK', 'ousma taboubi', 'PARTENAIRE', 0, b'1', 5, 1, 4, 'Amen Bank', '456498516563', 'carte_bancaire', '53121677', NULL),
(20, 'CUTE-02E84A', '2026-03-30 11:51:36.000000', 'faff@gmail.com', '$2a$10$iARURiMdGS4SDQWqgS2dWeknFJPGkhvSfZcWHDFe4/1yj3Gu9/5au', 'ousma taboubi', 'COMPTABLE', 1, b'1', 10, 2, 4, 'STB', '456498516563', 'carte_bancaire', '53121677', NULL),
(21, 'CUTE-51C39D', '2026-03-30 12:02:09.000000', 'fafaz@gmail.com', '$2a$10$QmLBTturtCP5E5kE0o3GGuFGNQ.4m0B3x2PI9LoxCfEQgWdVpGUwi', 'ousma taboubi', 'COMPTABLE', 0, b'0', 10, 2, 4, 'UIB', '456498516563', 'carte_bancaire', '53121677', NULL),
(22, 'CUTE-DA04EB', '2026-03-31 14:39:30.000000', 'fafaaaz@gmail.com', '$2a$10$l3QjpNLI3hlc9EtNr26c8.HRq0D75WM2crpLLDfulrmqKLofjwmWO', 'ousma taboubi', 'PARTENAIRE', 0, b'1', 5, 1, 4, 'BNA', '456498516563', 'carte_bancaire', '53121677', NULL),
(23, 'CUTE-99FC86', '2026-03-31 16:09:56.000000', 'user@gmail.com', '$2a$10$W3h5aCa344hHGFofwWDEruRCNApECAVT4CquKUK5JEsnh67G1ZBCK', 'ousma taboubi', 'PARTENAIRE', 0, b'0', 15, 3, 17, 'UIB', '456498516563', 'carte_bancaire', '53121677', NULL),
(24, 'CUTE-2369A9', '2026-03-31 16:11:40.000000', 'dzdafaf@gmail.com', '$2a$10$oqqzcyhVwKP3DobOGNQWp.c14SE98eUia5lcnV2R782u.DIxiFR4y', 'ousma taboubi', 'PARTENAIRE', 0, b'1', 5, 1, 20, 'UIB', '456498516563', 'carte_bancaire', '53121677', NULL),
(25, 'CUTE-1C7B6C', '2026-03-31 16:19:22.000000', 'fadzaf@gmail.com', '$2a$10$ZADP/5AvGPbDpfKyBDQKFuJ1l1DdY/ZpABFF0VdGy6U41jlBRRnh.', 'ousmaamal taboubi', 'PARTENAIRE', 0, b'1', 15, 3, 20, 'Amen Bank', '456498516563', 'carte_bancaire', '53121677', NULL),
(26, 'CUTE-DBF4E6', '2026-04-01 13:43:15.000000', 'mfafafa@gmail.com', '$2a$10$AALO5Zo.HEYkiYqookKvteUFcIGaat2uibvkQbsKGELHaU19EFVBe', 'Mohamed Gharbi', 'PARTENAIRE', 0, b'1', 5, 1, 22, NULL, NULL, NULL, NULL, NULL),
(27, 'CUTE-5E66C9', '2026-04-07 15:46:09.000000', 'admin@cuteness.com', '$2a$10$NJVPnohEUIkFjuwXnnmbHeoqE77Dtka0BPX9vKg08s7pN8229A3Xe', 'amal mezz', 'ADMIN', 0, b'1', 5, 1, 4, 'STB', '1234567896', 'carte_bancaire', '11233445', NULL),
(28, 'CUTE-15A41A', '2026-04-07 15:49:56.000000', 'sup@cuteness.tn', '$2a$10$.nTZNPQVr8gcf3pDKDwqaeFSOWomtUz9kv7sbVtTPQN4gEvB3Xzr6', 'amal mezz', 'SUPERVISEUR', 0, b'1', 5, 1, 4, 'Amen Bank', '1234567896', 'carte_bancaire', '11233445', NULL),
(29, 'CUTE-D81BDE', '2026-04-07 15:51:15.000000', 'compta@cuteness.tn', '$2a$10$Ef8a/WtMgENOpKnWM77XiuQNilSgBI4CRCigg5NBJLLjY.XaSlKw2', 'amal mezz', 'COMPTABLE', 0, b'1', 5, 1, 4, 'STB', '1234567896', 'carte_bancaire', '11233445', NULL),
(30, 'CUTE-716D49', '2026-04-07 15:52:34.000000', 'partenaire@cuteness.com', '$2a$10$PlcQyuXcnNlZQq9BdLZfQu7P6lRICXeZ0mzdItdCuq9p411wq2e1C', 'amal mezz', 'PARTENAIRE', 0, b'1', 5, 1, 4, 'BNA', '1234567896', 'carte_bancaire', '11233445', NULL),
(31, 'CUTE-8E5124', '2026-04-11 12:06:27.000000', 'mezniaya212165@gmal.com', '$2a$10$G6rVSCgvQxREJO.h3BEJXe9PiUM56phiBBOE2aze5VCPX/fO0MkkC', 'ay a mezni', 'PARTENAIRE', 0, b'1', 15, 3, 26, 'BNA', '22335896646216', 'carte_bancaire', '22335588', 'Béja'),
(32, 'CUTE-ECA99D', '2026-04-11 12:12:13.000000', 'hama.trabelsi@gmail.com', '$2a$10$Ljnk1t6KzDqaimxLle4LSOQ6LgH8IaPXV86uAprOyaEi1H1gjlrD.', 'hama hama', 'PARTENAIRE', 0, b'1', 10, 2, 31, 'Amen Bank', '236597946174', 'carte_bancaire', '22335566', 'Ben Arous');

-- --------------------------------------------------------

--
-- Structure de la table `virements`
--

CREATE TABLE `virements` (
  `id` int(11) NOT NULL,
  `date_virement` datetime(6) DEFAULT NULL,
  `info_bancaire` varchar(255) DEFAULT NULL,
  `montant` double NOT NULL,
  `semaine` varchar(255) DEFAULT NULL,
  `statut` enum('ECHEC','EFFECTUE','EN_ATTENTE') DEFAULT NULL,
  `type_payment` varchar(255) DEFAULT NULL,
  `partenaire_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `virements`
--

INSERT INTO `virements` (`id`, `date_virement`, `info_bancaire`, `montant`, `semaine`, `statut`, `type_payment`, `partenaire_id`) VALUES
(1, '2026-03-31 15:59:14.000000', 'N/A **** **** N/A', 120, 'Semaine 14', 'EFFECTUE', 'RIB', 17),
(2, '2026-03-31 16:16:45.000000', '4564 **** **** 6563', 12450, 'Semaine 14', 'EN_ATTENTE', 'CARTE', 19),
(3, '2026-04-01 13:49:17.000000', '4564 **** **** 6563', 124, 'Semaine 14', 'EN_ATTENTE', 'CARTE', 23),
(4, '2026-04-01 14:03:23.000000', 'N/A **** **** N/A', 14, 'Semaine 14', 'EN_ATTENTE', 'RIB', 5);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `commandes`
--
ALTER TABLE `commandes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKavy0l3h0s3v20uoi8dfcq9ipc` (`user_id`);

--
-- Index pour la table `formations`
--
ALTER TABLE `formations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `lignes_commande`
--
ALTER TABLE `lignes_commande`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKtry44xh8jbos217m4nk3wyyem` (`commande_id`),
  ADD KEY `FKb3wu8k6uqurshc901pyfqg1yi` (`pack_id`),
  ADD KEY `FK97125vvuxcin9rytjad4u9bm4` (`produit_id`);

--
-- Index pour la table `packs`
--
ALTER TABLE `packs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `packs_sous`
--
ALTER TABLE `packs_sous`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK8s766ifow8aerys9b9tbx3tot` (`modele_id`),
  ADD KEY `FKdq5q4j5jnr4s8p5ontbbx9690` (`pack_id`);

--
-- Index pour la table `pack_image`
--
ALTER TABLE `pack_image`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK4hxtyg8r5cn17ptx9fg3g79jq` (`pack_id`);

--
-- Index pour la table `page_content`
--
ALTER TABLE `page_content`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UKpq7p6hhimgsscwva9r5bgxpcy` (`section`,`cle`);

--
-- Index pour la table `produits`
--
ALTER TABLE `produits`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK8xk7p0dnnygs2sys4thsfekba` (`categorie_id`);

--
-- Index pour la table `sous_pack`
--
ALTER TABLE `sous_pack`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FKqwv7rmvc8va8rep7piikrojds` (`user_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  ADD UNIQUE KEY `UK3ntgvnv4w7r31t0utiilwci88` (`code_parrainage`),
  ADD KEY `FKenv5n2b328c73d8axu53br1en` (`pack_id`),
  ADD KEY `FKrsryjtbjal4y22yqhorsgr2m4` (`parrain_id`);

--
-- Index pour la table `virements`
--
ALTER TABLE `virements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FK3icp8gdvfd8d890gunqeoti79` (`partenaire_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `commandes`
--
ALTER TABLE `commandes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `formations`
--
ALTER TABLE `formations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `lignes_commande`
--
ALTER TABLE `lignes_commande`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `packs`
--
ALTER TABLE `packs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `packs_sous`
--
ALTER TABLE `packs_sous`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `pack_image`
--
ALTER TABLE `pack_image`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `page_content`
--
ALTER TABLE `page_content`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT pour la table `produits`
--
ALTER TABLE `produits`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `sous_pack`
--
ALTER TABLE `sous_pack`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT pour la table `virements`
--
ALTER TABLE `virements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `commandes`
--
ALTER TABLE `commandes`
  ADD CONSTRAINT `FKavy0l3h0s3v20uoi8dfcq9ipc` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `lignes_commande`
--
ALTER TABLE `lignes_commande`
  ADD CONSTRAINT `FK97125vvuxcin9rytjad4u9bm4` FOREIGN KEY (`produit_id`) REFERENCES `produits` (`id`),
  ADD CONSTRAINT `FKb3wu8k6uqurshc901pyfqg1yi` FOREIGN KEY (`pack_id`) REFERENCES `packs` (`id`),
  ADD CONSTRAINT `FKtry44xh8jbos217m4nk3wyyem` FOREIGN KEY (`commande_id`) REFERENCES `commandes` (`id`);

--
-- Contraintes pour la table `packs_sous`
--
ALTER TABLE `packs_sous`
  ADD CONSTRAINT `FK8s766ifow8aerys9b9tbx3tot` FOREIGN KEY (`modele_id`) REFERENCES `sous_pack` (`id`),
  ADD CONSTRAINT `FKdq5q4j5jnr4s8p5ontbbx9690` FOREIGN KEY (`pack_id`) REFERENCES `packs` (`id`);

--
-- Contraintes pour la table `pack_image`
--
ALTER TABLE `pack_image`
  ADD CONSTRAINT `FK4hxtyg8r5cn17ptx9fg3g79jq` FOREIGN KEY (`pack_id`) REFERENCES `packs` (`id`);

--
-- Contraintes pour la table `produits`
--
ALTER TABLE `produits`
  ADD CONSTRAINT `FK8xk7p0dnnygs2sys4thsfekba` FOREIGN KEY (`categorie_id`) REFERENCES `categories` (`id`);

--
-- Contraintes pour la table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `FKqwv7rmvc8va8rep7piikrojds` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `FKenv5n2b328c73d8axu53br1en` FOREIGN KEY (`pack_id`) REFERENCES `packs` (`id`),
  ADD CONSTRAINT `FKrsryjtbjal4y22yqhorsgr2m4` FOREIGN KEY (`parrain_id`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `virements`
--
ALTER TABLE `virements`
  ADD CONSTRAINT `FK3icp8gdvfd8d890gunqeoti79` FOREIGN KEY (`partenaire_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
