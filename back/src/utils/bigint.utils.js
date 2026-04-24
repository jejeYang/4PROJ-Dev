/**
 * Patch BigInt to allow JSON serialization.
 * This is necessary because JSON.stringify() does not support BigInt by default.
 */
export const patchBigIntSerialization = () => {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
};

// Also export a helper function if needed
export const serializeBigInt = (obj) => {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )
  );
};
