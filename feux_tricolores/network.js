// ========================================================================
// FEUX TRICOLORES RGB - NEURAL NETWORK IMPLEMENTATION
// ========================================================================

// Configuration : 3 cercles tactiles RGB sur tablette 200x400
const TABLET_WIDTH = 200;
const TABLET_HEIGHT = 400;
const CIRCLE_RADIUS = 50;

// Centres des cercles : Rouge, Vert, Orange
const CIRCLE_CENTERS = [
    { x: 100, y: 320, color: '#F44336', label: 'Rouge' },
    { x: 100, y: 80, color: '#4CAF50', label: 'Vert' },
    { x: 100, y: 200, color: '#FF9800', label: 'Orange' }
];

// Noms et couleurs des classes : [Rouge, Vert, Orange, Noir(fond)]
const CLASS_NAMES = ['Rouge', 'Vert', 'Orange', 'Noir'];
const CLASS_COLORS = ['#F44336', '#4CAF50', '#FF9800', '#000000'];

// Variables globales
let trainingData = [];
let validationData = [];
let datasetGenerated = false;
let network = null;
let trainingResults = null;
let trainingChart = null;
let isTraining = false;
let trainingTimeout = null;

// Fonction utilitaire pour brasser un tableau (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// ========================================================================
// DATASET GENERATION
// ========================================================================

/**
 * Génère le dataset complet avec des points dans chaque cercle et à l'extérieur
 */
function generateDataset() {
    showStatus('datasetStatus', 'Génération du dataset...', 'info');
    
    trainingData = [];
    validationData = [];
    
    // Récupérer les tailles depuis l'interface (ou valeurs par défaut)
    const trainSizeInput = document.getElementById('trainSize');
    const validationSizeInput = document.getElementById('validationSize');
    const totalTraining = trainSizeInput ? parseInt(trainSizeInput.value) || 1200 : 1200;
    const validationSize = validationSizeInput ? parseInt(validationSizeInput.value) || 240 : 240;
    
    // Répartition : 75% dans les cercles, 25% à l'extérieur (comme l'original)
    const pointsPerCircle = Math.floor(totalTraining * 0.75 / 3);
    const pointsOutside = totalTraining - pointsPerCircle * 3;
    
    // Training set : points dans les cercles
    for (let circleIndex = 0; circleIndex < CIRCLE_CENTERS.length; circleIndex++) {
        for (let i = 0; i < pointsPerCircle; i++) {
            trainingData.push(generatePointForClass(circleIndex));
        }
    }
    
    // Training set : points à l'extérieur (fond noir)
    for (let i = 0; i < pointsOutside; i++) {
        trainingData.push(generateOutsidePoint());
    }
    
    // Validation set (utilisation de la valeur saisie)
    const validationPerClass = Math.floor(validationSize / 4);
    
    for (let circleIndex = 0; circleIndex < CIRCLE_CENTERS.length; circleIndex++) {
        for (let i = 0; i < validationPerClass; i++) {
            validationData.push(generatePointForClass(circleIndex));
        }
    }
    for (let i = 0; i < validationPerClass; i++) {
        validationData.push(generateOutsidePoint());
    }
    
    // Brasser les datasets pour un apprentissage efficace
    shuffleArray(trainingData);
    shuffleArray(validationData);
    
    datasetGenerated = true;
    showStatus('datasetStatus', `Dataset: ${trainingData.length} train, ${validationData.length} val (brassés)`, 'success');
    document.getElementById('previewBtn').disabled = false;
    document.getElementById('visualizeBtn').disabled = false;
    document.getElementById('trainBtn').disabled = false;
}

/**
 * Génère un point aléatoire dans un cercle spécifié
 * @param {number} circleIndex - Index du cercle (0=Rouge, 1=Vert, 2=Orange)
 * @returns {Object} Point avec coordonnées, sortie attendue et classe
 */
function generatePointForClass(circleIndex) {
    const circle = CIRCLE_CENTERS[circleIndex];
    let x, y;
    
    // Générer un point aléatoire dans le cercle
    do {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * CIRCLE_RADIUS;
        x = circle.x + radius * Math.cos(angle);
        y = circle.y + radius * Math.sin(angle);
    } while (!isPointInCircle(x, y, circleIndex));
    
    // Normaliser les coordonnées entre 0 et 1
    const xNorm = x / (TABLET_WIDTH - 1);
    const yNorm = y / (TABLET_HEIGHT - 1);
    
    // Créer la sortie attendue : [1,0,0] pour Rouge, [0,1,0] pour Vert, [0,0,1] pour Orange
    const output = new Array(3).fill(0);
    output[circleIndex] = 1;
    
    return { 
        x: xNorm, 
        y: yNorm, 
        output: output, 
        trueClass: circleIndex, 
        original: {x, y} 
    };
}

/**
 * Génère un point aléatoire à l'extérieur de tous les cercles (fond noir)
 * @returns {Object} Point avec sortie [0,0,0] et classe 3 (Noir)
 */
function generateOutsidePoint() {
    let x, y;
    do {
        x = Math.random() * (TABLET_WIDTH - 1);
        y = Math.random() * (TABLET_HEIGHT - 1);
    } while (isPointInAnyCircle(x, y));
    
    const xNorm = x / (TABLET_WIDTH - 1);
    const yNorm = y / (TABLET_HEIGHT - 1);
    
    return { 
        x: xNorm, 
        y: yNorm, 
        output: [0, 0, 0], 
        trueClass: 3, // Noir = classe 3
        original: {x, y} 
    };
}

