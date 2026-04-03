import { ApiErrorCode } from "../../shared/types";

export interface ValidationOptions {
  allowEmpty?: boolean;
  minLength?: number;
  maxLength?: number;
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const createValidationError = (message: string, field: string) => ({
  code: ApiErrorCode.VALIDATION_ERROR,
  message,
  details: { field },
});

export const assertString = (
  value: unknown,
  field: string,
  options: ValidationOptions = {},
): string => {
  if (typeof value !== "string") {
    throw createValidationError(`${field} must be a string`, field);
  }

  const { allowEmpty = true, minLength, maxLength } = options;

  if (!allowEmpty && value.trim().length === 0) {
    throw createValidationError(`${field} cannot be empty`, field);
  }

  if (typeof minLength === "number" && value.length < minLength) {
    throw createValidationError(
      `${field} must be at least ${minLength} characters`,
      field,
    );
  }

  if (typeof maxLength === "number" && value.length > maxLength) {
    throw createValidationError(
      `${field} exceeds maximum length of ${maxLength}`,
      field,
    );
  }

  return value;
};

export const assertBoolean = (value: unknown, field: string): boolean => {
  if (typeof value !== "boolean") {
    throw createValidationError(`${field} must be a boolean`, field);
  }
  return value;
};

export const assertOptionalBoolean = (
  value: unknown,
  field: string,
): boolean | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return assertBoolean(value, field);
};

export const assertInteger = (
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {},
): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw createValidationError(`${field} must be a number`, field);
  }
  if (!Number.isInteger(value)) {
    throw createValidationError(`${field} must be an integer`, field);
  }

  if (typeof options.min === "number" && value < options.min) {
    throw createValidationError(`${field} must be >= ${options.min}`, field);
  }

  if (typeof options.max === "number" && value > options.max) {
    throw createValidationError(`${field} must be <= ${options.max}`, field);
  }

  return value;
};

export const assertOptionalInteger = (
  value: unknown,
  field: string,
  options: { min?: number; max?: number } = {},
): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return assertInteger(value, field, options);
};

export const assertPlainObject = (
  value: unknown,
  field: string,
): Record<string, unknown> => {
  if (!isPlainObject(value)) {
    throw createValidationError(`${field} must be an object`, field);
  }
  return value;
};

export const assertOptionalPlainObject = (
  value: unknown,
  field: string,
): Record<string, unknown> | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return assertPlainObject(value, field);
};

export const assertStringArray = (
  value: unknown,
  field: string,
  options: {
    allowEmptyItems?: boolean;
    maxItems?: number;
    itemMaxLength?: number;
  } = {},
): string[] => {
  if (!Array.isArray(value)) {
    throw createValidationError(`${field} must be an array`, field);
  }

  const { allowEmptyItems = true, maxItems, itemMaxLength } = options;

  if (typeof maxItems === "number" && value.length > maxItems) {
    throw createValidationError(
      `${field} exceeds maximum item count of ${maxItems}`,
      field,
    );
  }

  return value.map((item, index) =>
    assertString(item, `${field}[${index}]`, {
      allowEmpty: allowEmptyItems,
      maxLength: itemMaxLength,
    }),
  );
};

export const assertOptionalStringArray = (
  value: unknown,
  field: string,
  options: {
    allowEmptyItems?: boolean;
    maxItems?: number;
    itemMaxLength?: number;
  } = {},
): string[] | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return assertStringArray(value, field, options);
};

export const assertOneOf = <T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  options: ValidationOptions = {},
): T => {
  const normalized = assertString(value, field, options);
  if (!allowed.includes(normalized as T)) {
    throw createValidationError(
      `${field} must be one of: ${allowed.join(", ")}`,
      field,
    );
  }
  return normalized as T;
};

export const assertOptionalOneOf = <T extends string>(
  value: unknown,
  field: string,
  allowed: readonly T[],
  options: ValidationOptions = {},
): T | undefined => {
  if (value === undefined) {
    return undefined;
  }
  return assertOneOf(value, field, allowed, options);
};
