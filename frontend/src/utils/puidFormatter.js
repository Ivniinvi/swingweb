export function formatPUID(puid) {
    if (puid.length > 10) {
      throw new Error("PUID cannot be longer than 10 digits");
    }
    return puid.padStart(10, '0');
  }