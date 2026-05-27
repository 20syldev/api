<div align="center">
  <a href="https://api.sylvain.sh"><img src="https://api.sylvain.sh/favicon.ico" alt="Logo" width="25%" height="auto"/></a>

# API Personnelle

[![Version](https://custom-icon-badges.demolab.com/badge/Version%20:-v5.1.0-6479ee?logo=api.sylvain.sh&labelColor=23272A)](https://github.com/20syldev/api/releases/latest)

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
> @20syldev/api@5.1.0 build
> tsc

> @20syldev/api@5.1.0 start
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

## Exemples d'utilisation

```js
import { asymmetric, chart, evaluate, matrix, otp, symmetric } from '@20syldev/api/v5';

// Chiffrement RSA asymétrique
const { publicKey, privateKey } = asymmetric('keygen', {});
const { result: encrypted } = asymmetric('encrypt', { text: 'message secret', publicKey });
const { result: decrypted } = asymmetric('decrypt', { text: encrypted, privateKey });
console.log(decrypted); // 'message secret'

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

// Chiffrement symétrique AES-256-GCM
const { result: blob } = symmetric('encrypt', 'message secret', 'motdepasse');
const { result: plain } = symmetric('decrypt', blob, 'motdepasse');
console.log(plain); // 'message secret'

// Générer un secret TOTP et vérifier un code
const { secret } = otp('secret', {});
const { code } = otp('generate', { secret });
const { valid } = otp('verify', { secret, code });
console.log(valid); // true
```

_Visitez la [documentation](https://docs.sylvain.sh) dédiée pour la liste complète des endpoints, des exemples de requêtes et des guides d'utilisation de l'[API](https://api.sylvain.sh)._
