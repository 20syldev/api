<div align="center">
  <a href="https://api.sylvain.sh"><img src="https://api.sylvain.sh/favicon.ico" alt="Logo" width="25%" height="auto"/></a>

  # API Personnelle
  [![Version](https://custom-icon-badges.demolab.com/badge/Version%20:-v4.1.0-6479ee?logo=api.sylvain.sh&labelColor=23272A)](https://github.com/20syldev/api/releases/latest)
</div>

---

## À propos de l'API
Voici mon API personnelle, disponible sur le domaine [api.sylvain.sh](https://api.sylvain.sh).
L'API est développée avec **TypeScript** et **Node.js**, et hébergée **24h/7j**. Elle est **simple d'utilisation** et a une **documentation** disponible sur [docs.sylvain.sh](https://docs.sylvain.sh) !
> *Une limite de **2000** requêtes **par heure** est fixée. Elle change pour certains endpoints nécessitant plus de ressources. Si vous souhaitez une **augmentation** de cette limite, n'hésitez pas à visiter la [documentation](https://docs.sylvain.sh/pricing).*

## Prérequis
- **Node.js** >= 22.0.0

## Installer le paquet de l'API sur votre machine
```console
$ sudo apt install nodejs npm
$ npm install @20syldev/api
$ npm init
```
> *Attention, vous devez configurer le type sur "**module**" dans votre fichier `package.json`.*

## Utiliser l'API

### Option 1 : Démarrer un serveur local

Pour démarrer un serveur local avec tous les endpoints :
```console
$ npm run build && npm start
```
```console
> @20syldev/api@4.1.0 build
> tsc

> @20syldev/api@4.1.0 start
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

| Commande | Description |
|----------|-------------|
| `npm run dev` | Serveur de développement avec rechargement automatique (tsx watch) |
| `npm run build` | Compilation TypeScript vers `dist/` |
| `npm start` | Démarrer le serveur de production (`node dist/app.js`) |
| `npm run lint` | Vérification ESLint |
| `npm run format` | Formatage avec Prettier |
| `npm run check` | Vérification TypeScript + ESLint |

## Modules disponibles

L'API v4 expose plusieurs modules que vous pouvez importer :

```js
import {
    algorithms,        // Fonctions algorithmiques diverses
    captcha,           // Génération d'images captcha
    chat,              // Système de chat temporaire
    color,             // Génération de couleurs aléatoires
    convert,           // Conversions d'unités
    domain,            // Informations de domaine aléatoires
    hash,              // Hachage de texte
    hyperplanning,     // Analyse de calendriers
    levenshtein,       // Distance entre chaînes
    personal,          // Informations personnelles aléatoires
    qrcode,            // Génération de QR codes
    tic_tac_toe,       // Jeu de morpion
    time,              // Informations temporelles
    token,             // Génération de jetons sécurisés
    username           // Génération de noms d'utilisateur
} from '@20syldev/api/v4';
```

*Visitez la [documentation](https://docs.sylvain.sh) dédiée, vous y retrouverez des exemples de requêtes et des codes simples pour tester l'[API](https://api.sylvain.sh) !*
