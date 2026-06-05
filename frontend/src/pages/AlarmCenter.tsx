import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Select,
  Button,
  Table,
  Modal,
  Form,
  Input,
  Tag,
  Space,
  Typography,
  Statistic,
  Spin,
  message,
} from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { alarmApi, stationApi } from "../services/api";
import type { Station, Alarm } from "../types";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const AlarmCenter: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [form] = Form.useForm();

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
      const res = await alarmApi.getAll(params);
      setAlarms(res.data);
    } catch (error) {
      console.error("获取报警列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHandle = (alarm: Alarm) => {
    setSelectedAlarm(alarm);
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    if (!selectedAlarm) return;
    try {
      await alarmApi.update(selectedAlarm.id, {
        status: values.status,
        handle_result: values.handle_result,
        handled_by: values.handled_by,
      });
      message.success("处理成功");
      setModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || "处理失败");
    }
  };

  const getSeverityTag = (severity: string) => {
    const map: Record<string, { color: string; text: string }> = {
      高: { color: "red", text: "高" },
      中: { color: "orange", text: "中" },
      低: { color: "blue", text: "低" },
    };
    return (
      <Tag color={map[severity]?.color || "default"}>
        {map[severity]?.text || severity}
      </Tag>
    );
  };

  const getStatusTag = (status: string) => {
    const map: Record<string, { color: string; text: string }> = {
      未处理: { color: "red", text: "未处理" },
      处理中: { color: "orange", text: "处理中" },
      已处理: { color: "green", text: "已处理" },
    };
    return (
      <Tag color={map[status]?.color || "default"}>
        {map[status]?.text || status}
      </Tag>
    );
  };

  const columns: any[] = [
    {
      title: "严重程度",
      dataIndex: "severity",
      key: "severity",
      render: (v: string) => getSeverityTag(v),
      filters: [
        { text: "高", value: "高" },
        { text: "中", value: "中" },
        { text: "低", value: "低" },
      ],
      onFilter: (value: any, record: Alarm) => record.severity === value,
    },
    { title: "报警类型", dataIndex: "alarm_type", key: "alarm_type" },
    { title: "标题", dataIndex: "title", key: "title" },
    {
      title: "描述",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (v: string) => getStatusTag(v),
    },
    {
      title: "报警时间",
      dataIndex: "created_at",
      key: "created_at",
      render: (v: string) => dayjs(v).format("YYYY-MM-DD HH:mm"),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: Alarm) =>
        record.status !== "已处理" ? (
          <Button
            type="link"
            icon={<CheckCircleOutlined />}
            onClick={() => handleHandle(record)}
          >
            处理
          </Button>
        ) : null,
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
          报警中心
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
            <Option value="未处理">未处理</Option>
            <Option value="处理中">处理中</Option>
            <Option value="已处理">已处理</Option>
          </Select>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="未处理"
              value={alarms.filter((a) => a.status === "未处理").length}
              valueStyle={{ color: "#cf1322" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="处理中"
              value={alarms.filter((a) => a.status === "处理中").length}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="已处理"
              value={alarms.filter((a) => a.status === "已处理").length}
              valueStyle={{ color: "#3f8600" }}
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
            dataSource={alarms}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      <Modal
        title="处理报警"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        {selectedAlarm && (
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>报警标题:</strong> {selectedAlarm.title}
            </p>
            <p>
              <strong>报警类型:</strong> {selectedAlarm.alarm_type}
            </p>
            <p>
              <strong>描述:</strong> {selectedAlarm.description}
            </p>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="status"
            label="处理状态"
            initialValue="处理中"
            rules={[{ required: true }]}
          >
            <Select>
              <Option value="处理中">处理中</Option>
              <Option value="已处理">已处理</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="handle_result"
            label="处理结果"
            rules={[{ required: true }]}
          >
            <TextArea rows={4} placeholder="请输入处理结果" />
          </Form.Item>
          <Form.Item
            name="handled_by"
            label="处理人"
            rules={[{ required: true }]}
          >
            <Input placeholder="请输入处理人姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AlarmCenter;
