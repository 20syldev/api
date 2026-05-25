<div align="center">
  <a href="https://api.sylvain.sh"><img src="https://api.sylvain.sh/favicon.ico" alt="Logo" width="25%" height="auto"/></a>

# API Personnelle

[![Version](https://custom-icon-badges.demolab.com/badge/Version%20:-v5.0.0-6479ee?logo=api.sylvain.sh&labelColor=23272A)](https://github.com/20syldev/api/releases/latest)

</div>

---

## À propos de l'API

Voici mon API personnelle, disponible sur le domaine [api.sylvain.sh](https://api.sylvain.sh).
L'API est développée avec **TypeScript** et **Node.js**, et hébergée **24h/7j**. Elle est **simple d'utilisation** et a une **documentation** disponible sur [docs.sylvain.sh](https://docs.sylvain.sh) !

> _Une limite de **2000** requêtes **par heure** est fixée. Elle change pour certains endpoints nécessitant plus de ressources. Si vous souhaitez une **augmentation** de cette limite, n'hésitez pas à visiter la [documentation](https://docs.sylvain.sh/pricing)._

## Prérequis

- **Node.js** >= 22.0.0

## Installer le paquet de l'API sur votre machine

```console
$ sudo apt install nodejs npm
$ npm install @20syldev/api
$ npm init
```

> _Attention, vous devez configurer le type sur "**module**" dans votre fichier `package.json`._

## Utiliser l'API

### Option 1 : Démarrer un serveur local

Pour démarrer un serveur local avec tous les endpoints :

```console
$ npm run build && npm start
```

```console
> @20syldev/api@5.0.0 build
> tsc

> @20syldev/api@5.0.0 start
> node dist/app.js

API is running on
    - http://127.0.0.1:3000
    - http://localhost:3000
```

Pour le développement avec rechargement automatique :

```console
$ npm run dev
```

### Option 2 : Utiliser les modules directement dans votre code

Vous pouvez également importer les modules spécifiques dont vous avez besoin :

```js
// Importer des modules spécifiques depuis la v5
import { evaluate, color, username } from '@20syldev/api/v5';

// Évaluer une expression mathématique
const expr = evaluate('sin(pi / 2) + sqrt(4)', 5);
console.log(expr.result);     // 3
console.log(expr.expression); // "sin(pi / 2) + sqrt(4)"

// Générer une couleur aléatoire
const couleur = color();
console.log(`Couleur HEX: ${couleur.hex}`);
console.log(`Couleur RGB: ${couleur.rgb}`);

// Générer un nom d'utilisateur aléatoire
const utilisateur = username();
console.log(`Nom d'utilisateur: ${utilisateur.username}`);
```

## Scripts disponibles

| Commande         | Description                                                        |
| ---------------- | ------------------------------------------------------------------ |
| `npm run dev`    | Serveur de développement avec rechargement automatique (tsx watch) |
| `npm run build`  | Compilation TypeScript vers `dist/`                                |
| `npm start`      | Démarrer le serveur de production (`node dist/app.js`)             |
| `npm test`       | Lancer les tests unitaires et d'intégration                        |
| `npm run lint`   | Vérification ESLint                                                |
| `npm run format` | Formatage avec Prettier                                            |
| `npm run check`  | Vérification TypeScript + ESLint                                   |

## Endpoints disponibles (v5)

| Endpoint            | Méthode    | Description                                             |
| ------------------- | ---------- | ------------------------------------------------------- |
| `/v5/address`       | GET        | Génération d'adresses postales aléatoires               |
| `/v5/agent`         | GET        | Analyse de User-Agent                                   |
| `/v5/algorithms`    | GET        | Fonctions algorithmiques (tri, fibonacci, factorielle…) |
| `/v5/avatar`        | GET        | Génération d'avatars identicon/pixel                    |
| `/v5/barcode`       | GET        | Génération de codes-barres (Code128, EAN-13/8, Code39)  |
| `/v5/captcha`       | GET        | Génération d'images captcha                             |
| `/v5/chart`         | POST       | Génération de graphiques SVG (bar, line, pie, donut)    |
| `/v5/chat`          | GET / POST | Système de chat temporaire                              |
| `/v5/color`         | GET        | Génération de couleurs aléatoires                       |
| `/v5/convert`       | GET        | Conversions d'unités                                    |
| `/v5/credit`        | GET        | Génération de cartes bancaires fictives (Luhn valide)   |
| `/v5/cron`          | GET        | Analyse d'expressions cron                              |
| `/v5/dice`          | GET        | Lanceur de dés RPG                                      |
| `/v5/domain`        | GET        | Informations de domaine aléatoires                      |
| `/v5/encode`        | GET        | Encodage / décodage                                     |
| `/v5/evaluate`      | GET        | Évaluation d'expressions mathématiques                  |
| `/v5/geo`           | GET        | Calcul de distance géographique                         |
| `/v5/hash`          | POST       | Hachage de texte                                        |
| `/v5/headers`       | GET        | Informations des en-têtes HTTP                          |
| `/v5/hyperplanning` | POST       | Analyse de calendriers HyperPlanning                    |
| `/v5/infos`         | GET        | Informations sur l'API                                  |
| `/v5/ip`            | GET        | Analyse d'adresses IP                                   |
| `/v5/levenshtein`   | GET        | Distance entre chaînes                                  |
| `/v5/matrix`        | POST       | Opérations matricielles (add, multiply, inverse…)       |
| `/v5/palette`       | GET        | Génération de palettes de couleurs                      |
| `/v5/password`      | GET        | Génération de mots de passe sécurisés                   |
| `/v5/personal`      | GET        | Profil personnel aléatoire                              |
| `/v5/placeholder`   | GET        | Génération d'images placeholder                         |
| `/v5/qrcode`        | GET        | Génération de QR codes                                  |
| `/v5/regex`         | GET        | Test d'expressions régulières                           |
| `/v5/statistics`    | GET        | Statistiques descriptives                               |
| `/v5/text`          | GET        | Utilitaires texte                                       |
| `/v5/tic-tac-toe`   | GET / POST | Jeu de morpion                                          |
| `/v5/time`          | GET        | Informations temporelles                                |
| `/v5/token`         | POST       | Génération de jetons sécurisés                          |
| `/v5/username`      | GET        | Génération de noms d'utilisateur                        |
| `/v5/validate`      | GET        | Validation (Luhn, IBAN, email)                          |

## Exemples d'utilisation

```js
import { chart, evaluate, matrix } from '@20syldev/api/v5';

// Évaluer une expression mathématique
const { result } = evaluate('log2(8) * (3 + pi)', 4);
console.log(result); // 18.4248

// Opération matricielle — produit de deux matrices
const { result: product } = matrix.multiply([[1, 2], [3, 4]], [[5, 6], [7, 8]]);
console.log(product); // [[19, 22], [43, 50]]

// Générer un graphique SVG en mémoire
const { body: svg } = chart.bar(
    { labels: ['Jan', 'Fév', 'Mar'], datasets: [{ label: 'Ventes', values: [120, 85, 200] }] },
    { width: 600, height: 300 },
);
// body contient une chaîne SVG prête à l'emploi
```

_Visitez la [documentation](https://docs.sylvain.sh) dédiée, vous y retrouverez des exemples de requêtes et des codes simples pour tester l'[API](https://api.sylvain.sh) !_
