<div align="center">
  <a href="https://api.sylvain.pro"><img src="https://github.com/20syldev/api/blob/master/src/logo.png" alt="Logo" width="25%" height="auto"></a>

  # API Personnelle - Sylvain
  [![Version](https://custom-icon-badges.demolab.com/badge/Version%20:-v0.3.0-ee6464?logo=api.sylvain.pro&labelColor=23272A)](https://github.com/20syldev/api/releases/latest)
  [![Statut](https://img.shields.io/badge/Statut%20:-En%20ligne-42b85f?labelColor=23272A)](https://api.sylvain.pro)
</div>

---

## À propos de l'API
Voici mon API personnelle, disponible sur le domaine [api.sylvain.pro](https://api.sylvain.pro).
L'API est développée en Node.js, hébergée **24h/7j**, elle est **simple d'utilisation** et a une **[documentation](https://docs.sylvain.pro)** !
> *Une limite de requêtes sera bientôt fixée, en fonction du nombre de requêtes par minute.* 

## Récupérer une donnée
### Python
```py
import requests

print(requests.get('https://api.sylvain.pro/<version>/token').json()['token'])
```

### JavaScript
```js
fetch('https://api.sylvain.pro/<version>/token')
  .then(response => response.json())
  .then(data => console.log(data.token));
```

### Node.js
```
npm install https
```
```js
const https = require('https');

https.get('https://api.sylvain.pro/<version>/token', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(JSON.parse(data).token);
    });
});
```
