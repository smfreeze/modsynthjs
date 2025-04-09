import { schema } from './schema.js';
import { mapToObject } from './utility.js';


document.addEventListener('DOMContentLoaded', async () => {
    const sidebar = document.getElementById('sidebar');
    const indicator = document.getElementById('indicator');
    const modules = document.querySelectorAll('.modules div');
    const editorArea = document.querySelector('.editor-area');
    const playButton = document.getElementById('playBtn');

    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule('processor.js');
    const workletNode = new AudioWorkletNode(audioContext, 'main-processor');
    workletNode.connect(audioContext.destination);

    const activeModules = new Map(); // Store which modules are on the editor area as well as their connector indicators to access and any other information
    const connections = new Map(); // Store the connections between modules (does not store the port that the connections have, this needs to be ammended)
    let selectedModule = null;
    let clickedConnection = null;
    let nodeCounter = 0;
    let isDragging = false;
    let offsetX = 0, offsetY = 0;

    let playing = false; // Is the audio worklet active

    // When user tries to leave page, ensure they want to:
    window.addEventListener('beforeunload', (event) => {
        event.preventDefault();
    });

    // Sidebar toggle
    indicator.addEventListener('click', () => {
        sidebar.classList.toggle('expanded');
        indicator.textContent = sidebar.classList.contains('expanded') ? '<' : '>';
    });

    // Make sidebar modules draggable
    modules.forEach(module => {
        module.setAttribute('draggable', true);
        module.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', module.id);
            e.dataTransfer.effectAllowed = 'move';
        });
    });

    // Dragging over the editor
    editorArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    });

    // Dropping a module in the editor
    editorArea.addEventListener('drop', (e) => {
        e.preventDefault();
        const moduleId = e.dataTransfer.getData('text/plain');
        if (!schema[moduleId]) return;
      
        try {
            let count = 0;
            activeModules.forEach(({ moduleId: activeModuleId }) => {
                if (activeModuleId === moduleId) {
                    count++;
                }
            });
            if (count >= schema[moduleId].max) {
                return;
            }
        } catch {}
    
        const nodeId = `node-${nodeCounter++}`;
        const moduleName = schema[moduleId].name;
    
        const dropIndicator = document.createElement('div');
        dropIndicator.classList.add('module-node');
        dropIndicator.style.left = `${e.clientX - editorArea.getBoundingClientRect().left - 25}px`;
        dropIndicator.style.top = `${e.clientY - editorArea.getBoundingClientRect().top - 15}px`;
        dropIndicator.dataset.nodeId = nodeId;
    
        // Add the module name
        const moduleNameElement = document.createElement('div');
        moduleNameElement.classList.add('module-name');
        moduleNameElement.textContent = moduleName;
        dropIndicator.appendChild(moduleNameElement);
        moduleNameElement.addEventListener
        
        // The below makes it such that if you hover over the title, it changes to question marks and if you click it, it redirects you to the module help page for that module:

        moduleNameElement.addEventListener('click', async () => {
            window.location.href = 'modules/' + moduleName.replace(/\s+/g, '').toLowerCase() + '.html';
        });

        moduleNameElement.addEventListener('mouseenter', () => {
            moduleNameElement.textContent = '?'.repeat(moduleName.length);
            moduleNameElement.style.cursor = 'pointer';
        });
        
        moduleNameElement.addEventListener('mouseleave', () => {
            moduleNameElement.textContent = moduleName;
        });

        // Input box adding for modules of class 'typed':
        if (schema[moduleId].type === 'typed-integer') {
            const inputBoxContainer = document.createElement('div');
            inputBoxContainer.classList.add('input-box-container');
    
            const inputBox = document.createElement('input');
            inputBox.type = 'number';
            inputBox.placeholder = '';
            inputBox.classList.add('module-input');
            inputBoxContainer.appendChild(inputBox);
            
            dropIndicator.appendChild(inputBoxContainer);
        }
    
        activeModules.set(nodeId, { moduleId, dropIndicator });
    
        // Create input and output nodes dynamically
        createIOPorts(dropIndicator, nodeId, moduleId);
        addDraggingFunctionality(dropIndicator);
        editorArea.appendChild(dropIndicator);
    });
    
    

    function createIOPorts(dropIndicator, nodeId, moduleId) {
        if (schema[moduleId].inputs > 0) {
            const inputSpacing = 100 / (schema[moduleId].inputs + 1);
            for (let i = 0; i < schema[moduleId].inputs; i++) {
                const inputNode = document.createElement('div');
                inputNode.classList.add('input-node');
                inputNode.style.top = `${inputSpacing * (i + 1)}%`;
                dropIndicator.appendChild(inputNode);

                inputNode.addEventListener('click', (e) => {
                    e.stopPropagation();
                    handleConnection(nodeId, inputNode);
                });
            }
        }

        if (schema[moduleId].outputs > 0) {
            const outputSpacing = 100 / (schema[moduleId].outputs + 1);
            for (let i = 0; i < schema[moduleId].outputs; i++) {
                const outputNode = document.createElement('div');
                outputNode.classList.add('output-node');
                outputNode.style.top = `${outputSpacing * (i + 1)}%`;
                dropIndicator.appendChild(outputNode);

                outputNode.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectOutput(nodeId, outputNode);
                });
            }
        }
    }

    function handleConnection(nodeId, inputNode) {
        if (clickedConnection) {
            if (connections.has(clickedConnection)) {
                console.log(`Removed previous connection from ${clickedConnection}`);
                const prevInput = connections.get(clickedConnection);
    
                // Remove the previous connection visually
                document.querySelector(`[data-node-id="${prevInput}"] .input-node.clicked`)?.classList.remove('clicked');
    
                // Delete the previous connection
                connections.delete(clickedConnection);
            }
    
            console.log(`Connected ${clickedConnection} to ${nodeId}`);
    
            // Set the new connection
            connections.set(clickedConnection, nodeId);
    
            // Add the clicked state visually to the input node
            document.querySelector(`[data-node-id="${clickedConnection}"] .output-node.clicked`)?.classList.add('clicked');
            inputNode.classList.add('clicked');
    
            clickedConnection = null;  // Reset the clicked connection state
        }
    
        generateGraph();  // Update the graph state
    }

    function selectOutput(nodeId, outputNode) {
        // Prevent self-connection: Do not allow a node to connect to itself
        if (clickedConnection === nodeId) {
            console.log(`Cannot connect node ${nodeId} to itself.`);
            outputNode.classList.remove('clicked');  // Remove visual clicked state if self-connection is attempted
            clickedConnection = null;  // Deselect the current node
            return;
        }
    
        // If the output is already clicked, reset everything (disconnect it visually)
        if (clickedConnection === nodeId) {
            console.log(`Deselected output from ${nodeId}`);
    
            // Remove the old connection (if any) visually and from the connections map
            const prevInputNode = document.querySelector(`[data-node-id="${connections.get(clickedConnection)}"] .input-node.clicked`);
            if (prevInputNode) {
                prevInputNode.classList.remove('clicked');  // Un-highlight the previously connected input port
            }
    
            // Remove the connection from the connections map
            connections.delete(clickedConnection);
    
            // Reset the clicked class on the output node
            outputNode.classList.remove('clicked');
    
            clickedConnection = null;
            return;
        }
    
        // If another output was previously clicked, reset it first
        if (clickedConnection !== null) {
            const prevOutputNode = document.querySelector(`[data-node-id="${clickedConnection}"] .output-node.clicked`);
            if (prevOutputNode) {
                prevOutputNode.classList.remove('clicked');
            }
            // Reset the previously connected input port
            const prevInputNode = document.querySelector(`[data-node-id="${connections.get(clickedConnection)}"] .input-node.clicked`);
            if (prevInputNode) {
                prevInputNode.classList.remove('clicked');
            }
        }
    
        // Now set the new output connection
        clickedConnection = nodeId;
        console.log(`Selected output from ${nodeId}`);
    
        // Add the clicked state visually to the output node
        outputNode.classList.add('clicked');
    }

    function addDraggingFunctionality(dropIndicator) {
        dropIndicator.addEventListener('mousedown', (e) => {
            isDragging = true;
            selectedModule = dropIndicator;
            offsetX = e.clientX - dropIndicator.getBoundingClientRect().left;
            offsetY = e.clientY - dropIndicator.getBoundingClientRect().top;

            document.querySelectorAll('.module-node').forEach(node => node.classList.remove('selected'));
            dropIndicator.classList.add('selected');
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && selectedModule) {
                selectedModule.style.left = `${e.clientX - editorArea.getBoundingClientRect().left - offsetX}px`;
                selectedModule.style.top = `${e.clientY - editorArea.getBoundingClientRect().top - offsetY}px`;
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' && selectedModule) {
                deleteNode(selectedModule.dataset.nodeId);
                selectedModule = null;
            }
        });
    }


    // To be called whenever a change is made to the graph.
    function generateGraph() {

        // Clear state before generating the new  graph
        workletNode.port.postMessage({ command: 'reset' });

        // Push the graph to the audioworklet which will then call the audiograph.js for compilation
        workletNode.port.postMessage({
            command: 'pushGraph',
            args: {
                module: mapToObject(activeModules),
                graph: mapToObject(connections)
            }
        });


        /*
        const audioSources = [];
    
        connections.forEach((target, source) => {
            if (target === 'audio-out' && schema[activeModules.get(source)?.moduleId]?.data?.frequency) {
                audioSources.push(source);
            }
        });
    
        if (audioSources.length === 0) {
            console.log('No oscillators connected to Audio Output.');
            return;
        }
    
        audioSources.forEach(nodeId => {
            const moduleId = activeModules.get(nodeId)?.moduleId;
            const nodeInfo = schema[moduleId];
    
            if (!nodeInfo || !nodeInfo.data?.frequency) return;
    
            console.log(`Adding ${nodeInfo.name} to AudioGraph`);
    
            workletNode.port.postMessage({
                command: 'addNode',
                args: {
                    type: nodeInfo.name.replace(' ', '') + 'Oscillator',
                    frequency: nodeInfo.data.frequency,
                },
            });
        });
        */
       
    }
    
    function deleteNode(nodeId) {
        if (!activeModules.has(nodeId)) return;
    
        // Remove the visual node element from the editor
        const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeElement) {
            nodeElement.remove();
        }
    
        let affectedNodes = new Set();
    
        // Track nodes that were connected to this node
        connections.forEach((target, source) => {
            if (source === nodeId || target === nodeId) {
                affectedNodes.add(source);
                affectedNodes.add(target);
                if (target === 'audio-out') {
                    wasConnectedToAudioOut = true;
                }
            }
        });
    
        // Remove only connections associated with this node
        affectedNodes.forEach((affectedNode) => {
            connections.delete(affectedNode);
        });
    
        // Remove "clicked" class from input and output ports of all affected nodes
        affectedNodes.forEach((affectedNodeId) => {
            const affectedNode = document.querySelector(`[data-node-id="${affectedNodeId}"]`);
            if (affectedNode) {
                affectedNode.querySelectorAll('.input-node').forEach(inputNode => {
                    inputNode.classList.remove('clicked');
                });
                affectedNode.querySelectorAll('.output-node').forEach(outputNode => {
                    outputNode.classList.remove('clicked');
                });
            }
        });
        
        // Remove from active modules
        activeModules.delete(nodeId);
    
        // Update the graph dynamically
        generateGraph();
    }

    // Play button logs connections leading to audio output
    playButton.addEventListener('click', async () => {
        playPause()
        console.log(activeModules)
        console.log(connections)
    });

    document.getElementById('helpBtn').addEventListener('click', () => {
        window.location.href = 'help.html';
    });

    document.getElementById('examplesBtn').addEventListener('click', () => {
        window.location.href = 'examples.html';
    });
    

    async function playPause() {
        if (audioContext.state === 'suspended' && playing === false) {
            await audioContext.resume();
            playing = true;
            playButton.textContent = "Stop"; // Change text to "Stop"
        } else {
            await audioContext.suspend();
            playing = false;
            playButton.textContent = "Play"; // Change text back to "Play"
        }
    
        console.log('Active Modules:', Array.from(activeModules.keys()));
        console.log('Connections:', Array.from(connections.entries()));
        generateGraph();
    }
    
    const saveButton = document.getElementById('saveBtn');
    const loadButton = document.getElementById('loadBtn');
    const fileInput = document.createElement('input');  // Create hidden file input
    fileInput.type = 'file';
    fileInput.accept = '.json';

    // Save project state to a downloadable file
    saveButton.addEventListener('click', () => {
        const projectData = {
            modules: Array.from(activeModules.entries()).map(([nodeId, { moduleId, dropIndicator }]) => ({
                nodeId,
                moduleId,
                position: {
                    left: dropIndicator.style.left,
                    top: dropIndicator.style.top
                }
            })),
            connections: Array.from(connections.entries()),
        };

        const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'audio_project.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Load project state from a file
    loadButton.addEventListener('click', () => fileInput.click()); // Open file dialog when load button is clicked

    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
    
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const { modules, connections: savedConnections } = JSON.parse(e.target.result);
    
                // Clear current state
                editorArea.innerHTML = '';
                activeModules.clear();
                connections.clear();
    
                // Restore modules
                modules.forEach(({ nodeId, moduleId, position }) => {
                    const dropIndicator = document.createElement('div');
                    dropIndicator.textContent = schema[moduleId].name;
                    dropIndicator.classList.add('module-node');
                    dropIndicator.style.left = position.left;
                    dropIndicator.style.top = position.top;
                    dropIndicator.dataset.nodeId = nodeId;
    
                    activeModules.set(nodeId, { moduleId, dropIndicator });
    
                    createIOPorts(dropIndicator, nodeId, moduleId);
                    addDraggingFunctionality(dropIndicator);
                    editorArea.appendChild(dropIndicator);
                });
    
                // Restore connections
                savedConnections.forEach(([source, target]) => {
                    connections.set(source, target);
    
                    // Find the input and output nodes and set their visual state to "clicked"
                    const sourceNode = document.querySelector(`[data-node-id="${source}"]`);
                    const targetNode = document.querySelector(`[data-node-id="${target}"]`);
    
                    if (sourceNode) {
                        const outputNode = sourceNode.querySelector('.output-node');
                        if (outputNode) {
                            outputNode.classList.add('clicked');
                        }
                    }
    
                    if (targetNode) {
                        const inputNode = targetNode.querySelector('.input-node');
                        if (inputNode) {
                            inputNode.classList.add('clicked');
                        }
                    }
                });
    
                generateGraph();
                alert('Project loaded successfully!');
            } catch (error) {
                alert('Error loading file. Please ensure it is a valid project file.');
                console.error(error);
            }
        };
    
        reader.readAsText(file);
    });
    



});