export class AudioGraph {
    constructor(sampleRate = 48000) {
        this.nodes = [];
        this.sampleRate = sampleRate;
        this.masterGain = 0.3;
    }

    addNode(type, options) {
        if (type === 'Sine') {
            this.nodes.push(new SineOscillator(options.frequency));
        }
        if (type === 'Triangle') {
            this.nodes.push(new TriangleOscillator(options.frequency));
        }
        if (type === 'Sawtooth') {
            this.nodes.push(new SawtoothOscillator(options.frequency));
        }
        if (type === 'Square') {
            this.nodes.push(new SquareOscillator(options.frequency));
        }
        if (type === 'Addition') {
            const { node1Index, node2Index } = options;
            this.nodes.push(new Addition(this.nodes[node1Index], this.nodes[node2Index]));
        }
        if (type === 'Constant') {
            const { node1Index } = options;
            this.nodes.push(new Constant(this.nodes[node1Index]));
        }
        if (type === 'Multiply') {
            const { node1Index, node2Index } = options;
            this.nodes.push(new Multiply(this.nodes[node1Index], this.nodes[node2Index]));
        }
        if (type === 'Division') {
            const { node1Index, node2Index } = options;
            this.nodes.push(new Divide(this.nodes[node1Index], this.nodes[node2Index]));
        }
    }

    removeNode(index) {
        if (index >= 0 && index < this.nodes.length) {
            this.nodes.splice(index, 1);
        }
    }

    reset() {
        this.nodes = [];
    }

    genSample(time) {
        if (this.nodes.length === 0) {
            return 0;
        }
        const outputNode = this.nodes[this.nodes.length - 1];
        outputNode.update(time);
        return outputNode.output * this.masterGain;
    }

    compileGraph(modules, graph) {
        console.log(modules);
        console.log(graph);
    }
}

class SineOscillator {
    constructor(node1, frequency) {
        this.node1 = node1;
        this.frequency = 1;
        this.output = 0;
    }

    update(time) {
        this.frequency = this.frequency;
        this.output = (Math.sin(2 * Math.PI * this.frequency * time) + 1)/2;
    }
}

class TriangleOscillator {
    constructor(frequency = 440) {
        this.frequency = frequency;
        this.output = 0;
    }

    update(time) {
        const phase = (time * this.frequency) % 1;
        this.output = ((phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase) + 1)/2;
    }
}

class SawtoothOscillator {
    constructor(frequency = 440) {
        this.frequency = frequency;
        this.output = 0;
    }

    update(time) {
        const phase = (time * this.frequency) % 1;
        this.output = (2 * phase - 1 + 1) / 2;
    }
}

class SquareOscillator {
    constructor(frequency = 440) {
        this.frequency = frequency;
        this.output = 0;
    }

    update(time) {
        const phase = (time * this.frequency) % 1;
        this.output = (phase < 0.5 ? 1 : -1 + 1) / 2;
    }
}


class Addition {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.output = 0;
    }

    update(time) {
        this.node1.update(time);
        this.node2.update(time);
        this.output = this.node1.output + this.node2.output;
    }
}

class Constant {
    constructor(myInteger) {
        this.myInteger = myInteger;
        this.output = 0;
    }
    update(time) {
        this.output = this.myInteger;
    }
}

class Multiply {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.output = 0;
    }

    update(time) {
        this.node1.update(time);
        this.node2.update(time);
        this.output = this.node1.output * this.node2.output;
    }
}

class Divide {
    constructor(node1, node2) {
        this.node1 = node1;
        this.node2 = node2;
        this.output = 0;
    }

    update(time) {
        this.node1.update(time);
        this.node2.update(time);
        this.output = this.node1.output / this.node2.output;
    }
}

