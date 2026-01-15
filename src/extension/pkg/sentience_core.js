export function analyze_page(val) {
    return takeObject(wasm.analyze_page(addHeapObject(val)));
}

export function analyze_page_with_options(val, options) {
    return takeObject(wasm.analyze_page_with_options(addHeapObject(val), addHeapObject(options)));
}

export function decide_and_act(_raw_elements) {
    wasm.decide_and_act(addHeapObject(_raw_elements));
}

export function prune_for_api(val) {
    return takeObject(wasm.prune_for_api(addHeapObject(val)));
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_8c4e43fe74559d73: function(arg0, arg1) {
            return addHeapObject(Error(getStringFromWasm0(arg0, arg1)));
        },
        __wbg_Number_04624de7d0e8332d: function(arg0) {
            return Number(getObject(arg0));
        },
        __wbg___wbindgen_bigint_get_as_i64_8fcf4ce7f1ca72a2: function(arg0, arg1) {
            const v = getObject(arg1), ret = "bigint" == typeof v ? v : void 0;
            getDataViewMemory0().setBigInt64(arg0 + 8, isLikeNone(ret) ? BigInt(0) : ret, !0), 
            getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), !0);
        },
        __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(arg0) {
            const v = getObject(arg0), ret = "boolean" == typeof v ? v : void 0;
            return isLikeNone(ret) ? 16777215 : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(arg0, arg1) {
            const ptr1 = passStringToWasm0(debugString(getObject(arg1)), wasm.__wbindgen_export, wasm.__wbindgen_export2), len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4, len1, !0), getDataViewMemory0().setInt32(arg0 + 0, ptr1, !0);
        },
        __wbg___wbindgen_in_47fa6863be6f2f25: function(arg0, arg1) {
            return getObject(arg0) in getObject(arg1);
        },
        __wbg___wbindgen_is_bigint_31b12575b56f32fc: function(arg0) {
            return "bigint" == typeof getObject(arg0);
        },
        __wbg___wbindgen_is_function_0095a73b8b156f76: function(arg0) {
            return "function" == typeof getObject(arg0);
        },
        __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(arg0) {
            const val = getObject(arg0);
            return "object" == typeof val && null !== val;
        },
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(arg0) {
            return void 0 === getObject(arg0);
        },
        __wbg___wbindgen_jsval_eq_11888390b0186270: function(arg0, arg1) {
            return getObject(arg0) === getObject(arg1);
        },
        __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(arg0, arg1) {
            return getObject(arg0) == getObject(arg1);
        },
        __wbg___wbindgen_number_get_8ff4255516ccad3e: function(arg0, arg1) {
            const obj = getObject(arg1), ret = "number" == typeof obj ? obj : void 0;
            getDataViewMemory0().setFloat64(arg0 + 8, isLikeNone(ret) ? 0 : ret, !0), getDataViewMemory0().setInt32(arg0 + 0, !isLikeNone(ret), !0);
        },
        __wbg___wbindgen_string_get_72fb696202c56729: function(arg0, arg1) {
            const obj = getObject(arg1), ret = "string" == typeof obj ? obj : void 0;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_export, wasm.__wbindgen_export2), len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4, len1, !0), getDataViewMemory0().setInt32(arg0 + 0, ptr1, !0);
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_389efe28435a9388: function() {
            return handleError(function(arg0, arg1) {
                return addHeapObject(getObject(arg0).call(getObject(arg1)));
            }, arguments);
        },
        __wbg_done_57b39ecd9addfe81: function(arg0) {
            return getObject(arg0).done;
        },
        __wbg_error_9a7fe3f932034cde: function(arg0) {},
        __wbg_get_9b94d73e6221f75c: function(arg0, arg1) {
            return addHeapObject(getObject(arg0)[arg1 >>> 0]);
        },
        __wbg_get_b3ed3ad4be2bc8ac: function() {
            return handleError(function(arg0, arg1) {
                return addHeapObject(Reflect.get(getObject(arg0), getObject(arg1)));
            }, arguments);
        },
        __wbg_get_with_ref_key_1dc361bd10053bfe: function(arg0, arg1) {
            return addHeapObject(getObject(arg0)[getObject(arg1)]);
        },
        __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof ArrayBuffer;
            } catch (_) {
                result = !1;
            }
            return result;
        },
        __wbg_instanceof_Uint8Array_9b9075935c74707c: function(arg0) {
            let result;
            try {
                result = getObject(arg0) instanceof Uint8Array;
            } catch (_) {
                result = !1;
            }
            return result;
        },
        __wbg_isArray_d314bb98fcf08331: function(arg0) {
            return Array.isArray(getObject(arg0));
        },
        __wbg_isSafeInteger_bfbc7332a9768d2a: function(arg0) {
            return Number.isSafeInteger(getObject(arg0));
        },
        __wbg_iterator_6ff6560ca1568e55: function() {
            return addHeapObject(Symbol.iterator);
        },
        __wbg_js_click_element_2fe1e774f3d232c7: function(arg0) {
            js_click_element(arg0);
        },
        __wbg_length_32ed9a279acd054c: function(arg0) {
            return getObject(arg0).length;
        },
        __wbg_length_35a7bace40f36eac: function(arg0) {
            return getObject(arg0).length;
        },
        __wbg_new_361308b2356cecd0: function() {
            return addHeapObject(new Object);
        },
        __wbg_new_3eb36ae241fe6f44: function() {
            return addHeapObject(new Array);
        },
        __wbg_new_dd2b680c8bf6ae29: function(arg0) {
            return addHeapObject(new Uint8Array(getObject(arg0)));
        },
        __wbg_next_3482f54c49e8af19: function() {
            return handleError(function(arg0) {
                return addHeapObject(getObject(arg0).next());
            }, arguments);
        },
        __wbg_next_418f80d8f5303233: function(arg0) {
            return addHeapObject(getObject(arg0).next);
        },
        __wbg_prototypesetcall_bdcdcc5842e4d77d: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), getObject(arg2));
        },
        __wbg_set_3f1d0b984ed272ed: function(arg0, arg1, arg2) {
            getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
        },
        __wbg_set_f43e577aea94465b: function(arg0, arg1, arg2) {
            getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
        },
        __wbg_value_0546255b415e96c1: function(arg0) {
            return addHeapObject(getObject(arg0).value);
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            return addHeapObject(arg0);
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            return addHeapObject(getStringFromWasm0(arg0, arg1));
        },
        __wbindgen_cast_0000000000000003: function(arg0) {
            return addHeapObject(BigInt.asUintN(64, arg0));
        },
        __wbindgen_object_clone_ref: function(arg0) {
            return addHeapObject(getObject(arg0));
        },
        __wbindgen_object_drop_ref: function(arg0) {
            takeObject(arg0);
        }
    };
    return {
        __proto__: null,
        "./sentience_core_bg.js": import0
    };
}

