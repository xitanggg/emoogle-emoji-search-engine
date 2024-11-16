/**
 * Pre-process a keyword string to help with search
 *
 * It performs the following following operations:
 * - Remove “”":;(),.!? characters
 * - Replace - with space
 * - Replace ’ with '
 * - Convert to lowercase
 */
export const preProcessString = (str: string) => {
	return str
		.replace(/[“”":;(),.!?]/g, '')
		.replace(/-/g, ' ')
		.replace(/’/g, "'")
		.toLowerCase();
};
