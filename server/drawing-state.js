const operations = [];
const redoOperations = [];
function addOperation(operation) {

    operations.push(operation);
    redoOperations.length = 0;
}

function undo() {

    if (operations.length === 0) {
        return;
    }

    const operation = operations.pop();

    redoOperations.push(operation);
}

function redo() {

    if (redoOperations.length === 0) {
        return;
    }
    const operation = redoOperations.pop();
    operations.push(operation);
}

function getOperations() {
    return operations;
}

module.exports = {
    addOperation,
    undo,
    redo,
    getOperations
};