
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

function cumulativeDensity(weightsList)
{
    let cdf = new Array(weightsList.length);
    let prev = 0.0;
    for (let i = 0; i < weightsList.length; i++)
    {
        prev += weightsList[i];
        cdf[i] = prev;
    }

    return cdf;
}

function binaryFindSelectedValue(valuesList, cdfList, lower, upper, selection)
{
    let mid = Math.floor((lower + upper) / 2.0);

    let lowerEdge;
    if (mid === 0)
    {
        lowerEdge = 0.0;
    }
    else
    {
        lowerEdge = cdfList[mid - 1];
    }
    let upperEdge = cdfList[mid];

    if (selection < lowerEdge)
    {
        return binaryFindSelectedValue(valuesList, cdfList, lower, mid, selection);
    }

    if (selection >= upperEdge)
    {
        return binaryFindSelectedValue(valuesList, cdfList, mid, upper, selection);
    }

    return valuesList[mid];
}

function chooseWeighted(weightsList, valuesList, selection)
{
    let cdfList = cumulativeDensity(weightsList);
    let sum = cdfList[cdfList.length - 1];

    return binaryFindSelectedValue(valuesList, cdfList, 0, valuesList.length, selection * sum);
}

function chooseRandomWeighted(weightsList, valuesList)
{
    return chooseWeighted(weightsList, valuesList, Math.random());
}

function touches(particle1, particle2, distanceSqr, range = 0) {
    return distanceSqr <= sqr(particle1.size /2 + particle2.size/2 + range)
}

/**
 * Shuffles array in place.
 * @param {Array} a items An array containing the items.
 */
function shuffle(a) {
    let j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}