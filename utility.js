//This will check if a given module is in some way connected to the audio output (for use by MIDI inputs and perhaps others)
export function isConnected(graph, givenNode){
    // Traverse graph, checking if the given node is a part of the graph and if it connected directly to the audio output.

}

export function mapToObject(map) {
    return Array.from(map.entries()).reduce((obj, [key, value]) => {
        // Clone the value and remove 'dropIndicator' if it exists inside
        const { dropIndicator, ...cleanValue } = value;  
        obj[key] = cleanValue;  
        return obj;
    }, {});
}