function addHeapObject(obj) {
    heap_next === heap.length && heap.push(heap.length + 1);
    const idx = heap_next;
    return heap_next = heap[idx], heap[idx] = obj, idx;
}

function debugString(val) {
    const type = typeof val;
    if ("number" == type || "boolean" == type || null == val) return `${val}`;
    if ("string" == type) return `"${val}"`;
    if ("symbol" == type) {
        const description = val.description;
        return null == description ? "Symbol" : `Symbol(${description})`;
    }
    if ("function" == type) {
        const name = val.name;
        return "string" == typeof name && name.length > 0 ? `Function(${name})` : "Function";
    }
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = "[";
        length > 0 && (debug += debugString(val[0]));
        for (let i = 1; i < length; i++) debug += ", " + debugString(val[i]);
        return debug += "]", debug;
    }
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (!(builtInMatches && builtInMatches.length > 1)) return toString.call(val);
    if (className = builtInMatches[1], "Object" == className) try {
        return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
        return "Object";
    }
    return val instanceof Error ? `${val.name}: ${val.message}\n${val.stack}` : className;
}

function dropObject(idx) {
    idx < 132 || (heap[idx] = heap_next, heap_next = idx);
}

function getArrayU8FromWasm0(ptr, len) {
    return ptr >>>= 0, getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    return (null === cachedDataViewMemory0 || !0 === cachedDataViewMemory0.buffer.detached || void 0 === cachedDataViewMemory0.buffer.detached && cachedDataViewMemory0.buffer !== wasm.memory.buffer) && (cachedDataViewMemory0 = new DataView(wasm.memory.buffer)), 
    cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>>= 0, len);
}

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    return null !== cachedUint8ArrayMemory0 && 0 !== cachedUint8ArrayMemory0.byteLength || (cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer)), 
    cachedUint8ArrayMemory0;
}

