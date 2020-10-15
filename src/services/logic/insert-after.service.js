
export const insertAfter = (parentElement, previousSiblingElement, incomingElement) => {
    if (!previousSiblingElement) {
        if (parentElement.children.length === 0) {
            parentElement.appendChild(incomingElement);
        }
        else {
            parentElement.insertBefore(incomingElement, parentElement.children[0]);
        }
        return;
    }
    const hasNextElement = previousSiblingElement.nextSibling !== null;
    if (hasNextElement) {
        parentElement.insertBefore(incomingElement, previousSiblingElement.nextSibling);
    }
    else {
        parentElement.appendChild(incomingElement);
    }
}
