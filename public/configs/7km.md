# How to access the TDC data

数据采集发生在 7 km 实验点的数据服务器上（实验点局域网内 IF Broker 地址：`{{config:Access.1.AccessLab}}`）。在不同的网络环境下获取 Meta Data 和 Raw Data 的方式为：

<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"pair":"live","field":"AccessLab","collection":"TFQKD_TDC"}'>7 km 局域网</button>
<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"pair":"live","field":"AccessCampus","collection":"TFQKD_TDC"}'>研究院局域网</button>
<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"pair":"live","field":"AccessField","collection":"TFQKD_TDC"}'>公网</button>

--------

这些数据会在一定期限内（几秒到几天不等）复制到自由空间总数据服务器上，并在一段时间后（几天到几个月不等）从 7 km 的数据服务器上删除。此时，需要访问自由空间总数据服务器来获取数据：

<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"pair":"archived","field":"AccessCampus","collection":"TFQKD_TDC_7km"}'>研究院局域网</button>
<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"pair":"archived","field":"AccessField","collection":"TFQKD_TDC_7km"}'>公网</button>

--------

### 其它数据的获取方式：

--------

研究院内采集的相关数据参考<a href="/#/tfaccess?experiment=2502" target="_blank">这里</a>

--------

2022-12-19 ~ 2023-01-17 的数据：

<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"field":"AccessCampus","collection":"TFQKD_TDC_7km_old","metaHost":"172.20.8.102:1061","rawHost":"172.20.8.104:1002"}'>研究院局域网</button>
<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"field":"AccessField","collection":"TFQKD_TDC_7km_old","metaHost":"code.qpqi.group:1061","rawHost":"code.qpqi.group:1002"}'>公网</button>

--------

2024-01-31 ~ 2025-01-05 的数据：

<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"field":"AccessCampus","collection":"TFQKD_TDC","metaHost":"172.20.8.102:1061","rawHost":"172.20.8.104:1010"}'>研究院局域网</button>
<button type="button" class="access-md-action-btn" data-md-action="showCode" data-md-args='{"field":"AccessField","collection":"TFQKD_TDC","metaHost":"code.qpqi.group:1061","rawHost":"code.qpqi.group:1010"}'>公网</button>
