




---

# Apprentissage du perceptron SANS descente de gradient (réponse à la question)

## Question initiale
> Dans notre exemple d'apprentissage, on ne fait pas de descente de gradient (pas de dérivée) alors comment on procède ? force brute ?

## Réponse complète

Dans l'exemple du **feu tricolore avec 3 perceptrons**, la fonction d'activation est un **seuil binaire (H, fonction de Heaviside)**, non continue et non dérivable. On n'a donc **pas besoin de descente de gradient**. Voici les **4 méthodes classiques** pour entraîner un perceptron dans ce cas :

---

### 🔹 1️⃣ Algorithme du Perceptron (Rosenblatt, 1957) - **MÉTHODE RECOMMANDÉE**

C'est la méthode historique et la plus efficace pour ce cas. Elle ajuste les poids **de manière itérative et déterministe** quand une prédiction est fausse.

**Règle de mise à jour** (pour un neurone) :
```
Si y_pred ≠ y_true :
   w_i ← w_i + η × (y_true - y_pred) × x_i   (pour chaque poids i)
   s   ← s   - η × (y_true - y_pred)         (seuil)
```
- **η** = taux d'apprentissage (ex: 0.1 ou 1)
- **Pas de dérivée** : on corrige juste en fonction de l'erreur (y_true - y_pred)
- **Convergence garantie** si les données sont **linéairement séparables** (ce qui est le cas ici).

**Pour votre réseau à 3 neurones** :
On entraîne **chaque neurone indépendamment** (car chaque sortie est binaire : feu allumé = 1, éteint = 0).

