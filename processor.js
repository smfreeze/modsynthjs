import { AudioGraph } from './audiograph.js';

class MainProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.audioGraph = new AudioGraph(sampleRate);
        this.time = 0;

        this.port.onmessage = (event) => {
            const { command, args } = event.data;
            /*
            if (command === 'addNode') {
                this.audioGraph.addNode(args.type, args);
            } 
            if (command === 'removeNode') {
                this.audioGraph.removeNode(args.index);
            }
            */
            if (command === 'reset') {
                this.audioGraph.reset();
            }
            if (command === 'pushGraph') {
                this.audioGraph.compileGraph(args.modules, args.graph)
            }
        };
    }

    process(inputs, outputs) {
        const output = outputs[0];
        const sampleDuration = 1 / this.audioGraph.sampleRate;

        for (let i = 0; i < output[0].length; i++) {
            const sample = this.audioGraph.genSample(this.time);
            for (let channel = 0; channel < output.length; channel++) {
                output[channel][i] = sample;
            }
            this.time += sampleDuration;
        }

        return true; // Keep processor active
    }
}

registerProcessor('main-processor', MainProcessor);
