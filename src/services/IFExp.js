import moment from 'moment';

class Histogram {
  constructor() {
    this.xs = null
    this.xsMatch = true

    this.ys = null
  }

  update(xs, ys) {
    this.xs = xs
    this.ys = ys
    this.xsMatch = true
  }

  clear() {
    this.xs = null
    this.ys = null
    this.xsMatch = true
  }

  append(xs, ys) {
    if (this.xs == null) {
      this.xs = xs
      this.ys = new Array(ys.length)
      for (var i = 0; i < ys.length; i++) {
        this.ys[i] = 0
      }
    } else {
      if (!Array.isArray(this.xs) || !Array.isArray(xs) || this.xs.length != xs.length) this.xsMatch = false
      // if (!this.xs.zip(xs).every((_) => { return _[0] == _[1] })) this.xsMatch = false
      if (!this.xs.map((x, i) => [x, xs[i]]).every((_) => { return _[0] == _[1] })) this.xsMatch = false
    }
    for (var i = 0; i < ys.length; i++) {
      this.ys[i] += ys[i]
    }
  }

  genXs(start, stop, num) {
    if (num < 2) {
      return num === 1 ? [start] : [];
    }
    var i, ret = Array(num);
    num--;
    for (i = num; i >= 0; i--) {
      ret[i] = (i * stop + (num - i) * start) / num;
    }
    return ret;
  }
}

function linspace(a, b, n) {
  if (typeof n === "undefined") n = Math.max(Math.round(b - a) + 1, 1);
  if (n < 2) {
    return n === 1 ? [a] : [];
  }
  var i, ret = Array(n);
  n--;
  for (i = n; i >= 0; i--) {
    ret[i] = (i * b + (n - i) * a) / n;
  }
  return ret;
}

String.prototype.replaceAll = function (s1, s2) {
  return this.replace(new RegExp(s1, "gm"), s2);
}

// Array.prototype.zip = function (that) {
//   return this.map((k, i) => [k, that[i]])
// }

// Array.prototype.sum = function () {
//   return this.reduce((a, b) => a + b, 0)
// }

async function sleep(inteval) {
  return new Promise(resolve => setTimeout(resolve, inteval))
}

class TDCStorageStreamFetcher {
  constructor(worker, collection, updateInterval, filter, ploter, listener) {
    this.worker = worker
    this.collection = collection
    this.updateInterval = updateInterval
    this.updateRangedResultInterval = 50
    this.lastTime = null
    this.mode = 'Instant' // modes: Instant, Integral, IntegralContinues
    this.filter = filter
    this.fetchID = 0
    this.ploter = ploter
    this.integralTime = 0
    this.integralBeginTime = null
    this.integralEndTime = null
    this.integralMostRecentTime = null
    this.integralFetchedDataCount = 0
    this.integralTotalDataCount = 0
    this.integralContinuesHasNew = false
    this.listener = listener
    this.rangedResultQueue = []
    this.fetching = false
  }

  start() {
    this.ploter(null, false)
    this.fetching = true
    this.update()
    this.updateRangedResult()
  }

  stop() {
    this.fetching = false
  }

  async update() {
    if (this.mode == 'Instant' || this.mode == 'IntegralContinues') {
      var fetchID = this.fetchID
      try {
        var result = (this.mode == 'Instant') ? (await this.worker.Storage.latest(this.collection, 'FetchTime', this.lastTime, this.filter)) : (await this.worker.Storage.first(this.collection, 'FetchTime', this.lastTime, this.filter))
        if (fetchID == this.fetchID) {
          if (result != null) {
            this.lastTime = result['FetchTime'];
            if (this.mode == 'Instant' || this.mode == 'IntegralContinues') {
              this.updateResult(result, fetchID, 'update')
            }
          }
          if (this.mode == 'IntegralContinues') {
            this.integralTime = parseInt((new Date().getTime() - this.integralBeginTime.getTime()) / 1000)
            if (result != null) {
              this.integralTotalDataCount += 1
              this.integralFetchedDataCount += 1
              this.integralContinuesHasNew = true
            }
          }
          this.updateFetchingInfo()
        }
      } catch (error) {
        console.log("Error: ")
        console.log(error);
      }
    }
    this.updateFetchingInfo()
    if (this.fetching) setTimeout(this.update.bind(this), this.updateInterval)
  }

  async range(beginTime, endTime) {
    var fetchID = this.fetchID
    this.integralTime = parseInt((endTime.getTime() - beginTime.getTime()) / 1000)
    try {
      var rangedSummaries = await this.worker.Storage.range(this.collection, this.dateToISO(beginTime), this.dateToISO(endTime), 'FetchTime', { '_id': 1 }, 1000)
      this.integralTotalDataCount += rangedSummaries.length
      if (rangedSummaries.length > 1000) {
        this.changeMode('Stop')
        this.listener('TooManyRecords', true)
      } else {
        for (var i = 0; i < rangedSummaries.length; i++) {
          this.integralMostRecentTime = new Date()
          this.integralMostRecentTime.setTime(Date.parse(rangedSummaries[i]['FetchTime']))
          var item = await this.worker.Storage.get(this.collection, rangedSummaries[i]['_id'], '_id', this.filter)
          this.rangedResultQueue.push([fetchID, item])
        }
        if (rangedSummaries.length > 0) this.lastTime = rangedSummaries[rangedSummaries.length - 1]['FetchTime']
        else this.lastTime = this.dateToISO(beginTime)
      }
    } catch (error) {
      console.log("Error: " + error)
      console.log(error);
    }
  }