function getObject(idx) {
    return heap[idx];
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export3(addHeapObject(e));
    }
}

let heap = new Array(128).fill(void 0);

heap.push(void 0, null, !0, !1);

let heap_next = heap.length;

function isLikeNone(x) {
    return null == x;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (void 0 === realloc) {
        const buf = cachedTextEncoder.encode(arg), ptr = malloc(buf.length, 1) >>> 0;
        return getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf), WASM_VECTOR_LEN = buf.length, 
        ptr;
    }
    let len = arg.length, ptr = malloc(len, 1) >>> 0;
    const mem = getUint8ArrayMemory0();
    let offset = 0;
    for (;offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 127) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        0 !== offset && (arg = arg.slice(offset)), ptr = realloc(ptr, len, len = offset + 3 * arg.length, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        offset += cachedTextEncoder.encodeInto(arg, view).written, ptr = realloc(ptr, len, offset, 1) >>> 0;
    }
    return WASM_VECTOR_LEN = offset, ptr;
}

function takeObject(idx) {
    const ret = getObject(idx);
    return dropObject(idx), ret;
}

let cachedTextDecoder = new TextDecoder("utf-8", {
    ignoreBOM: !0,
    fatal: !0
});

cachedTextDecoder.decode();

const MAX_SAFARI_DECODE_BYTES = 2146435072;

let numBytesDecoded = 0;

function decodeText(ptr, len) {
    return numBytesDecoded += len, numBytesDecoded >= MAX_SAFARI_DECODE_BYTES && (cachedTextDecoder = new TextDecoder("utf-8", {
        ignoreBOM: !0,
        fatal: !0
    }), cachedTextDecoder.decode(), numBytesDecoded = len), cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder;

"encodeInto" in cachedTextEncoder || (cachedTextEncoder.encodeInto = function(arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    return view.set(buf), {
        read: arg.length,
        written: buf.length
    };
});

let wasmModule, wasm, WASM_VECTOR_LEN = 0;

function __wbg_finalize_init(instance, module) {
    return wasm = instance.exports, wasmModule = module, cachedDataViewMemory0 = null, 
    cachedUint8ArrayMemory0 = null, wasm;
}

async function __wbg_load(module, imports) {
    if ("function" == typeof Response && module instanceof Response) {
        if ("function" == typeof WebAssembly.instantiateStreaming) try {
            return await WebAssembly.instantiateStreaming(module, imports);
        } catch (e) {
            if (!(module.ok && function(type) {
                switch (type) {
                  case "basic":
                  case "cors":
                  case "default":
                    return !0;
                }
                return !1;
            }(module.type)) || "application/wasm" === module.headers.get("Content-Type")) throw e;
        }
        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    }
    {
        const instance = await WebAssembly.instantiate(module, imports);
        return instance instanceof WebAssembly.Instance ? {
            instance: instance,
            module: module
        } : instance;
    }
}

function initSync(module) {
    if (void 0 !== wasm) return wasm;
    void 0 !== module && Object.getPrototypeOf(module) === Object.prototype && ({module: module} = module);
    const imports = __wbg_get_imports();
    module instanceof WebAssembly.Module || (module = new WebAssembly.Module(module));
    return __wbg_finalize_init(new WebAssembly.Instance(module, imports), module);
}

async function __wbg_init(module_or_path) {
    if (void 0 !== wasm) return wasm;
    void 0 !== module_or_path && Object.getPrototypeOf(module_or_path) === Object.prototype && ({module_or_path: module_or_path} = module_or_path), 
    void 0 === module_or_path && (module_or_path = new URL("sentience_core_bg.wasm", import.meta.url));
    const imports = __wbg_get_imports();
    ("string" == typeof module_or_path || "function" == typeof Request && module_or_path instanceof Request || "function" == typeof URL && module_or_path instanceof URL) && (module_or_path = fetch(module_or_path));
    const {instance: instance, module: module} = await __wbg_load(await module_or_path, imports);
    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };