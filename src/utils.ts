export function jsonParse<T>(jsonString: string): T {
	return <T>JSON.parse(jsonString);
}
export function jsonString(jsonObject: any, pretty = false): string {
	if (pretty) return JSON.stringify(jsonObject, null, 2);
	else return JSON.stringify(jsonObject);
}
