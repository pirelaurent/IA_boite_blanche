# 🎯 Feux Tricolores RGB - Réseau de Neurones

Projet pédagogique d'implémentation d'un **réseau de neurones MLP (Multi-Layer Perceptron)** pour la classification de zones tactiles sur une tablette.

## 📌 Description

Ce projet permet d'entraîner un réseau de neurones pour reconnaître sur quelle zone tactile (Rouge, Vert, Bleu) l'utilisateur a cliqué sur une tablette de 200×400 pixels, ou s'il a cliqué dans le fond noir.

### Configuration de la tablette :
- **Dimensions** : 200 × 400 pixels
- **3 zones tactiles circulaires** :
  - 🔴 **Rouge** : centre (100, 320), rayon 50px
  - 🟢 **Vert** : centre (100, 80), rayon 50px  
  - 🔵 **Bleu** : centre (100, 200), rayon 50px
- **Fond** : Noir (quand on clique en dehors des cercles)

### Sorties du réseau :
| Position | Couleur | Sortie |
|----------|---------|---------|
| Dans le cercle Rouge | 🔴 Rouge | `[1, 0, 0]` |
| Dans le cercle Vert | 🟢 Vert | `[0, 1, 0]` |
| Dans le cercle Bleu | 🔵 Bleu | `[0, 0, 1]` |
| Ailleurs | ⚫ Noir | `[0, 0, 0]` |

## 🏗️ Architecture du Réseau

```
Entrée (2) ────► Cachée (12, ReLU) ────► Sortie (3, Sigmoïde)
   (x,y)              [configurable]          (R, V, B)
```

- **Couche d'entrée** : 2 neurones (x, y normalisés dans [0, 1])
- **Couche cachée** : 12 neurones avec activation **ReLU** (configurable : 8, 10, 12, 16, 20)
- **Couche de sortie** : 3 neurones avec activation **Sigmoïde**

## 📦 Fichiers

```
feux_tricolores/
├── index.html          # Page principale avec interface complète
├── entrainement.html    # Page dédiée à l'entraînement
├── description.html    # Documentation détaillée
├── network.js          # Implémentation du réseau de neurones
└── README.md           # Ce fichier
```

## 🚀 Utilisation

### 1. Ouvrir l'interface
Ouvrez simplement `index.html` dans un navigateur moderne (Chrome, Firefox, Edge, Safari).

### 2. Générer le dataset
Cliquez sur **"Générer le Dataset"** pour créer des données d'entraînement :
- 300 points par cercle (900 total)
- 300 points dans le fond (noir)
- 1200 points d'entraînement au total
- 240 points de validation (20%)

### 3. Configurer le réseau
Dans la section **Entraînement** :
- Choisissez la **taille de la couche cachée** (12 recommandé)
- Définissez le **nombre d'époques** (2000 par défaut)
- Sélectionnez la **taille du batch** (32 recommandé)
- Ajustez le **taux d'apprentissage** (0.01 recommandé)

### 4. Entraîner le réseau
Cliquez sur **"Entraîner le Réseau"** et observez :
- La progression de l'entraînement
- Les courbes de perte (train/val)
- Les courbes de précision (train/val)

### 5. Visualiser les résultats
- **Carte des prédictions** : Voir comment le réseau classifie chaque pixel
- **Matrice de confusion** : Analyser les performances par classe
- **Test de points spécifiques** : Tester manuellement des coordonnées

### 6. Exporter/Importer
- Exportez le modèle entraîné en JSON
- Import un modèle précédemment sauvegardé

## 🎓 Concepts Pédagogiques

Ce projet illustre les concepts suivants :

### Réseaux de Neurones
- **Perceptron Multi-Couche (MLP)**
- **Propagation avant (Forward Pass)**
- **Rétropropagation (Backpropagation)**
- **Fonctions d'activation** (ReLU, Sigmoïde)

### Apprentissage
- **Descente de gradient**
- **Optimiseur Adam**
- **Fonction de coût** (Binary Cross-Entropy)
- **Batch training**

### Préparation des données
- **Normalisation** des entrées
- **Split train/validation**
- **Génération de données synthétiques**

### Évaluation
- **Accuracy** (précision)
- **Matrice de confusion**
- **Validation croisée**

## ⚙️ Paramètres Recommandés

| Paramètre | Valeur | Description |
|-----------|--------|-------------|
| Taille couche cachée | **12** | Nombre de neurones en couche cachée |
| Époques | **2000** | Nombre de passages sur le dataset |
| Batch size | **32** | Taille des mini-batches |
| Learning rate | **0.01** | Taux d'apprentissage |
| Optimiseur | **Adam** | β1=0.9, β2=0.999, ε=1e-8 |