Exemple pour le neurone **vert** (doit s'activer UNIQUEMENT pour x=(0,1)) :
- Initialisation : w1=0, w2=0, s=0
- Après quelques itérations sur vos 4 exemples, vous obtenez par exemple :
  **w1 = -2, w2 = 2, s = 1**

Vérification :
- (0,0): 0 - 1 = -1 < 0 → **0** ✅
- (0,1): 2 - 1 = 1 ≥ 0 → **1** ✅
- (1,0): -2 - 1 = -3 < 0 → **0** ✅
- (1,1): -2 + 2 - 1 = -1 < 0 → **0** ✅

---

### 🔹 2️⃣ Résolution analytique (pour les petits problèmes)

Votre cas est **linéairement séparable** et très simple (2 entrées, 1 sortie par neurone). On peut **trouver les poids à la main** en résolvant des inégalités.

#### Pour le neurone VERT (actif si x=(0,1)) :
- w2 ≥ s (pour (0,1))
- w1 < s (pour (1,0))
- w1 + w2 < s (pour (1,1))
- 0 < s (pour (0,0))
**Solution** : s=1, w1=-2, w2=2

#### Pour le neurone ORANGE (actif si x=(1,0)) :
**Solution** : s=1, w1=2, w2=-2

#### Pour le neurone ROUGE (actif si x=(1,1)) :
**Solution** : s=2, w1=1, w2=1

**Matrice de poids finale** :

|       | Vert | Orange | Rouge |
|-------|------|--------|-------|
| **w1** | -2   | 2      | 1     |
| **w2** | 2    | -2     | 1     |
| **s**  | 1    | 1      | 2     |

---

### 🔹 3️⃣ Force brute (pour un très petit espace de recherche)

Si on limite les poids à des **entiers dans [-5, 5]** et le seuil dans [0, 5] :
- 3 paramètres par neurone (w1, w2, s)
- 11 × 11 × 6 = 726 combinaisons par neurone
- 3 neurones = 726³ ≈ 380 millions de combinaisons → **Trop long** pour la force brute pure.

**Optimisation possible** :
- Diviser le problème (1 neurone à la fois)
- Réduire l'espace : w1, w2 ∈ {-2, -1, 0, 1, 2} et s ∈ {0, 1, 2} → 5 × 5 × 3 = 75 combinaisons par neurone → 75³ = 421 875 (faisable en code)

---

### 🔹 4️⃣ Recherche heuristique

Pour des problèmes plus complexes, on pourrait utiliser :
- Algorithmes génétiques
- Recuit simulé
- Recherche par essaim particulaire

---

## Tableau comparatif

| Méthode               | Complexité | Nécessite une dérivée ? | Adapté à votre cas ? |
|-----------------------|------------|--------------------------|----------------------|
| **Algorithme du Perceptron** | Faible (O(n)) | ❌ Non | ✅ **Recommandé** |
| **Résolution analytique**    | Très faible | ❌ Non | ✅ **Parfait ici** |
| **Force brute**              | Exponentielle | ❌ Non | ⚠ Possible mais lent |
| **Descente de gradient**      | Moyenne | ✅ Oui | ❌ **Inutile ici** |

---

## Pourquoi pas de descente de gradient ?

La fonction d'activation **H (seuil)** n'est **pas dérivable** en 0. La descente de gradient est **inutile** pour un perceptron simple : l'algorithme original de Rosenblatt est **plus simple et plus efficace**.

---

## Exemple de code pour l'algorithme du Perceptron (JavaScript)

```javascript
// Pour un neurone
function trainPerceptron(examples, maxIterations = 100, learningRate = 1) {
  let w1 = 0, w2 = 0, s = 0;
  for (let i = 0; i < maxIterations; i++) {
    let allCorrect = true;
    for (const {x1, x2, y_true} of examples) {
      const y_pred = (w1 * x1 + w2 * x2 >= s) ? 1 : 0;
      if (y_pred !== y_true) {
        w1 += learningRate * (y_true - y_pred) * x1;  // η = learningRate
        w2 += learningRate * (y_true - y_pred) * x2;
        s  -= learningRate * (y_true - y_pred);
        allCorrect = false;
      }
    }
    if (allCorrect) break;
  }
  return {w1, w2, s};
}

// Exemple d'utilisation pour le neurone VERT
const examplesVert = [
  {x1: 0, x2: 0, y_true: 0}, // compteur 0 → aucun feu
  {x1: 0, x2: 1, y_true: 1}, // compteur 1 → feu vert
  {x1: 1, x2: 0, y_true: 0}, // compteur 2 → feu orange
  {x1: 1, x2: 1, y_true: 0}  // compteur 3 → feu rouge
];

const weightsVert = trainPerceptron(examplesVert);
console.log("Neurone Vert:", weightsVert);

// À appliquer 3 fois (1 par feu), avec les y_true appropriés
```

---

## Solutions analytiques prêtes à l'emploi

Voici les poids à utiliser directement dans votre code :

### Neurone VERT (feu vert allumé quand compteur=1, soit b1b0=01)
```javascript
const vert = { w1: -2, w2: 2, s: 1 };
```

### Neurone ORANGE (feu orange allumé quand compteur=2, soit b1b0=10)
```javascript
const orange = { w1: 2, w2: -2, s: 1 };
```

### Neurone ROUGE (feu rouge allumé quand compteur=3, soit b1b0=11)
```javascript
const rouge = { w1: 1, w2: 1, s: 2 };
```

---

## Vérification des solutions

Pour chaque compteur (b1, b2) :

| Compteur | b1 | b2 | Vert (w1=-2, w2=2, s=1) | Orange (w1=2, w2=-2, s=1) | Rouge (w1=1, w2=1, s=2) | Résultat |
|----------|----|----|---------------------------|----------------------------|---------------------------|----------|
| 0        | 0  | 0  | -1 < 0 → 0                | 0 < 1 → 0                 | 0 < 2 → 0                | Aucun feu ✅ |
| 1        | 0  | 1  | 2-1=1 ≥ 0 → 1            | -2 < 1 → 0                | 1 < 2 → 0                | Vert seul ✅ |
| 2        | 1  | 0  | -2 < 1 → 0               | 2-1=1 ≥ 0 → 1             | 1 < 2 → 0                | Orange seul ✅ |
| 3        | 1  | 1  | -2+2-1=-1 < 0 → 0        | 2-2-1=-1 < 0 → 0          | 1+1-2=0 ≥ 0 → 1           | Rouge seul ✅ |

---

## Conclusion

**Utilisez l'algorithme du Perceptron** (méthode 1) ou **les solutions analytiques** (méthode 2). La force brute (méthode 3) n'est pas nécessaire ici, mais peut servir de démo pour illustrer que "ça marche aussi".

La descente de gradient est **inutile** pour ce problème car la fonction d'activation n'est pas dérivable.

---   


Voici les courbes des quatre fonctions à une variable (softmax s'applique à un vecteur entier, donc pas représentable sur ce graphe) : [Fonctions d'activation (z de −6 à +6)](component://782d2ee9)

| z | step | ReLU | sigmoïde | tanh |
|---|---|---|---|---|
| −6 | 0 | 0 | 0,002 | −1 |
| −5,5 | 0 | 0 | 0,004 | −1 |
| −5 | 0 | 0 | 0,007 | −1 |
| −4,5 | 0 | 0 | 0,011 | −1 |
| −4 | 0 | 0 | 0,018 | −0,999 |
| −3,5 | 0 | 0 | 0,029 | −0,998 |
| −3 | 0 | 0 | 0,047 | −0,995 |
| −2,5 | 0 | 0 | 0,076 | −0,987 |
| −2 | 0 | 0 | 0,119 | −0,964 |
| −1,5 | 0 | 0 | 0,182 | −0,905 |
| −1 | 0 | 0 | 0,269 | −0,762 |
| −0,5 | 0 | 0 | 0,378 | −0,462 |
| 0 | 1 | 0 | 0,5 | 0 |
| 0,5 | 1 | 0,5 | 0,622 | 0,462 |
| 1 | 1 | 1 | 0,731 | 0,762 |
| 1,5 | 1 | 1,5 | 0,818 | 0,905 |
| 2 | 1 | 2 | 0,881 | 0,964 |
| 2,5 | 1 | 2,5 | 0,924 | 0,987 |
| 3 | 1 | 3 | 0,953 | 0,995 |
| 3,5 | 1 | 3,5 | 0,971 | 0,998 |
| 4 | 1 | 4 | 0,982 | 0,999 |
| 4,5 | 1 | 4,5 | 0,989 | 1 |
| 5 | 1 | 5 | 0,993 | 1 |
| 5,5 | 1 | 5,5 | 0,996 | 1 |
| 6 | 1 | 6 | 0,998 | 1 |

## Détail par fonction

**step() — échelon (Heaviside)**
`step(z) = 0 si z < 0, 1 sinon` — sortie binaire {0, 1}, historiquement celle du perceptron de Rosenblatt (1958). Dérivée quasi nulle partout (impulsion de Dirac en 0) : **impossible à entraîner par descente de gradient** (le gradient ne transporte aucune information sur "à quel point" on est proche du seuil). Aujourd'hui uniquement pédagogique ou dans des modèles à événements discrets (spiking networks).

**ReLU() — Rectified Linear Unit**
`ReLU(z) = max(0, z)` — non bornée à droite, nulle pour z<0. Dérivée : 0 ou 1, donc **pas de saturation** côté positif et gradient constant → calcul ultra-simple (un seuillage), convergence bien plus rapide que sigmoïde/tanh. Défaut : neurones "morts" (z<0 ⇒ gradient nul en permanence), corrigé par les variants **Leaky ReLU**, **ELU**, **GELU** (utilisée dans les transformers). Défaut par défaut des couches cachées depuis ~2011 (AlexNet).

**sigmoid() — logistique**
`σ(z) = 1/(1+e⁻ᶻ)` — sortie ∈ (0, 1), interprétable comme probabilité. Dérivée maximale de 0,25 en z=0, quasi nulle dès |z|>5 : c'est la **saturation**, cause principale du *vanishing gradient* en réseaux profonds. De plus sortie non centrée en 0 (moyenne 0,5), ce qui biaise les couches suivantes. Réservée aujourd'hui à la **couche de sortie en classification binaire** (avec perte log-loss/binary cross-entropy) et aux **portes des LSTM/GRU**.

**tanh() — tangente hyperbolique**
`tanh(z) = 2σ(2z) − 1` — sortie ∈ (−1, 1), **centrée en zéro** contrairement à la sigmoïde, avec un gradient maximal de 1 (deux fois meilleur). Même saturation aux extrêmes. Standard des couches cachées avant ReLU ; encore utilisée à l'intérieur des LSTM/GRU et dans certains mécanismes d'attention.

**softmax()**
`softmax(zᵢ) = eᶻⁱ / Σⱼ eᶻʲ` — s'applique à un **vecteur** et renvoie une **distribution de probabilités** (toutes sorties ∈ (0,1), somme = 1, ordre préservé). Généralise la sigmoïde : avec 2 classes, softmax ≡ sigmoïde. En pratique on soustrait max(z) pour la stabilité numérique. C'est la fonction de sortie quasi exclusive pour la **classification multi-classes** (avec cross-entropy catégorielle), car la perte et la dérivée se combinent en un gradient très simple : `ŷᵢ − yᵢ`. Version **temperature-scaled** (`eᶻⁱ/τ`) au cœur de l'échantillonnement des LLM : τ faible → sortie piquée/déterministe, τ élevé → sortie uniforme/aléatoire.

## Règles pratiques de choix

- **Couches cachées** : ReLU ou ses variants (GELU dans les transformers) — jamais sigmoïde/tanh profond (vanishing gradient), jamais step (pas de gradient).
- **Sortie régression** : linéaire (pas d'activation).
- **Sortie classification binaire** : sigmoïde · **multi-classes** : softmax · **multi-labels** : sigmoïde sur chaque neurone.
- Point commun sigmoïde/tanh/softmax : même forme en S (*sigmoid* = "en S"), même saturation aux bornes — c'est précisément ce que ReLU élimine.



---  
La dérivée ne dit pas *"on est proche de la cible"* — elle est purement **locale**. Ce qu'elle dit, c'est : *"si tu bouges ton paramètre d'un poil dans tel sens, l'erreur va monter ou descendre"* — et c'est suffisant pour progresser.

## Le mécanisme

Soit une perte `L(θ)` qu'on veut minimiser (θ = un poids du réseau). Le développement de Taylor à l'ordre 1 donne :

```
L(θ + Δ) ≈ L(θ) + L'(θ)·Δ
```

Le terme `L'(θ)·Δ` est la variation d'erreur prédite par la dérivée :

- si `L'(θ) > 0` : l'erreur **augmente** quand θ augmente → il faut **diminuer** θ ;
- si `L'(θ) < 0` : l'erreur **diminue** quand θ augmente → il faut **augmenter** θ.

Dans les deux cas, la règle de mise à jour de la descente de gradient :

```
θ ← θ − η·L'(θ)        (η = pas d'apprentissage)
```

rend le terme `L'(θ)·Δ` **négatif** (−η·L'(θ)²), donc garanti `L(θ+nouveau) < L(θ)` pour η assez petit. Chaque pas rapproche de l'erreur minimale — sans jamais savoir où elle se trouve.

## Ce que la dérivée encode, précisément

| Information | Portée |
|---|---|
| **Signe** | La direction à descendre |
| **Magnitude** | La raideur de la pente → taille du pas adaptée |
| **~0** | Plateau ou minimum local → on s'arrête (ou on stagne) |

La magnitude agit comme un régulateur : pente forte (erreur très sensible au paramètre) → grand pas ; pente faible → petit pas.

## Le lien avec les fonctions d'activation

C'est exactement là que les défauts cités précédemment se concrétisent :

- **step()** : dérivée nulle partout sauf en 0 → `L'(θ) = 0` → aucune information de direction, aucun apprentissage possible.
- **sigmoïde/tanh** : dérivée ≈ 0 dès |z| > 5 (saturation) → gradient quasi nul, le signal "où descendre" s'amenuise couche après couche (vanishing gradient) : le réseau croit avoir atteint la cible alors qu'il est juste sur un plateau.
- **ReLU** : dérivée = 1 côté positif → le signal de descente traverse toutes les couches sans s'affaiblir.

En résumé : la dérivée est une **boussole**, pas un GPS. Elle indique le sens de la descente à chaque point ; en l'itérant on converge — au moins vers un minimum local, la convexité étant rare en deep learning.