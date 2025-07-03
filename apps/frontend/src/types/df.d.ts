declare namespace wasm_bindgen {
	/* tslint:disable */
	/* eslint-disable */
	/**
	* Create a DeepFilterNet Model
	*
	* Args:
	*     - path: File path to a DeepFilterNet tar.gz onnx model
	*     - atten_lim: Attenuation limit in dB.
	*
	* Returns:
	*     - DF state doing the full processing: stft, DNN noise reduction, istft.
	* @param {Uint8Array} model_bytes
	* @param {number} atten_lim
	* @returns {number}
	*/
	export function df_create(model_bytes: Uint8Array, atten_lim: number): number;
	/**
	* Get DeepFilterNet frame size in samples.
	* @param {number} st
	* @returns {number}
	*/
	export function df_get_frame_length(st: number): number;
	/**
	* Set DeepFilterNet attenuation limit.
	*
	* Args:
	*     - lim_db: New attenuation limit in dB.
	* @param {number} st
	* @param {number} lim_db
	*/
	export function df_set_atten_lim(st: number, lim_db: number): void;
	/**
	* Set DeepFilterNet post filter beta. A beta of 0 disables the post filter.
	*
	* Args:
	*     - beta: Post filter attenuation. Suitable range between 0.05 and 0;
	* @param {number} st
	* @param {number} beta
	*/
	export function df_set_post_filter_beta(st: number, beta: number): void;
	/**
	* Processes a chunk of samples.
	*
	* Args:
	*     - df_state: Created via df_create()
	*     - input: Input buffer of length df_get_frame_length()
	*     - output: Output buffer of length df_get_frame_length()
	*
	* Returns:
	*     - Local SNR of the current frame.
	* @param {number} st
	* @param {Float32Array} input
	* @returns {Float32Array}
	*/
	export function df_process_frame(st: number, input: Float32Array): Float32Array;
	/**
	*/
	export class DFState {
	  free(): void;
	}
	
}

declare type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

declare interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_dfstate_free: (a: number) => void;
  readonly df_create: (a: number, b: number, c: number) => number;
  readonly df_get_frame_length: (a: number) => number;
  readonly df_set_atten_lim: (a: number, b: number) => void;
  readonly df_set_post_filter_beta: (a: number, b: number) => void;
  readonly df_process_frame: (a: number, b: number, c: number) => number;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_exn_store: (a: number) => void;
}

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {InitInput | Promise<InitInput>} module_or_path
*
* @returns {Promise<InitOutput>}
*/
declare function wasm_bindgen (module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>;
