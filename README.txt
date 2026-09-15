MA LISTE DE COURSES — V1

Contenu
-------
index.html        écran de l'application
style.css         présentation
app.js            fonctionnement de la liste
sw.js             fonctionnement hors connexion (navigateurs compatibles)
offline.appcache  secours pour certains anciens navigateurs
manifest.json     informations de l'application web
vercel.json       réglages d'hébergement Vercel

Fonctions
---------
- ajouter un article
- cocher/décocher un article
- saisir son prix à la main
- total automatique
- supprimer un article
- supprimer tous les articles cochés
- "Nouvelle course" : conserve les articles mais les décoche et remet les prix à zéro
- mémorisation locale sur le téléphone
- aucun CDN, aucune bibliothèque, aucune API et aucune police externe

IMPORTANT
---------
La liste est enregistrée dans le stockage local du navigateur.
Effacer les données du navigateur peut donc effacer la liste.

Pour le hors connexion, ouvrir l'application une première fois avec Internet.
Le mécanisme moderne (Service Worker) est complété par un ancien mécanisme
AppCache pour améliorer les chances de fonctionnement sur un vieux navigateur.

Déploiement Vercel
------------------
Déposer tous les fichiers à la racine du projet, puis déployer le projet.
Aucune compilation et aucune dépendance ne sont nécessaires.
