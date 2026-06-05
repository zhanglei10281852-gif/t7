import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Table,
  Drawer,
  Descriptions,
  Tag,
  Space,
  Typography,
  Timeline,
  Statistic,
  Spin,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { equipmentApi, stationApi } from "../services/api";
import type { Station, Equipment, EquipmentStatusLog } from "../types";

const { Title } = Typography;
const { Option } = Select;

const Equipment: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    null,
  );
  const [statusLogs, setStatusLogs] = useState<EquipmentStatusLog[]>([]);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await stationApi.getAll();
        setStations(res.data);
      } catch (error) {
        console.error("获取站点列表失败:", error);
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedStation, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStation) params.station_id = selectedStation;
      if (selectedStatus) params.status = selectedStatus;
      const res = await equipmentApi.getAll(params);
      setEquipment(res.data);
    } catch (error) {
      console.error("获取设备列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const showDetail = async (item: Equipment) => {
    setSelectedEquipment(item);
    setDrawerVisible(true);
    try {
      const res = await equipmentApi.getStatusLogs(item.id);
      setStatusLogs(res.data);
    } catch (error) {
      console.error("获取状态日志失败:", error);
    }
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, string> = {
      运行: "success",
      停机: "default",
      故障: "error",
      维保中: "warning",
    };
    return <Tag color={statusMap[status] || "default"}>{status}</Tag>;
  };

  const columns = [
    { title: "设备编号", dataIndex: "code", key: "code" },
    { title: "设备名称", dataIndex: "name", key: "name" },
    { title: "型号", dataIndex: "model", key: "model" },
    { title: "安装位置", dataIndex: "location", key: "location" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => getStatusTag(status),
    },
    {
      title: "累计运行时长",
      dataIndex: "total_run_hours",
      key: "total_run_hours",
      render: (v: number) => `${v} 小时`,
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Equipment) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}
        >
          详情
        </Button>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          设备管理
        </Title>
        <Space>
          <Select
            style={{ width: 200 }}
            placeholder="选择站点"
            allowClear
            value={selectedStation}
            onChange={setSelectedStation}
          >
            {stations.map((s) => (
              <Option key={s.id} value={s.id}>
                {s.name}
              </Option>
            ))}
          </Select>
          <Select
            style={{ width: 150 }}
            placeholder="选择状态"
            allowClear
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="运行">运行</Option>
            <Option value="停机">停机</Option>
            <Option value="故障">故障</Option>
            <Option value="维保中">维保中</Option>
          </Select>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="设备总数" value={equipment.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="运行中"
              value={equipment.filter((e) => e.status === "运行").length}
              valueStyle={{ color: "#3f8600" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="故障"
              value={equipment.filter((e) => e.status === "故障").length}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="停机/维保"
              value={
                equipment.filter(
                  (e) => e.status === "停机" || e.status === "维保中",
                ).length
              }
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px" }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={equipment}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Drawer
        title="设备详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {selectedEquipment && (
          <>
            <Descriptions title="基本信息" bordered column={1}>
              <Descriptions.Item label="设备编号">
                {selectedEquipment.code}
              </Descriptions.Item>
              <Descriptions.Item label="设备名称">
                {selectedEquipment.name}
              </Descriptions.Item>
              <Descriptions.Item label="型号">
                {selectedEquipment.model || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="安装位置">
                {selectedEquipment.location || "-"}
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                {getStatusTag(selectedEquipment.status)}
              </Descriptions.Item>
              <Descriptions.Item label="累计运行时长">
                {selectedEquipment.total_run_hours} 小时
              </Descriptions.Item>
            </Descriptions>

            <div style={{ marginTop: 24 }}>
              <Title level={5}>状态变更历史</Title>
              <Timeline>
                {statusLogs.map((log) => (
                  <Timeline.Item
                    key={log.id}
                    color={
                      log.new_status === "故障"
                        ? "red"
                        : log.new_status === "运行"
                          ? "green"
                          : "blue"
                    }
                  >
                    <p>{dayjs(log.change_time).format("YYYY-MM-DD HH:mm")}</p>
                    <p>
                      {log.old_status ? `${log.old_status} → ` : ""}
                      <strong>{log.new_status}</strong>
                    </p>
                    {log.remark && (
                      <p style={{ color: "#666" }}>{log.remark}</p>
                    )}
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
};

export default Equipment;
