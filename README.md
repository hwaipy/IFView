# IFView

## AttSim：2502 局域网版

```sh
npm install
npm run dev:attsim-lan
```

本机打开 <http://localhost:9000/#/attsim?experiment=attsim-lan>。
同一局域网的其它电脑打开 `http://<运行 IFView 的电脑局域网 IP>:9000/#/attsim?experiment=attsim-lan`。

`attsim-lan` 保留 AttSim 的全部菜单，各页面都使用局域网 Broker
`ws://192.168.25.5:1063/ws/`，由它访问 Storage、TDC 和其它已注册服务。
浏览器所在电脑需要能够访问 2502 的 `192.168.25.5`；页面请通过 HTTP 打开。
此地址沿用仓库中的 2502 局域网配置，实际连接需在实验室网络中验证。

数据接口仍为 Meta Data `192.168.25.5:1061`、Raw Data `192.168.25.5:1000`，
VNC、SSH 等地址在 Access 页面查看。Broker 地址可在
`public/configs/IFBrokers.json` 的 `CalvinFriend2502LAN` 中修改。

生产部署运行 `npm run build`，将 `dist/spa` 通过局域网 HTTP 静态服务器发布，
使用相同的 `/#/attsim?experiment=attsim-lan` 入口。

### 2502 已部署实例

访问 <http://192.168.25.5:5080/>，首页自动跳转至 AttSim 局域网入口。

- SSH：`ssh freespace@code.qpqi.group -p 2722`
- 容器：`ifview-attsim-lan`，重启策略为 `unless-stopped`
- 部署目录：`/home/freespace/docker/ifview-lan`
- 当前静态文件：`releases/20261102-attsim`
- 静态服务脚本：[deploy/attsim-lan/server.py](deploy/attsim-lan/server.py)
- 镜像：服务器已有的 `hwaipy/runtime:1.0.1`，运行 `python3 -u /server.py`
- 端口映射：`192.168.25.5:5080` → 容器 `8080`

维护时在服务器运行 `docker logs --tail 50 ifview-attsim-lan` 查看日志，
运行 `docker restart ifview-attsim-lan` 重启。静态目录以只读方式挂载至 `/site`，
服务脚本只读挂载至 `/server.py`。容器使用非 root 用户并设置日志轮转。
