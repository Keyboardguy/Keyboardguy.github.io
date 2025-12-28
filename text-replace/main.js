const textArea = document.getElementById("inputText");
const replaceInput = document.getElementById("replace");
const withInput = document.getElementById("with");
const previousValues = [];

function replaceText() {
    const replaceWord = replaceInput.value;
    const withWord = withInput.value;
    previousValues.push(textArea.value);
    const regex = new RegExp(RegExp.escape(replaceWord), "g");
    const newText = textArea.value.replace(regex, withWord);
    textArea.value = newText;

    makeUndoButton();
}

function copyText() {
    textArea.select();
}

function makeUndoButton() {
    if (document.getElementById("undoButton")) {
        return;
    }

    const undoButton = document.createElement("button");
    undoButton.innerText = "Undo";
    undoButton.id = "undoButton";   
    undoButton.onclick = undoReplace;
    document.body.appendChild(undoButton);
}

function undoReplace() {
    if (previousValues.length > 0) {
        const lastValue = previousValues.pop();
        textArea.value = lastValue;
    }

    if (previousValues.length === 0) {
        const undoButton = document.getElementById("undoButton");
        if (undoButton) {
            undoButton.remove();
        }
    }
}

