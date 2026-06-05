import React, { useEffect, useState } from 'react';
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
  DatePicker,
  Tag,
  Space,
  Typography,
  Statistic,
  Spin,
  message,
  Switch,
} from 'antd';
import { PlusOutlined, CheckCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { inspectionApi, stationApi } from '../services/api';
import type { Station, InspectionPlan, InspectionRecord } from '../types';

const { Title, TextArea } = Typography;
const { Option } = Select;

const Inspection: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [records, setRecords] = useState<InspectionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<InspectionPlan | null>(null);
  const [planForm] = Form.useForm();
  const [recordForm] = Form.useForm();

  useEffect(() => {
    const fetchStations = async () => {
      try {
        const res = await stationApi.getAll();
        setStations(res.data);
      } catch (error) {
        console.error('获取站点列表失败:', error);
      }
    };
    fetchStations();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedStation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStation) params.station_id = selectedStation;
      const [plansRes, recordsRes] = await Promise.all([
        inspectionApi.getPlans(params),
        inspectionApi.getRecords(),
      ]);
      setPlans(plansRes.data);
      setRecords(recordsRes.data);
    } catch (error) {
      console.error('获取巡检数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (values: any) => {
    try {
      await inspectionApi.createPlan({
        station_id: values.station_id,
        name: values.name,
        frequency: values.frequency,
        inspector: values.inspector,
        is_active: values.is_active,
      });
      message.success('创建成功');
      setPlanModalVisible(false);
      planForm.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建失败');
    }
  };

  const handleCreateRecord = async (values: any) => {
    if (!selectedPlan) return;
    try {
      await inspectionApi.createRecord({
        plan_id: selectedPlan.id,
        inspection_date: values.inspection_date.format('YYYY-MM-DD'),
        equipment_status: values.equipment_status,
        photo_path: values.photo_path,
        problem_description: values.problem_description,
      });
      message.success('上报成功');
      setRecordModalVisible(false);
      recordForm.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '上报失败');
    }
  };

  const planColumns: any[] = [
    { title: '计划名称', dataIndex: 'name', key: 'name' },
    {
      title: '所属站点',
      dataIndex: 'station_id',
      key: 'station_id',
      render: (id: number) => stations.find((s) => s.id === id)?.name || '-',
    },
    { title: '巡检频率', dataIndex: 'frequency', key: 'frequency' },
    { title: '巡检员', dataIndex: 'inspector', key: 'inspector' },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active: boolean) => (active ? <Tag color="success">启用</Tag> : <Tag color="default">停用</Tag>),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: InspectionPlan) => (
        <Button type="link" icon={<CheckCircleOutlined />} onClick={() => {
          setSelectedPlan(record);
          setRecordModalVisible(true);
        }}>
          上报记录
        </Button>
      ),
    },
  ];

  const recordColumns: any[] = [
    {
      title: '巡检计划',
      dataIndex: 'plan_id',
      key: 'plan_id',
      render: (id: number) => plans.find((p) => p.id === id)?.name || '-',
    },
    { title: '巡检日期', dataIndex: 'inspection_date', key: 'inspection_date' },
    { title: '设备状态', dataIndex: 'equipment_status', key: 'equipment_status', ellipsis: true },
    { title: '问题描述', dataIndex: 'problem_description', key: 'problem_description', ellipsis: true },
    {
      title: '是否逾期',
      dataIndex: 'is_overdue',
      key: 'is_overdue',
      render: (overdue: boolean) =>
        overdue ? <Tag color="error">逾期</Tag> : <Tag color="success">正常</Tag>,
    },
    {
      title: '上报时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>巡检管理</Title>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPlanModalVisible(true)}>
            创建计划
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="巡检计划数" value={plans.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="今日巡检记录" value={records.filter((r) => r.inspection_date === dayjs().format('YYYY-MM-DD')).length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="逾期记录"
              value={records.filter((r) => r.is_overdue).length}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="巡检计划" style={{ marginBottom: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table columns={planColumns} dataSource={plans} rowKey="id" pagination={{ pageSize: 10 }} />
        )}
      </Card>

      <Card title="巡检记录">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table columns={recordColumns} dataSource={records} rowKey="id" pagination={{ pageSize: 10 }} />
        )}
      </Card>

      <Modal
        title="创建巡检计划"
        open={planModalVisible}
        onCancel={() => setPlanModalVisible(false)}
        onOk={() => planForm.submit()}
      >
        <Form form={planForm} layout="vertical" onFinish={handleCreatePlan}>
          <Form.Item name="station_id" label="所属站点" rules={[{ required: true }]}>
            <Select placeholder="请选择站点">
              {stations.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="计划名称" rules={[{ required: true }]}>
            <Input placeholder="请输入计划名称" />
          </Form.Item>
          <Form.Item name="frequency" label="巡检频率" initialValue="每天一次" rules={[{ required: true }]}>
            <Select>
              <Option value="每天一次">每天一次</Option>
              <Option value="每周一次">每周一次</Option>
            </Select>
          </Form.Item>
          <Form.Item name="inspector" label="巡检员" rules={[{ required: true }]}>
            <Input placeholder="请输入巡检员姓名" />
          </Form.Item>
          <Form.Item name="is_active" label="是否启用" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上报巡检记录"
        open={recordModalVisible}
        onCancel={() => setRecordModalVisible(false)}
        onOk={() => recordForm.submit()}
      >
        {selectedPlan && (
          <p style={{ marginBottom: 16 }}>
            <strong>巡检计划:</strong> {selectedPlan.name}
          </p>
        )}
        <Form form={recordForm} layout="vertical" onFinish={handleCreateRecord}>
          <Form.Item name="inspection_date" label="巡检日期" initialValue={dayjs()} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="equipment_status" label="设备运行状态确认">
            <TextArea rows={3} placeholder="请描述各设备运行状态" />
          </Form.Item>
          <Form.Item name="photo_path" label="现场照片路径">
            <Input placeholder="请输入照片文件路径" />
          </Form.Item>
          <Form.Item name="problem_description" label="发现问题描述">
            <TextArea rows={3} placeholder="请描述发现的问题" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Inspection;