/**
 * Vérifie si un point est dans un cercle spécifique
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @param {number} circleIndex - Index du cercle
 * @returns {boolean}
 */
function isPointInCircle(x, y, circleIndex) {
    const circle = CIRCLE_CENTERS[circleIndex];
    const dx = x - circle.x;
    const dy = y - circle.y;
    return dx * dx + dy * dy <= CIRCLE_RADIUS * CIRCLE_RADIUS;
}

/**
 * Vérifie si un point est dans n'importe quel cercle
 * @param {number} x - Coordonnée x
 * @param {number} y - Coordonnée y
 * @returns {boolean}
 */
function isPointInAnyCircle(x, y) {
    for (let i = 0; i < CIRCLE_CENTERS.length; i++) {
        if (isPointInCircle(x, y, i)) return true;
    }
    return false;
}

/**
 * Affiche un aperçu textuel des premiers échantillons du dataset
 */
function showDatasetPreview() {
    if (!datasetGenerated) { alert('Générez le dataset d\'abord.'); return; }
    const preview = trainingData.slice(0, 20);
    let html = 'Premiers 20 échantillons:\n\n';
    preview.forEach((point, i) => {
        const className = point.trueClass < 3 ? CLASS_NAMES[point.trueClass] : 'Noir';
        html += `${i+1}. (x=${point.x.toFixed(4)}, y=${point.y.toFixed(4)}) → [${point.output.join(', ')}] (${className})\n`;
    });
    document.getElementById('datasetPreviewContent').textContent = html;
    document.getElementById('datasetPreview').classList.remove('hidden');
}

/**
 * Visualise le dataset sur un canvas
 */
