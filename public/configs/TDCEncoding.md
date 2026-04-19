# How to use this page (this page is about to be deprecated, please use page Encoding2 instead.)

TDCEncoding 用于呈现 QKD 编码的结果。在指定了一个 trigger 通道和 1 个 signal 通道后，各图中将分别呈现不同编码随机数的脉冲直方图。

具体来说，后端程序事先配置了相关参数：

* `RandomNumbers`: List of numbers, representing the random number for each pulse.
* `Period`: The period of QKD pulse, 10 ns by default.
* `PulsePerTrigger`: Tell the backend what the period of the trigger events is.
* `BinCount`: Bin count for histograms, 100 by default.
* `Histograms`: A map with string keys and list[number] values, presenting the way of grouping events by corresponding randon numbers.

在后端处理中，对于每一个 signal event（到达时间为 $s$），程序会寻找早于它但是与它最接近的 trigger event（假定它是从起点开始的第 $t_i$ 个 trigger event，到达时间为 $t$）。于是，我们知道 $s$ 对应的随机数是 $r_i$ = `RandomNumbers`[($t_i$ * `PulsePerTrigger` + int(($s$ - $t$) / `Period`)) % len(`RandomNumbers`)]，而它在这一脉冲周期内的时间为 $t_i$ = ($s$ - $t$) % `Period`，标记这个 signal event 为 ($r_i$, $t_i$)。

最终，这些 signal event 会根据 `Histograms` 中规定的分组方法进行统计。例如，默认的 `Histograms` 为

```python
{
    'All Pulses': [i for i in range(128)],
    'All Signals': [i for i in range(64)],
    'All Ref': [i + 64 for i in range(64)],
    'Vacuum': [i for i in range(64) if i % 4 == 0],
    'X': [i for i in range(64) if i % 4 == 1],
    'Y': [i for i in range(64) if i % 4 == 2],
    'Z': [i for i in range(64) if i % 4 == 3],
}
```

这里的定义意味着，我们认为所有的随机数（0 ~ 127）都要被当做 `All Pulese` 来统计，而 `All Signals` 只统计随机数为 0 ~ 63 的脉冲，以此类推。

具体的实现细节可参考 GitHub [hwaipy/PyTimeTag](https://github.com/hwaipy/PyTimeTag) 中的 [EncodingAnalyser.py](https://github.com/hwaipy/PyTimeTag/blob/main/pytimetag/analysers/EncodingAnalyser.py)。

本页共包含 11 个子图，其中前 7 个（All Pulses, All Signals, All Ref, Vacuum, X, Y, Z）通过名为 `TFQKDEncoding` 的 `EncodingAnalyser` 定义和配置，Sync Alice、Sync Bob、Sync Alice Monitor、Sync Bob Monitor 这 4 个子图分别由名为 `TFQKDSyncAlice`、`TFQKDSyncBob`、`TFQKDSyncAliceMonitor` 和 `TFQKDSyncBobMonitor` 的 `EncodingAnalyser` 定义和配置。

配置相关参数的示例程序：

```python title="参数配置示例"
from interactionfreepy import IFWorker
worker = IFWorker('tcp://192.168.25.5:1061') # 根据实际情况设定 ip 和 port
tdc = worker.TFTDCServer # 根据实际情况指定 TDCServer 的服务名

tdc.configureAnalyser(
    'TFQKDEncoding', # 根据实际情况指定 HistogramAnalyser 的名称
    {
        'Period': 10000,
        'TriggerChannel': 1,
        'SignalChannel': 2,
        'RandomNumbers': rns, # 根据实际情况指定随机数
        'PulsePerTrigger': 100000000,
        'Histograms': {
            'All Pulses': [i for i in range(128)],
            'All Signals': [i for i in range(64)],
            'All Ref': [i + 64 for i in range(64)],
            'Vacuum': [i for i in range(64) if i % 4 == 0],
            'X': [i for i in range(64) if i % 4 == 1],
            'Y': [i for i in range(64) if i % 4 == 2],
            'Z': [i for i in range(64) if i % 4 == 3],
        }
    }
)

tdc.configureAnalyser(
    'TFQKDSyncAlice',
    {
        'Period': 10000,
        'TriggerChannel': 0,
        'SignalChannel': 4,
        'RandomNumbers': [0],
        'Histograms': {
            'Sync Alice': [i for i in range(64)]
        }
    }
)

tdc.configureAnalyser(
    'TFQKDSyncBob',
    {
        'Period': 10000,
        'TriggerChannel': 0,
        'SignalChannel': 5,
        'RandomNumbers': [0],
        'Histograms': {
            'Sync Bob': [i for i in range(64)]
        }
    }
)

tdc.configureAnalyser(
    'TFQKDSyncAliceMonitor',
    {
        'Period': 10000,
        'TriggerChannel': 0,
        'SignalChannel': 4,
        'RandomNumbers': [0],
        'Histograms': {
            'Sync Alice Monitor': [i for i in range(64)]
        }
    }
)

tdc.configureAnalyser(
    'TFQKDSyncBobMonitor',
    {
        'Period': 10000,
        'TriggerChannel': 0,
        'SignalChannel': 5,
        'RandomNumbers': [0],
        'Histograms': {
            'Sync Bob Monitor': [i for i in range(64)]
        }
    }
)
```