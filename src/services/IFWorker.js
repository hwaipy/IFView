import IFWorker from './interactionfree'

const wsMap = {
  'code.qpqi.group': 'code.qpqi.group:1063', // IFView
  'code.qpqi.group:34510': 'code.qpqi.group:1063', // IFView Debug
  'code.qpqi.group:34511': 'code.qpqi.group:1063', // IFView Debug 7 km
  '192.168.25.6': '192.168.25.5:1063', // Lab
  '192.168.25.6:18010': '192.168.25.5:1063', // Lab
  'interactionfree.cn': 'code.qpqi.group:1063', //
  'interactionfree.cn:380': 'code.qpqi.group:1063', //
}

// const currentDomain = ((window.location.hostname === 'localhost') || (window.location.hostname === '172.16.60.2')) ? '172.16.60.200' : window.location.hostname
const currentHost = window.location.host

let plainWorker = undefined
// let secureWorker = undefined

function IFWorkerInstance(ssl) {
  if (ssl === undefined) ssl = false; //(currentDomain === 'interactionfree.cn')
  // if (ssl) {
  //     if (!secureWorker) secureWorker = IFWorker("wss://" + currentDomain + ":" + sslPortMap[currentDomain] + "/ws/")
  //     return secureWorker
  // } else {
  // if (!plainWorker) plainWorker = IFWorker("ws://" + wsMap[currentHost] + "/ws/")
  if (!plainWorker) plainWorker = IFWorker("ws://" + 'code.qpqi.group:1063' + '/ws/')
  return plainWorker
  // }
}

export default IFWorkerInstance()
