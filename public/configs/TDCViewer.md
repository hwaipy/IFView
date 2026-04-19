# How to use this page

TDCViewer 用于显示 TimeTag events 之间的相对时间关系。指定 1 个 trigger 通道和若干个 signal 通道，图中将分别呈现每个 signal 通道和 trigger 通道之间的直方图曲线。

对于某个 signal 通道 $s$，假定其包含的 TimeTag events 的集合为 $$S=\{s_i|i\in\{1,2,...,n\}\}$$

而 trigger 通道包含的 TimeTag events 的集合为 $$T=\{t_i|i\in\{1,2,...,m\}\}$$

取 $S$ 和 $T$ 的差集（闵可夫斯基和）并做取值范围的限定 $$D = S - T = \{ s_i - t_j \mid s_i \in S, t_j \in T, \mathtt{From} \le s_i - t_j \le \mathtt{To} \}$$

将集合 $D$ 以 `From` 和 `To` 为起止，`BinNum` * `Divide` 为 bin 数做直方图 $H^\prime$（该直方图包含 `BinNum` * `Divide` 个元素，其中第 $i$ 元素代表时间差处于 $[\mathtt{From} + (\mathtt{To} - \mathtt{From}) / (\mathtt{BinNum} * \mathtt{Divide}) * i, \mathtt{From} + (\mathtt{To} - \mathtt{From}) / (\mathtt{BinNum} * \mathtt{Divide}) * (i + 1))$ 范围内的事件个数）。

最终由 $H^\prime$ 得到目标直方图 $H$，包含 `BinNum` 个元素，其中 $$H_i = \sum_{k=0}^\mathtt{Divide} H^\prime_{k * \mathtt{Divide} + i}$$

具体的实现细节可参考 GitHub [hwaipy/PyTimeTag](https://github.com/hwaipy/PyTimeTag) 中的 [HistogramAnalyser.py](https://github.com/hwaipy/PyTimeTag/blob/main/pytimetag/analysers/HistogramAnalyser.py)。

配置相关参数的示例程序：

```python title="参数配置示例"
from interactionfreepy import IFWorker
worker = IFWorker('tcp://192.168.25.5:1061') # 根据实际情况设定 ip 和 port
tdc = worker.TFTDCServer # 根据实际情况指定 TDCServer 的服务名

tdc.configureAnalyser(
    'MultiHistogram', # 根据实际情况指定 HistogramAnalyser 的名称
    {
        'Sync': 0, 
        'Signals': [2, 3], 
        'ViewStart': 0, 
        'ViewStop': 40000000, 
        'BinCount': 1000, 
        'Divide': 1
    }
) 
```