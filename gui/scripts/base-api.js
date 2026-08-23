/**
 * [INPUT]: 依赖产品同源 /_sdk/base-api.js 暴露的 BottegaBase
 * [OUTPUT]: 通过 globalThis.FitnessBaseApi 兼容暴露 Client、BaseApiError 与 fragment 读取面
 * [POS]: gui/scripts 的纯命名适配器；认证、CAS、分页、轮询与 host action 全由产品 SDK 持有
 * [PROTOCOL]: 变更时更新此头部，然后检查 README.md
 */
(function exposeFitnessAdapter(global) {
  "use strict";
  var sdk = global.BottegaBase;
  if (!sdk) throw new Error("Bottega Base SDK 未加载");
  class Client {
    constructor(options) {
      if (options && options.token !== "product-sdk") return new sdk.Client(options);
      return {
        refresh: () => sdk.snapshot(),
        insertRows: (frozen, expectedRevision, signal) =>
          sdk.insertRows(frozen.expectedBaseInstanceId, expectedRevision, frozen.rows, signal),
        startPolling: (onSnapshot, onError, interval) =>
          sdk.startPolling(onSnapshot, onError, interval),
        stopPolling: () => sdk.stopPolling(),
      };
    }
  }
  global.FitnessBaseApi = {
    BaseApiError: sdk.BaseApiError,
    Client,
    consumeFragment: () => ({ token: "product-sdk", lang: sdk.language }),
  };
})(globalThis);
