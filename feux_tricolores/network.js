// ========================================================================
// FEUX TRICOLORES - NEURAL NETWORK IMPLEMENTATION
// ========================================================================

// Configuration
const TABLET_WIDTH = 200;
const TABLET_HEIGHT = 400;
const CIRCLE_RADIUS = 30;
const CIRCLE_CENTERS = [
    { x: 100, y: 87.5, color: '#000000', label: 'Noir' },
    { x: 100, y: 162.5, color: '#4CAF50', label: 'Vert' },
    { x: 100, y: 237.5, color: '#FF9800', label: 'Orange' },
    { x: 100, y: 312.5, color: '#F44336', label: 'Rouge' }
];

const CLASS_NAMES = ['Noir', 'Vert', 'Orange', 'Rouge', 'Ailleurs'];
const CLASS_COLORS = ['#000000', '#4CAF50', '#FF9800', '#F44336', '#666666'];

// Global variables
let trainingData = [];
let validationData = [];
let datasetGenerated = false;
let network = null;
let trainingResults = null;
let trainingChart = null;
let isTraining = false;
let trainingTimeout = null;

// ========================================================================
// DATASET GENERATION
// ========================================================================

function generateDataset() {
    showStatus('datasetStatus', 'Génération du dataset...', 'info');
    
    trainingData = [];
    validationData = [];
    
    const pointsPerClass = 300;
    const totalTraining = pointsPerClass * 5;
    
    // Training set
    for (let i = 0; i < totalTraining; i++) {
        const classIndex = Math.floor(i / pointsPerClass);
        trainingData.push(generatePointForClass(classIndex));
    }
    
    // Validation set (20%)
    const validationSize = Math.floor(totalTraining * 0.2);
    const validationPerClass = Math.floor(validationSize / 5);
    for (let i = 0; i < validationSize; i++) {
        const classIndex = Math.floor(i / validationPerClass);
        validationData.push(generatePointForClass(classIndex));
    }
    
    datasetGenerated = true;
    showStatus('datasetStatus', `Dataset: ${trainingData.length} train, ${validationData.length} val`, 'success');
    document.getElementById('previewBtn').disabled = false;
    document.getElementById('visualizeBtn').disabled = false;
    document.getElementById('trainBtn').disabled = false;
}

function generatePointForClass(classIndex) {
    if (classIndex < 4) {
        const circle = CIRCLE_CENTERS[classIndex];
        let x, y;
        do {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * CIRCLE_RADIUS;
            x = circle.x + radius * Math.cos(angle);
            y = circle.y + radius * Math.sin(angle);
        } while (!isPointInCircle(x, y, classIndex));
        
        const xNorm = x / (TABLET_WIDTH - 1);
        const yNorm = y / (TABLET_HEIGHT - 1);
        
        const output = new Array(4).fill(0);
        if (classIndex === 1) output[0] = 1;
        else if (classIndex === 2) output[1] = 1;
        else if (classIndex === 3) output[2] = 1;
        
        return { x: xNorm, y: yNorm, output: output, trueClass: classIndex, original: {x, y} };
    } else {
        let x, y;
        do {
            x = Math.random() * (TABLET_WIDTH - 1);
            y = Math.random() * (TABLET_HEIGHT - 1);
        } while (isPointInAnyCircle(x, y));
        
        const xNorm = x / (TABLET_WIDTH - 1);
        const yNorm = y / (TABLET_HEIGHT - 1);
        
        return { x: xNorm, y: yNorm, output: [0, 0, 0, 0], trueClass: 4, original: {x, y} };
    }
}

function isPointInCircle(x, y, circleIndex) {
    const circle = CIRCLE_CENTERS[circleIndex];
    const dx = x - circle.x;
    const dy = y - circle.y;
    return dx * dx + dy * dy <= CIRCLE_RADIUS * CIRCLE_RADIUS;
}

function isPointInAnyCircle(x, y) {
    for (let i = 0; i < CIRCLE_CENTERS.length; i++) {
        if (isPointInCircle(x, y, i)) return true;
    }
    return false;
}