  updateRangedResult() {
    if (this.rangedResultQueue.length > 0) {
      var resultSet = this.rangedResultQueue.shift()
      if (resultSet[0] == this.fetchID) {
        this.integralFetchedDataCount += 1
        try {
          this.updateResult(resultSet[1])
          this.updateFetchingInfo()
        } catch (err) {
          console.log(err);
        }
      }
    }
    setTimeout(this.updateRangedResult.bind(this), this.rangedResultQueue.length >
      0 ? 0 : this.updateRangedResultInterval)
  }

  updateResult(result) {
    this.ploter(result, this.mode != 'Instant')
  }

  updateFetchingInfo() {
    // Check if display no data warning
    var fetchTimeDelta = 0
    if (this.mode == 'Instant') {
      fetchTimeDelta = new Date().getTime() - Date.parse(this.lastTime)
    } else if (this.mode == 'IntegralContinues') {
      if (this.integralContinuesHasNew) {
        fetchTimeDelta = new Date().getTime() - Date.parse(this.lastTime)
      } else {
        if (this.integralFetchedDataCount == this.integralTotalDataCount &&
          this.integralMostRecentTime != null) {
          fetchTimeDelta = new Date().getTime() - this.integralMostRecentTime.getTime()
        }
      }
    }
    if (this.mode == 'Integral' || this.mode == 'IntegralContinues') {
      if (this.integralFetchedDataCount == 0) {
        fetchTimeDelta = 0
      }
    }
    this.listener('FetchTimeDelta', fetchTimeDelta);

    // Set prograss
    if (this.integralTotalDataCount > 0 && this.integralFetchedDataCount <
      this.integralTotalDataCount) {
      this.listener('FetchingProgress', this.integralFetchedDataCount * 1.0 /
        this.integralTotalDataCount)
    } else {
      this.listener('FetchingProgress', 0.0)
    }

    // Set FetchNumber
    if (this.mode == 'Integral' || this.mode == 'IntegralContinues') {
      this.listener('FetchingNumber', [this.integralFetchedDataCount, this.integralTotalDataCount,
      this.integralTime
      ])
    } else {
      this.listener('FetchingNumber', null)
    }
  }

  changeMode(mode) {
    if (mode == this.mode) return
    if (mode != 'Instant' && mode != 'Integral' && mode !=
      'IntegralContinues' && mode != 'Stop') {
      console.log('Bad mode: ' + mode)
      return
    }
    this.mode = mode
    this.integralTime = 0
    this.integralTotalDataCount = 0
    this.integralFetchedDataCount = 0
    this.integralContinuesHasNew = false
    this.rangedResultQueue = []
    if (mode == 'Instant') this.lastTime = 0
    if (mode != 'Stop') this.fetchID += 1
    this.ploter(null, false)
    this.listener('TooManyRecords', false)
  }

  updateIntegralData(beginTime, endTime, isToNow) {
    this.integralBeginTime = beginTime
    this.integralEndTime = endTime
    this.changeMode("Stop")
    this.changeMode(isToNow ? "IntegralContinues" : "Integral")
    if (isToNow) this.lastTime = this.dateToISO(endTime)
    this.range(beginTime, endTime)
  }

  dateToISO(date) {
    return moment(date).format('YYYY-MM-DDTHH:mm:ss.SSSSSS+08:00')
  }
}

class SimpleFetcher {
  constructor(fetchFunction, interval) {
    this.running = false
    this.fetchFunction = fetchFunction
    this.interval = interval
  }

  start() {
    this.running = true
    this.doFetch()
  }

  stop() {
    this.running = false
  }

  async doFetch() {
    try {
      await this.fetchFunction()
    } catch (error) {
      console.log(error);
    }
    if (this.running) setTimeout(this.doFetch.bind(this), this.interval)
  }
}

const eDateTimes = ['YYYY-MM-DD HH:mm:ss', 'YYYY-MM-DD HH:mm:ss.S']
for (let i = 0; i < 6; i++) eDateTimes.push(eDateTimes[eDateTimes.length - 1] + 'S')

const parseDateString = (val) => {
  val = val.trim().replaceAll(/ +/g, ' ');
  if (val.length == 0) return -1;
  for (var i in eDateTimes) {
    try {
      const m = moment(val, eDateTimes[i], true);
      if (m.isValid()) return m.valueOf();
    } catch (error) { }
  }
  return NaN;
}

export { Histogram, TDCStorageStreamFetcher, SimpleFetcher, linspace, parseDateString }