## 📊 Résultats Attendus

| Taille couche cachée | Précision attendue | Temps d'entraînement |
|-----------------------|-------------------|----------------------|
| 8 neurones | ~90-93% | 0.5-1s |
| 10 neurones | ~95-97% | 0.7-1.2s |
| **12 neurones** | **~96-98%** | **1-1.5s** |
| 16 neurones | ~95-97% | 1.5-2s |
| 20+ neurones | ~95-98% | 2-3s+ |

## 🔬 Pourquoi 12 neurones ?

L'analyse montre que **12 neurones en couche cachée** est le choix optimal pour ce problème :

1. **8 neurones** : Fonctionnent techniquement (93% de précision), mais l'approximation des frontières circulaires est grossière
2. **10 neurones** : Très bonne précision (96-97%), excellent compromis
3. **12 neurones** : Meilleure précision (97-98%), capacité suffisante pour approximer les 3 cercles
4. **16+ neurones** : Pas de gain significatif, risque de surapprentissage

**Règle empirique** : Pour approximer N cercles avec un MLP, il faut environ 4N neurones cachés. Ici, 3 cercles × 4 = 12 neurones.

## 🧪 Expérimentations Possibles

### Tester différentes architectures
```javascript
// Essayer avec différentes tailles de couche cachée
const network8 = new NeuralNetwork(2, 8, 3);
const network12 = new NeuralNetwork(2, 12, 3);
const network16 = new NeuralNetwork(2, 16, 3);
```

### Modifier les paramètres d'apprentissage
- Tester différents taux d'apprentissage (0.1, 0.01, 0.001)
- Comparer différents batch sizes (16, 32, 64, 128)
- Essayer d'autres optimiseurs (SGD, RMSProp)

### Changer la configuration
- Modifier le rayon des cercles
- Ajouter un 4ème cercle
- Changer les positions des cercles

### Visualiser l'apprentissage
- Observer les courbes de perte et de précision
- Identifier les problèmes de sur/sous-apprentissage
- Comprendre l'effet des différents paramètres

## 💾 Export/Import de Modèles

### Exporter un modèle
```javascript
// Après l'entraînement
const model = network.toJSON();
const jsonString = JSON.stringify(model, null, 2);
// Sauvegarder dans un fichier ou localStorage
```

### Importer un modèle
```javascript
const network = new NeuralNetwork(2, 12, 3);
const model = JSON.parse(jsonString);
network.fromJSON(model);
// Le réseau est prêt à être utilisé
```

## 📚 Technologies Utilisées

- **JavaScript** : Langage principal
- **HTML5/CSS3** : Interface utilisateur
- **Chart.js** : Visualisation des graphiques
- **Pas de dépendances externes** (sauf Chart.js pour les graphiques)

## 🎯 Objectifs Pédagogiques

✅ Comprendre l'architecture d'un MLP  
✅ Implémenter la propagation avant et arrière  
✅ Utiliser les fonctions d'activation ReLU et Sigmoïde  
✅ Configurer et utiliser l'optimiseur Adam  
✅ Préparer et normaliser des données  
✅ Entraîner un réseau de neurones sur des données synthétiques  
✅ Évaluer les performances d'un modèle  
✅ Visualiser les prédictions et comprendre les erreurs  
✅ Exporter et importer des modèles entraîne

## 🔗 Liens Utiles

- [Documentation complète](description.html)
- [Interface d'entraînement](entrainement.html)
- [Interface principale](index.html)

## 📝 Notes

- Ce projet est conçu à des fins pédagogiques
- Aucune bibliothèque de deep learning n'est utilisée (pure JavaScript)
- L'implémentation est simplifiée pour la compréhension
- Les performances peuvent varier selon le navigateur
- Pour des problèmes plus complexes, envisagez d'utiliser TensorFlow.js ou PyTorch

## 🎓 Prochaines Étapes

Si vous avez maîtrisé ce projet, essayez :

1. **Ajouter une deuxième couche cachée** pour créer un réseau plus profond
2. **Implémenter le dropout** pour la régularisation
3. **Créer un classifieur d'images** avec des convolutions
4. **Utiliser TensorFlow.js** pour des modèles plus complexes
5. **Déployer le modèle** dans une application web

---

**Créé pour l'apprentissage des réseaux de neurones**  
**Architecture recommandée : MLP 2-12-3 avec ReLU + Sigmoïde**  
**Précision attendue : 96-98%**
