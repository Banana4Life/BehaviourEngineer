
function clickToElement(clickEvent, elem) {
    let [x, y] = getElementContentPos(elem);
    return [clickEvent.clientX - x, clickEvent.clientY - y];
}

function getElementContentPos(elem) {
    let leftBorder = parseFloat(window.getComputedStyle(elem, null).getPropertyValue("border-left-width"));
    let topBorder = parseFloat(window.getComputedStyle(elem, null).getPropertyValue("border-top-width"));
    let elemRect = elem.getBoundingClientRect();
    return [elemRect.left + leftBorder, elemRect.top + topBorder];
}