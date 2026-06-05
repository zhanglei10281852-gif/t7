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
  InputNumber,
  Tag,
  Space,
  Typography,
  Statistic,
  Spin,
  message,
  Progress,
} from 'antd';
import { PlusOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { chemicalApi, stationApi } from '../services/api';
import type { Station, ChemicalInventory, ChemicalRecord } from '../types';

const { Title, TextArea } = Typography;
const { Option } = Select;

const Chemical: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStation, setSelectedStation] = useState<number | null>(null);
  const [inventories, setInventories] = useState<ChemicalInventory[]>([]);
  const [records, setRecords] = useState<ChemicalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);
  const [recordModalVisible, setRecordModalVisible] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<ChemicalInventory | null>(null);
  const [recordType, setRecordType] = useState<string>('入库');
  const [inventoryForm] = Form.useForm();
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
      const [invRes, recRes] = await Promise.all([
        chemicalApi.getInventories(params),
        chemicalApi.getRecords(),
      ]);
      setInventories(invRes.data);
      setRecords(recRes.data);
    } catch (error) {
      console.error('获取药剂数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInventory = async (values: any) => {
    try {
      await chemicalApi.createInventory({
        station_id: values.station_id,
        chemical_type: values.chemical_type,
        current_quantity: values.current_quantity,
        safe_quantity: values.safe_quantity,
        unit: values.unit,
      });
      message.success('创建成功');
      setInventoryModalVisible(false);
      inventoryForm.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建失败');
    }
  };

  const handleCreateRecord = async (values: any) => {
    if (!selectedInventory) return;
    try {
      await chemicalApi.createRecord({
        inventory_id: selectedInventory.id,
        record_type: recordType,
        quantity: values.quantity,
        operator: values.operator,
        remark: values.remark,
      });
      message.success('操作成功');
      setRecordModalVisible(false);
      recordForm.resetFields();
      fetchData();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '操作失败');
    }
  };

  const getStockPercent = (item: ChemicalInventory) => {
    if (item.safe_quantity <= 0) return 100;
    return Math.min(100, (item.current_quantity / item.safe_quantity) * 100);
  };

  const inventoryColumns: any[] = [
    {
      title: '所属站点',
      dataIndex: 'station_id',
      key: 'station_id',
      render: (id: number) => stations.find((s) => s.id === id)?.name || '-',
    },
    { title: '药剂类型', dataIndex: 'chemical_type', key: 'chemical_type' },
    {
      title: '库存状态',
      dataIndex: 'current_quantity',
      key: 'stock_status',
      render: (_: any, record: ChemicalInventory) => {
        const percent = getStockPercent(record);
        const isLow = record.current_quantity < record.safe_quantity;
        return (
          <div style={{ width: 150 }}>
            <Progress
              percent={percent}
              status={isLow ? 'exception' : 'normal'}
              size="small"
              format={() => `${record.current_quantity}/${record.safe_quantity} ${record.unit}`}
            />
            {isLow && <Tag color="error" style={{ marginTop: 4 }}>库存不足</Tag>}
          </div>
        );
      },
    },
    {
      title: '最后更新',
      dataIndex: 'last_updated',
      key: 'last_updated',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: ChemicalInventory) => (
        <Space>
          <Button
            type="link"
            icon={<ArrowUpOutlined />}
            onClick={() => {
              setSelectedInventory(record);
              setRecordType('入库');
              setRecordModalVisible(true);
            }}
          >
            入库
          </Button>
          <Button
            type="link"
            danger
            icon={<ArrowDownOutlined />}
            onClick={() => {
              setSelectedInventory(record);
              setRecordType('出库');
              setRecordModalVisible(true);
            }}
          >
            出库
          </Button>
        </Space>
      ),
    },
  ];

  const recordColumns: any[] = [
    {
      title: '药剂类型',
      dataIndex: 'inventory_id',
      key: 'inventory_id',
      render: (id: number) => {
        const inv = inventories.find((i) => i.id === id);
        return inv ? `${inv.chemical_type}` : '-';
      },
    },
    {
      title: '类型',
      dataIndex: 'record_type',
      key: 'record_type',
      render: (type: string) =>
        type === '入库' ? (
          <Tag color="success" icon={<ArrowUpOutlined />}>入库</Tag>
        ) : (
          <Tag color="orange" icon={<ArrowDownOutlined />}>出库</Tag>
        ),
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', render: (v: number) => `${v} kg` },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
  ];

  const lowStockCount = inventories.filter((i) => i.current_quantity < i.safe_quantity).length;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>药剂库存管理</Title>
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setInventoryModalVisible(true)}>
            新增库存
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="药剂种类" value={inventories.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="库存不足" value={lowStockCount} valueStyle={{ color: lowStockCount > 0 ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="今日出入库" value={records.filter((r) => dayjs(r.created_at).isSame(dayjs(), 'day')).length} />
          </Card>
        </Col>
      </Row>

      <Card title="库存列表" style={{ marginBottom: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table columns={inventoryColumns} dataSource={inventories} rowKey="id" pagination={{ pageSize: 10 }} />
        )}
      </Card>

      <Card title="出入库记录">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table columns={recordColumns} dataSource={records} rowKey="id" pagination={{ pageSize: 10 }} />
        )}
      </Card>

      <Modal
        title="新增药剂库存"
        open={inventoryModalVisible}
        onCancel={() => setInventoryModalVisible(false)}
        onOk={() => inventoryForm.submit()}
      >
        <Form form={inventoryForm} layout="vertical" onFinish={handleCreateInventory}>
          <Form.Item name="station_id" label="所属站点" rules={[{ required: true }]}>
            <Select placeholder="请选择站点">
              {stations.map((s) => (
                <Option key={s.id} value={s.id}>
                  {s.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="chemical_type" label="药剂类型" rules={[{ required: true }]}>
            <Select>
              <Option value="PAC">PAC</Option>
              <Option value="PAM">PAM</Option>
              <Option value="次氯酸钠">次氯酸钠</Option>
              <Option value="碳源">碳源</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="current_quantity" label="当前数量" initialValue={0} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="safe_quantity" label="安全库存" initialValue={100} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="unit" label="单位" initialValue="kg">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`药剂${recordType}`}
        open={recordModalVisible}
        onCancel={() => setRecordModalVisible(false)}
        onOk={() => recordForm.submit()}
      >
        {selectedInventory && (
          <p style={{ marginBottom: 16 }}>
            <strong>药剂:</strong> {selectedInventory.chemical_type} | <strong>当前库存:</strong> {selectedInventory.current_quantity} {selectedInventory.unit}
          </p>
        )}
        <Form form={recordForm} layout="vertical" onFinish={handleCreateRecord}>
          <Form.Item name="quantity" label={`${recordType}数量`} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} />
          </Form.Item>
          <Form.Item name="operator" label="操作人">
            <Input placeholder="请输入操作人姓名" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <TextArea rows={3} placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Chemical;
