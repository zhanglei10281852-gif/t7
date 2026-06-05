# 乡镇污水处理站运维管理平台

基于 Python FastAPI + MySQL 后端，React + TypeScript + Vite + Ant Design 前端的污水处理站运维管理系统。

## 功能特性

### 后端 API (端口: 8732)

1. **站点管理** - 三个污水处理站的基本信息管理
2. **水质数据管理** - 每日两次水质录入，含数据校验和达标自动判定
3. **设备管理** - 设备信息及运行时长统计
4. **巡检管理** - 巡检计划及记录，逾期自动预警
5. **药剂库存管理** - 药剂入库/出库记录，低库存自动预警
6. **报警管理** - 统一报警中心及处理流程

### 前端页面 (端口: 5173 或 80)

1. **总览仪表盘** - 三站运行状态卡片、达标率趋势图、未处理报警Badge
2. **水质数据管理** - 进出水指标折线对比图、数据录入表单、历史数据导出
3. **设备管理** - 设备列表筛选、详情抽屉、状态变更时间线
4. **报警中心** - 报警列表、按严重程度标签区分、处理操作

## 快速启动

### Docker 一键部署

```bash
docker-compose up -d --build
```

启动后访问: http://localhost

### 初始化演示数据

进入后端容器执行初始化脚本:

```bash
docker exec -it sewage-backend bash
python -m app.init_data
```

### 开发模式

#### 启动 MySQL

```bash
docker run -d --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=sewage_management \
  -p 3306:3306 \
  mysql:8.0 --character-set-server=utf8mb4
```

#### 启动后端

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8732
```

#### 初始化数据

```bash
python -m app.init_data
```

#### 启动前端

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:5173

## 水质达标标准

- COD ≤ 50mg/L
- 氨氮 ≤ 5mg/L
- 总磷 ≤ 0.5mg/L
- SS ≤ 10mg/L

## 数据校验规则

- COD: 0-1000 mg/L
- 氨氮: 0-100 mg/L
- pH: 1-14
