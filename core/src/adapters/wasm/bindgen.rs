use super::WasmSchedulerAdapter;

#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
pub struct WasmBindgenAdapter {
    inner: WasmSchedulerAdapter,
}

impl Default for WasmBindgenAdapter {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg_attr(target_arch = "wasm32", wasm_bindgen::prelude::wasm_bindgen)]
impl WasmBindgenAdapter {
    #[cfg_attr(
        target_arch = "wasm32",
        wasm_bindgen::prelude::wasm_bindgen(constructor)
    )]
    pub fn new() -> Self {
        Self {
            inner: WasmSchedulerAdapter::new(),
        }
    }

    pub fn execute_command_json(&mut self, input: &str) -> String {
        self.inner.execute_command_json(input)
    }

    pub fn execute_query_json(&self, input: &str) -> String {
        self.inner.execute_query_json(input)
    }
}