function showDatasetPreview() {
    if (!datasetGenerated) { alert('Générez le dataset d\'abord.'); return; }
    const preview = trainingData.slice(0, 20);
    let html = 'Premiers 20 échantillons:\n\n';
    preview.forEach((point, i) => {
        html += `${i+1}. (x=${point.x.toFixed(4)}, y=${point.y.toFixed(4)}) → [${point.output.join(', ')}] (${CLASS_NAMES[point.trueClass]})\n`;
    });
    document.getElementById('datasetPreviewContent').textContent = html;
    document.getElementById('datasetPreview').classList.remove('hidden');
}

function visualizeDataset() {
    if (!datasetGenerated) { alert('Générez le dataset d\'abord.'); return; }
    const canvas = document.getElementById('datasetCanvas');
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 400);
    
    ctx.strokeStyle = '#666';
    ctx.setLineDash([2, 2]);
    CIRCLE_CENTERS.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x + 10, circle.y + 10, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.setLineDash([]);
    
    trainingData.slice(0, 500).forEach(point => {
        const color = CLASS_COLORS[point.trueClass];
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.original.x + 10, point.original.y + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
    });
    
    document.getElementById('datasetVisualization').classList.remove('hidden');
}

// ========================================================================
// NEURAL NETWORK
// ========================================================================

class NeuralNetwork {
    constructor(inputSize, hiddenSize, outputSize) {
        this.inputSize = inputSize;
        this.hiddenSize = hiddenSize;
        this.outputSize = outputSize;
        
        this.W1 = this.xavierInitialize(inputSize, hiddenSize);
        this.b1 = new Array(hiddenSize).fill(0);
        this.W2 = this.xavierInitialize(hiddenSize, outputSize);
        this.b2 = new Array(outputSize).fill(0);
        
        // Adam optimizer parameters
        this.mW1 = this.zerosMatrix(inputSize, hiddenSize);
        this.vW1 = this.zerosMatrix(inputSize, hiddenSize);
        this.mb1 = new Array(hiddenSize).fill(0);
        this.vb1 = new Array(hiddenSize).fill(0);
        this.mW2 = this.zerosMatrix(hiddenSize, outputSize);
        this.vW2 = this.zerosMatrix(hiddenSize, outputSize);
        this.mb2 = new Array(outputSize).fill(0);
        this.vb2 = new Array(outputSize).fill(0);
    }
    
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
    
    zerosMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = new Array(cols).fill(0);
        }
        return matrix;
    }
    
    relu(z) { return Math.max(0, z); }
    reluDerivative(z) { return z > 0 ? 1 : 0; }
    sigmoid(z) { return 1 / (1 + Math.exp(-z)); }
    sigmoidDerivative(z) { const s = this.sigmoid(z); return s * (1 - s); }
    
    forward(x, y) {
        const input = [x, y];
        const hidden = new Array(this.hiddenSize).fill(0);
        const z1 = new Array(this.hiddenSize).fill(0);
        
        for (let i = 0; i < this.hiddenSize; i++) {
            z1[i] = this.b1[i];
            for (let j = 0; j < this.inputSize; j++) {
                z1[i] += input[j] * this.W1[j][i];
            }
            hidden[i] = this.relu(z1[i]);
        }
        
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
    
    computeLoss(output, target) {
        let loss = 0;
        for (let i = 0; i < output.length; i++) {
            const p = Math.max(Math.min(output[i], 1 - 1e-15), 1e-15);
            loss -= target[i] * Math.log(p) + (1 - target[i]) * Math.log(1 - p);
        }
        return loss / output.length;
    }
    
    backward(point, output, hidden, z1, z2, dW1, db1, dW2, db2) {
        const delta2 = new Array(this.outputSize).fill(0);
        for (let i = 0; i < this.outputSize; i++) {
            delta2[i] = output[i] - point.output[i];
        }
        
        for (let i = 0; i < this.outputSize; i++) {
            db2[i] += delta2[i] * this.sigmoidDerivative(z2[i]);
            for (let j = 0; j < this.hiddenSize; j++) {
                dW2[j][i] += hidden[j] * delta2[i] * this.sigmoidDerivative(z2[i]);
            }
        }
        
        const delta1 = new Array(this.hiddenSize).fill(0);
        for (let j = 0; j < this.hiddenSize; j++) {
            let sum = 0;
            for (let i = 0; i < this.outputSize; i++) {
                sum += this.W2[j][i] * delta2[i] * this.sigmoidDerivative(z2[i]);
            }
            delta1[j] = sum * this.reluDerivative(z1[j]);
        }
        
        for (let j = 0; j < this.hiddenSize; j++) {
            db1[j] += delta1[j];
            for (let k = 0; k < this.inputSize; k++) {
                const inputVal = k === 0 ? point.x : point.y;
                dW1[k][j] += inputVal * delta1[j];
            }
        }
    }
    
    updateWeights(dW1, db1, dW2, db2, learningRate, t, beta1, beta2, epsilon) {
        for (let i = 0; i < this.inputSize; i++) {
            for (let j = 0; j < this.hiddenSize; j++) {
                this.mW1[i][j] = beta1 * this.mW1[i][j] + (1 - beta1) * dW1[i][j];
                this.vW1[i][j] = beta2 * this.vW1[i][j] + (1 - beta2) * dW1[i][j] * dW1[i][j];
                const mW1Hat = this.mW1[i][j] / (1 - Math.pow(beta1, t));
                const vW1Hat = this.vW1[i][j] / (1 - Math.pow(beta2, t));
                this.W1[i][j] -= learningRate * mW1Hat / (Math.sqrt(vW1Hat) + epsilon);
            }
        }
        
        for (let j = 0; j < this.hiddenSize; j++) {
            this.mb1[j] = beta1 * this.mb1[j] + (1 - beta1) * db1[j];
            this.vb1[j] = beta2 * this.vb1[j] + (1 - beta2) * db1[j] * db1[j];
            const mb1Hat = this.mb1[j] / (1 - Math.pow(beta1, t));
            const vb1Hat = this.vb1[j] / (1 - Math.pow(beta2, t));
            this.b1[j] -= learningRate * mb1Hat / (Math.sqrt(vb1Hat) + epsilon);
        }
        
        for (let i = 0; i < this.hiddenSize; i++) {
            for (let j = 0; j < this.outputSize; j++) {
                this.mW2[i][j] = beta1 * this.mW2[i][j] + (1 - beta1) * dW2[i][j];
                this.vW2[i][j] = beta2 * this.vW2[i][j] + (1 - beta2) * dW2[i][j] * dW2[i][j];
                const mW2Hat = this.mW2[i][j] / (1 - Math.pow(beta1, t));
                const vW2Hat = this.vW2[i][j] / (1 - Math.pow(beta2, t));
                this.W2[i][j] -= learningRate * mW2Hat / (Math.sqrt(vW2Hat) + epsilon);
            }
        }
        
        for (let j = 0; j < this.outputSize; j++) {
            this.mb2[j] = beta1 * this.mb2[j] + (1 - beta1) * db2[j];
            this.vb2[j] = beta2 * this.vb2[j] + (1 - beta2) * db2[j] * db2[j];
            const mb2Hat = this.mb2[j] / (1 - Math.pow(beta1, t));
            const vb2Hat = this.vb2[j] / (1 - Math.pow(beta2, t));
            this.b2[j] -= learningRate * mb2Hat / (Math.sqrt(vb2Hat) + epsilon);
        }
    }
    
    train(data, batchSize, learningRate, epochs, validationData, onEpoch) {
        const beta1 = 0.9;
        const beta2 = 0.999;
        const epsilon = 1e-8;
        
        const results = { trainLoss: [], valLoss: [], trainAccuracy: [], valAccuracy: [], times: [] };
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            this.shuffleArray(data);
            
            let epochTrainLoss = 0;
            let correctTrain = 0;
            
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
            
            if (onEpoch) onEpoch(epoch, epochs, epochTrainLoss, valLoss, trainAccuracy, valAccuracy);
            
            // Early stopping
            if (epoch > 50 && valLoss > results.valLoss[epoch - 1] * 1.01) break;
        }
        
        return results;
    }
    
    evaluate(data) {
        let totalLoss = 0;
        let correct = 0;
        for (const point of data) {
            const { output } = this.forward(point.x, point.y);
            totalLoss += this.computeLoss(output, point.output);
            const predicted = this.outputToClass(output);
            if (predicted === point.trueClass) correct++;
        }
        return { valLoss: totalLoss / data.length, valAccuracy: correct / data.length };
    }
    
    outputToClass(output) {
        const tolerance = 0.5;
        for (let i = 0; i < output.length; i++) {
            if (output[i] > tolerance) return i + 1;
        }
        return 0;
    }
    
    predictClass(x, y) {
        const { output } = this.forward(x, y);
        return this.outputToClass(output);
    }
    
    predict(x, y) {
        const { output } = this.forward(x, y);
        return output;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    toJSON() {
        return { W1: this.W1, b1: this.b1, W2: this.W2, b2: this.b2 };
    }
    
    fromJSON(data) {
        this.W1 = data.W1; this.b1 = data.b1; this.W2 = data.W2; this.b2 = data.b2;
        // Reinitialize Adam parameters
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
// TRAINING UI
// ========================================================================

function trainNetwork() {
    if (!datasetGenerated) { alert('Générez le dataset d\'abord.'); return; }
    if (isTraining) { alert('Entraînement en cours.'); return; }
    
    isTraining = true;
    document.getElementById('trainBtn').disabled = true;
    document.getElementById('stopBtn').disabled = false;
    
    const epochs = parseInt(document.getElementById('epochs').value);
    const batchSize = parseInt(document.getElementById('batchSize').value);
    const learningRate = parseFloat(document.getElementById('learningRate').value);
    
    showStatus('trainingStatus', `Entraînement: ${epochs} epochs, batch ${batchSize}, lr ${learningRate}`, 'info');
    
    network = new NeuralNetwork(2, 12, 4);
    
    const ctx = document.getElementById('trainingChart').getContext('2d');
    if (trainingChart) trainingChart.destroy();
    trainingChart = new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [
            { label: 'Perte Train', data: [], borderColor: '#4CAF50', yAxisID: 'y' },
            { label: 'Perte Val', data: [], borderColor: '#F44336', yAxisID: 'y' },
            { label: 'Acc Train', data: [], borderColor: '#2196F3', yAxisID: 'y1' },
            { label: 'Acc Val', data: [], borderColor: '#FF9800', yAxisID: 'y1' }
        ] },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Perte' } },
                y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: 'Accuracy' }, min: 0, max: 1, grid: { drawOnChartArea: false } }
            }
        }
    });
    
    document.getElementById('metricsContainer').classList.add('hidden');
    const startTime = Date.now();
    
    trainingResults = network.train(
        trainingData, batchSize, learningRate, epochs, validationData,
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

function visualizePredictions() {
    if (!network) { alert('Entraînez le réseau d\'abord.'); return; }
    showStatus('trainingStatus', 'Génération visualisation...', 'info');
    
    const canvas = document.getElementById('predictionsCanvas');
    const ctx = canvas.getContext('2d');
    const gridCanvas = document.createElement('canvas');
    gridCanvas.width = TABLET_WIDTH; gridCanvas.height = TABLET_HEIGHT;
    const gridCtx = gridCanvas.getContext('2d');
    
    const step = 2;
    for (let y = 0; y < TABLET_HEIGHT; y += step) {
        for (let x = 0; x < TABLET_WIDTH; x += step) {
            const xNorm = x / (TABLET_WIDTH - 1);
            const yNorm = y / (TABLET_HEIGHT - 1);
            const predictedClass = network.predictClass(xNorm, yNorm);
            gridCtx.fillStyle = CLASS_COLORS[predictedClass];
            gridCtx.fillRect(x, y, step, step);
        }
    }
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 200, 400);
    ctx.drawImage(gridCanvas, 10, 10, 200, 400);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.setLineDash([2, 2]);
    ctx.globalAlpha = 0.5;
    CIRCLE_CENTERS.forEach(circle => {
        ctx.beginPath();
        ctx.arc(circle.x + 10, circle.y + 10, CIRCLE_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
    });
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    
    for (let i = 0; i < CLASS_NAMES.length; i++) {
        ctx.fillStyle = CLASS_COLORS[i];
        ctx.fillRect(230, 50 + i * 20, 15, 15);
        ctx.fillStyle = '#333';
        ctx.fillText(CLASS_NAMES[i], 250, 60 + i * 20);
    }
    
    document.getElementById('predictionsVisualization').classList.remove('hidden');
    showStatus('trainingStatus', 'Visualisation générée.', 'success');
}

// ========================================================================
// SPECIFIC POINT TEST
// ========================================================================

function testSpecificPoint() {
    document.getElementById('specificPointTest').classList.remove('hidden');
}

function runSpecificPointTest() {
    const x = parseInt(document.getElementById('testX').value);
    const y = parseInt(document.getElementById('testY').value);
    const xNorm = x / (TABLET_WIDTH - 1);
    const yNorm = y / (TABLET_HEIGHT - 1);
    
    let trueClass = 4;
    for (let i = 0; i < CIRCLE_CENTERS.length; i++) {
        if (isPointInCircle(x, y, i)) { trueClass = i; break; }
    }
    
    const output = network.predict(xNorm, yNorm);
    const predictedClass = network.predictClass(xNorm, yNorm);
    
    const result = document.getElementById('testResult');
    result.innerHTML = `
        <div class="important-box">
            <p><strong>Coordonnées:</strong> (${x}, ${y})</p>
            <p><strong>Vraie classe:</strong> <span style="color:${CLASS_COLORS[trueClass]};font-weight:bold">${CLASS_NAMES[trueClass]}</span></p>
            <p><strong>Prédite:</strong> <span style="color:${CLASS_COLORS[predictedClass]};font-weight:bold">${CLASS_NAMES[predictedClass]}</span></p>
            <p><strong>Sortie:</strong> [${output.map(v => v.toFixed(4)).join(', ')}]</p>
            <p><strong>Résultat:</strong> ${trueClass === predictedClass ? '<span style="color:green;font-weight:bold">✓ Correct</span>' : '<span style="color:red;font-weight:bold">✗ Incorrect</span>'}</p>
        </div>
    `;
}

// ========================================================================
// CONFUSION MATRIX
// ========================================================================

function computeConfusionMatrix() {
    if (!network) { alert('Entraînez le réseau d\'abord.'); return; }
    
    const nClasses = 5;
    const matrix = [];
    for (let i = 0; i < nClasses; i++) matrix[i] = new Array(nClasses).fill(0);
    
    for (const point of validationData) {
        const predictedClass = network.predictClass(point.x, point.y);
        matrix[point.trueClass][predictedClass]++;
    }
    
    let html = '<table><tr><th>Vrai\\Class</th>';
    for (let i = 0; i < nClasses; i++) html += `<th>${CLASS_NAMES[i]}</th>`;
    html += '</tr>';
    
    for (let i = 0; i < nClasses; i++) {
        html += `<tr><th>${CLASS_NAMES[i]}</th>`;
        for (let j = 0; j < nClasses; j++) html += `<td>${matrix[i][j]}</td>`;
        html += '</tr>';
    }
    html += '</table><h4>Précision par classe:</h4><ul>';
    
    for (let i = 0; i < nClasses; i++) {
        const total = matrix[i].reduce((a, b) => a + b, 0);
        const correct = matrix[i][i];
        const accuracy = total > 0 ? (correct / total * 100).toFixed(2) : 0;
        html += `<li><strong>${CLASS_NAMES[i]}</strong>: ${correct}/${total} (${accuracy}%)</li>`;
    }
    html += '</ul>';
    
    const total = validationData.length;
    let correct = 0; for (let i = 0; i < nClasses; i++) correct += matrix[i][i];
    html += `<p><strong>Accuracy globale:</strong> ${correct}/${total} (${(correct/total*100).toFixed(2)}%)</p>`;
    
    document.getElementById('confusionMatrixContainer').innerHTML = html;
    document.getElementById('confusionMatrixContainer').classList.remove('hidden');
}

// ========================================================================
// EXPORT/IMPORT
// ========================================================================

function exportModel() {
    if (!network) { alert('Entraînez le réseau d\'abord.'); return; }
    const json = JSON.stringify(network.toJSON(), null, 2);
    document.getElementById('modelJson').value = json;
    document.getElementById('modelExport').classList.remove('hidden');
}

function copyModelToClipboard() {
    const textarea = document.getElementById('modelJson');
    textarea.select();
    document.execCommand('copy');
    showStatus('trainingStatus', 'Modèle copié!', 'success');
}

function importModel() {
    document.getElementById('modelFileInput').click();
}

function loadModelFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const model = JSON.parse(e.target.result);
            network = new NeuralNetwork(2, 12, 4);
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

function showFullNetworkCode() {
    const code = `
// ========================================================================
// NEURAL NETWORK MLP 2-12-4
// ReLU (hidden) + Sigmoid (output)
// ========================================================================

class NeuralNetwork {
    constructor(inputSize, hiddenSize, outputSize) {
        // Xavier/Glorot initialization
        this.W1 = this.xavierInit(inputSize, hiddenSize);
        this.b1 = new Array(hiddenSize).fill(0);
        this.W2 = this.xavierInit(hiddenSize, outputSize);
        this.b2 = new Array(outputSize).fill(0);
        
        // Adam optimizer state
        this.mW1 = this.zerosMatrix(inputSize, hiddenSize);
        this.vW1 = this.zerosMatrix(inputSize, hiddenSize);
        // ... (mb1, vb1, mW2, vW2, mb2, vb2)
    }
    
    xavierInit(rows, cols) {
        const scale = Math.sqrt(2 / (rows + cols));
        return Array.from({length: rows}, () =>
            Array.from({length: cols}, () => (Math.random() - 0.5) * 2 * scale)
        );
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
        
        // Output layer (Sigmoid)
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
    
    // Training with Adam
    train(data, batchSize, lr, epochs, valData) {
        const beta1 = 0.9, beta2 = 0.999, epsilon = 1e-8;
        
        for (let epoch = 0; epoch < epochs; epoch++) {
            // Forward, backward, update weights
            // ... (implemented in network.js)
        }
    }
}
    `;
    document.getElementById('fullNetworkCode').innerHTML = '<div class="code-block">' + code + '</div>';
    document.getElementById('fullNetworkCode').classList.remove('hidden');
}

// ========================================================================
// UTILITY
// ========================================================================

function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = 'status';
    if (type === 'success') el.classList.add('success');
    else if (type === 'error') el.classList.add('error');
    else el.classList.add('info');
    el.style.display = 'block';
}

// Initialize network code display
document.getElementById('networkCode').textContent = `
// Réseau MLP 2-12-4
// - Entrée: 2 neurones (x, y) normalisés dans [0, 1]
// - Cachée: 12 neurones avec activation ReLU
// - Sortie: 4 neurones avec activation Sigmoïde
// 
// Fonction de coût: Binary Cross-Entropy
// Optimiseur: Adam (β1=0.9, β2=0.999, ε=1e-8)
// 
// Architecture:
//   forward(x, y) → hidden[12] → output[4]
//   backward() → mise à jour des poids avec Adam
`;

// Console log for debugging
console.log('Feux tricolores - Network loaded successfully!');
