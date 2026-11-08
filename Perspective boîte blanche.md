#  🟡 Découverte de l'IA

**Objectif pédagogique** :    
Il ne s'agit pas d'utiliser ni de juger l'IA, mais d'**armer l'esprit critique** par une compréhension de ses mécanismes.

## La démarche Boîte blanche 

Quand on regarde une IA de l'extérieur comme une _boîte noire_, on utilise des termes empruntés au lexique de la biologie et de l'esprit qui masquent les mécanismes intérieurs :     
- « neurone »  recouvre une somme pondérée, faite de simples additions et multiplications; 
- « il a appris » recouvre une descente de gradient ( suivre une pente ); 
- « il a compris » recouvre un calcul de probabilités. 
- etc.  
   
 **Nommer le mécanisme sous le mot**, c'est  la démarche **_boîte blanche_**.

### Différents plans 
L'IA  se compose de **plans superposés** avec des  **changements de  nature** de son objet.  

Le parcours _boîte blanche_ avance par **changements de question** et, avec chaque question, l'objet à décrire. 

- **Que fait un réseau ?** (Chapitres 1–2) : il compose des transformations simples, de nombres en nombres.
- **Comment s'est-il formé ?** (Chapitre 3) : non par des règles programmées, mais par réduction d'erreur.
- **Pour quoi est-il fait ?** (Chapitre 4) : une même mécanique, mise au service d'objectifs et de formats de sortie différents.
- **Comment saisit-il le langage ?** (Chapitre 5) : par une architecture qui pondère ce qui précède pour prédire ce qui suit.
- **Que produit-il exactement ?** (Chapitre 6) : une distribution de candidats conditionnée par un corpus.
- **Que fait-il paraître ?** (Chapitres 7–8) : un effet de compréhension, un plan de réponse, un raisonnement déroulé — produits du conditionnement et de la génération.
- **Que révèle cette mécanique des limites de l'IA ?** (Chapitre 9) On referme la boîte avec cette question critique. 

---

## Chapitre 1 — Le neurone artificiel : une fonction, pas un organe

**Changement de question :** on abandonne « est-il intelligent ? » pour « que calcule-t-il ? »

**Objectif pédagogique :** ramener le « neurone » à ce qu'il est réellement — une somme pondérée suivie d'une fonction d'activation — couper court à toute métaphore biologique.
-  La somme pondérée et le biais, un fonctionnement universel
-  A l'origine, la fonction d'activation par dépassement de seuil (échelon).

## Chapitre 2 — Le réseau : composer des transformations simples

**Changement de question :** « que fait un neurone ? » cède la place à « que fait un réseau de neurones? »

**Objectif pédagogique :** montrer que le réseau ne « contient » rien d'autre qu'une chaîne de multiplications matricielles et de non-linéarités ; la propagation avant est une simple composition de fonctions.


- Couches et profondeur : que gagne-t-on à empiler ?
- La propagation avant 
- L'hiver de l'IA 
- Pourquoi la non-linéarité a tout changé 


## Chapitre 3 — L'apprentissage : comment les poids se fixent

Changement de question : on ne demande plus ce que fait le réseau, mais comment il s'est formé.

**Objectif pédagogique :** faire comprendre qu'aucune règle n'est programmée ; les poids résultent d'une minimisation d'erreur (descente de gradient, rétropropagation). La « connaissance » d'un modèle n'est rien d'autre que l'état des poids après convergence.
- La fonction de perte : mesurer l'erreur
- Descente de gradient et rétropropagation
- Généralisation vs mémorisation (surapprentissage)


## Chapitre 4 — Une même mécanique, des objectifs différents

**Changement de question :** on ne demande plus comment il s'est formé, mais pour quoi il est fait.   

**Objectif pédagogique :** faire saisir que la taxonomie des IA (classifieur, régression, traduction, génération, apprentissage par renforcement) est une taxonomie d'objectifs et de formats de sortie, pas de mécanismes. L'architecture découle de la tâche.
- Du classifieur au modèle génératif
- Où se situent les LLM dans cette taxonomie


## Chapitre 5 — La mécanique propre au langage

### Tokens, attention, prédiction du mot suivant

**Changement de question :** on ne demande plus pour quoi il est fait, mais comment il saisit le langage.


**Objectif pédagogique :** expliquer la chaîne tokenisation → représentations vectorielles → attention → prédiction du token suivant ; montrer que « traiter le langage » se réduit ici à estimer le prochain élément d'une séquence selon son contexte.
- Tokenisation et embeddings : du texte aux nombres
- L'attention : pondérer le contexte
Génération auto-régressive : un mot à la fois


## Chapitre 6 — Données et probabilités : ce que le modèle « sait » vraiment

**Changement de question :** on ne demande plus comment il saisit le langage, mais ce qu'il produit exactement.

**Objectif pédagogique :** faire comprendre que la sortie est une distribution de probabilités conditionnée par le corpus ; en déduire mécaniquement biais, lacunes, variabilité des réponses, et l'hallucination comme propriété structurelle plutôt que comme panne.
- Le corpus comme source de vérité (et de biais)
- Température et échantillonnage : pourquoi deux réponses diffèrent
- L'hallucination expliquée par la mécanique


## Chapitre 7 — « Comprendre » la question et planifier la réponse

**Changement de question :** on ne demande plus ce qu'il produit, mais ce qu'il fait paraître.

**Objectif pédagogique :** dissocier l'effet de compréhension du mécanisme : le « plan de réponse » émerge d'un conditionnement (prompt, fine-tuning d'instructions, alignement) et non d'une délibération interne. Distinguer ce qui est dans les poids de ce qui est dans le contexte.
- Le prompt comme condition, pas comme commande
- Fine-tuning et alignement : d'où vient le comportement « utile »
- Le plan de réponse comme structure de texte générée

## Chapitre 8 — Chain of thought : le raisonnement comme comportement émergent

**Changement de question :** on ne demande plus seulement ce qu'il dit, mais ce qu'il fait — du modèle au système outillé.

**Objectif pédagogique :** expliquer pourquoi dérouler des étapes intermédiaires améliore les résultats — chaque token généré reconditionne les suivants — et relier ce mécanisme aux agents et à l'usage d'outils.  

- Pourquoi l'écrit intermédiaire améliore le calcul
- Agents, outils, test-time compute

## Chapitre 9 — Ce que la boîte blanche révèle des limites

**Changement de question :** on retourne la question sur elle-même — que révèle cette mécanique de ses limites ?

**Objectif pédagogique :** armer l'esprit critique — absence de modèle du monde, dépendance aux données, évaluation, coûts — et éviter les deux mythes symétriques : la boîte noire magique et le simple calcul trompeur.
- Limites structurelles
- Évaluer, vérifier, contrôler



