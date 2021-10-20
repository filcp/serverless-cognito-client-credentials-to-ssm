export const isJsonString = (str: string): boolean => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
};

export const assign = <T>(t: T, properties: Partial<T>): T => {
    return Object.assign(t, properties);
};
