export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    const isExtensionlessRelativeImport =
      error?.code === 'ERR_MODULE_NOT_FOUND' &&
      specifier.startsWith('.') &&
      !/\.[a-z0-9]+$/i.test(specifier);

    if (isExtensionlessRelativeImport) {
      return nextResolve(`${specifier}.ts`, context);
    }

    throw error;
  }
}
