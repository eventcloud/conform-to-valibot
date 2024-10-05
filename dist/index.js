"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.ts
var conform_to_valibot_fork_exports = {};
__export(conform_to_valibot_fork_exports, {
  getValibotConstraint: () => getValibotConstraint,
  parseWithValibot: () => parseWithValibot
});
module.exports = __toCommonJS(conform_to_valibot_fork_exports);

// constraint.ts
var keys = [
  "required",
  "minLength",
  "maxLength",
  "min",
  "max",
  "step",
  "multiple",
  "pattern"
];
function getValibotConstraint(schema) {
  function updateConstraint(schema2, data, name = "") {
    if (name !== "" && !data[name]) {
      data[name] = { required: true };
    }
    const constraint = name !== "" ? data[name] : {};
    if (schema2.type === "object") {
      for (const key in schema2.entries) {
        updateConstraint(
          // @ts-expect-error
          schema2.entries[key],
          data,
          name ? `${name}.${key}` : key
        );
      }
    } else if (schema2.type === "intersect") {
      for (const option of schema2.options) {
        const result2 = {};
        updateConstraint(option, result2, name);
        Object.assign(data, result2);
      }
    } else if (schema2.type === "union" || schema2.type === "variant") {
      Object.assign(
        data,
        // @ts-expect-error
        schema2.options.map((option) => {
          const result2 = {};
          updateConstraint(option, result2, name);
          return result2;
        }).reduce((prev, next) => {
          const list = /* @__PURE__ */ new Set([...Object.keys(prev), ...Object.keys(next)]);
          const result2 = {};
          for (const name2 of list) {
            const prevConstraint = prev[name2];
            const nextConstraint = next[name2];
            if (prevConstraint && nextConstraint) {
              const constraint2 = {};
              result2[name2] = constraint2;
              for (const key of keys) {
                if (typeof prevConstraint[key] !== "undefined" && typeof nextConstraint[key] !== "undefined" && prevConstraint[key] === nextConstraint[key]) {
                  constraint2[key] = prevConstraint[key];
                }
              }
            } else {
              result2[name2] = {
                ...prevConstraint,
                ...nextConstraint,
                required: false
              };
            }
          }
          return result2;
        })
      );
    } else if (name === "") {
      throw new Error("Unsupported schema");
    } else if (schema2.type === "array") {
      constraint.multiple = true;
      updateConstraint(schema2.item, data, `${name}[]`);
    } else if (schema2.type === "string") {
      const minLength = schema2.pipe?.find(
        // @ts-expect-error
        (v) => "type" in v && v.type === "min_length"
      );
      if (minLength && "requirement" in minLength) {
        constraint.minLength = minLength.requirement;
      }
      const maxLength = schema2.pipe?.find(
        // @ts-expect-error
        (v) => "type" in v && v.type === "max_length"
      );
      if (maxLength && "requirement" in maxLength) {
        constraint.maxLength = maxLength.requirement;
      }
    } else if (schema2.type === "optional") {
      constraint.required = false;
      updateConstraint(schema2.wrapped, data, name);
    } else if (schema2.type === "nullish") {
      constraint.required = false;
      updateConstraint(schema2.wrapped, data, name);
    } else if (schema2.type === "number") {
      const minValue = schema2.pipe?.find(
        // @ts-expect-error
        (v) => "type" in v && v.type === "min_value"
      );
      if (minValue && "requirement" in minValue) {
        constraint.min = minValue.requirement;
      }
      const maxValue = schema2.pipe?.find(
        // @ts-expect-error
        (v) => "type" in v && v.type === "max_value"
      );
      if (maxValue && "requirement" in maxValue) {
        constraint.max = maxValue.requirement;
      }
    } else if (schema2.type === "enum") {
      constraint.pattern = Object.entries(schema2.enum).map(
        ([_, option]) => (
          // To escape unsafe characters on regex
          typeof option === "string" ? option.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d") : option
        )
      ).join("|");
    } else if (schema2.type === "tuple") {
      for (let i = 0; i < schema2.items.length; i++) {
        updateConstraint(schema2.items[i], data, `${name}[${i}]`);
      }
    } else {
    }
  }
  const result = {};
  updateConstraint(schema, result);
  return result;
}

// parse.ts
var import_dom = require("@conform-to/dom");
var import_valibot2 = require("valibot");

// coercion.ts
var import_valibot = require("valibot");
function coerceString(value, transform) {
  if (typeof value !== "string") {
    return value;
  }
  if (value === "") {
    return void 0;
  }
  if (typeof transform !== "function") {
    return value;
  }
  try {
    return transform(value);
  } catch {
    return void 0;
  }
}
function coerce(type, transform) {
  const unknown = { ...(0, import_valibot.unknown)(), expects: type.expects };
  const transformFunction = (output) => type.type === "blob" || type.type === "file" ? coerceFile(output) : coerceString(output, transform);
  if (type.async) {
    return (0, import_valibot.pipeAsync)(unknown, (0, import_valibot.transform)(transformFunction), type);
  }
  return (0, import_valibot.pipe)(unknown, (0, import_valibot.transform)(transformFunction), type);
}
function coerceFile(file) {
  if (typeof File !== "undefined" && file instanceof File && file.name === "" && file.size === 0) {
    return void 0;
  }
  return file;
}
function generateReturnSchema(originalSchema, coercionSchema) {
  if ("pipe" in originalSchema) {
    if (originalSchema.async && coercionSchema.async) {
      return (0, import_valibot.pipeAsync)(
        coercionSchema,
        ...originalSchema.pipe.slice(1)
      );
    }
    return (0, import_valibot.pipe)(
      coercionSchema,
      ...originalSchema.pipe.slice(1)
    );
  }
  return coercionSchema;
}
function enableTypeCoercion(type) {
  const originalSchema = "pipe" in type ? type.pipe[0] : type;
  switch (type.type) {
    case "string":
    case "literal":
    case "enum":
    case "undefined": {
      return coerce(type);
    }
    case "number": {
      return coerce(type, Number);
    }
    case "boolean": {
      return coerce(type, (text) => text === "on" ? true : text);
    }
    case "date": {
      return coerce(type, (timestamp) => {
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) {
          return timestamp;
        }
        return date;
      });
    }
    case "bigint": {
      return coerce(type, BigInt);
    }
    case "file":
    case "blob": {
      return coerce(type);
    }
    case "array": {
      const arraySchema = {
        ...originalSchema,
        // @ts-expect-error
        item: enableTypeCoercion(originalSchema.item)
      };
      return generateReturnSchema(type, arraySchema);
    }
    case "optional":
    case "nullish":
    case "nullable":
    case "non_optional":
    case "non_nullish":
    case "non_nullable": {
      const wrapSchema = enableTypeCoercion(type.wrapped);
      if ("pipe" in wrapSchema) {
        const unknown = { ...(0, import_valibot.unknown)(), expects: type.expects };
        if (type.async) {
          return (0, import_valibot.pipeAsync)(unknown, wrapSchema.pipe[1], type);
        }
        return (0, import_valibot.pipe)(unknown, wrapSchema.pipe[1], type);
      }
      const wrappedSchema = {
        ...originalSchema,
        // @ts-expect-error
        wrapped: enableTypeCoercion(originalSchema.wrapped)
      };
      return generateReturnSchema(type, wrappedSchema);
    }
    case "union":
    case "intersect": {
      const unionSchema = {
        ...originalSchema,
        // @ts-expect-error
        options: originalSchema.options.map(
          (option) => enableTypeCoercion(option)
        )
      };
      return generateReturnSchema(type, unionSchema);
    }
    case "variant": {
      const variantSchema = {
        ...originalSchema,
        // @ts-expect-error
        options: originalSchema.options.map(
          (option) => enableTypeCoercion(option)
        )
      };
      return generateReturnSchema(type, variantSchema);
    }
    case "tuple": {
      const tupleSchema = {
        ...originalSchema,
        // @ts-expect-error
        items: originalSchema.items.map((option) => enableTypeCoercion(option))
      };
      return generateReturnSchema(type, tupleSchema);
    }
    case "tuple_with_rest": {
      const tupleWithRestSchema = {
        ...originalSchema,
        // @ts-expect-error
        items: originalSchema.items.map((option) => enableTypeCoercion(option)),
        // @ts-expect-error
        rest: enableTypeCoercion(originalSchema.rest)
      };
      return generateReturnSchema(type, tupleWithRestSchema);
    }
    case "object": {
      const objectSchema = {
        ...originalSchema,
        entries: Object.fromEntries(
          // @ts-expect-error
          Object.entries(originalSchema.entries).map(([key, def]) => [
            key,
            enableTypeCoercion(def)
          ])
        )
      };
      return generateReturnSchema(type, objectSchema);
    }
    case "object_with_rest": {
      const objectWithRestSchema = {
        ...originalSchema,
        entries: Object.fromEntries(
          // @ts-expect-error
          Object.entries(originalSchema.entries).map(([key, def]) => [
            key,
            enableTypeCoercion(def)
          ])
        ),
        // @ts-expect-error
        rest: enableTypeCoercion(originalSchema.rest)
      };
      return generateReturnSchema(type, objectWithRestSchema);
    }
  }
  return coerce(type);
}

// parse.ts
function parseWithValibot(payload, config) {
  return (0, import_dom.parse)(payload, {
    resolve(payload2, intent) {
      const originalSchema = typeof config.schema === "function" ? config.schema(intent) : config.schema;
      const schema = enableTypeCoercion(originalSchema);
      const resolveResult = (result) => {
        if (result.success) {
          return {
            value: result.output
          };
        }
        return {
          error: result.issues.reduce((result2, e) => {
            const name = e.path ? (
              // @ts-expect-error
              (0, import_dom.formatPaths)(e.path.map((d) => d.key))
            ) : e.input;
            result2[name] = [...result2[name] ?? [], e.message];
            return result2;
          }, {})
        };
      };
      if (schema.async === true) {
        return (0, import_valibot2.safeParseAsync)(schema, payload2, config.info).then(resolveResult);
      }
      return resolveResult((0, import_valibot2.safeParse)(schema, payload2, config.info));
    }
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getValibotConstraint,
  parseWithValibot
});
//# sourceMappingURL=index.js.map