function visualizeDataset() {
    if (!datasetGenerated) { alert('Générez le dataset d\'abord.'); return; }
    const canvas = document.getElementById('datasetCanvas');
    const ctx = canvas.getContext('2d');
    
    // Créer une copie brassée du dataset pour la visualisation
    const shuffledData = [...trainingData];
    shuffleArray(shuffledData);
    
    // Effacer le canvas
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner le cadre de la tablette
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, TABLET_WIDTH, TABLET_HEIGHT);
    
    // Dessiner les cercles en pointillés
    ctx.strokeStyle = '#666';
    ctx.setLineDash([2, 2]);
    CIRCLE_CENTERS.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x + 10, circle.y + 10, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.setLineDash([]);
    
    // Dessiner les points du dataset brassé (limité à 800 pour la lisibilité)
    shuffledData.slice(0, 800).forEach(point => {
        const color = CLASS_COLORS[point.trueClass];
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.original.x + 10, point.original.y + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    document.getElementById('datasetVisualization').classList.remove('hidden');
}

// ========================================================================
// NEURAL NETWORK - MLP 2-H-3
// ========================================================================

/**
 * Réseau de neurones MLP avec :
 * - Couche d'entrée : 2 neurones (x, y)
 * - Couche cachée : H neurones (ReLU)
 * - Couche de sortie : 3 neurones (Sigmoid) pour R, V, B
 */
class NeuralNetwork {
    constructor(inputSize = 2, hiddenSize = 12, outputSize = 3) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;
        
        // Initialisation Xavier/Glorot
        this.W1 = this.xavierInitialize(inputSize, hiddenSize);
        this.b1 = new Array(hiddenSize).fill(0);
        this.W2 = this.xavierInitialize(hiddenSize, outputSize);
        this.b2 = new Array(outputSize).fill(0);
        
        // Paramètres de l'optimiseur Adam
        this.mW1 = this.zerosMatrix(inputSize, hiddenSize);
        this.vW1 = this.zerosMatrix(inputSize, hiddenSize);
        this.mb1 = new Array(hiddenSize).fill(0);
        this.vb1 = new Array(hiddenSize).fill(0);
        this.mW2 = this.zerosMatrix(hiddenSize, outputSize);
        this.vW2 = this.zerosMatrix(hiddenSize, outputSize);
        this.mb2 = new Array(outputSize).fill(0);
        this.vb2 = new Array(outputSize).fill(0);
    }
    
    /**
     * Initialisation Xavier pour éviter les problèmes de gradients
     * @param {number} rows - Nombre de lignes
     * @param {number} cols - Nombre de colonnes
     * @returns {Array} Matrice de poids initialisés
     */
    xavierInitialize(rows, cols) {
        const matrix = [];
        const scale = Math.sqrt(2 / (rows + cols));
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = (Math.random() - 0.5) * 2 * scale;
            }
        }
        return matrix;
    }
    
    /**
     * Crée une matrice de zéros
     * @param {number} rows - Nombre de lignes
     * @param {number} cols - Nombre de colonnes
     * @returns {Array} Matrice de zéros
     */
    zerosMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = new Array(cols).fill(0);
        }
        return matrix;
    }
    
    // Fonctions d'activation
    relu(z) { return Math.max(0, z); }
    reluDerivative(z) { return z > 0 ? 1 : 0; }
    sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
    sigmoidDerivative(z) { 
        const s = this.sigmoid(z); 
        return s * (1 - s); 
    }
    
    /**
     * Forward pass : calcule la sortie du réseau
     * @param {number} x - Coordonnée x normalisée
     * @param {number} y - Coordonnée y normalisée
     * @returns {Object} Sortie, couches cachées et valeurs intermédiaires
     */
    forward(x, y) {
        const input = [x, y];
        const hidden = new Array(this.hiddenSize).fill(0);
        const z1 = new Array(this.hiddenSize).fill(0);
        
        // Couche cachée avec ReLU
        for (let i = 0; i < this.hiddenSize; i++) {
            z1[i] = this.b1[i];
            for (let j = 0; j < this.inputSize; j++) {
                z1[i] += input[j] * this.W1[j][i];
            }
            hidden[i] = this.relu(z1[i]);
        }
        
        // Couche de sortie avec Sigmoid
        const output = new Array(this.outputSize).fill(0);
        const z2 = new Array(this.outputSize).fill(0);
        
        for (let i = 0; i < this.outputSize; i++) {
            z2[i] = this.b2[i];
            for (let j = 0; j < this.hiddenSize; j++) {
                z2[i] += hidden[j] * this.W2[j][i];
            }
            output[i] = this.sigmoid(z2[i]);
        }
        
        return { output, hidden, z1, z2 };
    }
    
    /**
     * Calcule la perte (Binary Cross-Entropy)
     * @param {Array} output - Sortie prédite
     * @param {Array} target - Sortie attendue
     * @returns {number} Valeur de la perte
     */
    computeLoss(output, target) {
        let loss = 0;
        for (let i = 0; i < output.length; i++) {
            // Clip pour éviter log(0)
            const p = Math.max(Math.min(output[i], 1 - 1e-15), 1e-15);
            loss -= target[i] * Math.log(p) + (1 - target[i]) * Math.log(1 - p);
        }
        return loss / output.length;
    }
    
    /**
     * Backward pass : calcule les gradients
     * @param {Object} point - Point de données
     * @param {Array} output - Sortie prédite
     * @param {Array} hidden - Couche cachée
     * @param {Array} z1 - Pré-activation couche cachée
     * @param {Array} z2 - Pré-activation couche de sortie
     * @param {Array} dW1 - Accumulateur gradient W1
     * @param {Array} db1 - Accumulateur gradient b1
     * @param {Array} dW2 - Accumulateur gradient W2
     * @param {Array} db2 - Accumulateur gradient b2
     */
    backward(point, output, hidden, z1, z2, dW1, db1, dW2, db2) {
        // Gradient de la couche de sortie
        const delta2 = new Array(this.outputSize).fill(0);
        for (let i = 0; i < this.outputSize; i++) {
            delta2[i] = (output[i] - point.output[i]) * this.sigmoidDerivative(z2[i]);
        }
        
        // Accumuler les gradients pour W2 et b2
        for (let i = 0; i < this.outputSize; i++) {
            db2[i] += delta2[i];
            for (let j = 0; j < this.hiddenSize; j++) {
                dW2[j][i] += hidden[j] * delta2[i];
            }
        }
        
        // Gradient de la couche cachée
        const delta1 = new Array(this.hiddenSize).fill(0);
        for (let j = 0; j < this.hiddenSize; j++) {
            let sum = 0;
            for (let i = 0; i < this.outputSize; i++) {
                sum += this.W2[j][i] * delta2[i];
            }
            delta1[j] = sum * this.reluDerivative(z1[j]);
        }
        
        // Accumuler les gradients pour W1 et b1
        for (let j = 0; j < this.hiddenSize; j++) {
            db1[j] += delta1[j];
            for (let k = 0; k < this.inputSize; k++) {
                const inputVal = k === 0 ? point.x : point.y;
                dW1[k][j] += inputVal * delta1[j];
            }
        }
    }
    
    /**
     * Met à jour les poids avec l'optimiseur Adam
     * @param {Array} dW1 - Gradient W1
     * @param {Array} db1 - Gradient b1
     * @param {Array} dW2 - Gradient W2
     * @param {Array} db2 - Gradient b2
     * @param {number} learningRate - Taux d'apprentissage
     * @param {number} t - Numéro de l'itération
     * @param {number} beta1 - Paramètre Adam
     * @param {number} beta2 - Paramètre Adam
     * @param {number} epsilon - Petite constante pour éviter division par zéro
     */
    updateWeights(dW1, db1, dW2, db2, learningRate, t, beta1, beta2, epsilon) {
        // Mise à jour W1
        for (let i = 0; i < this.inputSize; i++) {
            for (let j = 0; j < this.hiddenSize; j++) {
                this.mW1[i][j] = beta1 * this.mW1[i][j] + (1 - beta1) * dW1[i][j];
                this.vW1[i][j] = beta2 * this.vW1[i][j] + (1 - beta2) * dW1[i][j] * dW1[i][j];
                const mW1Hat = this.mW1[i][j] / (1 - Math.pow(beta1, t));
                const vW1Hat = this.vW1[i][j] / (1 - Math.pow(beta2, t));
                this.W1[i][j] -= learningRate * mW1Hat / (Math.sqrt(vW1Hat) + epsilon);
            }
        }
        
        // Mise à jour b1
        for (let j = 0; j < this.hiddenSize; j++) {
            this.mb1[j] = beta1 * this.mb1[j] + (1 - beta1) * db1[j];
            this.vb1[j] = beta2 * this.vb1[j] + (1 - beta2) * db1[j] * db1[j];
            const mb1Hat = this.mb1[j] / (1 - Math.pow(beta1, t));
            const vb1Hat = this.vb1[j] / (1 - Math.pow(beta2, t));
            this.b1[j] -= learningRate * mb1Hat / (Math.sqrt(vb1Hat) + epsilon);
        }
        
        // Mise à jour W2
        for (let i = 0; i < this.hiddenSize; i++) {
            for (let j = 0; j < this.outputSize; j++) {
                this.mW2[i][j] = beta1 * this.mW2[i][j] + (1 - beta1) * dW2[i][j];
                this.vW2[i][j] = beta2 * this.vW2[i][j] + (1 - beta2) * dW2[i][j] * dW2[i][j];
                const mW2Hat = this.mW2[i][j] / (1 - Math.pow(beta1, t));
                const vW2Hat = this.vW2[i][j] / (1 - Math.pow(beta2, t));
                this.W2[i][j] -= learningRate * mW2Hat / (Math.sqrt(vW2Hat) + epsilon);
            }
        }
        
        // Mise à jour b2
        for (let j = 0; j < this.outputSize; j++) {
            this.mb2[j] = beta1 * this.mb2[j] + (1 - beta1) * db2[j];
            this.vb2[j] = beta2 * this.vb2[j] + (1 - beta2) * db2[j] * db2[j];
            const mb2Hat = this.mb2[j] / (1 - Math.pow(beta1, t));
            const vb2Hat = this.vb2[j] / (1 - Math.pow(beta2, t));
            this.b2[j] -= learningRate * mb2Hat / (Math.sqrt(vb2Hat) + epsilon);
        }
    }
    
    /**
     * Entraîne le réseau sur les données
     * @param {Array} data - Données d'entraînement
     * @param {number} batchSize - Taille des batches
     * @param {number} learningRate - Taux d'apprentissage
     * @param {number} epochs - Nombre d'époques
     * @param {Array} validationData - Données de validation
     * @param {Function} onEpoch - Callback après chaque époque
     * @returns {Object} Résultats de l'entraînement
     */
    train(data, batchSize, learningRate, epochs, validationData, onEpoch) {
        const beta1 = 0.9;
        const beta2 = 0.999;
        const epsilon = 1e-8;
        
        const results = { 
            trainLoss: [], 
            valLoss: [], 
            trainAccuracy: [], 
            valAccuracy: [], 
            times: [] 
        };
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            shuffleArray(data);
            
            let epochTrainLoss = 0;
            let correctTrain = 0;
            
            // Traiter par batches
            for (let i = 0; i < data.length; i += batchSize) {
                const batch = data.slice(i, i + batchSize);
                const dW1 = this.zerosMatrix(this.inputSize, this.hiddenSize);
                const db1 = new Array(this.hiddenSize).fill(0);
                const dW2 = this.zerosMatrix(this.hiddenSize, this.outputSize);
                const db2 = new Array(this.outputSize).fill(0);
                
                for (const point of batch) {
                    const { output, hidden, z1, z2 } = this.forward(point.x, point.y);
                    epochTrainLoss += this.computeLoss(output, point.output);
                    
                    const predicted = this.outputToClass(output);
                    if (predicted === point.trueClass) correctTrain++;
                    
                    this.backward(point, output, hidden, z1, z2, dW1, db1, dW2, db2);
                }
                
                // Mise à jour des poids après le batch
                this.updateWeights(dW1, db1, dW2, db2, learningRate, epoch + 1, beta1, beta2, epsilon);
            }
            
            epochTrainLoss /= data.length;
            const trainAccuracy = correctTrain / data.length;
            const { valLoss, valAccuracy } = this.evaluate(validationData);
            
            results.trainLoss.push(epochTrainLoss);
            results.valLoss.push(valLoss);
            results.trainAccuracy.push(trainAccuracy);
            results.valAccuracy.push(valAccuracy);
            results.times.push(Date.now());
            
            if (onEpoch) {
                onEpoch(epoch, epochs, epochTrainLoss, valLoss, trainAccuracy, valAccuracy);
            }
            
            // Arrêt anticipé si la perte de validation augmente
            if (epoch > 50 && results.valLoss.length > 1 && valLoss > results.valLoss[epoch - 1] * 1.01) {
                console.log(`Arrêt anticipé à l'époque ${epoch}`);
                break;
            }
        }
        
        return results;
    }
    
    /**
     * Évalue le réseau sur des données de test
     * @param {Array} data - Données à évaluer
     * @returns {Object} Perte et précision
     */
    evaluate(data) {
        let totalLoss = 0;
        let correct = 0;
        for (const point of data) {
            const { output } = this.forward(point.x, point.y);
            totalLoss += this.computeLoss(output, point.output);
            const predicted = this.outputToClass(output);
            if (predicted === point.trueClass) correct++;
        }
        return { 
            valLoss: totalLoss / data.length, 
            valAccuracy: correct / data.length 
        };
    }
    
    /**
     * Convertit la sortie du réseau en classe prédite
     * Utilise argmax avec seuil pour détecter la classe Noir
     * @param {Array} output - Sortie du réseau (3 valeurs: R, V, O)
     * @returns {number} Classe prédite (0=Rouge, 1=Vert, 2=Orange, 3=Noir)
     */
    outputToClass(output) {
        // Trouver l'index de la valeur maximale (argmax)
        let maxIndex = 0;
        let maxValue = output[0];
        for (let i = 1; i < output.length; i++) {
            if (output[i] > maxValue) {
                maxValue = output[i];
                maxIndex = i;
            }
        }
        
        // Si la valeur maximale est faible (< 0.3), c'est Noir (classe 3)
        // Ce seuil permet de mieux distinguer les points à l'extérieur des cercles
        if (maxValue < 0.3) return 3;
        return maxIndex;
    }
    
    /**
     * Prédit la classe pour des coordonnées données
     * @param {number} x - Coordonnée x normalisée
     * @param {number} y - Coordonnée y normalisée
     * @returns {number} Classe prédite
     */
    predictClass(x, y) {
        const { output } = this.forward(x, y);
        return this.outputToClass(output);
    }
    
    /**
     * Prédit la sortie brute pour des coordonnées données
     * @param {number} x - Coordonnée x normalisée
     * @param {number} y - Coordonnée y normalisée
     * @returns {Array} Sortie du réseau
     */
    predict(x, y) {
        const { output } = this.forward(x, y);
        return output;
    }
    
    /**
     * Exporte les poids du réseau en JSON
     * @returns {Object} Poids du réseau
     */
    toJSON() {
        return { 
            W1: this.W1, 
            b1: this.b1, 
            W2: this.W2, 
            b2: this.b2,
            hiddenSize: this.hiddenSize
        };
    }
    
    /**
     * Charge les poids du réseau depuis un JSON
     * @param {Object} data - Poids à charger
     */
    fromJSON(data) {
        this.W1 = data.W1;
        this.b1 = data.b1;
        this.W2 = data.W2;
        this.b2 = data.b2;
        this.hiddenSize = data.hiddenSize || this.hiddenSize;
        
        // Réinitialiser les paramètres Adam
        this.mW1 = this.zerosMatrix(this.inputSize, this.hiddenSize);
        this.vW1 = this.zerosMatrix(this.inputSize, this.hiddenSize);
        this.mb1 = new Array(this.hiddenSize).fill(0);
        this.vb1 = new Array(this.hiddenSize).fill(0);
        this.mW2 = this.zerosMatrix(this.hiddenSize, this.outputSize);
        this.vW2 = this.zerosMatrix(this.hiddenSize, this.outputSize);
        this.mb2 = new Array(this.outputSize).fill(0);
        this.vb2 = new Array(this.outputSize).fill(0);
    }
}

