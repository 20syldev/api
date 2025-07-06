<div align="center">
  <a href="https://api.sylvain.pro"><img src="https://api.sylvain.pro/favicon.ico" alt="Logo" width="25%" height="auto"/></a>

  # API Personnelle
  [![Version](https://custom-icon-badges.demolab.com/badge/Version%20:-v3.4.0-6479ee?logo=api.sylvain.pro&labelColor=23272A)](https://github.com/20syldev/api/releases/latest)
</div>

---

## À propos de l'API
Voici mon API personnelle, disponible sur le domaine [api.sylvain.pro](https://api.sylvain.pro).
L'API est développée avec Node.js et hébergée **24h/7j**. Elle est **simple d'utilisation** et a une **documentation** disponible sur [docs.sylvain.pro](https://docs.sylvain.pro) !
> *Une limite de **2000** requêtes **par heure** est fixée. Elle change pour certains endpoints nécessitant plus de ressources. Si vous souhaitez une **augmentation** de cette limite, n'hésitez pas à visiter la [documentation](https://docs.sylvain.pro/pricing).*

## Installer le paquet de l'API sur votre machine
```console
$ sudo apt install nodejs npm
$ npm install @20syldev/api
$ npm init
```
> *Attention, vous devez configurer le type sur "**module**" dans votre fichier `package.json`.*

## Utiliser l'API

### Option 1 : Démarrer un serveur local

Pour démarrer un serveur local avec tous les endpoints, créez un fichier JavaScript, par exemple `index.js` :
```js
import '@20syldev/api';
```

Puis, **démarrez** un serveur [Node.js](https://nodejs.org) :
```console
$ node index.js
API is running on
    - http://127.0.0.1:3000
    - http://localhost:3000
```

### Option 2 : Utiliser les modules directement dans votre code

Vous pouvez également importer les modules spécifiques dont vous avez besoin :

```js
// Importer des modules spécifiques depuis la v3
import { color, token, username } from '@20syldev/api/v3';

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

## Tester l'API sur votre machine
**Téléchargez** la [dernière mise à jour](https://github.com/20syldev/api/releases/latest) de l'API, puis **extrayez** le contenu du fichier `.zip` ou `.tar.gz` dans un de vos **répertoires**.
Ensuite, **déplacez-vous** dans le dossier du projet, via un terminal **Linux**, **Windows** ou **macOS** :
```console
$ cd /chemin/vers/le/projet
```

Enfin, **exécutez** le script de build, qui installera les **dépendances** et lancera le **serveur** de l'[API](https://api.sylvain.pro) :
```console
$ npm run build
```
```console
> @20syldev/api@3.4.0 build
> npm install && node app.js

[...]

found 0 vulnerabilities
API is running on
    - http://127.0.0.1:3000
    - http://localhost:3000
```

## Modules disponibles

L'API v3 expose plusieurs modules que vous pouvez importer :

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
} from '@20syldev/api/v3';
```

*Visitez la [documentation](https://docs.sylvain.pro) dédiée, vous y retrouverez des exemples de requêtes et des codes simples pour tester l'[API](https://api.sylvain.pro) !*
