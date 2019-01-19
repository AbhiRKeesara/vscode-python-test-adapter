
export function empty<T>(x: T[]) {
    return !x || !x.length;
}

export function getTestOutputBySplittingString(output: string, stringToSplitWith: string): string {
    const split = output.split(stringToSplitWith);
    return split && split.pop() || '';
}

export function groupBy<T, U>(values: T[], key: (v: T) => U) {
    return values.reduce((accumulator, x) => {
        if (accumulator.has(key(x))) {
            accumulator.get(key(x))!.push(x);
        } else {
            accumulator.set(key(x), [x]);
        }
        return accumulator;
    }, new Map<U, T[]>());
}

export function ensureDifferentLabels(values: Array<{ id: string, label: string }>, idSeparator: string) {
    /* Assuming label is last part of id */
    const notAllIdsEndsWithLabel = values.some(v => !v.id.endsWith(v.label));
    if (notAllIdsEndsWithLabel) {
        return;
    }
    const updatedLabels = mapUniqueLabelsById(values.map(v => ({ ...v, prefix: '' })), idSeparator);
    values.filter(v => updatedLabels.has(v.id))
        .filter(v => updatedLabels.get(v.id)!.prefix)
        .forEach(v => {
            v.label = `${v.label} (${updatedLabels.get(v.id)!.prefix})`;
        });
}

function mapUniqueLabelsById(
    values: Array<{ id: string, prefix: string | undefined, label: string }>,
    idSeparator: string
) {
    const uniqueLabelsById = new Map<string, { id: string, prefix: string | undefined, label: string }>();
    const labelGroups = groupBy(values, v => prependPrefix(v.prefix, idSeparator, v.label));
    Array.from(labelGroups.entries())
        .filter(([_, group]) => group.length > 1)
        .map(([label, group]) => {
            const extendedPrefixGroup = group.map(v => {
                const idPrefix = v.id.substring(0, v.id.length - label.length - idSeparator.length);
                const labelPrefix = extractLastElement(idPrefix.split(idSeparator));
                return {
                    id: v.id,
                    prefix: v.prefix ? prependPrefix(labelPrefix, idSeparator, v.prefix) : labelPrefix,
                    label: v.label,
                };
            });
            extendedPrefixGroup.forEach(v => uniqueLabelsById.set(v.id, v));
            mapUniqueLabelsById(extendedPrefixGroup, idSeparator).forEach((v, k) => uniqueLabelsById.set(k, v));
        });
    return uniqueLabelsById;
}

function prependPrefix(prefix: string | undefined, idSeparator: string, value: string) {
    return (prefix ? prefix + idSeparator : '') + value;
}

function extractLastElement(values: string[]) {
    if (empty(values)) {
        return undefined;
    }
    return values[values.length - 1];
}