// ========================================================================
// TRAINING UI FUNCTIONS
// ========================================================================

/**
 * Lance l'entraînement du réseau
 */
function trainNetwork() {
    if (!datasetGenerated) { 
        alert('Générez le dataset d\'abord.'); 
        return; 
    }
    if (isTraining) { 
        alert('Entraînement en cours.'); 
        return; 
    }
    
    isTraining = true;
    document.getElementById('trainBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    const epochs = parseInt(document.getElementById('epochs').value) || 1000;
    const batchSize = parseInt(document.getElementById('batchSize').value) || 32;
    const learningRate = parseFloat(document.getElementById('learningRate').value) || 0.01;
    const hiddenSize = parseInt(document.getElementById('hiddenSize').value) || 12;
    
    showStatus('trainingStatus', `Entraînement: ${epochs} epochs, batch ${batchSize}, lr ${learningRate}, hidden ${hiddenSize}`, 'info');
    
    // Créer le réseau avec la taille de couche cachée sélectionnée
    network = new NeuralNetwork(2, hiddenSize, 3);
    
    // Initialiser le graphique
    const ctx = document.getElementById('trainingChart').getContext('2d');
    if (trainingChart) trainingChart.destroy();
    
    trainingChart = new Chart(ctx, {
        type: 'line',
        data: { 
            labels: [], 
            datasets: [
                { label: 'Perte Train', data: [], borderColor: '#4CAF50', yAxisID: 'y' },
                { label: 'Perte Val', data: [], borderColor: '#F44336', yAxisID: 'y' },
                { label: 'Acc Train', data: [], borderColor: '#FF9800', yAxisID: 'y1' },
                { label: 'Acc Val', data: [], borderColor: '#FF9800', yAxisID: 'y1' }
            ] 
        },
        options: {
            responsive: true, 
            maintainAspectRatio: false,
            scales: {
                y: { 
                    type: 'linear', 
                    display: true, 
                    position: 'left', 
                    title: { display: true, text: 'Perte' } 
                },
                y1: { 
                    type: 'linear', 
                    display: true, 
                    position: 'right', 
                    title: { display: true, text: 'Accuracy' }, 
                    min: 0, 
                    max: 1, 
                    grid: { drawOnChartArea: false } 
                }
            }
        }
    });
    
    document.getElementById('metricsContainer').classList.add('hidden');
    const startTime = Date.now();
    
    trainingResults = network.train(
        trainingData, 
        batchSize, 
        learningRate, 
        epochs, 
        validationData,
        (epoch, totalEpochs, trainLoss, valLoss, trainAccuracy, valAccuracy) => {
            const progress = (epoch / totalEpochs) * 100;
            document.getElementById('trainingProgress').style.width = `${progress}%`;
            
            document.getElementById('trainLoss').textContent = trainLoss.toFixed(6);
            document.getElementById('valLoss').textContent = valLoss.toFixed(6);
            document.getElementById('trainAccuracy').textContent = (trainAccuracy * 100).toFixed(2) + '%';
            document.getElementById('valAccuracy').textContent = (valAccuracy * 100).toFixed(2) + '%';
            document.getElementById('currentEpoch').textContent = `${epoch + 1}/${totalEpochs}`;
            const elapsed = (Date.now() - startTime) / 1000;
            document.getElementById('elapsedTime').textContent = `${elapsed.toFixed(1)}s`;
            document.getElementById('metricsContainer').classList.remove('hidden');
            
            showStatus('trainingStatus', `Epoch ${epoch+1}/${totalEpochs} - Train: ${(trainAccuracy*100).toFixed(2)}% - Val: ${(valAccuracy*100).toFixed(2)}%`, 'info');
            
            trainingChart.data.labels.push(epoch + 1);
            trainingChart.data.datasets[0].data.push(trainLoss);
            trainingChart.data.datasets[1].data.push(valLoss);
            trainingChart.data.datasets[2].data.push(trainAccuracy);
            trainingChart.data.datasets[3].data.push(valAccuracy);
            trainingChart.update('none');
        }
    );
    
    isTraining = false;
    document.getElementById('trainBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    showStatus('trainingStatus', `Entraînement terminé! Accuracy: ${(trainingResults.trainAccuracy[trainingResults.trainAccuracy.length-1]*100).toFixed(2)}%`, 'success');
    
    document.getElementById('predictBtn').disabled = false;
    document.getElementById('testBtn').disabled = false;
    document.getElementById('confusionBtn').disabled = false;
}

/**
 * Arrête l'entraînement
 */
function stopTraining() {
    if (trainingTimeout) clearTimeout(trainingTimeout);
    isTraining = false;
    document.getElementById('trainBtn').disabled = false;
    document.getElementById('stopBtn').disabled = true;
    showStatus('trainingStatus', 'Entraînement arrêté.', 'error');
}

// ========================================================================
// PREDICTION VISUALIZATION
// ========================================================================

/**
 * Visualise les prédictions du réseau sur toute la tablette
 */
function visualizePredictions() {
    if (!network) { 
        alert('Entraînez le réseau d\'abord.'); 
        return; 
    }
    showStatus('trainingStatus', 'Génération visualisation...', 'info');
    
    const canvas = document.getElementById('predictionsCanvas');
    const ctx = canvas.getContext('2d');
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = TABLET_WIDTH;
    gridCanvas.height = TABLET_HEIGHT;
    const gridCtx = gridCanvas.getContext('2d');
    
    // Résolution pour la visualisation
    const step = 2;
    
    // Calculer les prédictions pour chaque pixel
    for (let y = 0; y < TABLET_HEIGHT; y += step) {
        for (let x = 0; x < TABLET_WIDTH; x += step) {
            const xNorm = x / (TABLET_WIDTH - 1);
            const yNorm = y / (TABLET_HEIGHT - 1);
            const predictedClass = network.predictClass(xNorm, yNorm);
            gridCtx.fillStyle = CLASS_COLORS[predictedClass];
            gridCtx.fillRect(x, y, step, step);
        }
    }
    
    // Dessiner le canvas final
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#333'; 
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, TABLET_WIDTH, TABLET_HEIGHT);
    
    ctx.drawImage(gridCanvas, 10, 10, TABLET_WIDTH, TABLET_HEIGHT);
    
    // Dessiner les cercles réels en superposition
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.setLineDash([2, 2]);
    ctx.lineWidth = 2;
    CIRCLE_CENTERS.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x + 10, circle.y + 10, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.setLineDash([]);
    
    // Légende
    for (let i = 0; i < CLASS_NAMES.length; i++) {
        ctx.fillStyle = CLASS_COLORS[i];
        ctx.fillRect(230, 50 + i * 25, 15, 15);
        ctx.fillStyle = '#333';
        ctx.fillText(CLASS_NAMES[i], 250, 60 + i * 25);
    }
    
    document.getElementById('predictionsVisualization').classList.remove('hidden');
    showStatus('trainingStatus', 'Visualisation générée.', 'success');
}

// ========================================================================
// SPECIFIC POINT TEST
// ========================================================================

/**
 * Affiche le formulaire de test pour un point spécifique
 */
function testSpecificPoint() {
    document.getElementById('specificPointTest').classList.remove('hidden');
}

/**
 * Teste un point spécifique sur le réseau
 */
function runSpecificPointTest() {
    const x = parseInt(document.getElementById('testX').value);
    const y = parseInt(document.getElementById('testY').value);
    
    // Vérifier que les coordonnées sont valides
    if (isNaN(x) || isNaN(y) || x < 0 || x >= TABLET_WIDTH || y < 0 || y >= TABLET_HEIGHT) {
        alert(`Coordonnées invalides. Entrez des valeurs entre 0 et ${TABLET_WIDTH-1} pour x, et 0 et ${TABLET_HEIGHT-1} pour y.`);
        return;
    }
    
    const xNorm = x / (TABLET_WIDTH - 1);
    const yNorm = y / (TABLET_HEIGHT - 1);
    
    // Déterminer la vraie classe
    let trueClass = 3; // Noir par défaut
    for (let i = 0; i < CIRCLE_CENTERS.length; i++) {
        if (isPointInCircle(x, y, i)) {
            trueClass = i;
            break;
        }
    }
    
    // Prédiction
    const output = network.predict(xNorm, yNorm);
    const predictedClass = network.predictClass(xNorm, yNorm);
    
    // Afficher les résultats
    const result = document.getElementById('testResult');
    result.innerHTML = `
        <div class="important-box">
            <p><strong>Coordonnées:</strong> (${x}, ${y})</p>
            <p><strong>Vraie classe:</strong> <span style="color:${CLASS_COLORS[trueClass]};font-weight:bold">${CLASS_NAMES[trueClass]}</span></p>
            <p><strong>Prédite:</strong> <span style="color:${CLASS_COLORS[predictedClass]};font-weight:bold">${CLASS_NAMES[predictedClass]}</span></p>
            <p><strong>Sortie:</strong> [${output.map(v => v.toFixed(4)).join(', ')}]</p>
            <p><strong>Résultat:</strong> ${trueClass === predictedClass ? '<span style="color:green;font-weight:bold">Correct</span>' : '<span style="color:red;font-weight:bold">Incorrect</span>'}</p>
        </div>
    `;
}

// ========================================================================
// CONFUSION MATRIX
// ========================================================================

/**
 * Calcule et affiche la matrice de confusion
 * Avec coloration pour mieux visualiser les performances
 */
function computeConfusionMatrix() {
    if (!network) { 
        alert('Entraînez le réseau d\'abord.'); 
        return; 
    }
    
    const nClasses = 4; // Rouge, Vert, Orange, Noir
    const matrix = [];
    for (let i = 0; i < nClasses; i++) {
        matrix[i] = new Array(nClasses).fill(0);
    }
    
    // Calculer la matrice
    for (const point of validationData) {
        const predictedClass = network.predictClass(point.x, point.y);
        matrix[point.trueClass][predictedClass]++;
    }
    
    // Générer le HTML avec coloration
    let html = '<div class="important-box">';
    html += '<h3 style="margin-top:0;">Matrice de Confusion (Méthode Argmax)</h3>';
    html += '<p style="margin-bottom:15px;"><strong>Diagonale = Prédictions correctes (vert clair)<br>';
    html += 'Hors diagonale = Erreurs (rose)</strong></p>';
    html += '</div>';
    
    html += '<table style="margin:20px 0;"><tr><th>Vrai\Class</th>';
    for (let i = 0; i < nClasses; i++) {
        html += `<th style="color:${CLASS_COLORS[i]}; font-weight:bold;">${CLASS_NAMES[i]}</th>`;
    }
    html += '</tr>';
    
    for (let i = 0; i < nClasses; i++) {
        html += `<tr><th style="color:${CLASS_COLORS[i]}; font-weight:bold;">${CLASS_NAMES[i]}</th>`;
        for (let j = 0; j < nClasses; j++) {
            const isCorrect = (i === j);
            const bgColor = isCorrect ? '#e8f5e9' : '#ffebee';
            html += `<td style="background:${bgColor}; text-align:center; padding:10px;">
                <strong>${matrix[i][j]}</strong><br>
                <small style="color:#666;">${i !== j ? CLASS_NAMES[i] + '→' + CLASS_NAMES[j] : '✓'}</small>
            </td>`;
        }
        html += '</tr>';
    }
    html += '</table>';
    
    html += '<div style="margin:20px 0;">';
    html += '<h4>Précision par classe:</h4><ul style="list-style:none; padding:0;">';
    
    // Précision par classe
    for (let i = 0; i < nClasses; i++) {
        const total = matrix[i].reduce((a, b) => a + b, 0);
        const correct = matrix[i][i];
        const accuracy = total > 0 ? (correct / total * 100).toFixed(2) : 0;
        const color = CLASS_COLORS[i];
        html += `<li style="margin:10px 0; padding:10px; border-left:4px solid ${color}; background:#f9f9f9;">
            <strong style="color:${color};">${CLASS_NAMES[i]}</strong>: 
            <span style="color:${correct === total ? '#4CAF50' : '#F44336'};">${correct}/${total}</span> 
            (<strong>${accuracy}%</strong>)
        </li>`;
    }
    html += '</ul></div>';
    
    // Précision globale
    const total = validationData.length;
    let correct = 0;
    for (let i = 0; i < nClasses; i++) {
        correct += matrix[i][i];
    }
    const globalAccuracy = (correct/total*100).toFixed(2);
    const globalColor = globalAccuracy >= 95 ? '#4CAF50' : globalAccuracy >= 90 ? '#FF9800' : '#F44336';
    html += `<div style="margin:20px 0; padding:15px; background:#fff3cd; border-left:4px solid ${globalColor}; border-radius:5px;">
        <h4 style="margin:0 0 10px 0;">Accuracy Globale</h4>
        <p style="margin:0; font-size:20px; color:${globalColor}; font-weight:bold;">
            ${correct}/${total} (${globalAccuracy}%)
        </p>
    </div>`;
    
    document.getElementById('confusionMatrixContainer').innerHTML = html;
    document.getElementById('confusionMatrixContainer').classList.remove('hidden');
}

// ========================================================================
// EXPORT/IMPORT FUNCTIONS
// ========================================================================

/**
 * Exporte le modèle sous forme de JSON
 */
function exportModel() {
    if (!network) { 
        alert('Entraînez le réseau d\'abord.'); 
        return; 
    }
    const json = JSON.stringify(network.toJSON(), null, 2);
    document.getElementById('modelJson').value = json;
    document.getElementById('modelExport').classList.remove('hidden');
}

/**
 * Copie le modèle JSON dans le presse-papiers
 */
function copyModelToClipboard() {
    const textarea = document.getElementById('modelJson');
    textarea.select();
    document.execCommand('copy');
    showStatus('trainingStatus', 'Modèle copié!', 'success');
}

/**
 * Ouvre la boîte de dialogue pour importer un modèle
 */
function importModel() {
    document.getElementById('modelFileInput').click();
}

/**
 * Charge un modèle depuis un fichier
 */
function loadModelFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const model = JSON.parse(e.target.result);
            const hiddenSize = model.hiddenSize || 12;
            network = new NeuralNetwork(2, hiddenSize, 3);
            network.fromJSON(model);
            showStatus('trainingStatus', 'Modèle importé!', 'success');
            document.getElementById('predictBtn').disabled = false;
            document.getElementById('testBtn').disabled = false;
            document.getElementById('confusionBtn').disabled = false;
        } catch (error) {
            showStatus('trainingStatus', 'Erreur: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// ========================================================================
// CODE DISPLAY
// ========================================================================

/**
 * Affiche le code complet du réseau
 */
function showFullNetworkCode() {
    const code = `
// ========================================================================
// NEURAL NETWORK MLP 2-H-3
// Réseau pour classer les zones tactiles RGB sur tablette 200x400
// ========================================================================

class NeuralNetwork {
    constructor(inputSize = 2, hiddenSize = 12, outputSize = 3) {
        // Xavier/Glorot initialization
        this.W1 = this.xavierInit(inputSize, hiddenSize);
        this.b1 = new Array(hiddenSize).fill(0);
        this.W2 = this.xavierInit(hiddenSize, outputSize);
        this.b2 = new Array(outputSize).fill(0);
        
        // Adam optimizer state
        this.mW1 = this.zerosMatrix(inputSize, hiddenSize);
        this.vW1 = this.zerosMatrix(inputSize, hiddenSize);
        this.mb1 = new Array(hiddenSize).fill(0);
        this.vb1 = new Array(hiddenSize).fill(0);
        this.mW2 = this.zerosMatrix(hiddenSize, outputSize);
        this.vW2 = this.zerosMatrix(hiddenSize, outputSize);
        this.mb2 = new Array(outputSize).fill(0);
        this.vb2 = new Array(outputSize).fill(0);
    }
    
    xavierInit(rows, cols) {
        const scale = Math.sqrt(2 / (rows + cols));
        return Array.from({length: rows}, () =>
            Array.from({length: cols}, () => (Math.random() - 0.5) * 2 * scale)
        );
    }
    
    zerosMatrix(rows, cols) {
        return Array.from({length: rows}, () => new Array(cols).fill(0));
    }
    
    // Activation functions
    relu(z) { return Math.max(0, z); }
    sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
    
    // Forward pass
    forward(x, y) {
        const input = [x, y];
        const hidden = new Array(this.hiddenSize).fill(0);
        
        // Hidden layer (ReLU)
        for (let i = 0; i < this.hiddenSize; i++) {
            let sum = this.b1[i];
            for (let j = 0; j < this.inputSize; j++) {
                sum += input[j] * this.W1[j][i];
            }
            hidden[i] = this.relu(sum);
        }
        
        // Output layer (Sigmoid) - 3 neurones pour R, V, B
        const output = new Array(this.outputSize).fill(0);
        for (let i = 0; i < this.outputSize; i++) {
            let sum = this.b2[i];
            for (let j = 0; j < this.hiddenSize; j++) {
                sum += hidden[j] * this.W2[j][i];
            }
            output[i] = this.sigmoid(sum);
        }
        
        return { output };
    }
    
    // Binary Cross-Entropy Loss
    computeLoss(output, target) {
        let loss = 0;
        for (let i = 0; i < output.length; i++) {
            const p = Math.max(Math.min(output[i], 1 - 1e-15), 1e-15);
            loss -= target[i] * Math.log(p) + (1 - target[i]) * Math.log(1 - p);
        }
        return loss / output.length;
    }
    
    // Convert output to class using argmax
    outputToClass(output) {
        // Trouver l'index de la valeur maximale (argmax)
        let maxIndex = 0;
        let maxValue = output[0];
        for (let i = 1; i < output.length; i++) {
            if (output[i] > maxValue) {
                maxValue = output[i];
                maxIndex = i;
            }
        }
        
        // Si la valeur maximale est faible (< 0.3), c'est Noir (classe 3)
        if (maxValue < 0.3) return 3; // Noir (fond)
        return maxIndex; // 0=Rouge, 1=Vert, 2=Orange
    }
    
    // Training with Adam optimizer
    train(data, batchSize, lr, epochs, valData, onEpoch) {
        const beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8;
        // ... (see full implementation in network.js)
    }
}

// Configuration:
// - Entrée: 2 neurones (x, y) normalisés dans [0, 1]
// - Cachée: 12 neurones avec activation ReLU (configurable)
// - Sortie: 3 neurones avec activation Sigmoïde (R, V, B)
// - Fonction de coût: Binary Cross-Entropy
// - Optimiseur: Adam (β1=0.9, β2=0.999, ε=1e-8)
// - Architecture: forward(x, y) → hidden[H] → output[3]
    `;
    document.getElementById('fullNetworkCode').innerHTML = '<div class="code-block">' + code + '</div>';
    document.getElementById('fullNetworkCode').classList.remove('hidden');
}

// ========================================================================
// UTILITY FUNCTION
// ========================================================================

/**
 * Affiche un message de statut
 * @param {string} elementId - ID de l'élément
 * @param {string} message - Message à afficher
 * @param {string} type - Type de message (info, success, error)
 */
function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = 'status';
    if (type === 'success') el.classList.add('success');
    else if (type === 'error') el.classList.add('error');
    else el.classList.add('info');
    el.style.display = 'block';
}

// ========================================================================
// INITIALIZATION
// ========================================================================

// Afficher la description du réseau au chargement
document.getElementById('networkCode').textContent = `
// Réseau MLP 2-H-3 pour classification RGB
// - Entrée: 2 neurones (x, y) normalisés dans [0, 1]
// - Cachée: H neurones avec activation ReLU (12 par défaut)
// - Sortie: 3 neurones avec activation Sigmoïde (R, V, B)
// 
// Fonction de coût: Binary Cross-Entropy
// Optimiseur: Adam (β1=0.9, β2=0.999, ε=1e-8)
// 
// Sorties:
//   [1,0,0] → Rouge
//   [0,1,0] → Vert  
//   [0,0,1] → Orange
//   [0,0,0] → Noir (fond)
// 
// Architecture:
//   forward(x, y) → hidden[H] → output[3]
//   backward() → mise à jour des poids avec Adam
`;

// Log de démarrage
console.log('Feux tricolores RGB - Network loaded successfully!');
