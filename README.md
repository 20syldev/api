<div align="center">
  <a href="https://api.sylvain.pro"><img src="https://api.sylvain.pro/favicon.ico" alt="Logo" width="25%" height="auto"/></a>

  # API Personnelle
  [![Version](https://custom-icon-badges.demolab.com/badge/Version%20:-v3.3.0-6479ee?logo=api.sylvain.pro&labelColor=23272A)](https://github.com/20syldev/api/releases/latest)
</div>

---

## À propos de l'API
Voici mon API personnelle, disponible sur le domaine [api.sylvain.pro](https://api.sylvain.pro).
L'API est développée avec Node.js et hébergée **24h/7j**. Elle est **simple d'utilisation** et a une **documentation** disponible sur [docs.sylvain.pro](https://docs.sylvain.pro) !
> *Une limite de **50** requêtes **par minute** est fixée. Elle change pour certains endpoints nécessitant plus de ressources. Si vous souhaitez une **augmentation** de cette limite, n'hésitez pas à visiter la [documentation](https://docs.sylvain.pro/pricing).*

## Installer le paquet de l'API sur votre machine
```console
$ sudo apt install nodejs npm
$ npm install @20syldev/api
$ npm init
```
> *Attention, vous devez configurer le type sur "**module**" dans votre fichier `package.json`.*

Pour utiliser le **paquet** dans votre projet, **créez** un fichier **JavaScript**. Par exemple, `index.js` :
```js
import '@20syldev/api';
```

Puis, **démarrez** un serveur [Node.js](https://nodejs.org) pour utiliser l'**API** :
```console
$ node index.js
API is running on
    - http://127.0.0.1:3000
    - http://localhost:3000
```
> *Remplacez `index.js` par le nom de votre fichier JavaScript.*

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
> @20syldev/api@3.3.0 build
> npm install && node app.js

[...]

found 0 vulnerabilities
API is running on
    - http://127.0.0.1:3000
    - http://localhost:3000
```

*Visitez la [documentation](https://docs.sylvain.pro) dédiée, vous y retrouverez des exemples de requêtes et des codes simples pour tester l'[API](https://api.sylvain.pro) !*
