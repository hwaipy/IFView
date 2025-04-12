import IFWorker from './interactionfree'

const wsMap = {
  // 'code.qpqi.group': 'code.qpqi.group:1063', // IFView
  // 'code.qpqi.group:34510': 'code.qpqi.group:1063', // IFView Debug
  // 'code.qpqi.group:34511': 'code.qpqi.group:1063', // IFView Debug 7 km
  // '192.168.25.6': '192.168.25.5:1063', // Lab
  // '192.168.25.6:18010': '192.168.25.5:1063', // Lab
  // 'interactionfree.cn': 'code.qpqi.group:1063', //
  // 'interactionfree.cn:380': 'code.qpqi.group:1063', //
  'localhost:9000': 'code.qpqi.group:1263',
  'localhost:9001': 'code.qpqi.group:1263',
  '192.168.25.5:5080': '192.168.25.5:1263',
  'iflab.qpqi.group': '192.168.0.35:1063',
}
const wssMap = {
  'iflab.qpqi.group': 'iflab.qpqi.group',
}

// const currentDomain = ((window.location.hostname === 'localhost') || (window.location.hostname === '172.16.60.2')) ? '172.16.60.200' : window.location.hostname
const currentHost = window.location.host

let worker = undefined
// let secureWorker = undefined

function IFWorkerInstance(ssl) {
  if (worker == undefined) {
    if (ssl === undefined) ssl = (window.location.protocol == 'https:'); //(currentDomain === 'interactionfree.cn')
    if (ssl) worker = IFWorker("wss://" + wssMap[currentHost] + "/ws7/")
    else worker = IFWorker("ws://" + wsMap[currentHost] + "/ws/")
  }
  // if (ssl) {
  //     if (!secureWorker) secureWorker = IFWorker("wss://" + currentDomain + ":" + sslPortMap[currentDomain] + "/ws/")
  //     return secureWorker
  // } else {
  // if (!plainWorker) plainWorker = IFWorker("wss://" + wsMap[currentHost] + "/ws/")
  // if (!plainWorker) plainWorker = IFWorker("ws://" + 'code.qpqi.group:1063' + '/ws/')
  // return plainWorker
  // }
  return worker
}

export default IFWorkerInstance()
