import IFWorker from './interactionfree'
import { useRoute } from 'vue-router'

class ExperimentConfig {
  constructor(name) {
    this.name = name;
    this.applicationConfigFileURL = `/configs/${name}.json`;
    this.IFWorkerFileURL = `/configs/IFBrokers.json`;
    this.workerNames = {}
    this.workers = {}
  }

  async loadApplicationConfig() {
    let responseConfig;
    let responseIFWorker;
    try {
      const f1 = fetch(this.applicationConfigFileURL + '?t=' + new Date().getTime());
      const f2 = fetch(this.IFWorkerFileURL + '?t=' + new Date().getTime());
      responseConfig = await f1
      responseIFWorker = await f2
      if (responseConfig == undefined || !responseConfig.ok) {
        console.log(`Config file ${this.applicationConfigFileURL} is not valid.`);
        return;
      }
      if (responseIFWorker == undefined || !responseIFWorker.ok) {
        console.log(`Config file ${this.IFWorkerFileURL} is not valid.`);
        return;
      }
    } catch (error) {
      console.log(`Error occurs during fetching the url: ${this.applicationConfigFileURL}`);
      return;
    }
    try {
      const data = await responseConfig.json();
      const brokers = await responseIFWorker.json();
      const ssl = (window.location.protocol == 'https:')
      const currentHost = window.location.host
      for (const key in data['IFWorkers']) {
        const brokerName = data['IFWorkers'][key]
        const workerMap = brokers[brokerName][ssl ? 'SSL' : 'NONSSL']
        const workerAddress = workerMap[currentHost]
        if (!this.workers[workerAddress]) this.workers[workerAddress] = IFWorker(workerAddress)
        this.workerNames[key] = brokerName
        this.workers[brokerName] = this.workers[workerAddress]
        this.workers[key] = this.workers[workerAddress]
      }
      this.applications = data["Applications"];
      this.access = data["Access"];
    } catch (error) {
      console.log(`Error occurs during parsing the config file: ${error}`);
      return;
    }
  }
}

let initPromise = null;
async function initConfig() {
  if (!initPromise) {
    initPromise = new Promise(async (resolve, reject) => {
      try {
        const route = useRoute()
        const name = route.query['experiment'] || null
        const ec = new ExperimentConfig(name);
        resolve(await ec.loadApplicationConfig())
        instance = ec
      } catch (err) {
        reject(err);
        initPromise = null;
      }
    });
  }
  return initPromise;
}

let instance = null;

async function loadConfig() {
  if (instance === null) {
    await initConfig();
  }
  return instance;
}

export { loadConfig };
