# Projet Feux Tricolores - Réseau de neurones MLP

## Description

Exemple concret d'application d'un **réseau de neurones MLP (Multi-Layer Perceptron)** pour la classification de points tactiles sur une tablette avec 4 cercles représentant des feux tricolores.

## Configuration

- **Tablette tactile** : 200 × 400 pixels
- **4 cercles tactiles** :
  - Noir : centre (100, 50), rayon 30px - action : éteindre tout
  - Vert : centre (100, 125), rayon 30px - action : allumer vert
  - Orange : centre (100, 200), rayon 30px - action : allumer orange
  - Rouge : centre (100, 275), rayon 30px - action : allumer rouge
- **Espacement** : 15 pixels entre les bords des cercles (distance entre centres = 75px)

## Architecture du réseau

```
Entrée (2) → Couche cachée (12 neurones, ReLU) → Sortie (4 neurones, Sigmoïde)
```

- **Couche d'entrée** : 2 neurones (x, y) normalisés dans [0, 1]
- **Couche cachée** : 12 neurones avec fonction d'activation **ReLU**
- **Couche de sortie** : 4 neurones avec fonction d'activation **Sigmoïde**

### Pourquoi ces fonctions d'activation ?

- **ReLU** pour la couche cachée : Évite le problème du gradient évanescent, permet un apprentissage plus rapide
- **Sigmoïde** pour la sortie : Produit des valeurs entre 0 et 1, adaptée aux étiquettes binaires
- **Pas Softmax** : Car [0,0,0,0] (noir/aucun) est une classe valide

## Constitution du dataset

### Taille

- **Training set** : 1 500 échantillons (300 par classe)
- **Validation set** : 300 échantillons (20% du total, 60 par classe)
- **Total** : 1 800 échantillons

### Classes

| Classe | Encodage | Signification |
|--------|----------|---------------|
| 0 | [0,0,0,0] | Noir (éteindre tout) |
| 1 | [1,0,0,0] | Vert |
| 2 | [0,1,0,0] | Orange |
| 3 | [0,0,1,0] | Rouge |
| 4 | [0,0,0,0] | Ailleurs (aucun effet) |

### Méthode de génération

1. **Pour chaque cercle** : Générer 300 points aléatoires dans le cercle
2. **Pour l'extérieur** : Générer 300 points aléatoires dans la tablette, en excluant les cercles
3. **Équilibrage** : Chaque classe a le même nombre d'échantillons

### Pourquoi pas 60 000 points ?

- **Calculatoirement coûteux** : 60 000 itérations par epoch
- **Redondant** : Les pixels voisins donnent des sorties très similaires
- **Innécessaire** : Le réseau généralise bien à partir d'un échantillonnage représentatif

## Entraînement

### Paramètres

| Paramètre | Valeur | Justification |
|-----------|--------|---------------|
| Fonction de coût | Binary Cross-Entropy | Adaptée aux sorties binaires |
| Optimiseur | Adam | Adaptatif, bon pour ce type de problème |
| Taux d'apprentissage | 0.01 | Valeur standard pour Adam |
| Nombre d'epochs | 500-1000 | Suffisant pour converger |
| Taille batch | 32 | Mini-batch pour SGD |

### Algorithme

1. **Initialisation** : Poids aléatoires (Xavier/Glorot)
2. **Forward Pass** : Calculer les prédictions
3. **Calcul de la perte** : Binary Cross-Entropy
4. **Backpropagation** : Calculer les gradients
5. **Mise à jour des poids** : Adam avec le gradient
6. **Répéter** pour tous les échantillons du batch, puis pour tous les epochs

### Early Stopping

L'entraînement s'arrête automatiquement si la perte de validation commence à augmenter (surapprentissage).

## Résultats attendus

- **Accuracy sur training** : > 95%
- **Accuracy sur validation** : > 90%
- **Généralisation** : Bonne reconnaissance des cercles non vus pendant l'entraînement

## Visualisation

### Frontières de décision

Le réseau apprend à approximer les 4 cercles avec ses frontières non-linéaires. La visualisation montre :
- Les régions prédites pour chaque classe (par couleur)
- Les cercles réels en superposition (pointillés)
- La comparaison permet de voir la qualité de l'approximation

### Matrice de confusion

Affiche la performance du réseau sur chaque classe :
- Lignes : Vraies classes
- Colonnes : Classes prédites
- Diagonale : Bonnes prédictions

## Fichiers

```
feux_tricolores/
├── index.html              # Page d'accueil
├── description.html        # Description détaillée + figures
├── entrainement.html       # Interface interactive
├── network.js             # Implémentation du réseau
└── README.md              # Ce fichier
```

## Utilisation

### Dans un navigateur

1. Ouvrir `index.html` dans Chrome ou Firefox
2. Suivre les étapes :
   - Lire la description
   - Générer le dataset
   - Visualiser le dataset
   - Configurer et lancer l'entraînement
   - Analyser les résultats
   - Tester des points spécifiques

### Avec un serveur web

```bash
cd feux_tricolores
python -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Exemple de code

```javascript
// Créer le réseau
const network = new NeuralNetwork(2, 12, 4);

// Générer le dataset
const trainingData = generateDataset(1500);
const validationData = generateDataset(300);

// Entraîner
network.train(trainingData, 32, 0.01, 500, validationData);

// Prédire
const output = network.predict(0.5, 0.25);
const predictedClass = network.predictClass(0.5, 0.25);
```

## Notes techniques

### Normalisation

Les coordonnées (x, y) sont normalisées entre [0, 1] :
```
x_norm = x / 199
y_norm = y / 399
```

### Encodage des sorties

Le réseau utilise un encodage multi-label :
- Chaque sortie correspond à une lumière
- [1,0,0,0] = Vert allumé
- [0,1,0,0] = Orange allumé
- [0,0,1,0] = Rouge allumé
- [0,0,0,0] = Tout éteint (Noir ou Ailleurs)

### Limitation

Les réseaux MLP produisent des frontières **polygonales** (approximation linéaire par morceaux). Les cercles ne seront donc pas parfaitement circulaires, mais suffisamment précis pour la classification.

## Auteurs

Projet créé pour illustrer les concepts de réseaux de neurones dans le cadre de l'apprentissage profond.

## Licence

MIT - Libre d'utilisation pour des fins éducatives et de recherche.
