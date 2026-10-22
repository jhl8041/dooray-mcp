/**
 * Text Replace Utility
 * Replace part of a long body without sending the whole body from the AI assistant
 */

export interface ReplaceResult {
  content: string;
  count: number;
}

/**
 * Replace oldText with newText in content
 * - Fails when oldText is not found, so a stale oldText never silently does nothing
 * - Fails when oldText appears more than once and replaceAll is not set, so the wrong spot is never changed
 */
export function replaceText(content: string, oldText: string, newText: string, replaceAll = false): ReplaceResult {
  if (oldText.length === 0) {
    throw new Error('oldText must not be empty');
  }

  const count = content.split(oldText).length - 1;
  if (count === 0) {
    throw new Error('oldText was not found in the current body. Fetch the latest body and copy the text exactly');
  }
  if (count > 1 && !replaceAll) {
    throw new Error(
      `oldText appears ${count} times. Add surrounding text to make it unique, or set replaceAll to true`
    );
  }

  return {
    content: content.split(oldText).join(newText),
    count,
  };
}
