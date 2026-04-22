let initCount = 0;

export default async function init() {
  initCount += 1;
}

export class WasmBindgenAdapter {
  execute_command_json() {
    return '{"status":"success","data":"applied"}';
  }

  execute_query_json() {
    return '{"status":"success","data":{"week_start":"2026-01-05","week_end":"2026-01-12","slots":[],"appointments":[]}}';
  }
}

export function getInitCount() {
  return initCount;
}
