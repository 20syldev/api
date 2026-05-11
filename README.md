<div align="center">
  <a href="https://api.sylvain.sh"><img src="https://api.sylvain.sh/favicon.ico" alt="Logo" width="25%" height="auto"/></a>

# API Personnelle

[![Version](https://custom-icon-badges.demolab.com/badge/Version%20:-v4.9.0-6479ee?logo=api.sylvain.sh&labelColor=23272A)](https://github.com/20syldev/api/releases/latest)

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
> @20syldev/api@4.9.0 build
> tsc

> @20syldev/api@4.9.0 start
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
// Importer des modules spécifiques depuis la v4
import { color, token, username } from '@20syldev/api/v4';

// Générer une couleur aléatoire
const couleur = color();
console.log(`Couleur HEX: ${couleur.hex}`);
console.log(`Couleur RGB: ${couleur.rgb}`);
console.log(`Couleur HSL: ${couleur.hsl}`);

// Générer un nom d'utilisateur aléatoire
const utilisateur = username();
console.log(`Nom d'utilisateur: ${utilisateur.username}`);

// Générer un jeton sécurisé
const jeton = token(16, 'hex');
console.log(`Jeton: ${jeton}`);
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

## Endpoints disponibles (v4)

| Endpoint            | Méthode    | Description                                             |
| ------------------- | ---------- | ------------------------------------------------------- |
| `/v4/address`       | GET        | Génération d'adresses postales aléatoires               |
| `/v4/agent`         | GET        | Analyse de User-Agent                                   |
| `/v4/algorithms`    | GET        | Fonctions algorithmiques (tri, fibonacci, factorielle…) |
| `/v4/avatar`        | GET        | Génération d'avatars identicon/pixel                    |
| `/v4/barcode`       | GET        | Génération de codes-barres (Code128, EAN-13/8, Code39)  |
| `/v4/captcha`       | GET        | Génération d'images captcha                             |
| `/v4/chat`          | GET / POST | Système de chat temporaire                              |
| `/v4/color`         | GET        | Génération de couleurs aléatoires                       |
| `/v4/convert`       | GET        | Conversions d'unités                                    |
| `/v4/credit`        | GET        | Génération de cartes bancaires fictives (Luhn valide)   |
| `/v4/cron`          | GET        | Analyse d'expressions cron                              |
| `/v4/dice`          | GET        | Lanceur de dés RPG                                      |
| `/v4/domain`        | GET        | Informations de domaine aléatoires                      |
| `/v4/encode`        | GET        | Encodage / décodage                                     |
| `/v4/geo`           | GET        | Calcul de distance géographique                         |
| `/v4/hash`          | POST       | Hachage de texte                                        |
| `/v4/headers`       | GET        | Informations des en-têtes HTTP                          |
| `/v4/hyperplanning` | POST       | Analyse de calendriers HyperPlanning                    |
| `/v4/infos`         | GET        | Informations sur l'API                                  |
| `/v4/ip`            | GET        | Analyse d'adresses IP                                   |
| `/v4/levenshtein`   | GET        | Distance entre chaînes                                  |
| `/v4/palette`       | GET        | Génération de palettes de couleurs                      |
| `/v4/password`      | GET        | Génération de mots de passe sécurisés                   |
| `/v4/personal`      | GET        | Profil personnel aléatoire                              |
| `/v4/placeholder`   | GET        | Génération d'images placeholder                         |
| `/v4/qrcode`        | GET        | Génération de QR codes                                  |
| `/v4/regex`         | GET        | Test d'expressions régulières                           |
| `/v4/statistics`    | GET        | Statistiques descriptives                               |
| `/v4/text`          | GET        | Utilitaires texte                                       |
| `/v4/tic-tac-toe`   | GET / POST | Jeu de morpion                                          |
| `/v4/time`          | GET        | Informations temporelles                                |
| `/v4/token`         | POST       | Génération de jetons sécurisés                          |
| `/v4/username`      | GET        | Génération de noms d'utilisateur                        |
| `/v4/validate`      | GET        | Validation (Luhn, IBAN, email)                          |

## Exemples d'utilisation

```js
import { avatar, barcode, credit, cron } from '@20syldev/api/v4';

// Générer une carte bancaire fictive Luhn-valide
const { cards } = credit('visa', 1, 'full');
console.log(cards[0].formatted); // "4532 9876 5432 1098"
console.log(cards[0].cvv);       // "847"

// Générer un avatar identicon SVG déterministe
const { body } = avatar({ seed: 'john', format: 'svg', size: 200 });
// body contient une chaîne SVG

// Générer un code-barres Code128
const { body: svg } = barcode({ data: 'Hello World' });
// body contient une chaîne SVG

// Analyser une expression cron
const { next } = cron('0 9 * * 1-5', 3);
console.log(next); // ["2026-05-12T09:00:00.000Z", ...]
```

_Visitez la [documentation](https://docs.sylvain.sh) dédiée, vous y retrouverez des exemples de requêtes et des codes simples pour tester l'[API](https://api.sylvain.sh) !_
