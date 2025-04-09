export const schema = {
    'Sin': {
        name: 'Sin',
        inputs: 1,
        outputs: 1,
        type: 'standard',
        data: {
            frequency: '0'
        }
    },
    'Squ': {
        name: 'Squ',
        inputs: 1,
        outputs: 1,
        type: 'standard',
        data: {
            frequency: '0'
        }
    },
    'Tri': {
        name: 'Tri',
        inputs: 1,
        outputs: 1,
        type: 'standard',
        data: {
            frequency: '0'
        }
    },
    'Saw': {
        name: 'Saw',
        inputs: 1,
        outputs: 1,
        type: 'standard',
        data: {
            frequency: '0'
        }
    },
    'Add': {
        name: 'Add',
        inputs: 2,
        outputs: 1,
        type: 'standard',
        data: {
            frequency: '0'
        }
    },
    'Con': {
        name: 'Constant',
        inputs: 0,
        outputs: 1,
        type: 'typed-integer',
        data: {
            int: 'integer',
        }
    },
    'Mul': {
        name: 'Multiply',
        inputs: 2,
        outputs: 1,
        type: 'standard'
    },
    'Div': {
        name: 'Divide',
        inputs: 2,
        outputs: 1,
        type: 'standard'
    },
    'Midi': {
        name: 'MIDI Input',
        inputs: 0,
        outputs: 1,
        type: 'standard',
        max: 1,
    },
    'Seq': {
        name: 'Sequencer',
        inputs: 0,
        outputs: 1,
        type: 'standard'
    },
    'Filter': {
        name: 'Filter',
        inputs: 1,
        outputs: 1,
        type: 'standard'
    },
    'ADSR': {
        name: 'ADSR',
        inputs: 4,
        outputs: 1,
        type: 'standard'
    },

    'Out': {
        name: 'Audio Output',
        inputs: 1,
        outputs: 0,
        type: 'standard',
        max: 1
    }
};
