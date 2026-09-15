MA LISTE DE COURSES — V2

Fonctions principales
---------------------
- liste habituelle conservée localement
- ajout/suppression et cases à cocher
- réorganisation des lignes avec les flèches haut/bas
- quantité en unités (u) ou en grammes (g)
- si g : le prix saisi est le prix au kg et le total est calculé automatiquement
- total du panier automatique
- menu ☰ discret en haut à droite
- Enregistrer cette course : crée uniquement une COPIE dans l'historique ; la liste habituelle n'est jamais modifiée
- page Historique avec courses enregistrées et évolution annuelle moyenne du prix par produit
- sauvegarde/restauration JSON de la liste + historique
- fonctionnement hors connexion
- aucune bibliothèque, API, police ou ressource JavaScript extérieure

Compatibilité V1
----------------
La clé de stockage de la liste reste maListeCourses_v1 : les articles existants sont donc conservés.
Les anciens articles reçoivent automatiquement quantité = 1 et unité = u.

Historique
----------
Une course enregistrée contient uniquement les articles cochés ayant un prix supérieur à zéro.
L'enregistrement ne décoche rien, ne remet aucun prix à zéro et ne supprime aucun article.

Déploiement
-----------
Déposer les fichiers à la racine du projet et pousser sur GitHub. Vercel redéploie automatiquement.
